'use client';

import { Character } from '@/lib/gameState';

interface CharacterSheetProps {
  character: Character;
  language: 'zh' | 'en';
  phase: string;
  npcRelations?: { name: string; satisfaction: number; status: string }[];
  mechanics?: { dayNumber: number; consecutiveRevenueDays: number; revenueTarget: number; todayRevenue: number; xp: number; inspectionPassed: boolean };
}

export default function CharacterSheet({ character, language, phase, npcRelations, mechanics }: CharacterSheetProps) {
  const { name, nameEn, stats, skills, inventory } = character;
  const isCreated = stats.str > 0; // Character created when stats are non-zero

  const texts = {
    zh: {
      title: '角色卡',
      hp: '生命值',
      luck: '幸运',
      reputation: '声望',
      inventory: '背包',
      skills: '技能',
      emptyInventory: '空',
      emptySkills: '无',
      notCreated: '角色未创建',
      notCreatedHint: '完成角色创建后将在此显示',
      str: '体魄',
      dex: '敏捷',
      int: '心智',
      cha: '魅力',
      template: '模板',
      npcRelations: 'NPC 关系',
      day: '天数',
      revenue: '今日营收',
      revenueTarget: '目标',
      xp: '经验',
      npcLeft: '已离开',
      npcActive: '在店',
      inspection: '检查',
      passed: '已通过',
      notYet: '未通过',
    },
    en: {
      title: 'Character',
      hp: 'HP',
      luck: 'Luck',
      reputation: 'Reputation',
      inventory: 'Inventory',
      skills: 'Skills',
      emptyInventory: 'Empty',
      emptySkills: 'None',
      notCreated: 'No Character Yet',
      notCreatedHint: 'Will appear after character creation',
      str: 'STR',
      dex: 'DEX',
      int: 'INT',
      cha: 'CHA',
      template: 'Template',
      npcRelations: 'NPC Relations',
      day: 'Day',
      revenue: 'Revenue',
      revenueTarget: 'Target',
      xp: 'XP',
      npcLeft: 'Left',
      npcActive: 'Active',
      inspection: 'Inspection',
      passed: 'Passed',
      notYet: 'Not yet',
    },
  };

  const t = texts[language];

  // Before character creation — show placeholder
  if (!isCreated) {
    return (
      <div className="bg-slate-800/50 border border-amber-700/30 rounded-xl p-4 md:p-5">
        <div className="text-center py-8">
          <div className="text-4xl mb-3 opacity-30">👤</div>
          <h3 className="text-amber-400/50 font-medium mb-2">{t.notCreated}</h3>
          <p className="text-amber-200/30 text-sm">{t.notCreatedHint}</p>
        </div>
      </div>
    );
  }

  const hpPercent = stats.maxHp > 0 ? (stats.hp / stats.maxHp) * 100 : 0;

  // Helper: get modifier from stat value
  const getMod = (val: number) => {
    if (val >= 16) return '+3';
    if (val >= 14) return '+2';
    if (val >= 12) return '+1';
    if (val >= 10) return '+0';
    if (val >= 8) return '-1';
    return '-2';
  };

  return (
    <div className="bg-slate-800/50 border border-amber-700/30 rounded-xl p-4 md:p-5">
      {/* Header */}
      <div className="flex items-start gap-4 mb-5">
        <div className="w-14 h-14 rounded-lg bg-slate-900/70 border border-amber-700/30 flex items-center justify-center text-2xl">
          ⚔️
        </div>
        <div className="flex-1 pt-1">
          <h3 className="text-amber-400 font-bold text-lg mb-0.5">{name || '???'}</h3>
          {nameEn && nameEn !== name && (
            <p className="text-amber-200/40 text-xs italic">{nameEn}</p>
          )}
        </div>
      </div>

      {/* HP Bar */}
      <div className="mb-4">
        <div className="flex justify-between text-sm mb-1.5">
          <span className="text-amber-200/70">{t.hp}</span>
          <span className="text-amber-100 font-medium">
            {stats.hp}/{stats.maxHp}
          </span>
        </div>
        <div className="h-2.5 bg-slate-900/70 rounded-full overflow-hidden">
          <div
            className={`
              h-full rounded-full transition-all duration-500
              ${hpPercent > 50
                ? 'bg-gradient-to-r from-green-600 to-green-500'
                : hpPercent > 25
                  ? 'bg-gradient-to-r from-yellow-600 to-orange-500'
                  : 'bg-gradient-to-r from-red-700 to-red-500'}
            `}
            style={{ width: `${Math.max(hpPercent, 2)}%` }}
          />
        </div>
      </div>

      {/* Attribute scores */}
      <div className="grid grid-cols-2 gap-2 mb-4">
        {[
          { key: 'str', label: t.str, val: stats.str },
          { key: 'dex', label: t.dex, val: stats.dex },
          { key: 'int', label: t.int, val: stats.int },
          { key: 'cha', label: t.cha, val: stats.cha },
        ].map(attr => (
          <div key={attr.key} className="bg-slate-900/50 rounded-lg p-2.5 text-center">
            <div className="text-amber-500/60 text-xs mb-0.5 uppercase tracking-wider">
              {attr.label}
            </div>
            <div className="text-amber-100 text-lg font-bold">{attr.val}</div>
            <div className="text-amber-400/40 text-xs">{getMod(attr.val)}</div>
          </div>
        ))}
      </div>

      {/* Skills */}
      {skills.length > 0 && (
        <div className="mb-4">
          <h4 className="text-amber-400/80 text-xs font-bold mb-2 uppercase tracking-wider">
            {t.skills}
          </h4>
          <div className="flex flex-wrap gap-1.5">
            {skills.map((skill, i) => (
              <span
                key={i}
                className="px-2 py-0.5 bg-amber-900/30 border border-amber-700/30 rounded text-amber-200/70 text-xs"
              >
                {skill}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Inventory */}
      <div className="mb-4">
        <h4 className="text-amber-400/80 text-xs font-bold mb-2 uppercase tracking-wider">
          {t.inventory}
        </h4>
        {inventory.length > 0 ? (
          <ul className="space-y-1">
            {inventory.map((item, index) => (
              <li
                key={index}
                className="text-amber-100/60 text-sm flex items-center gap-2 py-1 px-2 bg-slate-900/30 rounded"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600/40" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-amber-200/30 text-sm italic py-1">{t.emptyInventory}</p>
        )}
      </div>

      {/* NPC Relations */}
      {npcRelations && npcRelations.length > 0 && (
        <div className="mb-4">
          <h4 className="text-amber-400/80 text-xs font-bold mb-2 uppercase tracking-wider">
            {t.npcRelations}
          </h4>
          <div className="space-y-2">
            {npcRelations.map((npc) => (
              <div key={npc.name} className="bg-slate-900/40 rounded-lg p-2">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-amber-200/80 text-sm font-medium capitalize">
                    {npc.name === 'yu' ? '雨' : npc.name === 'huan' ? '焕' : npc.name === 'licht' ? '利希特' : npc.name}
                  </span>
                  <span className={`text-xs px-1.5 py-0.5 rounded ${
                    npc.status === 'active'
                      ? 'bg-green-900/30 text-green-400/70 border border-green-700/30'
                      : 'bg-red-900/30 text-red-400/70 border border-red-700/30'
                  }`}>
                    {npc.status === 'active' ? t.npcActive : t.npcLeft}
                  </span>
                </div>
                {npc.status === 'active' && (
                  <div className="h-1.5 bg-slate-800/70 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        npc.satisfaction >= 70
                          ? 'bg-gradient-to-r from-green-600 to-green-400'
                          : npc.satisfaction >= 40
                          ? 'bg-gradient-to-r from-yellow-600 to-amber-400'
                          : 'bg-gradient-to-r from-red-700 to-red-400'
                      }`}
                      style={{ width: `${npc.satisfaction}%` }}
                    />
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Game Mechanics */}
      {mechanics && (
        <div>
          <h4 className="text-amber-400/80 text-xs font-bold mb-2 uppercase tracking-wider">
            📊 {t.day} {mechanics.dayNumber}
          </h4>
          <div className="grid grid-cols-2 gap-2">
            {/* Revenue */}
            <div className="bg-slate-900/40 rounded-lg p-2 text-center">
              <div className="text-amber-500/60 text-xs mb-0.5">{t.revenue}</div>
              <div className={`text-lg font-bold ${
                mechanics.todayRevenue >= mechanics.revenueTarget
                  ? 'text-green-400'
                  : 'text-amber-100'
              }`}>
                {mechanics.todayRevenue}
              </div>
              <div className="text-amber-400/30 text-xs">{t.revenueTarget}: {mechanics.revenueTarget}</div>
            </div>

            {/* XP */}
            <div className="bg-slate-900/40 rounded-lg p-2 text-center">
              <div className="text-amber-500/60 text-xs mb-0.5">{t.xp}</div>
              <div className="text-amber-100 text-lg font-bold">{mechanics.xp}</div>
              {mechanics.inspectionPassed && (
                <div className="text-green-400/60 text-xs">✓ {t.inspection}: {t.passed}</div>
              )}
            </div>
          </div>

          {/* Consecutive revenue days */}
          {mechanics.consecutiveRevenueDays > 0 && (
            <div className="mt-2 text-center">
              <span className="text-xs text-amber-300/50">
                🔥 {mechanics.consecutiveRevenueDays}x {language === 'zh' ? '连续达标' : 'streak'}
              </span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
