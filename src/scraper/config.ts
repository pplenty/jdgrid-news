// scraper fetcher 공통 상수. 매체별 특수 User-Agent는 정책상 다르므로 명시 분기.

export const FETCH_TIMEOUT_MS = 15_000;

/** 기본 User-Agent — 대부분의 source. */
export const USER_AGENT = 'jdgrid-trends/0.1 (+https://trends.jdgrid.com)';

/** Wikipedia: Wikimedia API 정책상 mailto 연락처 포함 권장. */
export const WIKIPEDIA_USER_AGENT = 'jdgrid-trends/0.1 (mailto:support@jdgrid.com)';

/** Reddit: <platform>:<app-id>:<version> 형식 요구 (ADR-0026). */
export const REDDIT_USER_AGENT = 'web:jdgrid-trends:v0.1 (+https://trends.jdgrid.com)';
