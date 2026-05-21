import latest from '../../data/latest.json';
import { CATEGORY_LABELS } from '@/lib/categories';

export default function HomePage() {
  return (
    <main className="min-h-screen mx-auto max-w-4xl px-6 py-10">
      <header className="border-b border-neutral-200 dark:border-neutral-800 pb-4 mb-8">
        <h1 className="text-2xl font-bold tracking-tight">jdgrid·news</h1>
        <p className="text-sm text-neutral-500 mt-1">
          데일리 뉴스 인덱스 · {latest.date} · generated {latest.generatedAt}
        </p>
      </header>

      <section className="space-y-3">
        <h2 className="text-lg font-semibold">M0 scaffolding placeholder</h2>
        <p className="text-neutral-700 dark:text-neutral-300 leading-relaxed">
          M1 수집 파이프라인 + M3 UI 구현 후 이 페이지는 대시보드로 교체됩니다. 디자인은
          <code className="px-1 py-0.5 mx-1 rounded bg-neutral-100 dark:bg-neutral-800 text-sm">
            docs/adr/0009
          </code>
          를 따릅니다.
        </p>
        <ul className="text-sm text-neutral-600 dark:text-neutral-400 list-disc pl-5">
          {Object.entries(CATEGORY_LABELS).map(([id, label]) => (
            <li key={id}>
              <span className="font-mono">{id}</span> — {label.ko} / {label.en}
            </li>
          ))}
        </ul>
      </section>

      <details className="mt-8">
        <summary className="cursor-pointer text-sm text-neutral-500">latest.json 보기</summary>
        <pre className="mt-2 p-3 bg-neutral-50 dark:bg-neutral-900 rounded text-xs overflow-x-auto">
          {JSON.stringify(latest, null, 2)}
        </pre>
      </details>
    </main>
  );
}
