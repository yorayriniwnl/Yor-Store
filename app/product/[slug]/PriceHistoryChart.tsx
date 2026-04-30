// app/product/[slug]/PriceHistoryChart.tsx
"use client";

import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

interface HistoryPoint { date: string; price: number; }
interface StoreHistory { storeName: string; data: HistoryPoint[]; }

interface Props { history: StoreHistory[]; }

// One colour per store (deterministic)
const PALETTE = [
  "#10b981", "#8b5cf6", "#f59e0b", "#3b82f6", "#ef4444", "#06b6d4",
];

// Merge all dates across all stores into a unified flat dataset for Recharts
function mergeHistory(history: StoreHistory[]) {
  const dateSet = new Set<string>();
  history.forEach((s) => s.data.forEach((d) => dateSet.add(d.date)));
  const dates = Array.from(dateSet).sort();

  return dates.map((date) => {
    const row: Record<string, string | number> = {
      date: date.slice(5), // "MM-DD" for brevity
    };
    history.forEach((store) => {
      const point = store.data.find((d) => d.date === date);
      if (point) row[store.storeName] = point.price;
    });
    return row;
  });
}

export default function PriceHistoryChart({ history }: Props) {
  if (!history || history.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
        No price history available yet.
      </div>
    );
  }

  const data = mergeHistory(history);

  return (
    <ResponsiveContainer width="100%" height={280}>
      <LineChart data={data} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
        <CartesianGrid strokeDasharray="3 3" stroke="#f0fdf4" />
        <XAxis
          dataKey="date"
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={{ stroke: "#f3f4f6" }}
        />
        <YAxis
          tick={{ fontSize: 11, fill: "#9ca3af" }}
          tickLine={false}
          axisLine={false}
          tickFormatter={(v) => `₹${v}`}
          width={55}
        />
        <Tooltip
          formatter={(value: number) => [`₹${value.toFixed(2)}`, ""]}
          labelStyle={{ fontWeight: 600, color: "#1f2937" }}
          contentStyle={{
            borderRadius: 12,
            border: "1px solid #e5e7eb",
            fontSize: 13,
            boxShadow: "0 4px 12px rgba(0,0,0,0.06)",
          }}
        />
        <Legend
          wrapperStyle={{ fontSize: 13, paddingTop: 12 }}
          iconType="circle"
          iconSize={10}
        />
        {history.map((store, i) => (
          <Line
            key={store.storeName}
            type="monotone"
            dataKey={store.storeName}
            stroke={PALETTE[i % PALETTE.length]}
            strokeWidth={2.5}
            dot={{ r: 4, fill: PALETTE[i % PALETTE.length], strokeWidth: 0 }}
            activeDot={{ r: 6 }}
            connectNulls
          />
        ))}
      </LineChart>
    </ResponsiveContainer>
  );
}
