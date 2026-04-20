'use client';

import { useState } from 'react';

interface LanguageSelectorProps {
  currentLang: 'zh' | 'en';
  onChange: (lang: 'zh' | 'en') => void;
  size?: 'sm' | 'md';
}

export default function LanguageSelector({
  currentLang,
  onChange,
  size = 'md',
}: LanguageSelectorProps) {
  return (
    <div className="flex items-center gap-1">
      <button
        onClick={() => onChange('zh')}
        className={`px-2 py-1 rounded text-sm font-medium transition-all ${
          currentLang === 'zh'
            ? 'bg-amber-600/80 text-white'
            : 'text-amber-500/50 hover:text-amber-400 hover:bg-amber-900/30'
        } ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''}`}
      >
        中
      </button>
      <span className="text-amber-700/30 text-xs">/</span>
      <button
        onClick={() => onChange('en')}
        className={`px-2 py-1 rounded text-sm font-medium transition-all ${
          currentLang === 'en'
            ? 'bg-amber-600/80 text-white'
            : 'text-amber-500/50 hover:text-amber-400 hover:bg-amber-900/30'
        } ${size === 'sm' ? 'text-xs px-1.5 py-0.5' : ''}`}
      >
        EN
      </button>
    </div>
  );
}
