// /k/[keyword] 세그먼트 공용 파라미터 헬퍼 — page 와 opengraph-image 가 공유.

import { loadLatest } from '@/lib/data';

export function keywordStaticParams(): Array<{ keyword: string }> {
  const snapshot = loadLatest();
  const keywords = new Set<string>();
  for (const t of [...snapshot.trends.global, ...snapshot.trends.kr]) {
    if (t.keyword) keywords.add(t.keyword);
  }
  // raw 키워드 반환 — Next 가 파일시스템/URL 인코딩 담당. 여기서 encodeURIComponent 하면
  // Next 가 한 번 더 인코딩해(이중) 비-ASCII(한글) 페이지가 인코딩 문자열로 렌더됨 (ADR-0028 회귀).
  return [...keywords].map((keyword) => ({ keyword }));
}

// Next 버전/플랫폼에 따라 param 이 디코드/단일인코딩으로 올 수 있어 안전 디코드.
// 이미 디코드된 값(% 없음)은 무변, 인코딩 값은 1회 디코드, '%' 리터럴 등 오류는 원값 유지.
export function decodeKeyword(raw: string): string {
  try {
    return decodeURIComponent(raw);
  } catch {
    return raw;
  }
}
