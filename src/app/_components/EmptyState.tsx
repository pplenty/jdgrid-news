// 빈 상태·404 공용 — 별자리 + 짧은 카피 + 옵션 액션.

import type { ReactNode } from 'react';

import { ConstellationMark } from './icons';

type Props = {
  title: string;
  description?: ReactNode;
  action?: ReactNode;
  /** 큰(404 hero) / 보통(섹션 빈 상태). */
  size?: 'lg' | 'md';
};

export function EmptyState({ title, description, action, size = 'md' }: Props) {
  const isLg = size === 'lg';
  return (
    <div className="flex flex-col items-center justify-center px-4 py-16 text-center">
      <ConstellationMark
        size={isLg ? 72 : 48}
        className="text-fg-subtle opacity-50"
      />
      <h2 className={isLg ? 'mt-6 text-2xl font-bold tracking-tight' : 'mt-4 text-base font-semibold'}>
        {title}
      </h2>
      {description && (
        <p className="mt-2 max-w-md text-sm leading-relaxed text-fg-muted">{description}</p>
      )}
      {action && <div className="mt-6">{action}</div>}
    </div>
  );
}
