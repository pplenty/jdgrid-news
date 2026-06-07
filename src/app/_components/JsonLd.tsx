// JSON-LD 스크립트 렌더 (ADR-0040). Server 컴포넌트.
// `<` → < 이스케이프로 </script> 주입 차단 — 키워드 등 일부 값이 외부 RSS 유래라 필수.

export function JsonLd({ data }: { data: object }) {
  const json = JSON.stringify(data).replace(/</g, '\\u003c');
  return (
    // eslint-disable-next-line react/no-danger
    <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: json }} />
  );
}
