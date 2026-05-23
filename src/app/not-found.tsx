import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';

import { EmptyState } from './_components/EmptyState';

export default function NotFound() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <EmptyState
        size="lg"
        title="별자리에서 길을 잃었어요"
        description={
          <>
            요청하신 페이지가 보이지 않아요. 키워드 페이지는 오늘자 트렌드에 잡힌 키워드만
            생성되니, 과거 키워드는 날짜 페이지(<code>/d/YYYY-MM-DD</code>)에서 찾아주세요.
          </>
        }
        action={
          <Link
            href="/"
            className="inline-flex items-center gap-1.5 rounded-md border border-border bg-bg px-4 py-2 text-sm font-medium shadow-sm transition-colors hover:border-accent hover:text-accent-fg"
          >
            <ArrowLeft size={14} />
            홈으로
          </Link>
        }
      />
    </div>
  );
}
