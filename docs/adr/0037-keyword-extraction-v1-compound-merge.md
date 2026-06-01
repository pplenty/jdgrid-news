# ADR-0037: keyword extraction v1 — 복합명사 병합 (garu analyze span)

- Status: Accepted
- Date: 2026-06-01
- Deciders: yusik
- Related: [ADR-0014](./0014-keyword-extraction-v0.md), [ADR-0035](./0035-keyword-extraction-v1-morphological.md)

## Context (배경)

ADR-0035 의 garu-ko `nouns()` 명사 추출은 기능어·활용형 노이즈를 제거했으나, **복합명사를 sub-명사로 분리**하는 한계가 남았다 — 형태소 단위 추출이라 한 단어를 쪼갠다:

- `프로야구` → `프로` + `야구`
- `영업이익` → `영업` + `이익`
- `헌법재판소` → `헌법` + `재판소`
- `고가도로` → `고가` + `도로`

결과: (1) **빈도 분산** — `프로야구` 한 단어의 빈도가 `프로`/`야구` 로 쪼개져 trend 순위에서 저평가. (2) **의미 손상** — `프로`·`고가` 같은 fragment 가 단독으로 워드클라우드/메인 trends 에 노출돼 무의미. ADR-0035 가 "후속: 복합명사 병합(인접 NNG/NNP 결합) 검토" 로 남긴 항목.

7일 누적 빈도 실측(2026-06-01): `프로(33)`·`고가(30)` 등 fragment 가 top 에 잔존, `프로야구` 는 부재.

## Decision (결정)

> 운영자 결정 (2026-06-01): **채택** — garu `analyze()` 의 source span 기반 복합명사 병합. 같은-span 의 `NNG/NNP/SL` 형태소를 surface 순서로 이어붙임. 조사/어미/접사는 명사 POS 가 아니므로 제외. `단일화`→`단일`(파생접사 XSN 제외) 한계는 수용.

`nouns()` 대신 **`analyze()`** 사용. garu 는 복합명사를 쪼개도 쪼갠 형태소에 **원본 source span `[start, end)` 을 동일하게 부여**한다 (PoC 확인):

```
analyze("프로야구 개막전")
  → [{text:"프로",  pos:"NNG", start:0, end:4},   ← 같은 span
     {text:"야구",  pos:"NNG", start:0, end:4},   ← 같은 span
     {text:"개막전", pos:"NNG", start:5, end:8}]
```

→ **같은 (start,end) 묶음 = 한 어절**. 그 안의 명사 POS(`NNG·NNP·SL`) text 를 순서대로 이어붙여 복합명사 복원:

```ts
// keywords.ts — garuCompoundKoTokenizer
while (i < tokens.length) {
  const { start, end } = tokens[i];
  let j = i,
    buf = '';
  while (j < tokens.length && tokens[j].start === start && tokens[j].end === end) {
    if (KO_NOUN_POS.has(tokens[j].pos)) buf += tokens[j].text; // NNG·NNP·SL
    j++;
  }
  if (buf) merged.push(buf);
  i = j;
}
```

- **`KO_NOUN_POS = {NNG, NNP, SL}`** — ADR-0035 `nouns()+includeSL` 과 동일 명사 집합 (외국어 AI·IT 보존).
- 조사(JKS)·어미(EF/EP)·파생접사(XSN/XSV)·의존명사(NNB)·숫자(SN)는 명사 POS 가 아님 → 자동 제외. `삼성전자가`→`삼성전자`, `발표했다`→`발표`, `5월`→제외.
- **별도 어절(다른 span)은 병합 안 함** — `대통령 후보` 는 그대로 2개. 같은 어절 내 split 만 복원 → 진짜 단독 명사(`운행`·`구간`)는 안 건드림.
- 병합 결과에 기존 `refineKoTokens`(min-len·날짜·stopword) 재적용.
- 주입식 유지 — `garuCompoundKoTokenizer(analyze)`. 미주입 시 v0 fallback (ADR-0035 와 동일).

## Consequences (결과)

**긍정**

- 복합명사 빈도 통합 — 실측 7일 top 에 `프로야구(20)` 등장(이전엔 `프로`/`야구` 분산), `고가`→`고가도로` 병합.
- 조사·어미·접사 제거가 **POS 로 공짜** — 어절 내 조사를 사전 없이 거름.
- 정밀 — over-merge 없음(다른 span 불병합). `대통령 후보`·`운행`·`구간` 그대로.
- `nouns()` → `analyze()` 는 동일 WASM 호출(nouns 가 내부적으로 analyze 기반) → 추가 비용 미미.

**부정**

- **파생접사 손실** — `단일화`(단일+화/XSN) → `단일`. `-화/-성/-적` 류 파생어는 어근만. 수용(어근이 키워드로 충분).
- 사전에 한 단어로 등재된 고유명사(`국제축구연맹`)는 애초에 단일 NNP → 병합 불필요(무영향).
- span 동일성 가정 — garu 가 어절 span 을 형태소에 부여하는 현재 동작에 의존. 향후 per-morpheme span 으로 바뀌면 병합이 no-op 으로 **graceful degrade**(= ADR-0035 동작).

**중립**

- `garuKoTokenizer(nouns)` (ADR-0035) → `garuCompoundKoTokenizer(analyze)` 로 supersede. 영어(compromise, ADR-0036)·v0 fallback 무영향.
- 단위 테스트 37→39 (병합·조사제거·비-병합·refine 4종 신규, garuKoTokenizer 2종 대체).

## Alternatives Considered (대안)

- **인접 NNG/NNP 휴리스틱 병합 (span 무시)**: 어절 경계 없이 인접 명사 무조건 병합 → `대통령 후보` 같은 별도 어절도 잘못 병합. span 이 정확한 경계 신호라 기각.
- **source slice `text.slice(start,end)`**: 같은 병합 결과지만 조사 포함 어절(`삼성전자가`)에서 조사까지 포함될 위험. POS 필터 concat 이 조사 제거에 안전 → concat 채택.
- **XSN 포함(`단일화` 유지)**: `-화/-성` 파생어 보존되나 `화`·`성` 단독 노이즈 위험 + 케이스 복잡. v1 은 명사 어근만, 필요 시 후속.
- **사전 기반 복합명사(n-gram + 통계)**: 무겁고 ADR-0014 에서 이미 기각한 방향.

## Implementation Notes

- garu `analyze(text, opts?)` 반환은 `AnalyzeResult | AnalyzeResult[]` (topN>1 시 배열). 주입부에서 `Array.isArray(r) ? r[0] : r` 로 단일화.
- `Token.pos` 는 41개 POS 리터럴 유니온. `KO_NOUN_POS` Set 으로 명사군만 필터.
- 단위 테스트는 analyze 결과를 mock(고정 tokens)으로 — wasm 로드 없이 병합 로직만 검증. PoC 로 실제 garu span 동작(같은 어절 = 같은 span) 먼저 확인 후 mock 작성.
- PoC 에서 `nouns()` vs `merged` 나란히 비교로 가치 검증 (ADR-0036 의 before/after 패턴 계승). 실데이터 비교는 `data/*.json` 의 저장된 articles 오프라인 재추출(네트워크 0).
