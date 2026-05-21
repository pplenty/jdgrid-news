// URL/텍스트 정규화 + ID 생성.
// ADR-0004: id = SHA1(normalizedUrl) 앞 12자.
// ADR-0007: summary는 RSS description 그대로지만 HTML/엔티티 등 표시 안전한 cleanup은 허용.

import { createHash } from 'node:crypto';

const TRACKING_PARAM_PREFIXES = [
  'utm_',
  'fbclid',
  'gclid',
  'mc_cid',
  'mc_eid',
  'icid',
  'cmpid',
  '_ga',
];

/** 같은 기사가 여러 매체에서 다른 트래킹 파라미터로 들어와도 같은 ID가 되도록 정규화. */
export function normalizeUrl(input: string): string {
  try {
    const u = new URL(input);
    for (const key of [...u.searchParams.keys()]) {
      if (TRACKING_PARAM_PREFIXES.some((p) => key.toLowerCase().startsWith(p))) {
        u.searchParams.delete(key);
      }
    }
    u.hash = '';
    let pathname = u.pathname;
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
    const search = u.searchParams.toString();
    return `${u.origin}${pathname}${search ? `?${search}` : ''}`;
  } catch {
    return input.trim();
  }
}

export function idFromUrl(url: string): string {
  return createHash('sha1').update(normalizeUrl(url)).digest('hex').slice(0, 12);
}

const HTML_ENTITIES: Record<string, string> = {
  '&nbsp;': ' ',
  '&amp;': '&',
  '&lt;': '<',
  '&gt;': '>',
  '&quot;': '"',
  '&apos;': "'",
  '&#39;': "'",
  '&#x27;': "'",
  '&#x2F;': '/',
};

/** RSS description의 HTML 태그/엔티티/잡공백을 표시 가능한 plain text로 정규화. */
export function cleanText(input: string | undefined | null): string {
  if (!input) return '';
  let s = input;
  s = s.replace(/<[^>]+>/g, ' ');
  s = s.replace(/&[a-z#0-9]+;/gi, (m) => HTML_ENTITIES[m.toLowerCase()] ?? m);
  s = s.replace(/&[a-z#0-9]+;/gi, ''); // 남은 미지의 엔티티 제거
  s = s.replace(/\s+/g, ' ').trim();
  return s;
}

/** ISO 8601이 아니면 best-effort로 Date 파싱 후 ISO로. 실패 시 현재 시각. */
export function normalizeIsoDate(input: string | undefined | null): string {
  if (!input) return new Date().toISOString();
  const d = new Date(input);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

/** Asia/Seoul 기준 YYYY-MM-DD. */
export function formatDateKst(date: Date = new Date()): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone: 'Asia/Seoul',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(date);
}
