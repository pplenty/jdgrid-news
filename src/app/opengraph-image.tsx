// 사이트 OG 이미지 — next/og ImageResponse 로 빌드타임 정적 생성 (ADR-0040).
// 루트 배치라 전 페이지 공통 og:image (Next 가 자동 주입). 폰트 의존 회피 위해 영문 브랜드 텍스트.

import { ImageResponse } from 'next/og';

// output: 'export' 정적 빌드용 — 빌드타임 1회 생성.
export const dynamic = 'force-static';

export const alt = 'trends — 오늘의 인사이트';
export const size = { width: 1200, height: 630 };
export const contentType = 'image/png';

export default function OpengraphImage() {
  return new ImageResponse(
    (
      <div
        style={{
          display: 'flex',
          flexDirection: 'column',
          width: '100%',
          height: '100%',
          background: '#0b0e14',
          color: '#e6e8eb',
          padding: '80px',
          justifyContent: 'space-between',
          fontFamily: 'sans-serif',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div style={{ width: '30px', height: '30px', borderRadius: '9999px', background: '#6ea8fe' }} />
          <div style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-0.02em' }}>trends</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '76px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            Search · News · Culture
          </div>
          <div style={{ fontSize: '76px', fontWeight: 800, lineHeight: 1.1, letterSpacing: '-0.03em' }}>
            trends, in one page
          </div>
          <div style={{ marginTop: '22px', fontSize: '30px', color: '#9aa0a6' }}>
            Daily search, news, knowledge, shopping & culture trends
          </div>
        </div>

        <div style={{ display: 'flex', fontSize: '30px', color: '#6ea8fe', fontWeight: 600 }}>
          trends.jdgrid.com
        </div>
      </div>
    ),
    { ...size },
  );
}
