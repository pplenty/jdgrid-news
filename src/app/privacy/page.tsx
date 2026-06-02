// 개인정보처리방침 — Google AdSense 게재를 위한 필수 고지(제3자 쿠키·광고 개인화·opt-out).
// 정적 사이트(Cloudflare)라 자체 개인정보 수집·저장은 없음. 광고·호스팅의 쿠키/로그만 해당.

import Link from 'next/link';
import { ExternalLink, Mail } from 'lucide-react';

export const metadata = {
  title: '개인정보처리방침 — trends',
  description: 'trends.jdgrid.com의 쿠키·광고·접속 로그 처리 방침.',
};

const EFFECTIVE_DATE = '2026-06-02';

export default function PrivacyPage() {
  return (
    <div className="mx-auto max-w-prose px-4 py-10 lg:px-8">
      <header className="mb-8 border-b border-border-subtle pb-4">
        <h1 className="text-2xl font-bold tracking-tight">개인정보처리방침</h1>
        <p className="mt-2 text-sm text-fg-muted">
          trends.jdgrid.com(이하 &ldquo;사이트&rdquo;)이 쿠키·광고·접속 로그를 어떻게 처리하는지
          설명합니다.
        </p>
        <p className="mt-1 text-xs text-fg-subtle">시행일: {EFFECTIVE_DATE}</p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">1. 개요</h2>
        <p className="text-fg-muted">
          사이트는 회원가입·로그인·댓글이 없는 <strong>정적 웹사이트</strong>입니다. 운영자가
          이용자의 이름·이메일·전화번호 등 개인정보를 직접 수집·저장하지 않습니다. 다만 사이트가
          이용하는 <strong>호스팅·광고 서비스</strong>가 쿠키와 접속 로그를 처리할 수 있어, 그 범위를
          투명하게 안내합니다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">2. 접속 로그</h2>
        <p className="text-fg-muted">
          사이트는 Cloudflare를 통해 제공됩니다. 보안·트래픽 통계 목적으로 IP 주소·브라우저 정보
          등 표준 접속 로그가 호스팅 제공자에 의해 자동 기록될 수 있습니다. 이 로그는 운영자가
          개별 이용자를 식별하는 데 사용하지 않습니다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">3. 쿠키 및 광고 (Google AdSense)</h2>
        <p className="text-fg-muted">
          사이트는 Google AdSense를 통해 광고를 게재합니다. 이와 관련해 다음을 고지합니다.
        </p>
        <ul className="list-disc space-y-2 pl-5 text-fg-muted">
          <li>
            Google을 포함한 제3자 광고 공급업체는 <strong>쿠키</strong>를 사용해 이용자의 이전 방문
            기록을 바탕으로 광고를 게재합니다.
          </li>
          <li>
            Google의 광고 쿠키(DART 쿠키 등)는 이용자가 본 사이트 및 다른 사이트를 방문한 정보를
            바탕으로 <strong>개인 맞춤 광고</strong>를 제공할 수 있게 합니다.
          </li>
          <li>
            제3자 공급업체 및 광고 네트워크 또한 본 사이트에 광고를 게재하기 위해 쿠키를 사용할 수
            있습니다.
          </li>
        </ul>
        <p className="text-fg-muted">
          이용자는 다음에서 맞춤 광고를 비활성화하거나 광고 쿠키를 거부할 수 있습니다.
        </p>
        <ul className="space-y-1.5 text-sm">
          <li>
            <a
              href="https://www.google.com/settings/ads"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-fg-muted hover:text-fg"
            >
              Google 광고 설정 (개인 맞춤 광고 사용 안 함)
              <ExternalLink size={11} className="opacity-60" />
            </a>
          </li>
          <li>
            <a
              href="https://www.aboutads.info/choices/"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-fg-muted hover:text-fg"
            >
              aboutads.info — 제3자 광고 쿠키 opt-out
              <ExternalLink size={11} className="opacity-60" />
            </a>
          </li>
          <li>
            <a
              href="https://policies.google.com/technologies/partner-sites"
              target="_blank"
              rel="noreferrer noopener"
              className="inline-flex items-center gap-1 text-fg-muted hover:text-fg"
            >
              Google의 파트너 사이트 데이터 이용 방식
              <ExternalLink size={11} className="opacity-60" />
            </a>
          </li>
        </ul>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">4. 사이트 자체 저장소</h2>
        <p className="text-fg-muted">
          사이트는 이용자가 선택한 <strong>테마(라이트/다크)</strong> 설정을 브라우저
          LocalStorage에만 저장합니다. 이 값은 서버로 전송되지 않으며 광고·추적에 사용되지 않습니다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">5. 외부 링크</h2>
        <p className="text-fg-muted">
          사이트의 기사·트렌드는 각 매체 원문으로 연결됩니다. 외부 사이트의 개인정보 처리는 해당
          사이트의 방침을 따르며, 본 방침이 적용되지 않습니다. 데이터 출처·콘텐츠 정책은{' '}
          <Link href="/about/" className="text-fg-muted underline hover:text-fg">
            About
          </Link>{' '}
          페이지를 참고하세요.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">6. 아동의 개인정보</h2>
        <p className="text-fg-muted">
          사이트는 만 14세 미만 아동을 대상으로 하지 않으며, 아동의 개인정보를 의도적으로 수집하지
          않습니다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">7. 방침 변경</h2>
        <p className="text-fg-muted">
          본 방침은 법령·서비스 변경에 따라 갱신될 수 있으며, 변경 시 본 페이지에 게시하고 시행일을
          수정합니다.
        </p>
      </section>

      <section className="mt-10 space-y-3">
        <h2 className="text-lg font-semibold">8. 문의</h2>
        <p className="flex items-center gap-2 text-sm">
          <Mail size={14} className="text-fg-subtle" />
          <a href="mailto:support@jdgrid.com" className="text-fg-muted hover:text-fg">
            support@jdgrid.com
          </a>
        </p>
      </section>

      <div className="mt-12 border-t border-border-subtle pt-4">
        <Link href="/" className="text-sm text-fg-muted hover:text-fg">
          ← 홈으로
        </Link>
      </div>
    </div>
  );
}
