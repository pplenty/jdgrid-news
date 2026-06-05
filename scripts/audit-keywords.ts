// 키워드/source 품질 audit — 수동 모니터링 도구 (ADR-0038 후속).
//
// (1) Verge recall: dropCommerce 매체의 라이브 피드에 production 필터(isCommercePost)를 적용.
//     드롭 수 = scraper 의 `[scrape] dropped N`. KEEP 중 느슨한 딜 신호 매칭 = false-negative 후보(육안).
// (2) 소프트 잔재 추세: 저장 data/*.json 의 derived 클라우드로 watch-list 단어 일자별 추세(지속성).
//     + 최신 클라우드 top 출력으로 신규 노이즈 육안 점검.
// (3) 커머스 추세: 저장 data/*.json 에서 dropCommerce 매체 기사 중 커머스 패턴 매칭을 일자별로.
//     필터 적용일 이후 0 수렴 = production recall 확인 (라이브 1회 스냅샷보다 신뢰성↑).
//
// 실행: pnpm audit:keywords [days]   (기본 7일)
// 네트워크: dropCommerce 매체 피드만 fetch (recall 점검용). 데이터·git 미변경.

import { readFileSync, readdirSync } from 'node:fs';
import { resolve } from 'node:path';

import Parser from 'rss-parser';

import { extractCategoryTerms, isCommercePost } from '@/scraper/source-filter';
import { SOURCES } from '@/scraper/sources';

const DAYS = Number(process.argv[2]) || 7;

/** 거슬리면 stopword 후보로 지켜보는 일반/메타명사 (ADR-0038 세션 후속). 필요 시 갱신. */
const KO_WATCH = ['운영', '참여', '평가', '관리', '역대'];
const EN_WATCH = ['hit', 'event', 'man', 'weekend'];

/** source-filter.ts 의 커머스 category 와 동일 — recall 분해(category vs text) 표시용. */
const COMMERCE_CATS = new Set([
  'deals',
  'verge shopping',
  'commerce',
  'buying guide',
  'gift guide',
  'shopping',
]);

/**
 * 느슨한 커머스 탐지기 — production 필터(isCommercePost)보다 *넓게* 잡는다(recall 측정용).
 * 섹션 (1) KEEP 글 false-negative 후보 + (3) 저장 데이터 커머스 추세 공용. review·vs 제외.
 */
// 맨 `$\d`(예: "$4 billion contract")·bundle·cheap 은 뉴스 오탐 유발 → 제외. 가격 딜은 "under $N"·
// "$N right now/or less/off" 형태만. 정밀도 우선 — 매칭이 실제 커머스 누락 신호가 되도록.
const LOOSE_DEAL =
  /\bdeals?\b|\bon sale\b|\bsale\b|\bdiscount|\bcoupon\b|%\s?off|\bhalf off\b|\bgift guide\b|\bbuying guide\b|\bgiveaway\b|free tech|\bprime day\b|\bblack friday\b|\bcyber monday\b|\bpreorder\b|\bunder \$\d|\$\d[\d,.]*\s+(?:right now|or less|off)\b/i;

/** dropCommerce(ADR-0038) 적용 시작일 — 저장 데이터 전/후 표시 기준. */
const COMMERCE_FILTER_SINCE = '2026-06-02';

async function auditRecall(): Promise<void> {
  console.log('========== (1) 커머스 필터 recall (dropCommerce 매체 라이브) ==========');
  const targets = SOURCES.filter((s) => s.dropCommerce);
  if (targets.length === 0) {
    console.log('  dropCommerce 매체 없음 — skip');
    return;
  }
  const parser = new Parser({
    headers: { 'User-Agent': 'Mozilla/5.0' },
    timeout: 20000,
    customFields: { item: [['category', 'categories', { keepArray: true }]] },
  });

  for (const src of targets) {
    let feed;
    try {
      feed = await parser.parseURL(src.url);
    } catch (err) {
      console.log(`\n  [${src.id}] fetch 실패 — ${err instanceof Error ? err.message : String(err)}`);
      continue;
    }
    const items = feed.items ?? [];
    let dropCat = 0;
    let dropText = 0;
    const kept: { title: string; terms: string[] }[] = [];
    for (const i of items) {
      const terms = extractCategoryTerms(i.categories);
      const drop = isCommercePost({
        title: i.title,
        summary: i.contentSnippet ?? i.summary,
        categories: i.categories,
      });
      if (drop) {
        if (terms.some((t) => COMMERCE_CATS.has(t))) dropCat++;
        else dropText++;
        console.log(`  ✂ [${terms.join(',') || 'no-cat'}] ${i.title}`);
      } else {
        kept.push({ title: i.title ?? '', terms });
      }
    }
    const dropped = dropCat + dropText;
    const pct = items.length ? ((dropped / items.length) * 100).toFixed(1) : '0';
    console.log(
      `\n  → [${src.id}] 피드 ${items.length}건, 드롭 ${dropped} (${pct}%) = scrape dropped N | category ${dropCat} + text ${dropText}`,
    );
    const misses = kept.filter((k) => LOOSE_DEAL.test(k.title));
    console.log(`  KEEP ${kept.length}건 중 딜 신호 의심(false-negative 후보) ${misses.length}건:`);
    if (misses.length === 0) console.log('    (없음 — recall 양호)');
    for (const m of misses) console.log(`    ? [${m.terms.join(',') || 'no-cat'}] ${m.title}`);
  }
}

type Cloud = { keyword: string; count: number }[];

function auditResidual(): void {
  console.log(`\n\n========== (2) 소프트 잔재 추세 (저장 클라우드 ${DAYS}일) ==========`);
  const DATA = resolve(process.cwd(), 'data');
  const files = readdirSync(DATA)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .slice(-DAYS);
  if (files.length === 0) {
    console.log('  data/*.json 없음 — skip');
    return;
  }

  const perDay: Record<string, { ko: Map<string, number>; en: Map<string, number>; cloudKo: Cloud; cloudEn: Cloud }> = {};
  for (const f of files) {
    const snap = JSON.parse(readFileSync(resolve(DATA, f), 'utf8'));
    const cloudKo: Cloud = snap.trends?.derived?.ko ?? [];
    const cloudEn: Cloud = snap.trends?.derived?.en ?? [];
    perDay[f.replace('.json', '').slice(5)] = {
      ko: new Map(cloudKo.map((k) => [k.keyword, k.count])),
      en: new Map(cloudEn.map((k) => [k.keyword, k.count])),
      cloudKo,
      cloudEn,
    };
  }
  const days = Object.keys(perDay);

  const fmt = (lang: 'ko' | 'en', words: string[]) => {
    console.log(`\n  [${lang.toUpperCase()}] watch | ${days.join('  ')} | 출현일/${days.length}`);
    for (const w of words) {
      const cells = days.map((d) => {
        const c = perDay[d][lang].get(w);
        return c == null ? ' -- ' : String(c).padStart(3, ' ') + ' ';
      });
      const present = days.filter((d) => perDay[d][lang].get(w) != null).length;
      const verdict = present >= Math.ceil(days.length * 0.7) ? ' ← 지속(stopword 검토)' : present <= 2 ? ' ← 산발(토픽성, 유지)' : '';
      console.log(`   ${w.padEnd(7, ' ')}| ${cells.join(' ')} | ${present}/${days.length}${verdict}`);
    }
  };
  fmt('ko', KO_WATCH);
  fmt('en', EN_WATCH);

  const latest = days[days.length - 1];
  console.log(`\n  [최신 ${latest} 클라우드 top — 신규 노이즈 육안 점검]`);
  console.log('   KO:', perDay[latest].cloudKo.slice(0, 30).map((k) => `${k.keyword}(${k.count})`).join(' '));
  console.log('   EN:', perDay[latest].cloudEn.slice(0, 30).map((k) => `${k.keyword}(${k.count})`).join(' '));
  console.log('\n  (지속성 판정은 같은 파이프라인 누적일 기준이 정확 — 토크나이저/불용어 변경 직후엔 추세 약함)');
}

function auditStoredCommerceTrend(): void {
  console.log(`\n\n========== (3) 저장 데이터 커머스 추세 (dropCommerce 매체, 필터 효과) ==========`);
  const targets = SOURCES.filter((s) => s.dropCommerce);
  if (targets.length === 0) {
    console.log('  dropCommerce 매체 없음 — skip');
    return;
  }
  const DATA = resolve(process.cwd(), 'data');
  const files = readdirSync(DATA)
    .filter((f) => /^\d{4}-\d{2}-\d{2}\.json$/.test(f))
    .sort()
    .slice(-DAYS);
  if (files.length === 0) {
    console.log('  data/*.json 없음 — skip');
    return;
  }

  for (const src of targets) {
    console.log(`\n  [${src.name}] 일자        | 기사 | 커머스 | 샘플`);
    for (const f of files) {
      const snap = JSON.parse(readFileSync(resolve(DATA, f), 'utf8'));
      const seen = new Set<string>();
      const arts: string[] = [];
      for (const c of snap.categories ?? []) {
        if (c.id === 'top') continue;
        for (const a of c.items) {
          if (a.source?.name === src.name && !seen.has(a.id)) {
            seen.add(a.id);
            arts.push(`${a.title ?? ''} ${a.summary ?? ''}`);
          }
        }
      }
      const deals = arts.filter((t) => LOOSE_DEAL.test(t));
      const date = f.replace('.json', '');
      const mark = date >= COMMERCE_FILTER_SINCE ? '✓필터' : ' 전 ';
      const sample = (deals[0] ?? '').trim().slice(0, 48);
      console.log(
        `   ${date} [${mark}] | ${String(arts.length).padStart(3)}  | ${String(deals.length).padStart(4)}   | ${sample}`,
      );
    }
  }
  console.log(
    `\n  (커머스 = 느슨한 탐지기. 필터 적용일(${COMMERCE_FILTER_SINCE}~) 이후 0 수렴이면 production recall 양호)`,
  );
}

async function main(): Promise<void> {
  await auditRecall();
  auditResidual();
  auditStoredCommerceTrend();
}

main()
  .then(() => process.exit(0))
  .catch((err) => {
    console.error(err);
    process.exit(1);
  });
