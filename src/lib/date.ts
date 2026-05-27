// KST(Asia/Seoul) 날짜 유틸 — scraper·snapshot 전반의 단일 출처.
// timezone 변환은 Intl에 위임(수동 +9h offset 산술 제거). 한국은 DST가 없어
// 하루 = 86_400_000ms 로 고정 안전하므로 N일 전 계산은 UTC 밀리초 차감으로 처리.

const DAY_MS = 86_400_000;

/** Asia/Seoul 기준 'YYYY-MM-DD'. */
export function formatDateKst(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}

/** KST 기준 N일 전(기본 오늘) 'YYYY-MM-DD'. */
export function kstDateString(daysAgo = 0): string {
  return formatDateKst(new Date(Date.now() - daysAgo * DAY_MS));
}

/** KST 기준 N일 전(기본 오늘) 연/월/일 (zero-padded) — URL 경로 조립 등 분할이 필요할 때. */
export function kstDateParts(daysAgo = 0): { year: string; month: string; day: string } {
  const [year, month, day] = kstDateString(daysAgo).split('-') as [string, string, string];
  return { year, month, day };
}
