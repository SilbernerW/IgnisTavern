'use client';

import CharacterPortrait from './CharacterPortrait';
import { Character } from '@/lib/gameState';

interface CharacterSheetProps {
  character: Character;
  language: 'zh' | 'en';
}

export default function CharacterSheet({ character, language }: CharacterSheetProps) {
  const { name, nameEn, stats, inventory } = character;

  const texts = {
    zh: {
      title: '角色卡',
      hp: '生命值',
      luck: '幸运',
      reputation: '声望',
      inventory: '背包',
      emptyInventory: '空',
    },
    en: {
      title: 'Character',
      hp: 'HP',
      luck: 'Luck',
      reputation: 'Reputation',
      inventory: 'Inventory',
      emptyInventory: 'Empty',
    },
  };

  const t = texts[language];

  const hpPercent = (stats.hp / stats.maxHp) * 100;

  return (
    <div className="bg-slate-800/50 border border-amber-700/30 rounded-xl p-4 md:p-5">
      {/* Header with portrait */}
      <div className="flex items-start gap-4 mb-5">
        <CharacterPortrait
          characterName={name}
          characterNameEn={nameEn}
          size="md"
          frame="wood"
        />
        
        <div className="flex-1 pt-1">
          <h3 className="text-amber-400 font-medieval text-xl mb-1">{name}</h3>
          <p className="text-amber-200/50 text-sm italic">{nameEn}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="space-y-4 mb-5">
        {/* HP Bar */}
        <div>
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
              style={{ width: `${hpPercent}%` }}
            />
          </div>
        </div>

        {/* Attribute scores */}
        <div className="grid grid-cols-2 gap-3">
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-amber-500/70 text-xs mb-1 uppercase tracking-wider">
              {language === 'zh' ? '体魄' : 'STR'}
            </div>
            <div className="text-amber-100 text-xl font-bold">{stats.str}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-amber-500/70 text-xs mb-1 uppercase tracking-wider">
              {language === 'zh' ? '敏捷' : 'DEX'}
            </div>
            <div className="text-amber-100 text-xl font-bold">{stats.dex}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-amber-500/70 text-xs mb-1 uppercase tracking-wider">
              {language === 'zh' ? '心智' : 'INT'}
            </div>
            <div className="text-amber-100 text-xl font-bold">{stats.int}</div>
          </div>
          <div className="bg-slate-900/50 rounded-lg p-3 text-center">
            <div className="text-amber-500/70 text-xs mb-1 uppercase tracking-wider">
              {language === 'zh' ? '魅力' : 'CHA'}
            </div>
            <div className="text-amber-100 text-xl font-bold">{stats.cha}</div>
          </div>
        </div>
      </div>

      {/* Inventory */}
      <div>
        <h4 className="text-amber-400/80 font-medieval text-sm mb-2 uppercase tracking-wider">
          {t.inventory}
        </h4>
        {inventory.length > 0 ? (
          <ul className="space-y-1.5">
            {inventory.map((item, index) => (
              <li
                key={index}
                className="text-amber-100/70 text-sm flex items-center gap-2 py-1.5 px-2 bg-slate-900/30 rounded"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-600/50" />
                {item}
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-amber-200/40 text-sm italic py-2">{t.emptyInventory}</p>
        )}
      </div>
    </div>
  );
}
