// 카테고리별 큐레이션 키워드 사전 — ADR-0020.
// Naver DataLab는 "자동 인기 검색어 발견" API가 없으므로 사전 키워드의 검색량 추이로 정렬.
// 운영하며 PR로 추가/제거.

export type NaverCategoryDef = {
  /** UI에 표시할 별칭. */
  alias: string;
  /** Naver Shopping 카테고리 코드. */
  code: string;
  keywords: readonly string[];
};

export const NAVER_CATEGORIES: readonly NaverCategoryDef[] = [
  {
    alias: '패션',
    code: '50000000',
    keywords: [
      '청바지',
      '자켓',
      '원피스',
      '셔츠',
      '코트',
      '운동화',
      '가방',
      '스커트',
      '니트',
      '후드티',
    ],
  },
  {
    alias: '뷰티',
    code: '50000002',
    keywords: [
      '마스크팩',
      '립스틱',
      '향수',
      '선크림',
      '토너',
      '쿠션',
      '아이섀도우',
      '클렌징',
      '앰플',
      '바디로션',
    ],
  },
  {
    alias: '디지털·가전',
    code: '50000003',
    keywords: [
      '아이폰',
      '갤럭시',
      '노트북',
      '이어폰',
      '모니터',
      '키보드',
      '마우스',
      '에어팟',
      '태블릿',
      '스마트워치',
    ],
  },
  {
    alias: '식품',
    code: '50000006',
    keywords: [
      '라면',
      '즉석밥',
      '김치',
      '커피',
      '음료수',
      '과자',
      '간식',
      '건강식품',
      '비타민',
      '간편식',
    ],
  },
  {
    alias: '스포츠',
    code: '50000007',
    keywords: [
      '골프',
      '자전거',
      '등산',
      '요가',
      '헬스',
      '러닝',
      '캠핑',
      '수영',
      '축구',
      '낚시',
    ],
  },
];
