// lucide-react v1에서 제거된 브랜드 아이콘 + 사이트 브랜드 마크는 inline SVG로 유지.

/**
 * trends 브랜드 마크 — 별자리(constellation) 모티프.
 * ADR-0022: 점 4개를 연결한 단순 별자리. currentColor 사용해 라이트/다크 자연 대응.
 */
export function ConstellationMark({
  size = 18,
  className,
}: {
  size?: number;
  className?: string;
}) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      aria-hidden
      className={className}
    >
      {/* 연결선 — currentColor opacity 낮춤 */}
      <path
        d="M5 6 L11 11 L18 4 M11 11 L15 18"
        stroke="currentColor"
        strokeOpacity="0.35"
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      {/* 점(별) 4개 */}
      <circle cx="5" cy="6" r="1.8" fill="currentColor" />
      <circle cx="11" cy="11" r="2.4" fill="currentColor" />
      <circle cx="18" cy="4" r="1.6" fill="currentColor" />
      <circle cx="15" cy="18" r="2" fill="currentColor" />
    </svg>
  );
}

export function YouTubeIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M21.582 6.186a2.506 2.506 0 0 0-1.768-1.768C18.254 4 12 4 12 4s-6.254 0-7.814.418a2.506 2.506 0 0 0-1.768 1.768C2 7.746 2 12 2 12s0 4.254.418 5.814a2.506 2.506 0 0 0 1.768 1.768C5.746 20 12 20 12 20s6.254 0 7.814-.418a2.506 2.506 0 0 0 1.768-1.768C22 16.254 22 12 22 12s0-4.254-.418-5.814zM10 15.464V8.536L16 12l-6 3.464z" />
    </svg>
  );
}

export function RedditIcon({ size = 16, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M12 2C6.477 2 2 6.477 2 12c0 5.523 4.477 10 10 10s10-4.477 10-10c0-5.523-4.477-10-10-10zm5.535 11.06c.034.193.052.39.052.59 0 2.398-2.79 4.34-6.235 4.34s-6.235-1.942-6.235-4.34c0-.2.018-.397.053-.59a1.32 1.32 0 1 1 1.46-2.13c.97-.68 2.27-1.12 3.71-1.18l.93-3.71a.25.25 0 0 1 .29-.18l2.9.62a.95.95 0 1 1-.07.51l-2.6-.56-.83 3.32c1.42.07 2.7.51 3.66 1.18a1.32 1.32 0 1 1 1.45 2.13zM8.5 13a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm7 0a1 1 0 1 0 0-2 1 1 0 0 0 0 2zm-.32 2.1a.34.34 0 0 1 .03.49 4.2 4.2 0 0 1-3.21 1.21 4.2 4.2 0 0 1-3.21-1.21.347.347 0 1 1 .49-.49 3.51 3.51 0 0 0 2.72.99 3.51 3.51 0 0 0 2.72-.99.34.34 0 0 1 .46 0z" />
    </svg>
  );
}

export function GithubIcon({ size = 14, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 16 16"
      fill="currentColor"
      aria-hidden
      className={className}
    >
      <path d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.013 8.013 0 0 0 16 8c0-4.42-3.58-8-8-8z" />
    </svg>
  );
}
