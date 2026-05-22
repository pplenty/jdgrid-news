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

export type GoogleNewsItem = {
  title: string;
  url: string;
  /** 매체명 (Google이 표기해 줌). */
  source: string;
  /** Google CDN 핫링크 (자체 저장 금지, ADR-0007). */
  picture?: string;
};

export type Trend = {
  keyword: string;
  /** 0~1 정규화된 강도. derived는 count 비율, google은 traffic 추정. */
  score: number;
  /** 신호 출처 (ADR-0016). */
  source: 'google' | 'derived';
  /** Google 제공 대략적 검색량 (예: "200K+", "1M+"). source === 'google'에서만. */
  traffic?: string;
  /** 트렌드 대표 이미지 URL (Google CDN). */
  picture?: string;
  /** 짧은 컨텍스트/관련 검색어 (Google description). */
  description?: string;
  /** Google이 큐레이션한 관련 기사 (ht:news_item). */
  googleArticles?: GoogleNewsItem[];
  /** 우리가 정확 매칭한 우리 수집 기사 URL (ADR-0014). */
  relatedUrls: string[];
};

export type RealtimeCategory =
  | 'top_stories'
  | 'business'
  | 'entertainment'
  | 'health'
  | 'sci_tech'
  | 'sports';

export type RealtimeArticle = {
  title: string;
  url: string;
  source: string;
  imageUrl?: string;
  publishedAt?: string;
  /** Google이 짧게 발췌해 큐레이션한 인용 (ADR-0007 정합 — 매체가 RSS에 노출한 수준의 짧은 발췌). */
  snippet?: string;
};

export type RealtimeTrendStory = {
  /** Story 제목 (뉴스 토픽 클러스터 라벨). */
  title: string;
  /** 관련 엔티티 (인물·장소·물건). Google이 추출. */
  entityNames: string[];
  imageUrl?: string;
  /** Google Trends story URL. */
  shareUrl?: string;
  category: RealtimeCategory;
  geo: 'KR' | 'global';
  articles: RealtimeArticle[];
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
    /** ADR-0017: Google realtime trends API 카테고리별. */
    realtime?: {
      kr: RealtimeTrendStory[];
      global: RealtimeTrendStory[];
    };
  };
};
