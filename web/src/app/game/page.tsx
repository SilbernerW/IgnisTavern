'use client';

import { useState, useReducer, useRef, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import CharacterSheet from '@/components/CharacterSheet';
import DiceRoller from '@/components/DiceRoller';
import ChatInput from '@/components/ChatInput';
import StreamingText from '@/components/StreamingText';
import LanguageSelector from '@/components/LanguageSelector';
import ApiKeyModal from '@/components/ApiKeyModal';
import {
  GameState,
  createInitialGameState,
  gameStateReducer,
} from '@/lib/gameState';
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
  const [awaitingDice, setAwaitingDice] = useState(false);
  const [diceDifficulty, setDiceDifficulty] = useState<number | undefined>();
  const [diceCheckLabel, setDiceCheckLabel] = useState<string>('');
  const abortRef = useRef<AbortController | null>(null);

  const hasInitialized = useRef(false);

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
      // New game: start character creation
      // Pass settings directly so we don't depend on async React state
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

  const startCharacterCreation = async (settings?: { apiKey?: string; provider?: string; model?: string; customApiUrl?: string; language?: string }) => {
    dispatch({ type: 'SET_STREAMING', payload: true });

    const lang = settings?.language || gameState.language;
    const key = settings?.apiKey || gameState.userApiKey;
    const prov = settings?.provider || gameState.provider;
    const mdl = settings?.model || gameState.model;
    const url = settings?.customApiUrl || gameState.customApiUrl;

    const triggerMessage = lang === 'zh'
      ? '开始游戏'
      : 'Start the game';

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
      dispatch({ type: 'FINISH_STREAMING', payload: fullResponse });
    } catch (error: any) {
      let errMsg = error.message || 'Unknown error';
      if (errMsg.includes('daily_limit')) {
        errMsg = lang === 'zh'
          ? '今日免费额度已用完（10次/天）。请点击右上角 🔑「API Key」配置自己的 Key 解除限制！'
          : 'Daily free limit reached (10/day). Click 🔑 "API Key" in the top-right to configure your own key!';
        setTimeout(() => setShowApiKeyModal(true), 500);
      } else if (errMsg.includes('abort') || errMsg.includes('AbortError')) {
        errMsg = lang === 'zh'
          ? '请求超时（30秒无响应）。保底模型可能已不可用，请点击右上角「API Key」配置自己的 Key。'
          : 'Request timed out (30s). Fallback model may be unavailable — please click "API Key" to configure your own.';
      } else if (errMsg.includes('balance') || errMsg.includes('depleted') || errMsg.includes('insufficient')) {
        errMsg = lang === 'zh'
          ? '保底模型余额不足。请点击右上角「API Key」配置自己的 Key。'
          : 'Fallback model balance depleted. Please click "API Key" to configure your own.';
      } else if (errMsg.includes('401') || errMsg.includes('403')) {
        errMsg = lang === 'zh'
          ? 'API Key 无效或余额不足。请点击右上角「API Key」检查设置。'
          : 'API key invalid or balance depleted. Please click "API Key" to check settings.';
      } else {
        errMsg = lang === 'zh'
          ? `连接失败：${errMsg}`
          : `Connection failed: ${errMsg}`;
      }
      dispatch({ type: 'FINISH_STREAMING', payload: fullResponse || errMsg });
    }
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

        dispatch({ type: 'FINISH_STREAMING', payload: fullResponse });

        // Check if the response contains a dice check request
        // Support both Chinese and English patterns
        const dicePatterns = [
          /🎲\s*检定[：:]\s*(\S+)\s*DC\s*(\d+)/i,
          /🎲\s*Check[：:]\s*(\S+)\s*DC\s*(\d+)/i,
          /检定[：:]\s*(\S+)\s*DC\s*(\d+)/i,
          /Check[：:]\s*(\S+)\s*DC\s*(\d+)/i,
          /DC\s*(\d+)/i,
        ];

        let detectedDC: number | undefined;
        let detectedLabel = '';
        for (const pattern of dicePatterns) {
          const match = fullResponse.match(pattern);
          if (match) {
            detectedDC = parseInt(match[2] || match[1]);
            // If the pattern captures a label (e.g. "体魄", "STR"), use it
            if (match.length >= 3 && match[1] && !/^\d+$/.test(match[1])) {
              detectedLabel = match[1];
            }
            break;
          }
        }

        if (detectedDC) {
          setAwaitingDice(true);
          setDiceDifficulty(detectedDC);
          setDiceCheckLabel(detectedLabel);
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
    [gameState.messages, gameState.isStreaming, gameState.language, gameState.userApiKey]
  );

  const handleDiceRoll = useCallback(
    async (result: number) => {
      const success = diceDifficulty ? result >= diceDifficulty : true;
      dispatch({
        type: 'SET_DICE_ROLL',
        payload: { result, success, difficulty: diceDifficulty || 0 },
      });

      // Send dice result as a follow-up message
      const diceMsg = gameState.language === 'zh'
        ? `[骰子结果：d20=${result}${diceDifficulty ? ` vs DC${diceDifficulty}` : ''} → ${success ? '成功' : '失败'}]`
        : `[Dice result: d20=${result}${diceDifficulty ? ` vs DC${diceDifficulty}` : ''} → ${success ? 'Success' : 'Failure'}]`;

      setAwaitingDice(false);
      setDiceDifficulty(undefined);
      setDiceCheckLabel('');

      await handleSendMessage(diceMsg);
    },
    [diceDifficulty, gameState.language, handleSendMessage]
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
                <div
                  key={index}
                  className={`mb-4 ${
                    msg.role === 'user' ? 'flex justify-end' : ''
                  }`}
                >
                  <div
                    className={`${
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
              {/* Dice check notification */}
              {awaitingDice && (
                <div className="flex items-center justify-center gap-3 py-2 mb-2 rounded-lg bg-amber-900/20 border border-amber-700/30">
                  <span className="text-amber-300 text-sm">
                    🎲 {lang === 'zh' ? '需要投骰！' : 'Dice check needed!'} DC {diceDifficulty}
                  </span>
                  <button
                    onClick={() => {
                      const diceSection = document.getElementById('dice-roller');
                      diceSection?.scrollIntoView({ behavior: 'smooth' });
                    }}
                    className="text-amber-400 text-sm underline"
                  >
                    {lang === 'zh' ? '去投骰 →' : 'Roll →'}
                  </button>
                  <button
                    onClick={() => {
                      setAwaitingDice(false);
                      setDiceDifficulty(undefined);
                      setDiceCheckLabel('');
                    }}
                    className="text-amber-500/50 text-xs ml-2"
                  >
                    ✕
                  </button>
                </div>
              )}

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
            <CharacterSheet character={gameState.character} language={lang} />
            {/* Dice roller — locked until DM requests a check */}
            <div id="dice-roller">
              <DiceRoller
                onRoll={handleDiceRoll}
                disabled={gameState.isStreaming}
                locked={!awaitingDice}
                difficulty={diceDifficulty}
                checkLabel={diceCheckLabel}
              />
            </div>
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
