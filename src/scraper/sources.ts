// RSS 매체 마스터 리스트 — ADR-0013.
// URL은 변동성이 있으므로 운영 중 헬스체크로 검증·갱신. 매체 추가/제거는 PR로.
// 카테고리 매핑·우선순위 룰은 ADR-0008.

import type { CategoryId } from '@/lib/categories';

export type Source = {
  /** 고유 ID. `{매체}-{카테고리}` 컨벤션. */
  id: string;
  /** 매체명. UI 표시용. */
  name: string;
  /** 매체 홈 URL (Article.source.url에 박힘). */
  homepage: string;
  /** RSS 피드 URL. */
  url: string;
  /** 우리 카테고리(ADR-0008) ID 1:1 매핑. */
  category: CategoryId;
  /** 본문 언어. */
  lang: 'ko' | 'en';
  /** 가중치 v1은 모두 1.0 (균등). 운영 튜닝 영역. */
  weight: number;
};

export const SOURCES: readonly Source[] = [
  // ─── 해외 (영문, 6개 매체) ─────────────────────────────────────────────
  // BBC News — 카테고리별 RSS 잘 분리 제공.
  {
    id: 'bbc-world',
    name: 'BBC News',
    homepage: 'https://www.bbc.com/news',
    url: 'https://feeds.bbci.co.uk/news/world/rss.xml',
    category: 'world',
    lang: 'en',
    weight: 1,
  },
  {
    id: 'bbc-business',
    name: 'BBC News',
    homepage: 'https://www.bbc.com/news',
    url: 'https://feeds.bbci.co.uk/news/business/rss.xml',
    category: 'business',
    lang: 'en',
    weight: 1,
  },
  {
    id: 'bbc-tech',
    name: 'BBC News',
    homepage: 'https://www.bbc.com/news',
    url: 'https://feeds.bbci.co.uk/news/technology/rss.xml',
    category: 'tech',
    lang: 'en',
    weight: 1,
  },
  {
    id: 'bbc-science',
    name: 'BBC News',
    homepage: 'https://www.bbc.com/news',
    url: 'https://feeds.bbci.co.uk/news/science_and_environment/rss.xml',
    category: 'science',
    lang: 'en',
    weight: 1,
  },

  // ADR-0027: AP·Reuters RSS 폐지로 Al Jazeera·NPR로 교체.
  {
    id: 'aljazeera-world',
    name: 'Al Jazeera',
    homepage: 'https://www.aljazeera.com',
    url: 'https://www.aljazeera.com/xml/rss/all.xml',
    category: 'world',
    lang: 'en',
    weight: 1,
  },
  {
    id: 'npr-world',
    name: 'NPR',
    homepage: 'https://www.npr.org',
    url: 'https://feeds.npr.org/1004/rss.xml',
    category: 'world',
    lang: 'en',
    weight: 1,
  },

  // The Guardian — 카테고리별 RSS 매우 잘 분리.
  {
    id: 'guardian-world',
    name: 'The Guardian',
    homepage: 'https://www.theguardian.com',
    url: 'https://www.theguardian.com/world/rss',
    category: 'world',
    lang: 'en',
    weight: 1,
  },
  {
    id: 'guardian-politics',
    name: 'The Guardian',
    homepage: 'https://www.theguardian.com',
    url: 'https://www.theguardian.com/politics/rss',
    category: 'politics',
    lang: 'en',
    weight: 1,
  },
  {
    id: 'guardian-culture',
    name: 'The Guardian',
    homepage: 'https://www.theguardian.com',
    url: 'https://www.theguardian.com/culture/rss',
    category: 'culture',
    lang: 'en',
    weight: 1,
  },
  {
    id: 'guardian-science',
    name: 'The Guardian',
    homepage: 'https://www.theguardian.com',
    url: 'https://www.theguardian.com/science/rss',
    category: 'science',
    lang: 'en',
    weight: 1,
  },

  // Bloomberg — business 중심. 공식 RSS는 markets 위주.
  {
    id: 'bloomberg-business',
    name: 'Bloomberg',
    homepage: 'https://www.bloomberg.com',
    url: 'https://feeds.bloomberg.com/markets/news.rss',
    category: 'business',
    lang: 'en',
    weight: 1,
  },

  // The Verge — tech.
  {
    id: 'verge-tech',
    name: 'The Verge',
    homepage: 'https://www.theverge.com',
    url: 'https://www.theverge.com/rss/index.xml',
    category: 'tech',
    lang: 'en',
    weight: 1,
  },

  // ─── 국내 (한국어, 6개 매체) ───────────────────────────────────────────
  // ADR-0030: 연합뉴스 6 source 모두 ECONNRESET (로컬+CI) → 동아 3 + 경향 3 으로 분산 대체.
  // 매핑: 동아 = politics/society/culture, 경향 = world/business/sports.
  // society 카테고리는 ADR-0008 에 없어 world 로 매핑 (yonhap-society 와 동일 hack).

  // 동아일보 — rss.donga.com, 카테고리별 50 items.
  {
    id: 'donga-politics',
    name: '동아일보',
    homepage: 'https://www.donga.com',
    url: 'https://rss.donga.com/politics.xml',
    category: 'politics',
    lang: 'ko',
    weight: 1,
  },
  {
    id: 'donga-society',
    name: '동아일보',
    homepage: 'https://www.donga.com',
    url: 'https://rss.donga.com/national.xml',
    category: 'world',
    lang: 'ko',
    weight: 1,
  },
  {
    id: 'donga-culture',
    name: '동아일보',
    homepage: 'https://www.donga.com',
    url: 'https://rss.donga.com/culture.xml',
    category: 'culture',
    lang: 'ko',
    weight: 1,
  },

  // 경향신문 — khan.co.kr/rss/rssdata, 카테고리별 50 items.
  {
    id: 'khan-world',
    name: '경향신문',
    homepage: 'https://www.khan.co.kr',
    url: 'https://www.khan.co.kr/rss/rssdata/kh_world.xml',
    category: 'world',
    lang: 'ko',
    weight: 1,
  },
  {
    id: 'khan-business',
    name: '경향신문',
    homepage: 'https://www.khan.co.kr',
    url: 'https://www.khan.co.kr/rss/rssdata/economy_news.xml',
    category: 'business',
    lang: 'ko',
    weight: 1,
  },
  {
    id: 'khan-sports',
    name: '경향신문',
    homepage: 'https://www.khan.co.kr',
    url: 'https://www.khan.co.kr/rss/rssdata/kh_sports.xml',
    category: 'sports',
    lang: 'ko',
    weight: 1,
  },

  // 한겨레 — 카테고리별 RSS.
  {
    id: 'hani-politics',
    name: '한겨레',
    homepage: 'https://www.hani.co.kr',
    url: 'https://www.hani.co.kr/rss/politics/',
    category: 'politics',
    lang: 'ko',
    weight: 1,
  },
  {
    id: 'hani-culture',
    name: '한겨레',
    homepage: 'https://www.hani.co.kr',
    url: 'https://www.hani.co.kr/rss/culture/',
    category: 'culture',
    lang: 'ko',
    weight: 1,
  },

  // 조선일보 — RSS는 outboundfeeds 엔드포인트. URL 안정성 운영 시 검증.
  {
    id: 'chosun-politics',
    name: '조선일보',
    homepage: 'https://www.chosun.com',
    url: 'https://www.chosun.com/arc/outboundfeeds/rss/category/politics/?outputType=xml',
    category: 'politics',
    lang: 'ko',
    weight: 1,
  },
  {
    id: 'chosun-business',
    name: '조선일보',
    homepage: 'https://www.chosun.com',
    url: 'https://www.chosun.com/arc/outboundfeeds/rss/category/economy/?outputType=xml',
    category: 'business',
    lang: 'ko',
    weight: 1,
  },

  // 한국경제 — business 강함.
  {
    id: 'hankyung-business',
    name: '한국경제',
    homepage: 'https://www.hankyung.com',
    url: 'https://www.hankyung.com/feed/economy',
    category: 'business',
    lang: 'ko',
    weight: 1,
  },

  // 전자신문 — tech 전문지. Section901 = IT.
  {
    id: 'etnews-tech',
    name: '전자신문',
    homepage: 'https://www.etnews.com',
    url: 'https://rss.etnews.com/Section901.xml',
    category: 'tech',
    lang: 'ko',
    weight: 1,
  },

  // KBS World RSS는 ADR-0027에서 폐지 확인 후 제거.
];
