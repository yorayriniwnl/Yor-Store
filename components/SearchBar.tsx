// components/SearchBar.tsx
"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useRouter } from "next/navigation";

interface SearchBarProps {
  initialValue?: string;
  placeholder?: string;
  autoFocus?: boolean;
  size?: "default" | "large";
}

const RECENT_KEY = "bb_recent_searches";
const MAX_RECENT = 6;

function getRecent(): string[] {
  if (typeof window === "undefined") return [];
  try {
    return JSON.parse(localStorage.getItem(RECENT_KEY) ?? "[]");
  } catch {
    return [];
  }
}

function saveRecent(query: string) {
  const prev = getRecent().filter((q) => q !== query);
  const next = [query, ...prev].slice(0, MAX_RECENT);
  localStorage.setItem(RECENT_KEY, JSON.stringify(next));
}

export default function SearchBar({
  initialValue = "",
  placeholder = "Search for milk, eggs, atta…",
  autoFocus = false,
  size = "default",
}: SearchBarProps) {
  const router = useRouter();
  const [value, setValue] = useState(initialValue);
  const [recent, setRecent] = useState<string[]>([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setRecent(getRecent());
  }, []);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target as Node)) {
        setShowDropdown(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const navigate = useCallback(
    (q: string) => {
      const trimmed = q.trim();
      if (!trimmed) return;
      saveRecent(trimmed);
      setRecent(getRecent());
      setShowDropdown(false);
      router.push(`/search?q=${encodeURIComponent(trimmed)}`);
    },
    [router]
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter") navigate(value);
    if (e.key === "Escape") setShowDropdown(false);
  };

  const filtered = recent.filter((r) =>
    r.toLowerCase().includes(value.toLowerCase())
  );

  const isLarge = size === "large";

  return (
    <div ref={wrapperRef} className="relative w-full">
      <div
        className={`flex items-center bg-white border-2 rounded-2xl transition-all duration-200 shadow-sm
          ${showDropdown && filtered.length > 0 ? "border-emerald-400 shadow-emerald-100 shadow-md" : "border-gray-200 hover:border-emerald-300"}`}
      >
        {/* Search icon */}
        <div className={`pl-4 text-gray-400 flex-shrink-0 ${isLarge ? "pl-5" : ""}`}>
          <svg
            className={isLarge ? "w-6 h-6" : "w-5 h-5"}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
            />
          </svg>
        </div>

        <input
          ref={inputRef}
          type="text"
          value={value}
          autoFocus={autoFocus}
          placeholder={placeholder}
          onChange={(e) => {
            setValue(e.target.value);
            setShowDropdown(true);
          }}
          onFocus={() => setShowDropdown(true)}
          onKeyDown={handleKeyDown}
          className={`flex-1 bg-transparent outline-none text-gray-800 placeholder-gray-400 font-medium
            ${isLarge ? "px-4 py-5 text-lg" : "px-3 py-3.5 text-base"}`}
        />

        {/* Clear button */}
        {value && (
          <button
            onClick={() => { setValue(""); inputRef.current?.focus(); }}
            className="px-2 text-gray-300 hover:text-gray-500 transition-colors"
            aria-label="Clear"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        )}

        {/* Search button */}
        <button
          onClick={() => navigate(value)}
          className={`bg-emerald-500 hover:bg-emerald-600 text-white font-semibold rounded-xl transition-colors m-1.5 flex items-center gap-2
            ${isLarge ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm"}`}
        >
          Search
        </button>
      </div>

      {/* Recent searches dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 bg-white rounded-2xl border border-gray-100 shadow-xl z-50 overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-xs font-semibold text-gray-400 uppercase tracking-wider">
            Recent searches
          </div>
          {filtered.map((q) => (
            <button
              key={q}
              onMouseDown={() => { setValue(q); navigate(q); }}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-emerald-50 transition-colors text-gray-700 text-sm"
            >
              <svg className="w-4 h-4 text-gray-300 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              {q}
            </button>
          ))}
          <div className="h-2" />
        </div>
      )}
    </div>
  );
}
