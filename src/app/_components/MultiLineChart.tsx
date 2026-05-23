// ADR-0023: 자체 SVG 멀티라인 차트. 의존성 0.
// 입력 데이터 모든 라인 통합 max/min으로 정규화.

import { cn } from '@/lib/utils';

export type ChartLine = {
  label: string;
  /** Tailwind 토큰 색 또는 hex. */
  color: string;
  points: ReadonlyArray<{ date: string; value: number }>;
};

type Props = {
  lines: ChartLine[];
  width?: number;
  height?: number;
  className?: string;
};

export function MultiLineChart({ lines, width = 560, height = 160, className }: Props) {
  const valid = lines.filter((l) => l.points.length >= 2);
  if (valid.length === 0) return null;

  const allValues = valid.flatMap((l) => l.points.map((p) => p.value));
  const max = Math.max(...allValues, 1);
  const min = Math.min(...allValues, 0);
  const range = max - min || 1;

  const padX = 12;
  const padY = 10;
  const innerW = width - padX * 2;
  const innerH = height - padY * 2;

  return (
    <div className={className}>
      <svg
        viewBox={`0 0 ${width} ${height}`}
        className="block h-auto w-full text-fg-subtle"
        preserveAspectRatio="none"
      >
        {/* baseline grid (선택) */}
        {[0.25, 0.5, 0.75].map((t) => (
          <line
            key={t}
            x1={padX}
            x2={padX + innerW}
            y1={padY + innerH * t}
            y2={padY + innerH * t}
            stroke="currentColor"
            strokeOpacity="0.08"
            strokeWidth="1"
          />
        ))}

        {valid.map((line) => {
          const points = line.points
            .map((p, i) => {
              const x = padX + (i / (line.points.length - 1)) * innerW;
              const y = padY + innerH - ((p.value - min) / range) * innerH;
              return `${x.toFixed(1)},${y.toFixed(1)}`;
            })
            .join(' ');
          const lastP = line.points.at(-1);
          const lastX = padX + innerW;
          const lastY = lastP
            ? padY + innerH - ((lastP.value - min) / range) * innerH
            : padY + innerH;
          return (
            <g key={line.label}>
              <polyline
                points={points}
                fill="none"
                stroke={line.color}
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
              <circle cx={lastX} cy={lastY} r="2.5" fill={line.color} />
            </g>
          );
        })}
      </svg>
      <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-fg-muted">
        {valid.map((line) => (
          <li key={line.label} className={cn('flex items-center gap-1.5')}>
            <span
              aria-hidden
              className="h-2 w-2 rounded-full"
              style={{ backgroundColor: line.color }}
            />
            {line.label}
          </li>
        ))}
      </ul>
    </div>
  );
}
