import { clsx, type ClassValue } from 'clsx';

// 날짜 표기는 실행 환경 시간대와 무관하게 KST 로 고정한다. Cloudflare 빌드는 UTC 라 지정하지
// 않으면 KST 자정이 전날로 찍히고, 클라이언트 컴포넌트(Header)는 방문자 시간대로 다시 그려
// 하이드레이션 불일치(React #418)까지 난다.
const KST = 'Asia/Seoul';

export function cn(...inputs: ClassValue[]): string {
  return clsx(inputs);
}

/** ISO 시각을 "HH분 전 / N시간 전 / N일 전 / 절대 일자" 표시로. */
export function relativeTime(iso: string, now: Date = new Date()): string {
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '';
  const diffMs = now.getTime() - t;
  const diffMin = Math.round(diffMs / 60_000);
  if (diffMin < 1) return '방금';
  if (diffMin < 60) return `${diffMin}분 전`;
  const diffHr = Math.round(diffMin / 60);
  if (diffHr < 24) return `${diffHr}시간 전`;
  const diffDay = Math.round(diffHr / 24);
  if (diffDay < 7) return `${diffDay}일 전`;
  return new Intl.DateTimeFormat('ko-KR', { timeZone: KST, month: 'short', day: 'numeric' }).format(
    new Date(iso),
  );
}

/** YYYY-MM-DD를 보기 좋은 한국어 일자로. */
export function formatDateLabel(date: string): string {
  const d = new Date(`${date}T00:00:00+09:00`);
  if (Number.isNaN(d.getTime())) return date;
  return new Intl.DateTimeFormat('ko-KR', {
    timeZone: KST,
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    weekday: 'short',
  }).format(d);
}
