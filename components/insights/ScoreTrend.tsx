"use client";

import type { TrendPoint } from "@/types/quiz";

const PASS_LINE = 72;

/**
 * Pure inline-SVG area + line sparkline of completed-session scores.
 * No chart library — a strict CSP blocks external hosts. A faint baseline
 * marks the 72% pass-readiness threshold.
 */
export default function ScoreTrend({ trend }: { trend: TrendPoint[] }) {
  if (!trend || trend.length < 2) {
    return (
      <div className="flex h-[140px] items-center justify-center rounded-cards border border-dashed border-charcoal-grey/70 bg-deep-slate/30">
        <p className="text-body text-fog-grey">Not enough data yet</p>
      </div>
    );
  }

  // Viewbox geometry — points are mapped into a fixed coordinate space so the
  // SVG scales fluidly while keeping consistent stroke widths.
  const W = 600;
  const H = 140;
  const padX = 8;
  const padY = 12;
  const innerW = W - padX * 2;
  const innerH = H - padY * 2;

  const n = trend.length;
  const xAt = (i: number) => padX + (n === 1 ? innerW / 2 : (i / (n - 1)) * innerW);
  const yAt = (pct: number) => padY + (1 - Math.max(0, Math.min(100, pct)) / 100) * innerH;

  const points = trend.map((p, i) => ({ x: xAt(i), y: yAt(p.percentage), pct: p.percentage }));
  const linePath = points.map((p, i) => `${i === 0 ? "M" : "L"}${p.x.toFixed(1)},${p.y.toFixed(1)}`).join(" ");
  const areaPath = `${linePath} L${points[n - 1].x.toFixed(1)},${(H - padY).toFixed(1)} L${points[0].x.toFixed(1)},${(H - padY).toFixed(1)} Z`;
  const passY = yAt(PASS_LINE);

  const last = trend[trend.length - 1].percentage;

  return (
    <div className="relative">
      <svg
        viewBox={`0 0 ${W} ${H}`}
        preserveAspectRatio="none"
        className="h-[140px] w-full"
        role="img"
        aria-label={`Score trend across ${n} sessions, most recent ${last}%`}
      >
        <defs>
          <linearGradient id="trend-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e4f222" stopOpacity="0.22" />
            <stop offset="100%" stopColor="#e4f222" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Pass-readiness baseline at 72% */}
        <line
          x1={padX}
          y1={passY}
          x2={W - padX}
          y2={passY}
          stroke="#8a8f98"
          strokeWidth="1"
          strokeDasharray="4 4"
          opacity="0.5"
          vectorEffect="non-scaling-stroke"
        />

        {/* Area + line */}
        <path d={areaPath} fill="url(#trend-fill)" />
        <path
          d={linePath}
          fill="none"
          stroke="#e4f222"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
          vectorEffect="non-scaling-stroke"
        />

        {/* Point markers */}
        {points.map((p, i) => (
          <circle
            key={i}
            cx={p.x}
            cy={p.y}
            r="2.5"
            fill="#08090a"
            stroke="#e4f222"
            strokeWidth="1.5"
            vectorEffect="non-scaling-stroke"
          />
        ))}
      </svg>

      {/* Pass-line label, positioned over the SVG */}
      <span
        className="pointer-events-none absolute right-2 -translate-y-1/2 rounded-tags bg-pitch-black/70 px-1.5 py-0.5 text-caption font-w510 text-storm-cloud"
        style={{ top: `${(passY / H) * 100}%` }}
      >
        72% pass line
      </span>
    </div>
  );
}
