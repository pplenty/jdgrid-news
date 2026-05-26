// ADR-0023 후속: 우리 8 카테고리 색 매핑 (stacked bar / 차트용).
// 인디고 액센트와 어울리는 500-tone 채도, 다크 모드에서도 가시.

import type { CategoryId } from '@/lib/categories';

export const CATEGORY_COLORS: Record<CategoryId, string> = {
  top: '#71717a', // zinc-500
  world: '#3b82f6', // blue-500
  politics: '#ef4444', // red-500
  society: '#14b8a6', // teal-500 — ADR-0032
  business: '#f59e0b', // amber-500
  tech: '#06b6d4', // cyan-500
  science: '#10b981', // emerald-500
  sports: '#ec4899', // pink-500
  culture: '#a855f7', // purple-500
};
