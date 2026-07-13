// 페이지별 동적 OG 이미지 공용 템플릿 (ADR-0043).
// 루트 opengraph-image 와 같은 다크 브랜드 룩. 한글 렌더링을 위해 빌드타임에
// pretendard(devDependency) 의 OTF 를 로드 — satori 는 woff2 를 못 읽는다.

import { readFile } from 'node:fs/promises';
import path from 'node:path';

import { ImageResponse } from 'next/og';

import { ogTitle, ogTitleFontSize } from '@/lib/og-text';

export const OG_SIZE = { width: 1200, height: 630 };

// 빌드 워커당 1회만 디스크에서 읽도록 모듈 스코프 캐시.
let fontPromise: Promise<Buffer> | null = null;
function loadPretendardBold(): Promise<Buffer> {
  fontPromise ??= readFile(
    path.join(process.cwd(), 'node_modules/pretendard/dist/public/static/Pretendard-Bold.otf'),
  );
  return fontPromise;
}

type OgTemplateProps = {
  /** 상단 액센트 배지 — 페이지 종류 (예: '오늘의 검색 트렌드') */
  badge: string;
  /** 중앙 대형 타이틀 — 키워드/카테고리/날짜 */
  title: string;
  /** 타이틀 아래 보조 설명 (없으면 생략) */
  subtitle?: string;
};

export async function renderOgImage({ badge, title, subtitle }: OgTemplateProps) {
  const clamped = ogTitle(title);
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
          fontFamily: 'Pretendard',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '18px' }}>
          <div
            style={{ width: '30px', height: '30px', borderRadius: '9999px', background: '#6ea8fe' }}
          />
          <div style={{ fontSize: '42px', fontWeight: 700, letterSpacing: '-0.02em' }}>trends</div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <div style={{ fontSize: '30px', color: '#6ea8fe', fontWeight: 700 }}>{badge}</div>
          <div
            style={{
              marginTop: '18px',
              fontSize: `${ogTitleFontSize(clamped)}px`,
              fontWeight: 700,
              lineHeight: 1.15,
              letterSpacing: '-0.03em',
            }}
          >
            {clamped}
          </div>
          {subtitle && (
            <div style={{ marginTop: '22px', fontSize: '30px', color: '#9aa0a6' }}>{subtitle}</div>
          )}
        </div>

        <div style={{ display: 'flex', fontSize: '30px', color: '#6ea8fe', fontWeight: 600 }}>
          trends.jdgrid.com
        </div>
      </div>
    ),
    {
      ...OG_SIZE,
      fonts: [
        { name: 'Pretendard', data: await loadPretendardBold(), weight: 700, style: 'normal' },
      ],
    },
  );
}
