'use client';

import { useState, useCallback, useEffect } from 'react';
import { calculateRollResult, formatRollMessage, type DiceRollResult } from '@/lib/diceMachine';

interface DiceRollerProps {
  onRoll: (result: number) => void;
  disabled: boolean;
  locked: boolean;        // true when no check is pending
  difficulty: number | undefined;
  checkLabel: string;
  diceState: 'idle' | 'awaiting_roll' | 'roll_resolved';
  statValue: number;      // character's stat for the check attribute
  language: 'zh' | 'en';
}

export default function DiceRoller({ 
  onRoll, 
  disabled = false, 
  locked = false, 
  difficulty,
  checkLabel,
  diceState,
  statValue,
  language = 'zh'
}: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<DiceRollResult | null>(null);
  const [displayNumber, setDisplayNumber] = useState(1);

  // Reset result when entering awaiting_roll state (new check)
  useEffect(() => {
    if (diceState === 'awaiting_roll') {
      setResult(null);
      setDisplayNumber(1);
    }
  }, [diceState]);

  const rollDice = useCallback(() => {
    if (diceState !== 'awaiting_roll' || disabled || locked || isRolling) return;

    setIsRolling(true);
    setResult(null);

    // Animation duration
    const duration = 1500;
    const startTime = Date.now();

    const animate = () => {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / duration, 1);

      // Random display during animation, slowing down
      if (progress < 1) {
        setDisplayNumber(Math.floor(Math.random() * 20) + 1);
        // Slow down as we approach the end
        const delay = 50 + Math.pow(progress, 3) * 200;
        setTimeout(animate, delay);
      } else {
        // Final result
        const finalRoll = Math.floor(Math.random() * 20) + 1;
        setDisplayNumber(finalRoll);
        
        // Calculate full result with modifiers
        const rollResult = calculateRollResult(finalRoll, statValue, difficulty || 0);
        setResult(rollResult);
        setIsRolling(false);
        
        // Call onRoll with total
        onRoll?.(rollResult.total);
      }
    };

    animate();
  }, [diceState, isRolling, disabled, locked, statValue, difficulty, onRoll]);

  const getResultColor = () => {
    if (result === null) return '';
    return result.success ? 'text-green-400' : 'text-red-400';
  };

  const isInteractive = diceState === 'awaiting_roll' && !locked && !disabled && !isRolling;

  // State-based button text
  const getButtonText = () => {
    if (diceState === 'idle') {
      return language === 'zh' ? '等待检定...' : 'Awaiting check...';
    }
    if (diceState === 'roll_resolved') {
      return language === 'zh' ? '已解决' : 'Resolved';
    }
    if (isRolling) {
      return language === 'zh' ? '投掷中...' : 'Rolling...';
    }
    if (locked) {
      return language === 'zh' ? '🔒 等待检定' : '🔒 Awaiting check';
    }
    // awaiting_roll state
    if (difficulty !== undefined) {
      return language === 'zh' 
        ? `🎲 掷骰 (DC${difficulty})` 
        : `🎲 Roll (DC${difficulty})`;
    }
    return language === 'zh' ? '掷骰子' : 'Roll';
  };

  // Calculate modifier display
  const modifier = statValue > 0 ? getModifier(statValue) : 0;

  return (
    <div className={`
      flex flex-col items-center gap-4 p-4 rounded-xl transition-all duration-300
      ${diceState === 'idle' ? 'opacity-50' : 'opacity-100'}
    `}>
      {/* State indicator - idle state */}
      {diceState === 'idle' && (
        <div className="text-center mb-1">
          <div className="text-sm text-slate-500/70 italic">
            {language === 'zh' ? '等待检定...' : 'Awaiting check...'}
          </div>
        </div>
      )}

      {/* Awaiting roll / Roll resolved banner */}
      {diceState !== 'idle' && difficulty !== undefined && (
        <div className={`text-center mb-1 ${diceState === 'awaiting_roll' ? 'animate-pulse' : ''}`}>
          <div className={`text-sm font-bold ${diceState === 'awaiting_roll' ? 'text-amber-300' : 'text-slate-400'}`}>
            🎲 {checkLabel || (language === 'zh' ? '检定' : 'Check')} DC {difficulty}
          </div>
          {/* Show modifier info */}
          <div className="text-xs text-amber-200/60 mt-1">
            {language === 'zh' 
              ? `属性值: ${statValue} (${modifier >= 0 ? '+' : ''}${modifier})`
              : `Stat: ${statValue} (${modifier >= 0 ? '+' : ''}${modifier})`}
          </div>
        </div>
      )}

      {/* Dice display */}
      <div className="relative">
        {/* Glow effect - success green or failure red */}
        <div className={`
          absolute inset-0 rounded-xl blur-md transition-opacity duration-300
          ${isRolling ? 'opacity-70 bg-amber-500/50' : result !== null ? 'opacity-50' : 'opacity-0'}
          ${result !== null ? (result.success ? 'bg-green-500/50' : 'bg-red-500/50') : ''}
        `} />

        {/* Success/Failure glow animation */}
        {diceState === 'roll_resolved' && result !== null && (
          <div className={`
            absolute inset-0 rounded-xl blur-xl animate-pulse
            ${result.success ? 'bg-green-400/30' : 'bg-red-400/30'}
          `} />
        )}
        
        {/* Dice face */}
        <div className={`
          relative w-24 h-24 md:w-28 md:h-28
          bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900
          border-2 rounded-xl
          flex items-center justify-center
          shadow-xl
          transition-all duration-300
          ${diceState === 'idle' ? 'border-slate-600/30 opacity-40' : 'border-amber-700/50'}
          ${result?.success ? 'shadow-green-500/20 border-green-500/50' : ''}
          ${result && !result.success ? 'shadow-red-500/20 border-red-500/50' : ''}
          ${isRolling ? 'scale-95' : isInteractive ? 'hover:scale-105 cursor-pointer' : 'scale-100'}
          ${result && !result.success && !isRolling ? 'animate-shake' : ''}
        `}>
          {/* Inner bevel */}
          <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900" />
          
          {/* Number */}
          <span className={`
            relative z-10 text-5xl md:text-6xl font-bold font-medieval
            transition-all duration-300
            ${diceState === 'idle' ? 'text-slate-600' : (getResultColor() || 'text-amber-100')}
            ${isRolling ? 'scale-110' : 'scale-100'}
          `}>
            {diceState === 'idle' ? '🔒' : displayNumber}
          </span>

          {/* Corner decorations */}
          <div className="absolute top-2 left-2 w-2 h-2 border-t border-l border-amber-600/30 rounded-tl-sm" />
          <div className="absolute top-2 right-2 w-2 h-2 border-t border-r border-amber-600/30 rounded-tr-sm" />
          <div className="absolute bottom-2 left-2 w-2 h-2 border-b border-l border-amber-600/30 rounded-bl-sm" />
          <div className="absolute bottom-2 right-2 w-2 h-2 border-b border-r border-amber-600/30 rounded-br-sm" />
        </div>

        {/* Sparkles during roll */}
        {isRolling && (
          <div className="absolute inset-0 pointer-events-none">
            <div className="absolute -top-2 left-1/2 w-1 h-1 bg-yellow-400 rounded-full animate-ping" />
            <div className="absolute top-1/2 -right-2 w-1.5 h-1.5 bg-amber-400 rounded-full animate-pulse" />
            <div className="absolute -bottom-2 left-1/3 w-1 h-1 bg-orange-400 rounded-full animate-ping" style={{ animationDelay: '0.2s' }} />
          </div>
        )}
      </div>

      {/* Roll calculation breakdown - shown after roll */}
      {diceState === 'roll_resolved' && result !== null && (
        <div className="text-center animate-fadeIn">
          <div className={`
            text-lg font-bold font-medieval
            ${result.success ? 'text-green-400' : 'text-red-400'}
          `}>
            {result.success 
              ? (language === 'zh' ? '成功!' : 'Success!')
              : (language === 'zh' ? '失败' : 'Failure')
            }
          </div>
          {/* Calculation: d20=X + modifier = total vs DC=Y */}
          <div className="text-sm text-amber-200/80 mt-1 font-mono">
            d20={result.roll} 
            <span className={modifier >= 0 ? 'text-green-300' : 'text-red-300'}>
              {modifier >= 0 ? '+' : ''}{modifier}
            </span>
            {' '}={result.total} vs DC{result.dc}
          </div>
        </div>
      )}

      {/* Difficulty indicator - only show during awaiting_roll */}
      {diceState === 'awaiting_roll' && difficulty !== undefined && (
        <div className="text-sm text-amber-300/70">
          {language === 'zh' ? `难度: ${difficulty}` : `DC: ${difficulty}`}
        </div>
      )}

      {/* Roll button */}
      <button
        onClick={rollDice}
        disabled={!isInteractive}
        className={`
          relative px-6 py-3 font-medieval font-bold
          rounded-lg overflow-hidden
          transition-all duration-200
          ${!isInteractive
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-amber-700 to-orange-600 text-white hover:from-amber-600 hover:to-orange-500 hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/30 animate-pulse cursor-pointer'}
        `}
      >
        {/* Button glow */}
        {isInteractive && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-shimmer" />
        )}
        <span className="relative z-10">{getButtonText()}</span>
      </button>
    </div>
  );
}

// Helper to get modifier (same as in diceMachine)
function getModifier(statValue: number): number {
  return Math.floor((statValue - 10) / 2);
}
