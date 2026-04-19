'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import LanguageSelector from '@/components/LanguageSelector';
import ApiKeyModal from '@/components/ApiKeyModal';
import { hasSave } from '@/lib/storage';
import { loadSettings, saveSettings } from '@/lib/settings';

export default function Home() {
  const router = useRouter();
  const [language, setLanguage] = useState<'zh' | 'en'>('zh');
  const [showApiModal, setShowApiModal] = useState(false);
  const [hasSavedGame, setHasSavedGame] = useState(false);

  useEffect(() => {
    const settings = loadSettings();
    if (settings.language) setLanguage(settings.language);
    setHasSavedGame(hasSave());
  }, []);

  const handleStartGame = () => {
    router.push('/game');
  };

  const handleContinue = () => {
    router.push('/game?continue=true');
  };

  const texts = {
    zh: {
      title: '伊格尼斯酒馆',
      subtitle: 'Ignis Tavern',
      tagline: '在美食之城的阴影下，揭开被遗忘的秘密',
      description: `一座以美食闻名的烹饪之都，一位继承小酒馆的老板。
        当尸骨在锅底浮现，当食客眼中藏着疯狂，
        你必须选择——配合作恶的食客，还是反抗扭曲的味觉？`,
      start: '开始新游戏',
      continue: '继续游戏',
      settings: 'API 设置',
    },
    en: {
      title: '伊格尼斯酒馆',
      subtitle: 'Ignis Tavern',
      tagline: 'Beneath the shadows of the culinary capital, uncover forgotten secrets',
      description: `A city famous for its cuisine, a tavern keeper who inherited a corner shop.
        When bones appear in the broth, when diners' eyes hide madness,
        you must choose—to cooperate with the wicked diners, or resist the twisted tastes?`,
      start: 'New Game',
      continue: 'Continue',
      settings: 'API Settings',
    },
  };

  const t = texts[language];

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-orange-600/10 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-80 h-80 bg-amber-600/10 rounded-full blur-3xl" />
        <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />
        <div className="absolute bottom-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-amber-700/30 to-transparent" />
      </div>

      <div className="absolute top-6 right-6 z-20">
        <LanguageSelector currentLang={language} onChange={setLanguage} size="md" />
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        <div className="mb-8">
          <h1 className="text-5xl md:text-7xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-500 to-amber-400 mb-3 tracking-wide">
            {t.title}
          </h1>
          <h2 className="text-2xl md:text-3xl text-amber-200/70 tracking-widest uppercase">
            {t.subtitle}
          </h2>
        </div>

        <p className="text-amber-100/60 text-lg md:text-xl mb-6 max-w-xl mx-auto leading-relaxed">
          {t.tagline}
        </p>

        <p className="text-amber-200/50 text-sm md:text-base mb-12 max-w-lg mx-auto leading-relaxed whitespace-pre-line">
          {t.description}
        </p>

        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleStartGame}
            className="group relative px-10 py-4 min-w-[200px]
                       bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700
                       text-white text-lg rounded-xl
                       hover:shadow-lg hover:shadow-orange-900/40
                       hover:scale-105 active:scale-100
                       transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
            <span className="relative z-10">{t.start}</span>
          </button>

          {hasSavedGame && (
            <button
              onClick={handleContinue}
              className="px-8 py-4 min-w-[180px]
                         border-2 border-amber-700/50 text-amber-300
                         text-lg rounded-xl
                         hover:bg-amber-900/20 hover:border-amber-500/50
                         transition-all duration-300"
            >
              {t.continue}
            </button>
          )}
        </div>

        <button
          onClick={() => setShowApiModal(true)}
          className="mt-8 text-amber-500/50 hover:text-amber-400 text-sm underline underline-offset-4 transition-colors"
        >
          {t.settings}
        </button>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 text-amber-700/30 text-sm">
        <span>◆</span>
        <span>伊格尼斯 · 烹饪之都</span>
        <span>◆</span>
      </div>

      <ApiKeyModal
        isOpen={showApiModal}
        onClose={() => setShowApiModal(false)}
        onSave={(s) => saveSettings(s)}
        currentKey={loadSettings().apiKey}
        currentProvider={loadSettings().provider}
        currentModel={loadSettings().model}
        currentCustomApiUrl={loadSettings().customApiUrl}
        language={language}
      />
    </main>
  );
}
