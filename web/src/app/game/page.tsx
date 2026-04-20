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
  DmTagPatch,
  createInitialGameState,
  gameStateReducer,
} from '@/lib/gameState';
import { parseDiceCheck, calculateRollResult, formatRollMessage } from '@/lib/diceMachine';
import { streamChatMessage } from '@/lib/api';
import { loadGame, saveGame } from '@/lib/storage';
import { loadSettings, saveSettings as persistSettings } from '@/lib/settings';
import { PROVIDERS, ProviderId } from '@/lib/providers';

function GamePageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [gameState, dispatch] = useReducer(gameStateReducer, createInitialGameState());
  const [showSidePanel, setShowSidePanel] = useState(false);
  const [showApiKeyModal, setShowApiKeyModal] = useState(false);

  // Ref to always have latest API settings (avoids stale closure issues)
  const apiSettingsRef = useRef({
    language: gameState.language,
    userApiKey: gameState.userApiKey,
    provider: gameState.provider,
    model: gameState.model,
    customApiUrl: gameState.customApiUrl,
  });
  // Keep ref in sync with state
  apiSettingsRef.current = {
    language: gameState.language,
    userApiKey: gameState.userApiKey,
    provider: gameState.provider,
    model: gameState.model,
    customApiUrl: gameState.customApiUrl,
  };

  const hasInitialized = useRef(false);

  /**
   * Strip all [CHAR:...] and [PHASE_TRANSITION:...] tags from DM text.
   * Parse [CHAR:...] tags into a single reducer patch to avoid fragmented state writes.
   * Returns cleaned text for display.
   */
  function parseDmTagPatch(text: string): DmTagPatch {
    const patch: DmTagPatch = {};
    const addItems: string[] = [];
    const removeItems: string[] = [];
    const addSkills: string[] = [];
    const npcDeltas: Array<{ npcName: string; delta: number }> = [];

    const tagRegex = /\[CHAR:([a-zA-Z0-9+\-]+)=([^\]]+)\]/g;
    let match: RegExpExecArray | null;

    while ((match = tagRegex.exec(text)) !== null) {
      const key = match[1];
      const value = match[2].trim();

      switch (key) {
        case 'hp': {
          const hpMatch = value.match(/^(\d+)\/(\d+)$/);
          if (hpMatch) {
            const hp = parseInt(hpMatch[1], 10);
            const maxHp = parseInt(hpMatch[2], 10);
            if (hp >= 0 && maxHp > 0 && hp <= maxHp) {
              patch.hp = hp;
              patch.maxHp = maxHp;
            }
          }
          break;
        }
        case 'item+':
          if (value) addItems.push(value);
          break;
        case 'item-':
          if (value) removeItems.push(value);
          break;
        case 'skill+':
          if (value) addSkills.push(value);
          break;
        case 'xp': {
          const xp = parseInt(value, 10);
          if (!Number.isNaN(xp) && xp > 0) {
            patch.xpGain = (patch.xpGain ?? 0) + xp;
          }
          break;
        }
        case 'npc+': {
          const npcMatch = value.match(/^(\w+):(-?\d+)$/);
          if (npcMatch) {
            npcDeltas.push({ npcName: npcMatch[1], delta: parseInt(npcMatch[2], 10) });
          }
          break;
        }
        case 'name':
          patch.name = value;
          break;
        case 'stats': {
          const nextStats: DmTagPatch['stats'] = { ...(patch.stats ?? {}) };
          const statEntries = value.split(',').map(s => s.trim());
          for (const entry of statEntries) {
            const m = entry.match(/^(STR|DEX|INT|CHA|体魄|敏捷|心智|魅力)\s*(\d+)$/i);
            if (!m) continue;
            const label = m[1].toUpperCase();
            const statValue = parseInt(m[2], 10);
            if (label === 'STR' || label === '体魄') nextStats.str = statValue;
            if (label === 'DEX' || label === '敏捷') nextStats.dex = statValue;
            if (label === 'INT' || label === '心智') nextStats.int = statValue;
            if (label === 'CHA' || label === '魅力') nextStats.cha = statValue;
          }
          if (Object.keys(nextStats).length > 0) {
            patch.stats = nextStats;
          }
          break;
        }
      }
    }

    if (addItems.length > 0) patch.addItems = addItems;
    if (removeItems.length > 0) patch.removeItems = removeItems;
    if (addSkills.length > 0) patch.addSkills = addSkills;
    if (npcDeltas.length > 0) patch.npcDeltas = npcDeltas;

    return patch;
  }

  function hasDmTagPatch(patch: DmTagPatch): boolean {
    return (
      patch.hp !== undefined
      || patch.maxHp !== undefined
      || patch.name !== undefined
      || patch.nameEn !== undefined
      || patch.xpGain !== undefined
      || (patch.stats !== undefined && Object.keys(patch.stats).length > 0)
      || (patch.addItems !== undefined && patch.addItems.length > 0)
      || (patch.removeItems !== undefined && patch.removeItems.length > 0)
      || (patch.addSkills !== undefined && patch.addSkills.length > 0)
      || (patch.npcDeltas !== undefined && patch.npcDeltas.length > 0)
    );
  }

  function stripAndParseTags(
    text: string,
    dispatchFn: React.Dispatch<any>,
    messageIndex: number,
  ): string {
    const patch = parseDmTagPatch(text);
    if (hasDmTagPatch(patch)) {
      dispatchFn({ type: 'APPLY_DM_TAG_PATCH', payload: { patch, messageIndex } });
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
      const triggerMessage = apiSettingsRef.current.language === 'zh'
        ? '角色已创建完成，请开始游戏'
        : 'Character creation complete, start the game';

      dispatch({ type: 'ADD_USER_MESSAGE', payload: triggerMessage });
      dispatch({ type: 'SET_STREAMING', payload: true });
      dispatch({ type: 'APPEND_STREAMING_TEXT', payload: '' });

      (async () => {
        const s = apiSettingsRef.current;
        let fullResponse = '';
        try {
          for await (const chunk of streamChatMessage(
            [{ role: 'user', content: triggerMessage }],
            s.language,
            s.userApiKey,
            'opening',
            s.provider,
            s.model,
            s.customApiUrl
          )) {
            fullResponse += chunk;
            dispatch({ type: 'APPEND_STREAMING_TEXT', payload: chunk });
          }
          const cleaned = stripAndParseTags(fullResponse, dispatch, gameState.messages.length);
          dispatch({ type: 'FINISH_STREAMING', payload: cleaned });

          // Check for dice check in opening
          const check = parseDiceCheck(fullResponse);
          if (check) {
            dispatch({ type: 'SET_DICE_STATE', payload: 'awaiting_roll' });
            dispatch({ type: 'SET_CURRENT_CHECK', payload: check });
          }
        } catch (error: any) {
          const s = apiSettingsRef.current;
          const errMsg = s.language === 'zh'
            ? `连接失败：${error.message || '未知错误'}`
            : `Connection failed: ${error.message || 'Unknown error'}`;
          dispatch({ type: 'FINISH_STREAMING', payload: errMsg });
        }
      })();
    },
    [apiSettingsRef]
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
      dispatch({ type: 'LOAD_STATE', payload: saved });
    } else {
      // New game: show character creation UI
      // Pass settings directly since dispatch hasn't updated gameState yet
      startCharacterCreation(settings);
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

  const startCharacterCreation = (settings?: { apiKey?: string; provider?: string; model?: string; customApiUrl?: string; language?: string }) => {
    dispatch({ type: 'SET_SHOW_CHARACTER_CREATION', payload: true });
    dispatch({ type: 'SET_SCENE', payload: 'character_creation' });

    // Use settings directly (React dispatch is async, gameState not yet updated)
    const lang = settings?.language || gameState.language;
    const key = settings?.apiKey || gameState.userApiKey;
    const prov = settings?.provider || gameState.provider;
    const mdl = settings?.model || gameState.model;
    const url = settings?.customApiUrl || gameState.customApiUrl;

    const triggerMessage = lang === 'zh'
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
          lang,
          key,
          'character_creation',
          prov,
          mdl,
          url
        )) {
          fullResponse += chunk;
          dispatch({ type: 'APPEND_STREAMING_TEXT', payload: chunk });
        }
        const cleaned = stripAndParseTags(fullResponse, dispatch, gameState.messages.length);
        dispatch({ type: 'FINISH_STREAMING', payload: cleaned });
      } catch (error: any) {
        let errMsg = error.message || 'Unknown error';
        if (errMsg.includes('daily_limit')) {
          errMsg = lang === 'zh'
            ? '今日免费额度已用完（10次/天）。请点击右上角 🔑「API Key」配置自己的 Key 解除限制！'
            : 'Daily free limit reached (10/day). Click 🔑 "API Key" to configure your own key!';
          setTimeout(() => setShowApiKeyModal(true), 500);
        } else if (errMsg.includes('abort') || errMsg.includes('AbortError')) {
          errMsg = lang === 'zh'
            ? '请求超时。保底模型可能已不可用，请点击右上角「API Key」配置自己的 Key。'
            : 'Request timed out. Fallback model may be unavailable — please configure your own API key.';
        } else if (errMsg.includes('balance') || errMsg.includes('depleted') || errMsg.includes('insufficient')) {
          errMsg = lang === 'zh'
            ? '保底模型余额不足。请点击右上角「API Key」配置自己的 Key。'
            : 'Fallback model balance depleted. Please configure your own API key.';
        } else if (errMsg.includes('401') || errMsg.includes('403')) {
          errMsg = lang === 'zh'
            ? 'API Key 无效或余额不足。请点击右上角「API Key」检查设置。'
            : 'API key invalid or balance depleted. Please check settings.';
        } else {
          errMsg = lang === 'zh'
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
        const cleanedText = stripAndParseTags(fullResponse, dispatch, gameState.messages.length);

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
    [gameState.messages, gameState.isStreaming, gameState.language, gameState.userApiKey, gameState.currentScene, gameState.diceState]
  );

  const handleDiceRoll = useCallback(
    (totalResult: number) => {
      const check = gameState.currentCheck;
      if (!check) return;

      const statValue = gameState.character.stats[check.attribute as keyof typeof gameState.character.stats] || 10;
      const rollResult = calculateRollResult(totalResult, statValue, check.dc);

      dispatch({
        type: 'SET_DICE_ROLL',
        payload: { result: rollResult.total, success: rollResult.success, difficulty: check.dc },
      });

      // Transition to roll_resolved — card stays visible showing result
      dispatch({ type: 'SET_DICE_STATE', payload: 'roll_resolved' });

      // After a 2-second pause so player sees the result, send to DM
      const lang = apiSettingsRef.current.language || gameState.language;
      const diceMsg = formatRollMessage(rollResult, lang);
      setTimeout(() => {
        handleSendMessage(diceMsg);
      }, 2000);
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

  // Current streaming response buffer
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

              {/* Character creation card — appears after DM welcome message */}
              {gameState.showCharacterCreation && !gameState.isStreaming && (
                <InlineCharacterCreation
                  language={lang}
                  onComplete={handleCharacterCreated}
                />
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
