'use client';

import { useState } from 'react';

interface InlineCharacterCreationProps {
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
      id: 'mediator', name: '调和者', nameEn: 'Mediator',
      stats: { str: 12, dex: 10, int: 14, cha: 10 }, primaryAttr: 'int',
      skills: ['观察', '烹饪'], trait: '冷静，善于调和矛盾',
      desc: '曾是著名餐厅的副厨，因事件离开，来到伊格尼斯重起炉灶',
    },
    {
      id: 'action', name: '行动派', nameEn: 'Action-Oriented',
      stats: { str: 10, dex: 14, int: 10, cha: 12 }, primaryAttr: 'dex',
      skills: ['巧手', '隐匿', '表演'], trait: '机敏，擅长变通',
      desc: '街头长大的孤儿，擅长用小聪明解决问题，酒馆是你的掩护身份',
    },
    {
      id: 'persuader', name: '说服者', nameEn: 'Persuader',
      stats: { str: 10, dex: 10, int: 8, cha: 16 }, primaryAttr: 'cha',
      skills: ['威压', '交易'], trait: '有感染力，能说动人',
      desc: '落魄贵族后裔，负债累累，寄希望于酒馆生意翻身',
    },
    {
      id: 'warrior', name: '武者', nameEn: 'Warrior',
      stats: { str: 16, dex: 12, int: 10, cha: 8 }, primaryAttr: 'str',
      skills: ['格斗', '感知', '生存'], trait: '可靠，关键时刻靠得住',
      desc: '退役佣兵，想在伊格尼斯找个安静地方度过余生',
    },
  ],
  en: [
    {
      id: 'mediator', name: 'Mediator', nameEn: 'Mediator',
      stats: { str: 12, dex: 10, int: 14, cha: 10 }, primaryAttr: 'int',
      skills: ['Perception', 'Cooking'], trait: 'Calm, skilled at resolving conflicts',
      desc: 'Former sous-chef at a famous restaurant, left after an incident',
    },
    {
      id: 'action', name: 'Action-Oriented', nameEn: 'Action-Oriented',
      stats: { str: 10, dex: 14, int: 10, cha: 12 }, primaryAttr: 'dex',
      skills: ['Sleight of Hand', 'Stealth', 'Performance'], trait: 'Quick-witted, adaptable',
      desc: 'Street orphan, skilled at clever solutions, tavern is your cover',
    },
    {
      id: 'persuader', name: 'Persuader', nameEn: 'Persuader',
      stats: { str: 10, dex: 10, int: 8, cha: 16 }, primaryAttr: 'cha',
      skills: ['Intimidation', 'Trade'], trait: 'Charismatic, persuasive',
      desc: 'Fallen noble descendant, deep in debt, betting on the tavern',
    },
    {
      id: 'warrior', name: 'Warrior', nameEn: 'Warrior',
      stats: { str: 16, dex: 12, int: 10, cha: 8 }, primaryAttr: 'str',
      skills: ['Fighting', 'Perception', 'Survival'], trait: 'Reliable, dependable in crisis',
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
  honor: 'warrior', truth: 'mediator', friendship: 'persuader',
  money: 'persuader', gluttony: 'warrior', shy: 'action',
};

const getMod = (val: number) => {
  if (val >= 16) return '+3'; if (val >= 14) return '+2'; if (val >= 12) return '+1';
  if (val >= 10) return '+0'; if (val >= 8) return '-1'; return '-2';
};

const ATTR_LABELS = {
  zh: { str: '体魄', dex: '敏捷', int: '心智', cha: '魅力' },
  en: { str: 'STR', dex: 'DEX', int: 'INT', cha: 'CHA' },
};

export default function InlineCharacterCreation({ language, onComplete }: InlineCharacterCreationProps) {
  const [mode, setMode] = useState<'template' | 'quiz'>('template');
  const [selectedTemplate, setSelectedTemplate] = useState<string | null>(null);
  const [quizStep, setQuizStep] = useState(0);
  const [quizAnswers, setQuizAnswers] = useState<string[]>([]);
  const [completed, setCompleted] = useState(false);

  const templates = TEMPLATES[language];
  const questions = QUIZ_QUESTIONS[language];
  const attrLabels = ATTR_LABELS[language];

  const t = {
    zh: {
      title: '创建你的角色',
      subtitle: '选择一种方式定义你的酒馆老板',
      templateTab: '预设模板', quizTab: '问答生成',
      select: '选择', skills: '技能', trait: '特质',
      done: '角色已创建！冒险即将开始…',
      qProgress: (n: number) => `问题 ${n + 1}/3`,
    },
    en: {
      title: 'Create Your Character',
      subtitle: 'Choose how to define your tavern keeper',
      templateTab: 'Templates', quizTab: 'Quiz',
      select: 'Select', skills: 'Skills', trait: 'Trait',
      done: 'Character created! Adventure awaits…',
      qProgress: (n: number) => `Question ${n + 1}/3`,
    },
  }[language];

  const handleTemplateSelect = (template: Template) => {
    setSelectedTemplate(template.id);
    setCompleted(true);
    onComplete({
      name: template.name, nameEn: template.nameEn,
      stats: template.stats, skills: template.skills, templateId: template.id,
    });
  };

  const handleQuizAnswer = (type: string) => {
    const newAnswers = [...quizAnswers, type];
    setQuizAnswers(newAnswers);

    if (newAnswers.length < 3) {
      setQuizStep(quizStep + 1);
    } else {
      const counts: Record<string, number> = {};
      newAnswers.forEach((a) => { counts[a] = (counts[a] || 0) + 1; });
      const mostCommon = Object.entries(counts).sort((a, b) => b[1] - a[1])[0][0];
      const generatedStats = STAT_MAPPING[mostCommon];
      const templateId = TEMPLATE_MAPPING[mostCommon];
      const template = TEMPLATES[language].find((tp) => tp.id === templateId) || templates[0];

      setCompleted(true);
      onComplete({
        name: template.name, nameEn: template.nameEn,
        stats: { str: generatedStats.str, dex: generatedStats.dex, int: generatedStats.int, cha: generatedStats.cha },
        skills: template.skills, templateId: `quiz-${mostCommon}`,
      });
    }
  };

  const resetQuiz = () => { setQuizStep(0); setQuizAnswers([]); };

  // Completed: show compact confirmation
  if (completed) {
    return (
      <div className="my-2 p-3 rounded-xl bg-amber-900/20 border border-amber-600/30 text-center">
        <span className="text-amber-300 text-sm">✨ {t.done}</span>
      </div>
    );
  }

  return (
    <div className="my-3 p-4 rounded-xl bg-slate-800/60 border border-amber-700/30">
      {/* Header */}
      <div className="text-center mb-4">
        <h3 className="text-xl font-bold text-amber-400 mb-1">{t.title}</h3>
        <p className="text-amber-200/40 text-sm">{t.subtitle}</p>
      </div>

      {/* Mode Toggle */}
      <div className="flex justify-center mb-4">
        <div className="inline-flex bg-slate-900/50 border border-amber-700/20 rounded-lg p-0.5">
          <button
            onClick={() => { setMode('template'); resetQuiz(); }}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'template' ? 'bg-amber-600 text-white' : 'text-amber-400/60 hover:text-amber-300'
            }`}
          >
            {t.templateTab}
          </button>
          <button
            onClick={() => setMode('quiz')}
            className={`px-4 py-1.5 rounded-md text-xs font-medium transition-all ${
              mode === 'quiz' ? 'bg-amber-600 text-white' : 'text-amber-400/60 hover:text-amber-300'
            }`}
          >
            {t.quizTab}
          </button>
        </div>
      </div>

      {/* Template Mode */}
      {mode === 'template' && (
        <div className="grid grid-cols-2 gap-2">
          {templates.map((template) => (
            <button
              key={template.id}
              onClick={() => handleTemplateSelect(template)}
              disabled={selectedTemplate !== null}
              className={`text-left p-3 rounded-lg border transition-all hover:scale-[1.01] ${
                selectedTemplate === template.id
                  ? 'border-amber-400 bg-slate-800/80 shadow-lg shadow-amber-900/30'
                  : 'border-amber-700/20 bg-slate-900/40 hover:border-amber-500/40'
              }`}
            >
              <div className="flex items-center justify-between mb-2">
                <h4 className="text-amber-400 font-bold text-sm">
                  {template.name}
                  <span className="text-amber-200/30 text-xs ml-1">{template.nameEn}</span>
                </h4>
                <span className="text-amber-300/40 text-[10px] bg-amber-900/20 px-1.5 py-0.5 rounded">{t.select}</span>
              </div>
              <p className="text-amber-200/30 text-xs mb-2 line-clamp-2">{template.desc}</p>
              <div className="grid grid-cols-4 gap-1">
                {(['str', 'dex', 'int', 'cha'] as const).map((attr) => {
                  const isPrimary = template.primaryAttr === attr;
                  return (
                    <div key={attr} className={`text-center rounded px-1 py-0.5 ${isPrimary ? 'bg-amber-900/30' : ''}`}>
                      <div className={`text-[10px] ${isPrimary ? 'text-amber-300' : 'text-slate-500'}`}>
                        {attrLabels[attr]}{isPrimary ? '★' : ''}
                      </div>
                      <div className={`text-xs font-bold ${isPrimary ? 'text-amber-400' : 'text-slate-300'}`}>
                        {template.stats[attr]}
                      </div>
                    </div>
                  );
                })}
              </div>
            </button>
          ))}
        </div>
      )}

      {/* Quiz Mode */}
      {mode === 'quiz' && (
        <div className="max-w-sm mx-auto">
          <div className="flex justify-center gap-1.5 mb-4">
            {[0, 1, 2].map((i) => (
              <div key={i} className={`w-2 h-2 rounded-full transition-all ${
                i < quizStep ? 'bg-amber-500' : i === quizStep ? 'bg-amber-400 scale-125' : 'bg-slate-600'
              }`} />
            ))}
          </div>
          <div className="text-center mb-3">
            <span className="text-xs text-amber-300/50">{t.qProgress(quizStep)}</span>
            <h4 className="text-lg font-bold text-amber-400">{questions[quizStep].question}</h4>
          </div>
          <div className="space-y-2">
            {questions[quizStep].options.map((option) => (
              <button
                key={option.type}
                onClick={() => handleQuizAnswer(option.type)}
                className="w-full text-left p-3 rounded-lg bg-slate-900/40 border border-amber-700/20 hover:border-amber-500/40 hover:bg-slate-800/60 transition-all text-amber-200"
              >
                {option.text}
              </button>
            ))}
          </div>
          {quizStep > 0 && (
            <button onClick={resetQuiz} className="mt-3 text-amber-400/40 hover:text-amber-300 text-xs">
              {language === 'zh' ? '← 重新开始' : '← Start over'}
            </button>
          )}
        </div>
      )}
    </div>
  );
}
