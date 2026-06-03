// 일일 트렌드 브리핑 — 메인 상단 원천 텍스트 요약 (ADR-0039). Server 컴포넌트.
// buildBriefing 결과를 받아 prose 한 문단 + 하이라이트 행으로 렌더. 키워드는 plain text
// (derived 클라우드 키워드는 /k 페이지가 없을 수 있어 링크 미사용 — 404 회피).

import { Sparkles } from 'lucide-react';

import type { Briefing } from '@/lib/briefing';

function uniq(words: string[]): string[] {
  return [...new Set(words.filter(Boolean))];
}

export function DailyBriefing({ briefing: b }: { briefing: Briefing }) {
  const risers = uniq([...b.risersKo, ...b.risersEn].map((r) => r.keyword));
  const fresh = uniq([...b.newKo, ...b.newEn].map((k) => k.keyword));

  // 데이터가 사실상 비면 렌더 생략 (빈 카드 방지).
  if (b.totalArticles === 0 && b.topKr.length === 0 && b.topGlobal.length === 0) return null;

  // 원천 요약 문장 — 수집 데이터의 메타분석(ADR-0007 호환).
  const lead = b.topCategory
    ? `${b.date} 기준 trends가 수집한 주요 기사 ${b.totalArticles}건 가운데 ‘${b.topCategory.label}’ 분야가 ${b.topCategory.count}건으로 가장 활발했습니다.`
    : `${b.date} 기준 trends가 오늘의 검색·뉴스 트렌드를 정리했습니다.`;
  const detail =
    b.topKr.length || b.topGlobal.length
      ? ` 국내에서는 ${b.topKr.slice(0, 3).join('·') || '—'}, 해외에서는 ${b.topGlobal.slice(0, 3).join('·') || '—'}가 주목받았습니다.`
      : '';
  const rise = risers.length ? ` 어제보다 ${risers.slice(0, 3).join('·')}의 언급이 두드러지게 늘었습니다.` : '';

  const rows: { label: string; items: string[] }[] = [
    { label: '🇰🇷 국내 톱', items: b.topKr },
    { label: '🌐 해외 톱', items: b.topGlobal },
    { label: '📈 급상승', items: risers },
    { label: '✨ 신규 등장', items: fresh },
    { label: '🔗 공통 관심사', items: b.crossSignals },
  ].filter((r) => r.items.length > 0);

  return (
    <section
      aria-label="오늘의 트렌드 브리핑"
      className="mb-6 rounded-xl border border-border-subtle bg-bg-subtle/50 p-4 lg:p-5"
    >
      <h2 className="flex items-center gap-1.5 text-sm font-semibold uppercase tracking-wider text-fg">
        <Sparkles size={14} className="text-accent" aria-hidden />
        오늘의 트렌드 브리핑
      </h2>

      <p className="mt-2 text-sm leading-relaxed text-fg-muted">
        {lead}
        {detail}
        {rise}
      </p>

      <dl className="mt-3 grid gap-x-6 gap-y-1.5 border-t border-border-subtle pt-3 text-sm sm:grid-cols-2">
        {rows.map((r) => (
          <div key={r.label} className="flex gap-2">
            <dt className="shrink-0 font-medium text-fg-subtle">{r.label}</dt>
            <dd className="text-fg-muted">{r.items.slice(0, 6).join(', ')}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
