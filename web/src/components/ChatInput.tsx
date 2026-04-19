'use client';

import { useState, useRef, useEffect } from 'react';

interface ChatInputProps {
  onSubmit: (message: string) => void;
  disabled?: boolean;
  placeholder?: string;
  language: 'zh' | 'en';
}

export default function ChatInput({
  onSubmit,
  disabled = false,
  placeholder,
  language,
}: ChatInputProps) {
  const [input, setInput] = useState('');
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const defaultPlaceholder = language === 'zh'
    ? '输入你想做的事...'
    : 'What do you want to do?';

  const handleSubmit = () => {
    const trimmed = input.trim();
    if (!trimmed || disabled) return;
    onSubmit(trimmed);
    setInput('');
    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  // Auto-resize textarea
  useEffect(() => {
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
      inputRef.current.style.height = Math.min(inputRef.current.scrollHeight, 120) + 'px';
    }
  }, [input]);

  return (
    <div className="flex items-end gap-2">
      <textarea
        ref={inputRef}
        value={input}
        onChange={(e) => setInput(e.target.value)}
        onKeyDown={handleKeyDown}
        disabled={disabled}
        placeholder={placeholder || defaultPlaceholder}
        rows={1}
        className={`
          flex-1 resize-none rounded-lg px-4 py-3
          bg-slate-800/60 border border-amber-700/40
          text-amber-100 placeholder:text-amber-700/50
          focus:outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30
          disabled:opacity-50 disabled:cursor-not-allowed
          text-sm md:text-base leading-relaxed
          transition-colors duration-200
        `}
      />
      <button
        onClick={handleSubmit}
        disabled={disabled || !input.trim()}
        className={`
          shrink-0 px-4 py-3 rounded-lg font-medium text-sm
          transition-all duration-200
          ${disabled || !input.trim()
            ? 'bg-slate-700/50 text-slate-500 cursor-not-allowed'
            : 'bg-amber-700/80 text-amber-100 hover:bg-amber-600/80 active:bg-amber-500/80'}
        `}
      >
        {language === 'zh' ? '发送' : 'Send'}
      </button>
    </div>
  );
}
