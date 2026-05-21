# ADR-0001: 아키텍처 결정 사항을 ADR로 기록한다

- Status: Accepted
- Date: 2026-05-21
- Deciders: yusik

## Context (배경)

`jdgrid-news`는 1인 운영 프로젝트지만, 데이터 소스/저장 방식/배포 플랫폼 등 한 번 정하면 되돌리기 비싼 결정들이 초기에 몰려 있다. 시간이 지나 "왜 이 스택을 골랐더라?"를 다시 추론하지 않으려면 결정의 **맥락(Context)** 과 **대안(Alternatives)** 까지 같이 남겨두는 게 낫다.

또한 LLM 보조 개발(Claude Code)을 적극적으로 쓸 예정이므로, 결정 근거가 코드 주변이 아니라 별도 문서로 정리돼 있어야 AI가 다음 결정을 추론할 때 일관성을 유지할 수 있다.

## Decision (결정)

- 주요 아키텍처/도구/플랫폼 결정은 ADR(Architecture Decision Record)로 남긴다.
- 위치: `docs/adr/NNNN-kebab-case-title.md`.
- 형식: Michael Nygard 스타일 (Context / Decision / Consequences / Alternatives).
- 상태값: `Proposed`, `Accepted`, `Deprecated`, `Superseded by ADR-NNNN`.
- 본문 언어는 한국어, 기술 용어/식별자는 원문 그대로.

### 작성 트리거

다음 중 하나에 해당하면 ADR을 만든다.

1. 외부 의존성/서비스를 새로 추가하거나 교체한다.
2. 데이터 모델·저장소 형태를 바꾼다.
3. 빌드/배포 파이프라인의 흐름을 바꾼다.
4. 한 번 도입 후 1주일 이상 운영하면 되돌리기 어려운 결정이다.

### 작성하지 않는 경우

- 라이브러리 마이너 버전 업.
- 단순한 코드 스타일/포맷팅.
- 일회성 실험적 스크립트.

### 작성 방식 (Authoring workflow)

AI 보조(Claude Code 등)로 ADR을 만들거나 갱신할 때 다음 흐름을 따른다.

1. **AI는 결정 항목을 임의로 채우지 않는다.** 핵심 결정 포인트를 식별해 운영자에게 **질문으로** 던진다 (`AskUserQuestion` 또는 자연어 질문).
2. 운영자가 답한 내용을 **그대로 `## Decision` 섹션에 반영**한다. AI가 추론으로 결정을 덧붙이지 않는다.
3. 운영자가 사전에 명시한 선호·결정(예: 본문 어딘가에서 이미 "X로 가고 싶다"고 말한 항목)은 다시 묻지 않는다 — 중복 질문 회피.
4. AI가 자율적으로 보강해도 되는 섹션은 `Context`, `Consequences`, `Alternatives Considered`뿐이다. 이들도 사실 관계 위주로 정리하고, 가치 판단이 포함되면 운영자에게 확인을 받는다.

이 룰은 "ADR은 운영자의 의사결정 기록이지 AI의 추론 기록이 아니다"는 원칙에서 나온다.

## Consequences (결과)

**긍정**
- 결정의 근거가 시간이 지나도 보존된다.
- 신규 협업자(또는 미래의 나, AI 에이전트)가 빠르게 컨텍스트 복구 가능.
- "이 결정을 뒤집으려면 무엇을 다시 고려해야 하는가"가 명확.

**부정**
- 결정마다 문서 작성 오버헤드 (수십 분 단위).
- ADR을 안 쓰는 결정과 쓰는 결정의 경계가 흐려질 수 있음 → 위 트리거 룰로 완화.

**중립**
- ADR은 결정 시점의 스냅샷이다. 이후 사실이 바뀌면 새 ADR로 supersede.

## Alternatives Considered (대안)

- **README에 모두 통합**: 결정 수가 늘면 README가 잡탕이 됨.
- **GitHub Issues/Discussions로만 기록**: 검색은 되지만 코드와 함께 버전 관리되지 않음.
- **CHANGELOG로 대체**: CHANGELOG는 "무엇을 바꿨나"는 잘 보여주지만 "왜"는 약하다.
