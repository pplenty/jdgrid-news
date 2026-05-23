// ADR-0023 후속: 자체 키워드 빈도 → 워드클라우드.
// flex-wrap + 빈도별 폰트 크기 (12px ~ 32px) + opacity 변화.

import Link from 'next/link';
import { Type } from 'lucide-react';

type Word = { keyword: string; count: number };

type Props = {
  ko: Word[];
  en: Word[];
};

export function WordCloudSection({ ko, en }: Props) {
  if (ko.length === 0 && en.length === 0) return null;

  return (
    <section className="border-b border-border-subtle px-4 py-8 lg:px-8">
      <header className="mb-4 flex items-center gap-2">
        <Type size={16} className="text-fg-muted" />
        <h2 className="text-base font-bold tracking-tight">헤드라인 단어 빈도</h2>
        <span className="text-xs text-fg-subtle">우리가 수집한 매체 헤드라인 기반</span>
      </header>
      <div className="grid gap-x-6 gap-y-6 md:grid-cols-2">
        <Cloud label="🇰🇷 한국어" words={ko} />
        <Cloud label="🌐 영문" words={en} />
      </div>
    </section>
  );
}

function Cloud({ label, words }: { label: string; words: Word[] }) {
  if (words.length === 0) return null;
  const max = words[0]?.count ?? 1;
  const min = words.at(-1)?.count ?? 1;
  const range = max - min || 1;

  return (
    <div>
      <p className="mb-3 text-xs font-medium text-fg-muted">{label}</p>
      <div className="flex flex-wrap items-center justify-center gap-x-2.5 gap-y-1">
        {words.map((w) => {
          const ratio = (w.count - min) / range; // 0~1
          const fontSize = 12 + ratio * 20; // 12 ~ 32px
          const opacity = 0.55 + ratio * 0.45; // 0.55 ~ 1.0
          const fontWeight = 400 + Math.round(ratio * 3) * 100; // 400/500/600/700
          return (
            <Link
              key={w.keyword}
              href={`/k/${encodeURIComponent(w.keyword)}/`}
              className="text-fg transition-colors hover:text-accent-fg"
              style={{
                fontSize: `${fontSize.toFixed(1)}px`,
                opacity,
                fontWeight,
                lineHeight: 1.2,
              }}
              title={`${w.keyword} · ${w.count}회 등장`}
            >
              {w.keyword}
            </Link>
          );
        })}
      </div>
    </div>
  );
}
