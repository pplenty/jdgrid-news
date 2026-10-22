// localStorage 값을 useSyncExternalStore 로 읽기 위한 최소 스토어 (클라이언트 전용).
// 정적 HTML·하이드레이션 첫 패스는 서버 스냅샷(기본값)으로 그리고, React 가 직후에 브라우저
// 값으로 다시 그린다 — 마운트 effect 에서 setState 하던 2단 렌더를 대체
// (react-hooks/set-state-in-effect, Next 16 / eslint-plugin-react-hooks 7).

const listeners = new Set<() => void>();

export function subscribeLocalStorage(onChange: () => void): () => void {
  listeners.add(onChange);
  // 다른 탭에서 바꾼 값도 반영된다 ('storage' 이벤트는 다른 탭에서만 발생).
  window.addEventListener('storage', onChange);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onChange);
  };
}

export function readLocalStorage(key: string): string | null {
  try {
    return window.localStorage.getItem(key);
  } catch {
    return null;
  }
}

/** value 가 null 이면 키 삭제. 같은 탭의 구독자에게 직접 알린다. */
export function writeLocalStorage(key: string, value: string | null): void {
  try {
    if (value === null) window.localStorage.removeItem(key);
    else window.localStorage.setItem(key, value);
  } catch {
    // 저장소 차단(프라이빗 모드 등) — 기억은 못 해도 알림은 보낸다.
  }
  for (const listener of listeners) listener();
}
