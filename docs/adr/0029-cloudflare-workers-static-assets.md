# ADR-0029: Cloudflare 호스팅 모드 — Workers Static Assets (ADR-0003 보완)

- Status: Accepted
- Date: 2026-05-24
- Deciders: yusik
- Related: [ADR-0002](./0002-frontend-nextjs-static-export.md), [ADR-0003](./0003-hosting-cloudflare-pages.md)

## Context (배경)

ADR-0003에서 "Cloudflare Pages"를 호스팅으로 결정. 2026년 현재 Cloudflare가 Pages를 **Workers Static Assets**로 통합 추세 — 새 프로젝트는 자동으로 Workers 모드로 생성되며 `npx wrangler deploy`를 배포 명령으로 사용.

운영자 첫 배포 시도 에러 (2026-05-24):
1. `[ERR_PNPM_IGNORED_BUILDS] workerd@1.20260521.1` — `pnpm-workspace.yaml` 의 `allowBuilds`에 `workerd` 누락. → 추가 fix 완료 (c8f40b4).
2. 후속 에러: `pnpm opennextjs-cloudflare build` → `.next/standalone/.next/server/pages-manifest.json` ENOENT.

원인: Cloudflare가 Next.js 프로젝트를 감지해 **`@opennextjs/cloudflare` (SSR/Functions 통합)** 으로 빌드 시도. 우리는 정적 export(`output: 'export'`, ADR-0002)라 `.next/standalone/` 자체가 생성 안 됨.

## Decision (결정)

**Cloudflare Workers Static Assets 모드**로 명시. `wrangler.toml` 파일을 repo 루트에 두고 `assets.directory = "./out"`만 명시 — 서버 코드(main entrypoint) 없음.

`wrangler.toml`:

```toml
name = "trends"
compatibility_date = "2026-05-24"

[assets]
directory = "./out"
not_found_handling = "404-page"
```

- `main` 필드 없음 → Worker 코드 없음, 순수 정적 호스팅.
- `assets.directory = "./out"` → Next.js export 산출물 직접 업로드.
- `not_found_handling = "404-page"` → Next.js `not-found.tsx` → `404.html` 자동 매핑.

운영자 dashboard 빌드 설정 (확인됨):
- 빌드 명령: `pnpm run build`
- 배포 명령: `npx wrangler deploy` ← `wrangler.toml` 보고 assets-only 모드로 동작
- 루트 디렉터리: `/`
- 환경변수: NODE_VERSION=22, NAVER_CLIENT_ID/SECRET, YOUTUBE_API_KEY (선택)

ADR-0003의 "Cloudflare Pages" 결정은 **호스팅 플랫폼은 그대로**(여전히 Cloudflare 무료·글로벌 CDN), 모드만 supersede.

### Project name

`wrangler.toml`의 `name = "trends"` — 운영자가 dashboard에서 사용 중인 정확한 프로젝트 이름과 일치해야 함. 다르면 첫 deploy 시 이름 충돌 또는 새 worker 생성. 운영자가 변경 권장.

## Consequences (결과)

**긍정**
- ADR-0002 정적 export 흐름과 정합. SSR·Functions 없이 순수 정적 호스팅.
- Cloudflare CDN·HTTPS·무료 quota 그대로.
- `wrangler.toml`이 모드를 명시 → Cloudflare 자동 감지가 OpenNext SSR로 빗나갈 일 없음.

**부정**
- ADR-0003에서 박은 "Cloudflare Pages" 정체성과 살짝 다른 모드. 사용자 체감은 동일 (정적 사이트 호스팅).
- 향후 SSR/Functions 필요 시 `main` 추가 + Worker 코드 작성 필요 (현재 v1엔 무관).

**중립**
- ADR-0006 GitHub Actions cron 흐름은 그대로 (data/ 커밋 → main push → Cloudflare 자동 재배포).
- `not_found_handling = "404-page"`는 Next.js export의 `not-found.tsx → 404.html` 매핑과 정합.

## Alternatives Considered (대안)

- **Cloudflare Pages (구) 새 프로젝트 생성**: Cloudflare가 새 Pages 생성 시점에도 점점 Workers Static Assets로 유도. 임시 회피.
- **`output: 'standalone'` + OpenNext SSR**: SSR 가능하지만 데이터가 빌드 시점에 정해지는(ADR-0004) 우리 케이스엔 오버킬.
- **Vercel·Netlify·GitHub Pages**: ADR-0003에서 이미 비교 후 Cloudflare 선택.
- **wrangler.toml에 `pages_build_output_dir = "./out"`**: Pages-style 호환 옵션. 단 Workers 모드 명시가 더 깔끔.
