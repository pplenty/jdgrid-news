// 메인 대시보드 — ADR-0022.
// 트렌드 전용: TrendingHero + Wikipedia + Naver + (추후 iTunes Korea).
// 헤드라인은 /headlines로 분리.

import { buildBriefing } from '@/lib/briefing';
import { loadLatest, loadPrevious } from '@/lib/data';
import { itemList, keywordUrl } from '@/lib/jsonld';
import { computeMovers } from '@/lib/movers';

import { DailyBriefing } from './_components/DailyBriefing';
import { HackerNewsSection } from './_components/HackerNewsSection';
import { JsonLd } from './_components/JsonLd';
import { ItunesSection } from './_components/ItunesSection';
import { MoversSection } from './_components/MoversSection';
import { NaverShoppingSection } from './_components/NaverShoppingSection';
import { RedditSection } from './_components/RedditSection';
import { TrendingHero } from './_components/TrendingHero';
import { WikipediaSection } from './_components/WikipediaSection';
import { YouTubeSection } from './_components/YouTubeSection';

export default function HomePage() {
  const snapshot = loadLatest();
  const yesterday = loadPrevious(snapshot.date);
  const wiki = snapshot.trends.wikipedia;
  const naver = snapshot.trends.naver;
  const itunes = snapshot.trends.itunes;
  const hn = snapshot.trends.hackernews;
  const youtube = snapshot.trends.youtube;
  const reddit = snapshot.trends.reddit;

  const moversKr = yesterday
    ? computeMovers(snapshot.trends.kr, yesterday.trends.kr)
    : [];
  const moversGlobal = yesterday
    ? computeMovers(snapshot.trends.global, yesterday.trends.global)
    : [];

  const briefing = buildBriefing(snapshot, yesterday);

  // 트렌드 키워드 ItemList (KR+global top, /k 페이지로 링크). 중복 제거.
  const trendItems: { name: string; url: string }[] = [];
  const seenTrend = new Set<string>();
  for (const t of [...snapshot.trends.kr.slice(0, 10), ...snapshot.trends.global.slice(0, 10)]) {
    const key = t.keyword?.toLowerCase().trim();
    if (!key || seenTrend.has(key)) continue;
    seenTrend.add(key);
    trendItems.push({ name: t.keyword, url: keywordUrl(t.keyword) });
  }

  return (
    <>
      {trendItems.length > 0 && (
        <JsonLd data={itemList(`오늘의 트렌드 키워드 · ${snapshot.date}`, trendItems)} />
      )}

      <DailyBriefing briefing={briefing} />

      <TrendingHero
        kr={snapshot.trends.kr}
        global={snapshot.trends.global}
        date={snapshot.date}
      />

      {(moversKr.length > 0 || moversGlobal.length > 0) && (
        <MoversSection kr={moversKr} global={moversGlobal} />
      )}

      {wiki && <WikipediaSection ko={wiki.ko} en={wiki.en} />}

      {itunes && <ItunesSection music={itunes.music} apps={itunes.apps} />}

      {youtube && youtube.length > 0 && <YouTubeSection videos={youtube} />}

      {hn && hn.length > 0 && <HackerNewsSection stories={hn} />}

      {reddit && reddit.length > 0 && <RedditSection posts={reddit} />}

      {naver && (
        <NaverShoppingSection
          keywordsByCategory={naver.keywordsByCategory}
          categoryTrends={naver.categoryTrends}
        />
      )}
    </>
  );
}
