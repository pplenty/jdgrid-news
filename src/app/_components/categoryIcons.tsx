// 카테고리 ID → lucide 아이콘 단일 출처. ADR-0015 §아이콘.

import {
  Briefcase,
  Cpu,
  FlaskConical,
  Globe,
  Landmark,
  Palette,
  Star,
  Trophy,
  Users,
  type LucideIcon,
} from 'lucide-react';

import type { CategoryId } from '@/lib/categories';

export const CATEGORY_ICONS: Record<CategoryId, LucideIcon> = {
  top: Star,
  world: Globe,
  politics: Landmark,
  society: Users,
  business: Briefcase,
  tech: Cpu,
  science: FlaskConical,
  sports: Trophy,
  culture: Palette,
};
