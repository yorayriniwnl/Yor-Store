// components/StoreBadge.tsx
"use client";

interface StoreBadgeProps {
  storeName: string;
  size?: "sm" | "md";
}

const STORE_CONFIG: Record<
  string,
  { bg: string; text: string; border: string; emoji: string }
> = {
  blinkit: {
    bg: "bg-amber-50",
    text: "text-amber-700",
    border: "border-amber-200",
    emoji: "⚡",
  },
  zepto: {
    bg: "bg-purple-50",
    text: "text-purple-700",
    border: "border-purple-200",
    emoji: "🟣",
  },
  bigbasket: {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    emoji: "🧺",
  },
  "big basket": {
    bg: "bg-emerald-50",
    text: "text-emerald-700",
    border: "border-emerald-200",
    emoji: "🧺",
  },
  "amazon fresh": {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    emoji: "📦",
  },
  amazon: {
    bg: "bg-blue-50",
    text: "text-blue-700",
    border: "border-blue-200",
    emoji: "📦",
  },
  instamart: {
    bg: "bg-red-50",
    text: "text-red-700",
    border: "border-red-200",
    emoji: "🛒",
  },
  swiggy: {
    bg: "bg-orange-50",
    text: "text-orange-700",
    border: "border-orange-200",
    emoji: "🛵",
  },
};

const DEFAULT_CONFIG = {
  bg: "bg-gray-50",
  text: "text-gray-700",
  border: "border-gray-200",
  emoji: "🏪",
};

export default function StoreBadge({ storeName, size = "md" }: StoreBadgeProps) {
  const key = storeName.toLowerCase();
  const config = STORE_CONFIG[key] ?? DEFAULT_CONFIG;

  const sizeClasses =
    size === "sm"
      ? "text-xs px-2 py-0.5 gap-1"
      : "text-sm px-2.5 py-1 gap-1.5";

  return (
    <span
      className={`inline-flex items-center rounded-full border font-medium ${config.bg} ${config.text} ${config.border} ${sizeClasses}`}
    >
      <span>{config.emoji}</span>
      {storeName}
    </span>
  );
}
