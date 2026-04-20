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
      tagline: '炉火之都的街角，你的故事从这里开始',
      description: '伊格尼斯——一座以美食、夜市和永不熄灭的圣焰闻名的城邦。\n你继承了街角一间破旧的小酒馆"灰烬酒馆"，\n带着三个性格迥异的员工，准备让它重获新生。\n……但这座城市的夜晚，似乎藏着不为人知的秘密。',
      start: '🔥 开始冒险',
      continue: '继续游戏',
      settings: '🔑 API 设置',
    },
    en: {
      title: 'Ignis Tavern',
      tagline: 'On a corner of the Hearthfire City, your story begins',
      description: 'Ignis — a city-state famous for its cuisine, night markets, and the eternally burning Sacred Flame.\nYou\'ve inherited a run-down corner tavern called "The Ashen",\nwith three employees of wildly different personalities, ready to bring it back to life.\n...But the city\'s nights seem to hold secrets unknown.',
      start: '🔥 Begin Adventure',
      continue: 'Continue',
      settings: '🔑 API Settings',
    },
  };

  const t = texts[language];

  return (
    <main className="min-h-screen bg-slate-950 flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Background effects — warm, inviting */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/3 left-1/3 w-[500px] h-[500px] bg-amber-600/8 rounded-full blur-3xl" />
        <div className="absolute bottom-1/3 right-1/3 w-[400px] h-[400px] bg-orange-500/8 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] bg-red-500/5 rounded-full blur-3xl" />
      </div>

      {/* Top bar: language + API */}
      <div className="absolute top-4 left-4 right-4 z-20 flex items-center justify-between">
        <LanguageSelector currentLang={language} onChange={setLanguage} size="md" />
        <button
          onClick={() => setShowApiModal(true)}
          className="flex items-center gap-2 px-4 py-2 bg-amber-900/30 border border-amber-700/40 rounded-lg text-amber-400/80 text-sm hover:bg-amber-900/50 hover:text-amber-300 transition-all"
        >
          {t.settings}
        </button>
      </div>

      <div className="relative z-10 max-w-2xl w-full text-center">
        {/* Title */}
        <div className="mb-10">
          <h1 className="text-6xl md:text-8xl text-transparent bg-clip-text bg-gradient-to-r from-amber-400 via-orange-400 to-amber-400 mb-4 tracking-wider font-bold">
            {t.title}
          </h1>
          <div className="w-24 h-1 bg-gradient-to-r from-transparent via-amber-500 to-transparent mx-auto mb-6" />
        </div>

        {/* Tagline */}
        <p className="text-amber-100/70 text-lg md:text-xl mb-5 max-w-xl mx-auto leading-relaxed">
          {t.tagline}
        </p>

        {/* Description */}
        <p className="text-amber-200/45 text-sm md:text-base mb-14 max-w-lg mx-auto leading-relaxed whitespace-pre-line">
          {t.description}
        </p>

        {/* Buttons */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <button
            onClick={handleStartGame}
            className="group relative px-12 py-4 min-w-[220px]
                       bg-gradient-to-r from-amber-700 via-orange-600 to-amber-700
                       text-white text-lg rounded-xl font-bold
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
      </div>

      {/* Bottom decoration */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex items-center gap-4 text-amber-700/20 text-sm">
        <span>◆</span>
        <span>{language === 'zh' ? '伊格尼斯 · 炉火之都' : 'Ignis · City of Hearthfire'}</span>
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
