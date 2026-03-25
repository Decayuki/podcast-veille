'use client';

import { useState, useEffect, useRef } from 'react';

interface SearchBarProps {
  onSearch: (query: string) => void;
  placeholder?: string;
}

export default function SearchBar({ onSearch, placeholder = 'Rechercher un épisode...' }: SearchBarProps) {
  const [value, setValue] = useState('');
  const timerRef = useRef<ReturnType<typeof setTimeout>>(undefined);

  useEffect(() => {
    timerRef.current = setTimeout(() => onSearch(value), 300);
    return () => clearTimeout(timerRef.current);
  }, [value, onSearch]);

  return (
    <div className="relative mb-4">
      <svg
        width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="#666" strokeWidth="1.5" strokeLinecap="round"
        className="absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none"
      >
        <circle cx="7" cy="7" r="5"/>
        <path d="M11 11l3.5 3.5"/>
      </svg>
      <input
        type="text"
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder={placeholder}
        className="w-full bg-[#161616] border border-[#2a2a2a] rounded-lg pl-10 pr-4 py-2.5 text-sm text-[#e8e8e8] placeholder-[#555] focus:border-[#e8834a] focus:outline-none transition-colors"
      />
      {value && (
        <button
          onClick={() => setValue('')}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-[#666] hover:text-[#e8e8e8]"
        >
          <svg width="14" height="14" viewBox="0 0 14 14" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
            <path d="M3 3l8 8M11 3l-8 8"/>
          </svg>
        </button>
      )}
    </div>
  );
}
