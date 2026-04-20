'use client';

import { useState, useReducer, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CharacterSheet from '@/components/CharacterSheet';
import InlineCharacterCreation from '@/components/InlineCharacterCreation';
import InlineDiceCheck from '@/components/InlineDiceCheck';
import InlineNotification from '@/components/InlineNotification';
import ChatInput from '@/components/ChatInput';
import StreamingText from '@/components/StreamingText';
import LanguageSelector from '@/components/LanguageSelector';
import ApiKeyModal from '@/components/ApiKeyModal';
import {
  GameState,
  createInitialGameState,
  gameStateReducer,
} from '@/lib/gameState';
import { parseDiceCheck, calculateRollResult, formatRollMessage } from '@/lib/diceMachine';
import { streamChatMessage } from '@/lib/api';
import { loadGame, saveGame, deleteSave } from '@/lib/storage';
import { loadSettings, saveSettings as persistSettings } from '@/lib/settings';
import { PROVIDERS, ProviderId } from '@/lib/providers';

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gameState, dispatch] = useReducer(gameStateReducer, createInitialGameState());
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);
  const abortRef = useRef<AbortController | null>(null);

  const hasInitialized = useRef(false);

  /**
   * Strip all [CHAR:...] and [PHASE_TRANSITION:...] tags from DM text.
   * Parse [CHAR:...] tags for in-game state changes (HP, items, skills).
   * Returns cleaned text for display.
   */
  function stripAndParseTags(
    text: string,
    dispatchFn: React.Dispatch<any>,
  ): string {
    const msgIndex = gameState.messages.length;

    // Parse [CHAR:...] tags for in-game updates
    const tagRegex = /\[CHAR:(\w+)=([^\]]+)\]/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(text)) !== null) {
      const key = match[1];
      const value = match[2];

      switch (key) {
        case 'hp': {
          const hpMatch = value.match(/^(\d+)\/(\d+)$/);
          if (hpMatch) {
            const hp = parseInt(hpMatch[1]);
            const maxHp = parseInt(hpMatch[2]);
            if (hp >= 0 && maxHp > 0 && hp <= maxHp) {
              const oldHp = gameState.character.stats.hp;
              dispatchFn({ type: 'UPDATE_CHARACTER_STATS', payload: { hp, maxHp } });
              if (hp !== oldHp) {
                dispatchFn({ type: 'ADD_INLINE_EVENT', payload: {
                  id: `hp-${Date.now()}`, type: 'hp_change' as const,
                  value: `${oldHp} → ${hp}`, afterMessageIndex: msgIndex,
                }});
              }
            }
          }
          break;
        }
        case 'item+': {
          dispatchFn({ type: 'ADD_INVENTORY_ITEM', payload: value });
          dispatchFn({ type: 'ADD_INLINE_EVENT', payload: {
            id: `item+-${Date.now()}`, type: 'item_add' as const,
            value, afterMessageIndex: msgIndex,
          }});
          break;
        }
        case 'item-': {
          dispatchFn({ type: 'REMOVE_INVENTORY_ITEM', payload: value });
          dispatchFn({ type: 'ADD_INLINE_EVENT', payload: {
            id: `item--${Date.now()}`, type: 'item_remove' as const,
            value, afterMessageIndex: msgIndex,
          }});
          break;
        }
        case 'skill+': {
          dispatchFn({ type: 'ADD_CHARACTER_SKILL', payload: value });
          dispatchFn({ type: 'ADD_INLINE_EVENT', payload: {
            id: `skill+-${Date.now()}`, type: 'skill_add' as const,
            value, afterMessageIndex: msgIndex,
          }});
          break;
        }
        case 'xp': {
          const xp = parseInt(value);
          if (xp > 0) {
            dispatchFn({ type: 'ADD_XP', payload: xp });
            dispatchFn({ type: 'ADD_INLINE_EVENT', payload: {
              id: `xp-${Date.now()}`, type: 'xp' as const,
              value: xp, afterMessageIndex: msgIndex,
            }});
          }
          break;
        }
        case 'npc+': {
          const npcMatch = value.match(/^(\w+):(-?\d+)$/);
          if (npcMatch) {
            const npcName = npcMatch[1];
            const delta = parseInt(npcMatch[2]);
            const current = gameState.npcRelations.find(n => n.name === npcName);
            if (current) {
              dispatchFn({ type: 'SET_NPC_SATISFACTION', payload: { npcName, satisfaction: current.satisfaction + delta } });
            }
          }
          break;
        }
      }
    }

    // Strip all tags
    let cleaned = text;
    cleaned = cleaned.replace(/\[CHAR:\w+=[^\]]+\]/g, '');
    cleaned = cleaned.replace(/\[PHASE_TRANSITION:\w+\]/g, '');
    cleaned = cleaned.replace(/\n{3,}/g, '\n\n').trim();

    return cleaned;
  }

  // Handle character creation completion (from CharacterCreation UI)
  const handleCharacterCreated = useCallback(
    (character: {
      name: string;
      nameEn: string;
      stats: { str: number; dex: number; int: number; cha: number };
      skills: string[];
      templateId: string;
    }) => {
      // Calculate HP from STR
      const strMod = Math.floor((character.stats.str - 10) / 2);
      const hp = 5 + strMod;

      dispatch({ type: 'SET_CHARACTER_NAME', payload: { name: character.name, nameEn: character.nameEn } });
      dispatch({ type: 'UPDATE_CHARACTER_STATS', payload: { ...character.stats, hp, maxHp: hp } });
      dispatch({ type: 'UPDATE_CHARACTER_SKILLS', payload: character.skills });

      // Hide character creation
      dispatch({ type: 'SET_SHOW_CHARACTER_CREATION', payload: false });

      // Set scene to opening BEFORE the API call
      dispatch({ type: 'SET_SCENE', payload: 'opening' });
      dispatch({ type: 'SET_ACT', payload: 1 });

      // Send the opening trigger as a user message
      // route.ts will detect phase=opening and inject the scene trigger
      const triggerMessage = gameState.language === 'zh'
        ? '角色已创建完成，请开始游戏'
        : 'Character creation complete, start the game';

      dispatch({ type: 'ADD_USER_MESSAGE', payload: triggerMessage });
      dispatch({ type: 'SET_STREAMING', payload: true });
      dispatch({ type: 'APPEND_STREAMING_TEXT', payload: '' });

      // Use a ref-safe approach: directly call the API
      (async () => {
        let fullResponse = '';
        try {
          for await (const chunk of streamChatMessage(
            [{ role: 'user', content: triggerMessage }],
            gameState.language,
            gameState.userApiKey,
            'opening', // hardcode opening scene
            gameState.provider,
            gameState.model,
            gameState.customApiUrl
          )) {
            fullResponse += chunk;
            dispatch({ type: 'APPEND_STREAMING_TEXT', payload: chunk });
          }
          const cleaned = stripAndParseTags(fullResponse, dispatch);
          dispatch({ type: 'FINISH_STREAMING', payload: cleaned });

          // Check for dice check in opening
          const check = parseDiceCheck(fullResponse);
          if (check) {
            dispatch({ type: 'SET_DICE_STATE', payload: 'awaiting_roll' });
            dispatch({ type: 'SET_CURRENT_CHECK', payload: check });
          }
        } catch (error: any) {
          const errMsg = gameState.language === 'zh'
            ? `连接失败：${error.message || '未知错误'}`
            : `Connection failed: ${error.message || 'Unknown error'}`;
          dispatch({ type: 'FINISH_STREAMING', payload: errMsg });
        }
      })();
    },
    [gameState.language, gameState.userApiKey, gameState.provider, gameState.model, gameState.customApiUrl]
  );

  // On first load: restore save or auto-start character creation
  useEffect(() => {
    if (hasInitialized.current) return;
    hasInitialized.current = true;

    // Always load settings from localStorage first
    const settings = loadSettings();
    if (settings.apiMode) dispatch({ type: 'SET_API_MODE', payload: settings.apiMode });
    if (settings.language) dispatch({ type: 'SET_LANGUAGE', payload: settings.language });
    if (settings.apiKey) dispatch({ type: 'SET_API_KEY', payload: settings.apiKey });
    if (settings.provider) dispatch({ type: 'SET_PROVIDER', payload: settings.provider });
    if (settings.model) dispatch({ type: 'SET_MODEL', payload: settings.model });
    if (settings.customApiUrl) dispatch({ type: 'SET_CUSTOM_API_URL', payload: settings.customApiUrl });

    const shouldContinue = searchParams.get('continue') === 'true';
    const saved = loadGame();

    if (shouldContinue && saved && saved.messages && saved.messages.length > 0) {
      // Restore from save
      if (saved.language) dispatch({ type: 'SET_LANGUAGE', payload: saved.language });
      if (saved.userApiKey) dispatch({ type: 'SET_API_KEY', payload: saved.userApiKey });
      if (saved.provider) dispatch({ type: 'SET_PROVIDER', payload: saved.provider });
      if (saved.model) dispatch({ type: 'SET_MODEL', payload: saved.model });
      if (saved.customApiUrl) dispatch({ type: 'SET_CUSTOM_API_URL', payload: saved.customApiUrl });
      for (const msg of saved.messages) {
        dispatch({ type: 'ADD_ASSISTANT_MESSAGE', payload: msg.content });
      }
    } else {
      // New game: show character creation UI
      startCharacterCreation();
    }
  }, []);

  // Auto-save periodically
  useEffect(() => {
    const interval = setInterval(() => {
      if (gameState.messages.length > 0) {
        saveGame(gameState);
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [gameState]);

  const startCharacterCreation = () => {
    dispatch({ type: 'SET_SHOW_CHARACTER_CREATION', payload: true });

    // Call the DM with character_creation phase to get a welcome message
    // The DM will output a short intro, then the inline card appears below
    dispatch({ type: 'SET_SCENE', payload: 'character_creation' });

    const triggerMessage = gameState.language === 'zh'
      ? '开始游戏'
      : 'Start the game';

    dispatch({ type: 'ADD_USER_MESSAGE', payload: triggerMessage });
    dispatch({ type: 'SET_STREAMING', payload: true });
    dispatch({ type: 'APPEND_STREAMING_TEXT', payload: '' });

    (async () => {
      let fullResponse = '';
      try {
        for await (const chunk of streamChatMessage(
          [{ role: 'user', content: triggerMessage }],
          gameState.language,
          gameState.userApiKey,
          'character_creation',
          gameState.provider,
          gameState.model,
          gameState.customApiUrl
        )) {
          fullResponse += chunk;
          dispatch({ type: 'APPEND_STREAMING_TEXT', payload: chunk });
        }
        const cleaned = stripAndParseTags(fullResponse, dispatch);
        dispatch({ type: 'FINISH_STREAMING', payload: cleaned });
      } catch (error: any) {
        let errMsg = error.message || 'Unknown error';
        if (errMsg.includes('daily_limit')) {
          errMsg = gameState.language === 'zh'
            ? '今日免费额度已用完（10次/天）。请点击右上角 🔑「API Key」配置自己的 Key 解除限制！'
            : 'Daily free limit reached (10/day). Click 🔑 "API Key" to configure your own key!';
          setTimeout(() => setShowApiKeyModal(true), 500);
        } else if (errMsg.includes('abort') || errMsg.includes('AbortError')) {
          errMsg = gameState.language === 'zh'
            ? '请求超时。保底模型可能已不可用，请点击右上角「API Key」配置自己的 Key。'
            : 'Request timed out. Fallback model may be unavailable — please configure your own API key.';
        } else {
          errMsg = gameState.language === 'zh'
            ? `连接失败：${errMsg}`
            : `Connection failed: ${errMsg}`;
        }
        dispatch({ type: 'FINISH_STREAMING', payload: fullResponse || errMsg });
      }
    })();
  };

  const handleLanguageChange = (lang: 'zh' | 'en') => {
    dispatch({ type: 'SET_LANGUAGE', payload: lang });
  };

  const handleSendMessage = useCallback(
    async (text: string) => {
      if (gameState.isStreaming) return;

      dispatch({ type: 'ADD_USER_MESSAGE', payload: text });
      dispatch({ type: 'SET_STREAMING', payload: true });
      dispatch({ type: 'APPEND_STREAMING_TEXT', payload: '' }); // Reset streaming text

      let fullResponse = '';

      try {
        // Get all messages for context (including the one we just added)
        const contextMessages = [
          ...gameState.messages,
          { role: 'user' as const, content: text },
        ];

        for await (const chunk of streamChatMessage(
          contextMessages,
          gameState.language,
          gameState.userApiKey,
          gameState.currentScene,
          gameState.provider,
          gameState.model,
          gameState.customApiUrl
        )) {
          fullResponse += chunk;
          dispatch({ type: 'APPEND_STREAMING_TEXT', payload: chunk });
        }

        // Strip and parse tags (HP, items, skills, etc.)
        const cleanedText = stripAndParseTags(fullResponse, dispatch);

        dispatch({ type: 'FINISH_STREAMING', payload: cleanedText });

        // Dice check: only detect when diceState is 'idle'
        if (gameState.diceState === 'idle') {
          const check = parseDiceCheck(fullResponse);
          if (check) {
            dispatch({ type: 'SET_DICE_STATE', payload: 'awaiting_roll' });
            dispatch({ type: 'SET_CURRENT_CHECK', payload: check });
          }
        }

        // Reset dice state to idle after roll was resolved and DM responded
        if (gameState.diceState === 'roll_resolved') {
          dispatch({ type: 'SET_DICE_STATE', payload: 'idle' });
          dispatch({ type: 'SET_CURRENT_CHECK', payload: null });
        }

        // Handle phase transition (check against original fullResponse)
        const phaseMatch = fullResponse.match(/\[PHASE_TRANSITION:(\w+)\]/);
        if (phaseMatch) {
          const nextPhase = phaseMatch[1];
          const phaseMap: Record<string, string> = {
            'opening': 'opening',
            'act1': 'act1',
            'act2': 'act2',
            'act3': 'act3',
            'ending': 'ending',
          };
          if (phaseMap[nextPhase]) {
            setTimeout(() => {
              dispatch({ type: 'SET_SCENE', payload: phaseMap[nextPhase] });
              if (nextPhase === 'opening') dispatch({ type: 'SET_ACT', payload: 1 });
              else if (nextPhase === 'act1') dispatch({ type: 'SET_ACT', payload: 1 });
              else if (nextPhase === 'act2') dispatch({ type: 'SET_ACT', payload: 2 });
              else if (nextPhase === 'act3') dispatch({ type: 'SET_ACT', payload: 3 });
            }, 1500);
          }
        }
      } catch (error: any) {
        let errMsg = error.message || 'Unknown error';
        if (errMsg.includes('daily_limit')) {
          errMsg = gameState.language === 'zh'
            ? '今日免费额度已用完（10次/天）。请点击右上角 🔑「API Key」配置自己的 Key 解除限制！'
            : 'Daily free limit reached (10/day). Click 🔑 "API Key" in the top-right to configure your own key!';
          // Auto-open API key modal on rate limit
          setTimeout(() => setShowApiKeyModal(true), 500);
        } else if (errMsg.includes('abort') || errMsg.includes('AbortError')) {
          errMsg = gameState.language === 'zh'
            ? '请求超时（30秒无响应）。保底模型可能已不可用，请点击右上角「API Key」配置自己的 Key。'
            : 'Request timed out (30s). Fallback model may be unavailable — please click "API Key" to configure your own.';
        } else if (errMsg.includes('balance') || errMsg.includes('depleted') || errMsg.includes('insufficient')) {
          errMsg = gameState.language === 'zh'
            ? '保底模型余额不足。请点击右上角「API Key」配置自己的 Key。'
            : 'Fallback model balance depleted. Please click "API Key" to configure your own.';
        } else if (errMsg.includes('401') || errMsg.includes('403')) {
          errMsg = gameState.language === 'zh'
            ? 'API Key 无效或余额不足。请点击右上角「API Key」检查设置。'
            : 'API key invalid or balance depleted. Please click "API Key" to check settings.';
        } else {
          errMsg = gameState.language === 'zh'
            ? `连接失败：${errMsg}`
            : `Connection failed: ${errMsg}`;
        }
        dispatch({ type: 'FINISH_STREAMING', payload: fullResponse || errMsg });
      }
    },
    [gameState.messages, gameState.isStreaming, gameState.language, gameState.userApiKey, gameState.currentScene]
  );

  const handleDiceRoll = useCallback(
    async (result: number) => {
      const check = gameState.currentCheck;
      if (!check) return;

      const statValue = gameState.character.stats[check.attribute as keyof typeof gameState.character.stats] || 10;
      const rollResult = calculateRollResult(result, statValue, check.dc);

      dispatch({
        type: 'SET_DICE_ROLL',
        payload: { result: rollResult.total, success: rollResult.success, difficulty: check.dc },
      });

      // Transition to roll_resolved
      dispatch({ type: 'SET_DICE_STATE', payload: 'roll_resolved' });

      // Send dice result as a follow-up message
      const diceMsg = formatRollMessage(rollResult, gameState.language);
      await handleSendMessage(diceMsg);
    },
    [gameState.currentCheck, gameState.character.stats, gameState.language, handleSendMessage]
  );

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom when new content arrives
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [gameState.messages, gameState.displayedText, gameState.isStreaming]);

  const handleApiKeySave = (settings: { apiKey: string; provider: string; model: string; customApiUrl: string; mode: 'default' | 'custom' }) => {
    dispatch({ type: 'SET_API_KEY', payload: settings.apiKey });
    dispatch({ type: 'SET_PROVIDER', payload: settings.provider });
    dispatch({ type: 'SET_MODEL', payload: settings.model });
    dispatch({ type: 'SET_CUSTOM_API_URL', payload: settings.customApiUrl });
    dispatch({ type: 'SET_API_MODE', payload: settings.mode });
    persistSettings({ ...settings, apiMode: settings.mode });
    setShowApiKeyModal(false);
  };

  const handleBackToMenu = () => {
    saveGame(gameState);
    router.push('/');
  };

  const handleNewGame = () => {
    deleteSave();
    window.location.reload();
  };

  const t = {
    zh: {
      back: '返回',
      newGame: '新游戏',
      act: '第 $ 幕',
      panel: '面板',
      apiKey: 'API Key',
      welcome: '🔥 欢迎来到伊格尼斯酒馆 🔥\n\n💡 提示：当前使用免费保底模型（每日10次），建议点击右上角 🔑 配置自己的 API Key 获得更好的 DM 体验！\n\n输入任意内容开始你的冒险...',
    },
    en: {
      back: 'Back',
      newGame: 'New Game',
      act: 'Act $',
      panel: 'Panel',
      apiKey: 'API Key',
      welcome: '🔥 Welcome to Ignis Tavern 🔥\n\n💡 Tip: Using free fallback model (10/day). Click 🔑 in the top-right to configure your own API key for a better DM experience!\n\nType anything to begin your adventure...',
    },
  };

  const lang = gameState.language;
  const text = t[lang];

  // Build display messages: combine history + current streaming buffer
  const displayMessages = [
    ...gameState.messages.map((msg, i) => ({
      role: msg.role,
      content: msg.content,
      isHistory: true as const,
      index: i,
    })),
  ];

  // The streaming buffer — all text received for the current response
  const streamingBuffer = gameState.isStreaming
    ? (gameState.messages.length > 0
        ? gameState.messages[gameState.messages.length - 1].content // not used for streaming
        : '') + gameState.displayedText
    : '';
  // Actually: for streaming, we track displayedText as the buffer
  const currentStreamBuffer = gameState.displayedText;

  return (
    <div className="h-screen bg-slate-950 flex flex-col overflow-hidden">
      {/* Header */}
      <header className="bg-slate-900/80 border-b border-amber-700/30 px-4 py-3 flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <button
            onClick={handleBackToMenu}
            className="text-amber-400/70 hover:text-amber-400 transition-colors text-sm"
          >
            ← {text.back}
          </button>
          <span className="text-amber-700/50">|</span>
          <span className="text-amber-300 text-sm">
            {text.act.replace('$', gameState.currentAct.toString())}
          </span>
          {/* Current model indicator */}
          {gameState.apiMode === 'custom' && gameState.provider && gameState.model && (
            <span className="hidden sm:inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-slate-800/80 border border-amber-700/20 text-xs text-amber-500/60">
              <span className="w-1.5 h-1.5 rounded-full bg-green-500/70 animate-pulse" />
              {PROVIDERS[gameState.provider as ProviderId]?.name || gameState.provider} · {gameState.model}
            </span>
          )}
          {gameState.apiMode === 'default' && (
            <button
              onClick={() => setShowApiKeyModal(true)}
              className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-900/40 border border-amber-600/50 text-xs text-amber-400 hover:bg-amber-900/60 transition-colors cursor-pointer"
            >
              🔑 {lang === 'zh' ? '配置 API Key 解锁更好体验' : 'Set API Key for better experience'}
            </button>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setShowSidePanel(!showSidePanel)}
            className="md:hidden text-amber-400/70 hover:text-amber-400 px-2 py-1 border border-amber-700/30 rounded text-sm"
          >
            {text.panel}
          </button>
          <button
            onClick={() => setShowApiKeyModal(true)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-900/30 border border-amber-700/40 rounded-lg text-amber-400/80 text-sm hover:bg-amber-900/50 hover:text-amber-300 transition-all"
          >
            🔑 API
          </button>
          <LanguageSelector currentLang={lang} onChange={handleLanguageChange} size="sm" />
        </div>
      </header>

      {/* Main game area */}
      <main className="flex-1 flex overflow-hidden">
        {/* Left: Chat area */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Messages */}
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 scroll-smooth">
            <div className="max-w-3xl mx-auto">
              {/* Initial loading — game is starting */}
              {displayMessages.length === 0 && !gameState.isStreaming && (
                <div className="text-amber-300/60 text-center mt-20 whitespace-pre-line text-lg">
                  {text.welcome}
                </div>
              )}

              {/* Initial loading animation */}
              {displayMessages.length === 0 && gameState.isStreaming && !gameState.displayedText && (
                <div className="flex flex-col items-center justify-center mt-20 gap-6">
                  <div className="relative">
                    <div className="w-20 h-20 rounded-full bg-gradient-to-br from-amber-600/30 to-orange-600/30 flex items-center justify-center animate-pulse">
                      <span className="text-4xl">🔥</span>
                    </div>
                    <div className="absolute inset-0 rounded-full border-2 border-amber-500/40 animate-ping" />
                  </div>
                  <div className="text-amber-300/70 text-base">
                    {lang === 'zh' ? '炉火正在点燃...' : 'The hearth fire is being lit...'}
                  </div>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-2 h-2 rounded-full bg-amber-500/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                </div>
              )}

              {displayMessages.map((msg, index) => (
                <div key={index}>
                  <div
                    className={`mb-1 ${
                      msg.role === 'user' ? 'flex justify-end' : ''
                    }`}
                  >
                    <div
                      className={`
                        msg.role === 'user'
                          ? 'bg-amber-900/30 border border-amber-700/30 rounded-xl px-4 py-3 max-w-[80%]'
                          : 'text-amber-100/90 leading-relaxed'
                      }`}
                    >
                      <div className="whitespace-pre-wrap text-sm md:text-base">
                        {msg.content}
                      </div>
                    </div>
                  </div>

                  {/* Inline cards after assistant messages */}
                  {msg.role === 'assistant' && (
                    <>
                      {/* Character creation card */}
                      {index === 0 && gameState.showCharacterCreation && (
                        <InlineCharacterCreation
                          language={lang}
                          onComplete={handleCharacterCreated}
                        />
                      )}

                      {/* Inline notifications */}
                      {gameState.inlineEvents
                        .filter(e => e.afterMessageIndex === index)
                        .map(event => (
                          <InlineNotification
                            key={event.id}
                            type={event.type}
                            value={event.value}
                            language={lang}
                          />
                        ))
                      }

                      {/* Inline dice check */}
                      {gameState.diceState !== 'idle' && gameState.currentCheck &&
                        index === displayMessages.length - 1 && (
                        <InlineDiceCheck
                          onRoll={handleDiceRoll}
                          disabled={gameState.isStreaming}
                          difficulty={gameState.currentCheck.dc}
                          checkLabel={gameState.currentCheck.label}
                          statValue={gameState.character.stats[gameState.currentCheck.attribute as keyof typeof gameState.character.stats] || 10}
                          diceState={gameState.diceState}
                          language={lang}
                        />
                      )}
                    </>
                  )}
                </div>
              ))}

              {/* Current streaming response with smooth typewriter */}
              {gameState.isStreaming && currentStreamBuffer && (
                <div className="mb-4 text-amber-100/90 leading-relaxed">
                  <StreamingText
                    buffer={currentStreamBuffer}
                    isStreaming={gameState.isStreaming}
                    baseSpeed={20}
                    className="whitespace-pre-wrap text-sm md:text-base"
                  />
                </div>
              )}
              {gameState.isStreaming && !currentStreamBuffer && displayMessages.length > 0 && (
                <div className="mb-4 flex items-center gap-3 text-amber-400/60">
                  <div className="flex gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: '0ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: '150ms' }} />
                    <span className="w-1.5 h-1.5 rounded-full bg-amber-400/60 animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                  <span className="text-sm italic">
                    {lang === 'zh' ? 'DM 正在思考...' : 'DM is thinking...'}
                  </span>
                </div>
              )}
            </div>
          </div>

          {/* Input area */}
          <div className="shrink-0 border-t border-amber-700/20 bg-slate-900/50 px-4 py-3">
            <div className="max-w-3xl mx-auto">

              <ChatInput
                onSubmit={handleSendMessage}
                disabled={gameState.isStreaming}
                language={lang}
              />
            </div>
          </div>
        </div>

        {/* Right: Side panel */}
        <aside
          className={`
            fixed inset-y-0 right-0 z-40 w-80
            bg-slate-900/95 backdrop-blur-sm
            border-l border-amber-700/30
            transform transition-transform duration-300
            md:static md:transform-none md:w-[30%] md:min-w-72 md:bg-transparent md:backdrop-blur-none md:border-l-0
            ${showSidePanel ? 'translate-x-0' : 'translate-x-full md:translate-x-0'}
          `}
        >
          <button
            onClick={() => setShowSidePanel(false)}
            className="md:hidden absolute top-4 right-4 text-amber-400/70 hover:text-amber-400"
          >
            ✕
          </button>

          <div className="h-full p-4 flex flex-col gap-4 overflow-y-auto">
            <CharacterSheet 
              character={gameState.character} 
              language={lang} 
              phase={gameState.currentScene}
              npcRelations={gameState.npcRelations}
              mechanics={gameState.mechanics}
            />

          </div>
        </aside>
      </main>

      {/* Mobile overlay */}
      {showSidePanel && (
        <div
          className="md:hidden fixed inset-0 bg-black/50 z-30"
          onClick={() => setShowSidePanel(false)}
        />
      )}

      {/* API Key Modal */}
      <ApiKeyModal
        isOpen={showApiKeyModal}
        onClose={() => setShowApiKeyModal(false)}
        onSave={handleApiKeySave}
        currentKey={gameState.userApiKey}
        currentProvider={gameState.provider}
        currentModel={gameState.model}
        currentCustomApiUrl={gameState.customApiUrl}
        currentMode={gameState.apiMode}
        language={lang}
      />
    </div>
  );
}

export default function GamePage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-slate-950 flex items-center justify-center">
          <div className="text-amber-400 text-xl animate-pulse">Loading...</div>
        </div>
      }
    >
      <GamePageContent />
    </Suspense>
  );
}
