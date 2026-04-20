'use client';

interface InlineNotificationProps {
  type: 'item_add' | 'item_remove' | 'hp_change' | 'skill_add' | 'xp';
  value: string | number;
  language: 'zh' | 'en';
}

const LABELS = {
  zh: {
    item_add: '获得物品',
    item_remove: '失去物品',
    hp_change: '生命值',
    skill_add: '获得技能',
    xp: '获得经验',
  },
  en: {
    item_add: 'Item gained',
    item_remove: 'Item lost',
    hp_change: 'HP changed',
    skill_add: 'Skill gained',
    xp: 'XP gained',
  },
};

const ICONS: Record<string, string> = {
  item_add: '🎒',
  item_remove: '🎒',
  hp_change: '❤️',
  skill_add: '✨',
  xp: '⭐',
};

export default function InlineNotification({ type, value, language }: InlineNotificationProps) {
  const isPositive = type === 'item_add' || type === 'skill_add' || type === 'xp';
  const label = LABELS[language][type];
  const icon = ICONS[type];

  return (
    <div className={`my-1.5 px-3 py-2 rounded-lg border text-sm flex items-center gap-2 animate-fadeIn ${
      isPositive
        ? 'bg-green-900/15 border-green-700/20 text-green-300/80'
        : 'bg-red-900/15 border-red-700/20 text-red-300/80'
    }`}>
      <span>{icon}</span>
      <span className="text-xs text-amber-200/40">{label}</span>
      <span className="font-medium">{isPositive ? '+' : '-'} {value}</span>
    </div>
  );
}
