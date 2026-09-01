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
    <div ref={wrapperRef} className="yor-search-wrap">
      <div
        className={`yor-search-field transition-all duration-200
          ${showDropdown && filtered.length > 0 ? "border-[#ff8a7f]" : ""}`}
      >
        {/* Search icon */}
        <div className={`yor-search-icon flex-shrink-0 ${isLarge ? "pl-5" : "pl-4"}`}>
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
          className={`yor-search-input font-medium
            ${isLarge ? "px-4 py-5 text-lg" : "px-3 py-3.5 text-base"}`}
        />

        {/* Clear button */}
        {value && (
          <button
            onClick={() => { setValue(""); inputRef.current?.focus(); }}
            className="px-2 text-[#c4c4c4] hover:text-[#f5eaea] transition-colors"
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
          className={`yor-search-button transition-colors m-1.5 flex items-center gap-2
            ${isLarge ? "px-6 py-3.5 text-base" : "px-4 py-2.5 text-sm"}`}
        >
          Search
        </button>
      </div>

      {/* Recent searches dropdown */}
      {showDropdown && filtered.length > 0 && (
        <div className="yor-search-menu overflow-hidden">
          <div className="px-4 pt-3 pb-1 text-xs font-semibold text-[#c4c4c4] uppercase tracking-wider">
            Recent searches
          </div>
          {filtered.map((q) => (
            <button
              key={q}
              onMouseDown={() => { setValue(q); navigate(q); }}
              className="w-full text-left px-4 py-2.5 flex items-center gap-3 hover:bg-[#671515] transition-colors text-[#c4c4c4] text-sm"
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
