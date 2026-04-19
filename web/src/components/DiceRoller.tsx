'use client';

import { useState, useCallback } from 'react';

interface DiceRollerProps {
  onRoll?: (result: number) => void;
  disabled?: boolean;
  locked?: boolean;
  difficulty?: number;
  checkLabel?: string;
}

export default function DiceRoller({ onRoll, disabled = false, locked = false, difficulty, checkLabel }: DiceRollerProps) {
  const [isRolling, setIsRolling] = useState(false);
  const [result, setResult] = useState<number | null>(null);
  const [displayNumber, setDisplayNumber] = useState(1);

  const rollDice = useCallback(() => {
    if (isRolling || disabled || locked) return;

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
        const finalResult = Math.floor(Math.random() * 20) + 1;
        setDisplayNumber(finalResult);
        setResult(finalResult);
        setIsRolling(false);
        onRoll?.(finalResult);
      }
    };

    animate();
  }, [isRolling, disabled, onRoll]);

  const getResultColor = () => {
    if (result === null) return '';
    if (difficulty !== undefined) {
      return result >= difficulty ? 'text-green-400' : 'text-red-400';
    }
    // Natural d20 scale
    if (result >= 18) return 'text-yellow-400';
    if (result >= 15) return 'text-green-400';
    if (result >= 10) return 'text-amber-200';
    if (result >= 5) return 'text-orange-400';
    return 'text-red-400';
  };

  const getSuccessText = () => {
    if (result === null || difficulty === undefined) return null;
    return result >= difficulty ? '成功!' : '失败';
  };

  const isInteractive = !locked && !disabled && !isRolling;

  return (
    <div className="flex flex-col items-center gap-4">
      {/* Locked overlay */}
      {locked && (
        <div className="text-center mb-1">
          <div className="text-xs text-slate-500/70 italic">
            {checkLabel ? `🔒 ${checkLabel}` : '🔒 等待DM指示投骰'}
          </div>
        </div>
      )}

      {/* Unlocked glow banner */}
      {!locked && difficulty !== undefined && (
        <div className="text-center mb-1 animate-pulse">
          <div className="text-sm text-amber-300 font-bold">
            🎲 {checkLabel || '检定'} DC {difficulty}
          </div>
        </div>
      )}

      {/* Dice display */}
      <div className="relative">
        {/* Glow effect */}
        <div className={`
          absolute inset-0 rounded-xl blur-md transition-opacity duration-300
          ${isRolling ? 'opacity-70' : result !== null ? 'opacity-50' : 'opacity-0'}
          ${result !== null ? (getResultColor().includes('green') || getResultColor().includes('yellow') 
            ? 'bg-yellow-500/50' : 'bg-red-500/50') : 'bg-amber-500/50'}
        `} />
        
        {/* Dice face */}
        <div className={`
          relative w-24 h-24 md:w-28 md:h-28
          bg-gradient-to-br from-slate-700 via-slate-800 to-slate-900
          border-2 rounded-xl
          flex items-center justify-center
          shadow-xl
          transition-all duration-300
          ${locked ? 'border-slate-600/30 opacity-50' : 'border-amber-700/50'}
          ${isRolling ? 'scale-95' : isInteractive ? 'hover:scale-105 cursor-pointer' : 'scale-100'}
        `}>
          {/* Inner bevel */}
          <div className="absolute inset-1 rounded-lg bg-gradient-to-br from-slate-800 to-slate-900" />
          
          {/* Number */}
          <span className={`
            relative z-10 text-5xl md:text-6xl font-bold font-medieval
            transition-all duration-300
            ${locked ? 'text-slate-600' : (getResultColor() || 'text-amber-100')}
            ${isRolling ? 'scale-110' : 'scale-100'}
          `}>
            {locked ? '🔒' : displayNumber}
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

      {/* Success/failure text */}
      {result !== null && difficulty !== undefined && (
        <div className={`
          text-xl font-bold font-medieval animate-bounce
          ${result >= difficulty ? 'text-green-400' : 'text-red-400'}
        `}>
          {getSuccessText()}
        </div>
      )}

      {/* Difficulty indicator */}
      {difficulty !== undefined && (
        <div className="text-sm text-amber-300/70">
          难度: {difficulty}
        </div>
      )}

      {/* Roll button */}
      <button
        onClick={rollDice}
        disabled={isRolling || disabled || locked}
        className={`
          relative px-6 py-3 font-medieval font-bold
          rounded-lg overflow-hidden
          transition-all duration-200
          ${isRolling || disabled || locked
            ? 'bg-slate-700 text-slate-500 cursor-not-allowed' 
            : 'bg-gradient-to-r from-amber-700 to-orange-600 text-white hover:from-amber-600 hover:to-orange-500 hover:scale-105 active:scale-95 shadow-lg shadow-orange-900/30 animate-pulse'}
        `}
      >
        {/* Button glow */}
        {!isRolling && !disabled && !locked && (
          <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent -translate-x-full hover:animate-shimmer" />
        )}
        <span className="relative z-10">
          {locked ? '🔒 等待检定' : isRolling ? '投掷中...' : difficulty ? `🎲 掷骰 (DC${difficulty})` : '掷骰子'}
        </span>
      </button>
    </div>
  );
}
