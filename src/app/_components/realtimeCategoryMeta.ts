// Realtime trend 카테고리(ADR-0017) → 라벨·아이콘 매핑.

import {
  Briefcase,
  Cpu,
  HeartPulse,
  Palette,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

import type { RealtimeCategory } from '@/lib/types';

export const REALTIME_CATEGORY_ORDER: ReadonlyArray<RealtimeCategory> = [
  'top_stories',
  'business',
  'sci_tech',
  'entertainment',
  'sports',
  'health',
];

export const REALTIME_CATEGORY_LABELS: Record<
  RealtimeCategory,
  { ko: string; en: string; icon: LucideIcon }
> = {
  top_stories: { ko: '헤드라인', en: 'Top Stories', icon: Star },
  business: { ko: '경제', en: 'Business', icon: Briefcase },
  sci_tech: { ko: '과학·기술', en: 'Sci/Tech', icon: Cpu },
  entertainment: { ko: '연예·문화', en: 'Entertainment', icon: Palette },
  sports: { ko: '스포츠', en: 'Sports', icon: Trophy },
  health: { ko: '건강', en: 'Health', icon: HeartPulse },
};
