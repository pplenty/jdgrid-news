import { afterEach, describe, expect, it, vi } from 'vitest';

import { errMessage, fetchJson, fetchText, HttpError } from './http';

const realFetch = global.fetch;

afterEach(() => {
  global.fetch = realFetch;
  vi.restoreAllMocks();
});

function mockResponse(status: number, body: string): Response {
  return {
    ok: status >= 200 && status < 300,
    status,
    text: async () => body,
    json: async () => JSON.parse(body),
  } as Response;
}

describe('fetchJson / fetchText', () => {
  it('returns parsed JSON on 200 with a single call', async () => {
    const f = vi.fn().mockResolvedValue(mockResponse(200, '{"a":1}'));
    global.fetch = f;
    await expect(fetchJson<{ a: number }>('https://x')).resolves.toEqual({ a: 1 });
    expect(f).toHaveBeenCalledTimes(1);
  });

  it('throws HttpError with status on 4xx without retrying', async () => {
    const f = vi.fn().mockResolvedValue(mockResponse(404, 'not found'));
    global.fetch = f;
    await expect(fetchText('https://x')).rejects.toBeInstanceOf(HttpError);
    expect(f).toHaveBeenCalledTimes(1);
  });
});

describe('retry / backoff', () => {
  it('retries on 5xx then succeeds', async () => {
    const f = vi
      .fn()
      .mockResolvedValueOnce(mockResponse(500, 'err'))
      .mockResolvedValueOnce(mockResponse(200, '{"ok":true}'));
    global.fetch = f;
    await expect(fetchJson<{ ok: boolean }>('https://x')).resolves.toEqual({ ok: true });
    expect(f).toHaveBeenCalledTimes(2);
  });

  it('gives up after 3 total attempts on persistent 500', async () => {
    const f = vi.fn().mockResolvedValue(mockResponse(500, 'err'));
    global.fetch = f;
    await expect(fetchJson('https://x')).rejects.toMatchObject({ status: 500 });
    expect(f).toHaveBeenCalledTimes(3);
  });

  it('retries on network errors then rethrows', async () => {
    const f = vi.fn().mockRejectedValue(new Error('ECONNRESET'));
    global.fetch = f;
    await expect(fetchText('https://x')).rejects.toThrow('ECONNRESET');
    expect(f).toHaveBeenCalledTimes(3);
  });
});

describe('errMessage', () => {
  it('formats HttpError with status and body excerpt', () => {
    expect(errMessage(new HttpError(403, 'https://x', 'forbidden'))).toBe('HTTP 403 forbidden');
    expect(errMessage(new HttpError(500, 'https://x'))).toBe('HTTP 500');
  });

  it('falls back to Error message / String for non-HttpError', () => {
    expect(errMessage(new Error('boom'))).toBe('boom');
    expect(errMessage('plain')).toBe('plain');
  });
});
