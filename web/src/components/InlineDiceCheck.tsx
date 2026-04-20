'use client';

import { useState, useCallback, useEffect } from 'react';
import { calculateRollResult, type DiceRollResult } from '@/lib/diceMachine';

interface InlineDiceCheckProps {
  onRoll: (result: number) => void;
  disabled: boolean;
  difficulty: number;
  checkLabel: string;
  statValue: number;
  diceState: 'idle' | 'awaiting_roll' | 'roll_resolved';
  language: 'zh' | 'en';
}

export default function InlineDiceCheck({
  onRoll,
  disabled = false,
  difficulty,
  checkLabel,
  statValue,
  diceState,
  language = 'zh',
}: InlineDiceCheckProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [displayNumber, setDisplayNumber] = useState(1);

  useEffect(() => {
    if (diceState === 'awaiting_roll') {
      setResult(null);
      setDisplayNumber(1);
    }
  }, [diceState]);

  const modifier = Math.floor((statValue - 10) / 2);

  const rollDice = useCallback(() => {
    if (diceState !== 'awaiting_roll' || disabled || isRolling) return;

    setIsRolling(true);
    setResult(null);

    const duration = 1200;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      if (progress < 1) {
        setDisplayNumber(Math.floor(Math.random() * 20) + 1);
        const delay = 50 + Math.pow(progress, 3) * 200;
        setTimeout(animate, delay);
      } else {
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        setDisplayNumber(finalRoll);

        const rollResult = calculateRollResult(finalRoll, statValue, difficulty);
        setResult(rollResult);
        setIsRolling(false);

        onRoll?.(rollResult.total);
      }
    };

    animate();
  }, [diceState, isRolling, disabled, statValue, difficulty, onRoll]);

  if (diceState !== 'awaiting_roll' && diceState !== 'roll_resolved') return null;

  const isInteractive = diceState === 'awaiting_roll' && !disabled && !isRolling;

  return (
    <div className={`my-2 p-3 rounded-xl border transition-all ${
      result?.success
        ? 'bg-green-900/15 border-green-600/30'
        : result && !result.success
        ? 'bg-red-900/15 border-red-600/30'
        : 'bg-amber-900/15 border-amber-600/30'
    }`}>
      {/* Check info */}
      <div className="flex items-center justify-between mb-2">
        <span className="text-amber-300 text-sm font-medium">
          🎲 {checkLabel || (language === 'zh' ? '检定' : 'Check')} DC {difficulty}
        </span>
        <span className="text-amber-200/40 text-xs">
          {language === 'zh' ? '修正' : 'Mod'}: {modifier >= 0 ? '+' : ''}{modifier}
        </span>
      </div>

      {/* Dice + Button row */}
      <div className="flex items-center gap-3">
        {/* Dice face */}
        <div className={`relative w-14 h-14 rounded-lg bg-gradient-to-br from-slate-700 to-slate-900 border-2 flex items-center justify-center transition-all ${
          result?.success ? 'border-green-500/50' : result && !result.success ? 'border-red-500/50' : 'border-amber-600/40'
        } ${isRolling ? 'scale-95' : isInteractive ? 'hover:scale-105 cursor-pointer' : ''}`}>
          <span className={`text-2xl font-bold ${
            result?.success ? 'text-green-400' : result && !result.success ? 'text-red-400' : 'text-amber-100'
          }`}>
            {diceState === 'roll_resolved' && result ? result.roll : displayNumber}
          </span>
        </div>

        {/* Roll button or result */}
        {diceState === 'awaiting_roll' && !result && (
          <button
            onClick={rollDice}
            disabled={!isInteractive}
            className={`flex-1 py-2.5 rounded-lg font-bold text-sm transition-all ${
              !isInteractive
                ? 'bg-slate-700 text-slate-500 cursor-not-allowed'
                : 'bg-gradient-to-r from-amber-700 to-orange-600 text-white hover:from-amber-600 hover:to-orange-500 hover:scale-[1.02] active:scale-95 shadow-lg shadow-orange-900/30 animate-pulse cursor-pointer'
            }`}
          >
            {isRolling
              ? (language === 'zh' ? '投掷中...' : 'Rolling...')
              : (language === 'zh' ? `🎲 掷骰 (DC${difficulty})` : `🎲 Roll (DC${difficulty})`)}
          </button>
        )}

        {/* Result display */}
        {diceState === 'roll_resolved' && result && (
          <div className="flex-1">
            <div className={`text-lg font-bold ${result.success ? 'text-green-400' : 'text-red-400'}`}>
              {result.success
                ? (language === 'zh' ? '✅ 成功！' : '✅ Success!')
                : (language === 'zh' ? '❌ 失败' : '❌ Failure')}
            </div>
            <div className="text-xs text-amber-200/60 font-mono">
              d20={result.roll} {modifier >= 0 ? '+' : ''}{modifier} = {result.total} vs DC{result.dc}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
