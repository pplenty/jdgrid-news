// 데이터 모델 — ADR-0004 (Git JSON 저장), ADR-0007 (5필드 콘텐츠 정책), ADR-0008 (카테고리).

import type { CategoryId } from './categories';

export type Article = {
  /** URL 정규화 후 SHA1 앞 12자. */
  id: string;
  /** RSS 헤드라인 (제목). */
  title: string;
  /** RSS description 그대로. 가공·재요약 금지 (ADR-0007). */
  summary: string;
  /** 원문 링크. */
  url: string;
  /** 매체 정보. */
  source: { name: string; url: string };
  /** 발행 시각 (ISO 8601). */
  publishedAt: string;
  /** 본문 언어. */
  lang: 'ko' | 'en';
  /** 매체 RSS 제공 썸네일. 외부 핫링크, 자체 호스팅 금지 (ADR-0007). */
  imageUrl?: string;
  /** 단일 분류 결과. 우선순위 룰은 categories.CATEGORY_PRIORITY. */
  category: CategoryId;
};

export type CategoryBucket = {
  id: CategoryId;
  label: { ko: string; en: string };
  items: Article[];
};

export type Trend = {
  keyword: string;
  /** 0~1 정규화된 강도. */
  score: number;
  /** 해당 키워드가 매칭된 오늘자 기사 URL 목록. */
  relatedUrls: string[];
};

export type DailySnapshot = {
  /** 스크래퍼 실행 시각 (ISO 8601). */
  generatedAt: string;
  /** YYYY-MM-DD. */
  date: string;
  categories: CategoryBucket[];
  trends: {
    global: Trend[];
    kr: Trend[];
  };
};
