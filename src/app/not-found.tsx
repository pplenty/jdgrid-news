import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] flex-col items-center justify-center px-4 text-center">
      <p className="text-sm font-medium text-fg-subtle">404</p>
      <h1 className="mt-2 text-2xl font-bold tracking-tight">페이지를 찾을 수 없습니다</h1>
      <p className="mt-2 max-w-md text-sm text-fg-muted">
        키워드 페이지는 오늘자 트렌딩에 잡힌 키워드만 생성됩니다. 과거 키워드를 찾으시려면 날짜
        페이지(/d/YYYY-MM-DD)를 사용해주세요.
      </p>
      <Link
        href="/"
        className="mt-6 inline-flex items-center gap-1 rounded-md border border-border px-4 py-2 text-sm font-medium hover:bg-bg-subtle"
      >
        <ArrowLeft size={14} />
        홈으로
      </Link>
    </div>
  );
}
