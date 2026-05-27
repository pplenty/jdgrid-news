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

// 일시적 실패로 보고 재시도하는 status — 429(rate limit) + 5xx(서버). 4xx는 재시도 무의미.
const isRetryableStatus = (status: number): boolean => status === 429 || status >= 500;
const MAX_RETRIES = 2; // 총 3회 시도
const RETRY_BASE_MS = 400; // exponential backoff: 400ms → 800ms

const sleep = (ms: number): Promise<void> => new Promise((resolve) => setTimeout(resolve, ms));

async function request(url: string, opts: FetchOptions): Promise<Response> {
  const {
    userAgent = USER_AGENT,
    accept,
    timeoutMs = FETCH_TIMEOUT_MS,
    method,
    headers = {},
    body,
  } = opts;
  const init: RequestInit = {
    method,
    headers: {
      'User-Agent': userAgent,
      ...(accept ? { Accept: accept } : {}),
      ...headers,
    },
    body,
  };

  // 429/5xx/네트워크·timeout 에러는 exponential backoff 재시도. 4xx(429 제외)는 즉시 throw.
  for (let attempt = 0; ; attempt++) {
    let res: Response | undefined;
    let networkErr: unknown;
    try {
      res = await fetch(url, { ...init, signal: AbortSignal.timeout(timeoutMs) });
    } catch (err) {
      networkErr = err; // 네트워크 실패 또는 AbortSignal.timeout
    }

    if (res) {
      if (res.ok) return res;
      const errBody = await res.text().catch(() => '');
      const httpErr = new HttpError(res.status, url, errBody);
      if (!isRetryableStatus(res.status) || attempt >= MAX_RETRIES) throw httpErr;
    } else if (attempt >= MAX_RETRIES) {
      throw networkErr;
    }

    await sleep(RETRY_BASE_MS * 2 ** attempt);
  }
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
