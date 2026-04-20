'use client';

import { useState } from 'react';

interface CharacterCreationProps {
  language: 'zh' | 'en';
  onComplete: (character: {
    name: string;
    nameEn: string;
    stats: { str: number; dex: number; int: number; cha: number };
    skills: string[];
    templateId: string;
  }) => void;
}

interface Template {
  id: string;
  name: string;
  nameEn: string;
  stats: { str: number; dex: number; int: number; cha: number };
  primaryAttr: 'str' | 'dex' | 'int' | 'cha';
  skills: string[];
  trait: string;
  desc: string;
}

const TEMPLATES: { zh: Template[]; en: Template[] } = {
  zh: [
    {
      id: 'mediator',
      name: '调和者',
      nameEn: 'Mediator',
      stats: { str: 12, dex: 10, int: 14, cha: 10 },
      primaryAttr: 'int',
      skills: ['观察', '烹饪'],
      trait: '冷静，善于调和矛盾',
      desc: '曾是著名餐厅的副厨，因事件离开，来到伊格尼斯重起炉灶',
    },
    {
      id: 'action',
      name: '行动派',
      nameEn: 'Action-Oriented',
      stats: { str: 10, dex: 14, int: 10, cha: 12 },
      primaryAttr: 'dex',
      skills: ['巧手', '隐匿', '表演'],
      trait: '机敏，擅长变通',
      desc: '街头长大的孤儿，擅长用小聪明解决问题，酒馆是你的掩护身份',
    },
    {
      id: 'persuader',
      name: '说服者',
      nameEn: 'Persuader',
      stats: { str: 10, dex: 10, int: 8, cha: 16 },
      primaryAttr: 'cha',
      skills: ['威压', '交易'],
      trait: '有感染力，能说动人',
      desc: '落魄贵族后裔，负债累累，寄希望于酒馆生意翻身',
    },
    {
      id: 'warrior',
      name: '武者',
      nameEn: 'Warrior',
      stats: { str: 16, dex: 12, int: 10, cha: 8 },
      primaryAttr: 'str',
      skills: ['格斗', '感知', '生存'],
      trait: '可靠，关键时刻靠得住',
      desc: '退役佣兵，想在伊格尼斯找个安静地方度过余生',
    },
  ],
  en: [
    {
      id: 'mediator',
      name: 'Mediator',
      nameEn: 'Mediator',
      stats: { str: 12, dex: 10, int: 14, cha: 10 },
      primaryAttr: 'int',
      skills: ['Perception', 'Cooking'],
      trait: 'Calm, skilled at resolving conflicts',
      desc: 'Former sous-chef at a famous restaurant, left after an incident',
    },
    {
      id: 'action',
      name: 'Action-Oriented',
      nameEn: 'Action-Oriented',
      stats: { str: 10, dex: 14, int: 10, cha: 12 },
      primaryAttr: 'dex',
      skills: ['Sleight of Hand', 'Stealth', 'Performance'],
      trait: 'Quick-witted, adaptable',
      desc: 'Street orphan, skilled at clever solutions, tavern is your cover',
    },
    {
      id: 'persuader',
      name: 'Persuader',
      nameEn: 'Persuader',
      stats: { str: 10, dex: 10, int: 8, cha: 16 },
      primaryAttr: 'cha',
      skills: ['Intimidation', 'Trade'],
      trait: 'Charismatic, persuasive',
      desc: 'Fallen noble descendant, deep in debt, betting on the tavern',
    },
    {
      id: 'warrior',
      name: 'Warrior',
      nameEn: 'Warrior',
      stats: { str: 16, dex: 12, int: 10, cha: 8 },
      primaryAttr: 'str',
      skills: ['Fighting', 'Perception', 'Survival'],
      trait: 'Reliable, dependable in crisis',
      desc: 'Retired mercenary, seeking a quiet life in Ignis',
    },
  ],
};

const QUIZ_QUESTIONS = {
  zh: [
    {
      question: '你最在乎什么？',
      options: [
        { text: '友情', type: 'friendship' },
        { text: '金钱', type: 'money' },
        { text: '真相', type: 'truth' },
        { text: '荣誉', type: 'honor' },
      ],
    },
    {
      question: '你有什么缺点？',
      options: [
        { text: '冲动', type: 'honor' },
        { text: '优柔寡断', type: 'truth' },
        { text: '贪吃', type: 'gluttony' },
        { text: '害羞', type: 'shy' },
      ],
    },
    {
      question: '你想成为什么样的人？',
      options: [
        { text: '被尊重', type: 'money' },
        { text: '被喜爱', type: 'friendship' },
        { text: '不被遗忘', type: 'gluttony' },
        { text: '问心无愧', type: 'shy' },
      ],
    },
  ],
  en: [
    {
      question: 'What matters most to you?',
      options: [
        { text: 'Friendship', type: 'friendship' },
        { text: 'Money', type: 'money' },
        { text: 'Truth', type: 'truth' },
        { text: 'Honor', type: 'honor' },
      ],
    },
    {
      question: 'What is your flaw?',
      options: [
        { text: 'Impulsive', type: 'honor' },
        { text: 'Indecisive', type: 'truth' },
        { text: 'Gluttonous', type: 'gluttony' },
        { text: 'Shy', type: 'shy' },
      ],
    },
    {
      question: 'Who do you want to become?',
      options: [
        { text: 'Respected', type: 'money' },
        { text: 'Loved', type: 'friendship' },
        { text: 'Unforgotten', type: 'gluttony' },
        { text: 'At peace', type: 'shy' },
      ],
    },
  ],
};

const STAT_MAPPING: Record<string, { str: number; dex: number; int: number; cha: number; primaryAttr: 'str' | 'dex' | 'int' | 'cha' }> = {
  honor: { str: 14, dex: 12, int: 8, cha: 10, primaryAttr: 'str' },
  truth: { str: 10, dex: 10, int: 14, cha: 10, primaryAttr: 'int' },
  friendship: { str: 10, dex: 12, int: 10, cha: 14, primaryAttr: 'cha' },
  money: { str: 12, dex: 10, int: 10, cha: 14, primaryAttr: 'cha' },
  gluttony: { str: 14, dex: 10, int: 12, cha: 8, primaryAttr: 'str' },
  shy: { str: 10, dex: 14, int: 12, cha: 8, primaryAttr: 'dex' },
};

const TEMPLATE_MAPPING: Record<string, string> = {
  honor: 'warrior',
  truth: 'mediator',
  friendship: 'persuader',
  money: 'persuader',
  gluttony: 'warrior',
  shy: 'action',
};

const getMod = (val: number) => {
  if (val >= 16) return '+3';
  if (val >= 14) return '+2';
  if (val >= 12) return '+1';
  if (val >= 10) return '+0';
  if (val >= 8) return '-1';
  return '-2';
};

const ATTR_LABELS = {
  zh: { str: '体魄', dex: '敏捷', int: '心智', cha: '魅力' },
  en: { str: 'STR', dex: 'DEX', int: 'INT', cha: 'CHA' },
};

export default function CharacterCreation({ language, onComplete }: CharacterCreationProps) {
  const [mode, setMode] = useState<'template' | 'quiz'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [isConfirming, setIsConfirming] = useState(false);

  const texts = {
    zh: {
      title: '创建你的角色',
      subtitle: '选择一种方式定义你的酒馆老板',
      templateTab: '预设模板',
      quizTab: '问答生成',
      quizProgress: (current: number) => `问题 ${current + 1}/3`,
      confirmTitle: '角色已确认！',
      confirmDesc: '准备进入伊格尼斯...',
      selectTemplate: '选择此模板',
      skills: '技能',
      trait: '特质',
      primary: '★',
    },
    en: {
      title: 'Create Your Character',
      subtitle: 'Choose how to define your tavern keeper',
      templateTab: 'Templates',
      quizTab: 'Quiz',
      quizProgress: (current: number) => `Question ${current + 1}/3`,
      confirmTitle: 'Character Confirmed!',
      confirmDesc: 'Ready to enter Ignis...',
      selectTemplate: 'Select',
      skills: 'Skills',
      trait: 'Trait',
      primary: '★',
    },
  };

  const t = texts[language];
  const templates = TEMPLATES[language];
  const questions = QUIZ_QUESTIONS[language];
  const attrLabels = ATTR_LABELS[language];

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template.id);
    setIsConfirming(true);

    setTimeout(() => {
      onComplete({
        name: template.name,
        nameEn: template.nameEn,
        stats: template.stats,
        skills: template.skills,
        templateId: template.id,
      });
    }, 1500);
  };

  const handleQuizAnswer = (type: string) => {
    const newAnswers = [...quizAnswers, type];
    setQuizAnswers(newAnswers);

    if (newAnswers.length < 3) {
      setQuizStep(quizStep + 1);
    } else {
      const counts: Record<string, number> = {};
      newAnswers.forEach((a) => {
        counts[a] = (counts[a] || 0) + 1;
      });
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];

      const generatedStats = STAT_MAPPING[mostCommon];
      const templateId = TEMPLATE_MAPPING[mostCommon];
      const template = TEMPLATES[language].find((tp) => tp.id === templateId) || templates[0];

      setIsConfirming(true);
      setTimeout(() => {
        onComplete({
          name: template.name,
          nameEn: template.nameEn,
          stats: {
            str: generatedStats.str,
            dex: generatedStats.dex,
            int: generatedStats.int,
            cha: generatedStats.cha,
          },
          skills: template.skills,
          templateId: `quiz-${mostCommon}`,
        });
      }, 1500);
    }
  };

  const resetQuiz = () => {
    setQuizStep(0);
    setQuizAnswers([]);
  };

  if (isConfirming) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/95">
        <div className="text-center animate-pulse">
          <div className="text-6xl mb-6">✨</div>
          <h2 className="text-3xl font-bold text-amber-400 mb-3">{t.confirmTitle}</h2>
          <p className="text-amber-200/60">{t.confirmDesc}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center bg-slate-950 overflow-y-auto py-8">
      <div className="w-full max-w-4xl mx-auto p-4">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="text-5xl mb-4">🏰</div>
          <h2 className="text-3xl font-bold text-amber-400 mb-2">{t.title}</h2>
          <p className="text-amber-200/50">{t.subtitle}</p>
        </div>

        {/* Mode Toggle */}
        <div className="flex justify-center mb-8">
          <div className="inline-flex bg-slate-800/70 border border-amber-700/30 rounded-lg p-1">
            <button
              onClick={() => {
                setMode('template');
                resetQuiz();
              }}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'template'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                  : 'text-amber-400/70 hover:text-amber-300'
              }`}
            >
              {t.templateTab}
            </button>
            <button
              onClick={() => setMode('quiz')}
              className={`px-6 py-2 rounded-md text-sm font-medium transition-all ${
                mode === 'quiz'
                  ? 'bg-amber-600 text-white shadow-lg shadow-amber-900/30'
                  : 'text-amber-400/70 hover:text-amber-300'
              }`}
            >
              {t.quizTab}
            </button>
          </div>
        </div>

        {/* Template Selection Mode */}
        {mode === 'template' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {templates.map((template) => (
              <button
                key={template.id}
                onClick={() => handleTemplateSelect(template)}
                disabled={selectedTemplate !== null}
                className={`group relative text-left p-5 rounded-xl border transition-all duration-300 hover:scale-[1.02] ${
                  selectedTemplate === template.id
                    ? 'bg-slate-800/70 border-amber-400 shadow-lg shadow-amber-900/40'
                    : 'bg-slate-800/50 border-amber-700/30 hover:border-amber-500/50 hover:bg-slate-800/70'
                }`}
              >
                {/* Header */}
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="text-xl font-bold text-amber-400 mb-1">
                      {template.name}
                      <span className="text-amber-200/40 text-sm font-normal ml-2">
                        {template.nameEn}
                      </span>
                    </h3>
                    <p className="text-amber-200/50 text-sm">{template.desc}</p>
                  </div>
                  <span className="text-amber-300/60 text-xs bg-amber-900/30 border border-amber-700/40 px-2 py-1 rounded whitespace-nowrap ml-2">
                    {t.selectTemplate}
                  </span>
                </div>

                {/* Stats grid */}
                <div className="grid grid-cols-4 gap-2 mb-4">
                  {(['str', 'dex', 'int', 'cha'] as const).map((attr) => {
                    const isPrimary = template.primaryAttr === attr;
                    return (
                      <div
                        key={attr}
                        className={`text-center p-2 rounded-lg ${
                          isPrimary
                            ? 'bg-amber-900/40 border border-amber-600/50'
                            : 'bg-slate-700/30'
                        }`}
                      >
                        <div className={`text-xs mb-1 ${isPrimary ? 'text-amber-300' : 'text-slate-400'}`}>
                          {attrLabels[attr]} {isPrimary ? t.primary : ''}
                        </div>
                        <div className={`text-lg font-bold ${isPrimary ? 'text-amber-400' : 'text-slate-200'}`}>
                          {template.stats[attr]}
                        </div>
                        <div className="text-xs text-slate-500">{getMod(template.stats[attr])}</div>
                      </div>
                    );
                  })}
                </div>

                {/* Skills & Trait */}
                <div className="flex flex-wrap gap-2 mb-2">
                  {template.skills.map((skill) => (
                    <span
                      key={skill}
                      className="text-xs bg-amber-900/20 border border-amber-700/30 text-amber-300 px-2 py-1 rounded"
                    >
                      {t.skills}: {skill}
                    </span>
                  ))}
                </div>
                <div className="text-xs text-amber-200/40 italic">
                  {t.trait}: {template.trait}
                </div>
              </button>
            ))}
          </div>
        )}

        {/* Quiz Mode */}
        {mode === 'quiz' && (
          <div className="max-w-lg mx-auto">
            {/* Progress dots */}
            <div className="flex justify-center gap-2 mb-8">
              {[0, 1, 2].map((i) => (
                <div
                  key={i}
                  className={`w-3 h-3 rounded-full transition-all ${
                    i < quizStep
                      ? 'bg-amber-500'
                      : i === quizStep
                      ? 'bg-amber-400 scale-125'
                      : 'bg-slate-600'
                  }`}
                />
              ))}
            </div>

            {/* Question */}
            <div className="text-center mb-6">
              <div className="text-sm text-amber-300/60 mb-2">
                {t.quizProgress(quizStep)}
              </div>
              <h3 className="text-2xl font-bold text-amber-400">
                {questions[quizStep].question}
              </h3>
            </div>

            {/* Options */}
            <div className="space-y-3">
              {questions[quizStep].options.map((option) => (
                <button
                  key={option.type}
                  onClick={() => handleQuizAnswer(option.type)}
                  className="w-full text-left p-4 rounded-xl bg-slate-800/50 border border-amber-700/30 hover:border-amber-500/50 hover:bg-slate-800/70 transition-all duration-200 hover:scale-[1.01]"
                >
                  <span className="text-amber-200 text-lg">{option.text}</span>
                </button>
              ))}
            </div>

            {/* Back button */}
            {quizStep > 0 && (
              <button
                onClick={resetQuiz}
                className="mt-6 text-amber-400/50 hover:text-amber-300 text-sm transition-colors"
              >
                {language === 'zh' ? '← 重新开始' : '← Start over'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
