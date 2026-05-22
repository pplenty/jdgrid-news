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
