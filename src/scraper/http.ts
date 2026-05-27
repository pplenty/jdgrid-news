// 공통 fetch 래퍼 — timeout + User-Agent 를 한 곳에서. (retry/backoff는 A4에서 추가)
// 실패 시 throw → 호출부가 try/catch 로 graceful skip (빈 배열/null) 처리.
// 각 fetcher 에 흩어져 있던 fetch + !res.ok + AbortSignal.timeout 보일러플레이트를 흡수.

import { FETCH_TIMEOUT_MS, USER_AGENT } from './config';

/** !res.ok 응답. status + (디버깅용) 응답 본문 일부를 담는다. */
export class HttpError extends Error {
  constructor(
    readonly status: number,
    url: string,
    readonly body = '',
  ) {
    super(`HTTP ${status} for ${url}`);
    this.name = 'HttpError';
  }
}

export type FetchOptions = {
  userAgent?: string;
  accept?: string;
  timeoutMs?: number;
  method?: string;
  headers?: Record<string, string>;
  body?: string;
};

async function request(url: string, opts: FetchOptions): Promise<Response> {
  const {
    userAgent = USER_AGENT,
    accept,
    timeoutMs = FETCH_TIMEOUT_MS,
    method,
    headers = {},
    body,
  } = opts;
  const res = await fetch(url, {
    method,
    headers: {
      'User-Agent': userAgent,
      ...(accept ? { Accept: accept } : {}),
      ...headers,
    },
    body,
    signal: AbortSignal.timeout(timeoutMs),
  });
  if (!res.ok) {
    const errBody = await res.text().catch(() => '');
    throw new HttpError(res.status, url, errBody);
  }
  return res;
}

/** 텍스트 응답 (XML 등). 실패 시 throw. */
export async function fetchText(url: string, opts: FetchOptions = {}): Promise<string> {
  const res = await request(url, opts);
  return res.text();
}

/** JSON 응답. Accept: application/json 기본 적용. 실패 시 throw. */
export async function fetchJson<T>(url: string, opts: FetchOptions = {}): Promise<T> {
  const res = await request(url, { accept: 'application/json', ...opts });
  return (await res.json()) as T;
}

/** unknown 에러 → 로그용 메시지. HttpError 는 status (+본문 일부) 를 노출. */
export function errMessage(err: unknown): string {
  if (err instanceof HttpError) {
    return err.body ? `HTTP ${err.status} ${err.body.slice(0, 120)}` : `HTTP ${err.status}`;
  }
  return err instanceof Error ? err.message : String(err);
}
