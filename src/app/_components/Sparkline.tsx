// ADR-0019: 작은 inline SVG sparkline.
// values가 2개 미만이면 빈 영역.

import { cn } from '@/lib/utils';

type Props = {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
};

export function Sparkline({ values, width = 56, height = 16, className }: Props) {
  if (values.length < 2) {
    return <span aria-hidden style={{ width, height, display: 'inline-block' }} />;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const range = max - min || 1;
  const step = width / (values.length - 1);

  const points = values
    .map((v, i) => {
      const x = i * step;
      const y = height - ((v - min) / range) * (height - 1) - 0.5;
      return `${x.toFixed(1)},${y.toFixed(1)}`;
    })
    .join(' ');

  const last = values.at(-1)!;
  const lastX = (values.length - 1) * step;
  const lastY = height - ((last - min) / range) * (height - 1) - 0.5;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={cn('text-fg-subtle', className)}
      aria-hidden
    >
      <polyline
        points={points}
        fill="none"
        stroke="currentColor"
        strokeWidth="1"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <circle cx={lastX} cy={lastY} r="1.5" fill="currentColor" className="text-accent" />
    </svg>
  );
}
