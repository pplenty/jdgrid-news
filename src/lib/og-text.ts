// OG 이미지 타이틀 텍스트 헬퍼 — 길이에 따른 절단·폰트 크기 (ADR-0043).

const MAX_TITLE_CHARS = 48;

/** 과도하게 긴 타이틀은 잘라 말줄임 — satori 레이아웃 폭주 방지. */
export function ogTitle(raw: string): string {
  const text = raw.trim();
  if (text.length <= MAX_TITLE_CHARS) return text;
  return `${text.slice(0, MAX_TITLE_CHARS - 1).trimEnd()}…`;
}

/** 타이틀 길이별 폰트 크기(px) — 짧은 한글 키워드는 크게, 긴 영문 구는 단계적 축소. */
export function ogTitleFontSize(title: string): number {
  const len = title.length;
  if (len <= 10) return 96;
  if (len <= 20) return 76;
  if (len <= 32) return 60;
  return 48;
}
