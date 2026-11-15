# NEXORA AI·차별화·출시 가능성 검토 보고서

## 지적사항에 대한 검토 결과와 해결책 · 2026년 11월 15일 기준

**제품:** NEXORA Business Growth Platform  
**기준 코드:** GitHub `upstagecorp-cell/upstage` / `main` / `850e479`  
**검토 목적:** NEXORA의 현재 AI, 고객 판단 능력, 데이터베이스, 서버 구조, 무료 이미지·영상 API 가능성, 자체 AI 개발 필요성, 제품 차별화와 해결책을 재검토한다.

> 이 보고서는 제품·기술·사업 전략 검토 문서다. 법률·세무·개인정보·AI 규제 자문을 대체하지 않는다.

---

## 1. 결론: 지적은 타당하며 제품의 중심을 재정의해야 한다

현재 NEXORA는 독자적인 대형 AI 모델을 보유하지 않는다. `OPENAI_API_KEY`와 `OPENAI_MODEL`이라는 환경변수 이름만으로 provider가 결정되는 것은 아니지만, 현재 코드의 실제 호출부는 `https://api.openai.com/v1/responses`로 고정되어 있고 작업 기록도 `provider: 'openai'`로 저장한다. 즉 현재 버전은 “provider를 선택할 수 있는 추상화”가 아니라 OpenAI Responses API에 연결된 구현이다. 이미지와 영상 생성 API는 현재 제품의 핵심 경로로 연결되어 있지 않다.

현재 NEXORA의 업종 판단도 완전한 자동 진단이 아니다. 업종별 질문 템플릿, 고객이 입력한 사업 프로필과 증거, 규칙 기반 평가, 그리고 그 결과를 설명하는 AI 초안 생성을 조합한 형태다. 따라서 “고객 사업을 자동으로 정확히 진단하는 독자 AI”라고 홍보하면 과장이다.

또한 다른 AI 서비스의 API를 빌려 이미지를 만들고 영상을 만드는 것만으로는 충분한 차별점이 되지 않는다. 고객은 ChatGPT, Gemini, Canva, Adobe, CapCut, Runway 등과 비교할 것이며, NEXORA가 단순한 콘텐츠 생성 래퍼로 보이면 별도 구독료를 지불할 이유가 약하다.

따라서 NEXORA의 제품 정의를 다음과 같이 바꿔야 한다.

> **NEXORA는 콘텐츠를 대신 만들어주는 도구가 아니라, 초보 사업자가 무엇을 홍보할지 결정하고, 근거를 확인하며, 하나의 promotion을 실행하고, 결과를 다음 판단에 연결하는 성장 운영 시스템이다.**

이미지·영상은 이 의사결정의 결과물 중 하나로 제공한다. 핵심 자산은 모델 자체가 아니라 고객의 사업 맥락, 증거, 실행 이력, 승인 내용, 결과 데이터, 업종별 판단 구조다.

---

## 2. 현재 구현 상태의 사실 확인

### 2.1 현재 사용 중인 AI

현재 코드에서 텍스트 생성은 다음 흐름으로 동작한다.

```text
사업 프로필 + Assessment + 추천 action + 고객 입력
        ↓
OpenAI 호환 provider 호출
        ↓
구조화된 marketing package
        ↓
claimsToVerify·채널·목표·측정 지표 검증
        ↓
초안 저장 → 사용자 수정 → 정확한 버전 승인
```

생성 프롬프트에는 다음 보호 규칙이 포함되어 있다.

- 고객이 제공하지 않은 가격·효과·리뷰·통계·성과를 발명하지 않는다.
- 고객의 자기 보고를 독립적으로 검증된 사실처럼 표현하지 않는다.
- 짧은 스크립트를 완성된 영상 파일이라고 주장하지 않는다.
- AI가 광고를 게시하거나 광고비를 지출했다고 주장하지 않는다.
- 공개 조회수나 좋아요를 구매·매출·ROAS로 해석하지 않는다.
- 외부 reference가 없으면 분석했다고 주장하지 않는다.

이것은 안전한 생성 구조이지만, 자체 모델이나 자체 산업 지능을 뜻하지는 않는다.

### 2.2 고객 판단 기능

현재 구현에는 다음이 있다.

- restaurant, cafe, lodging, retail, e-commerce, services, creator 등의 업종별 질문
- planning, launching, operating, growing 등의 사업 단계
- 비용·마진·용량·재고·전환·판매 경로를 확인하는 질문
- 고객이 입력한 Evidence의 기간·출처·측정치 저장
- 이전 Assessment와 현재 Assessment 비교
- 누락 정보와 검증이 필요한 사실 표시
- 실행 기록과 결과 기록의 연결

반면 현재 다음은 없다.

- 지역별 또는 업종별 실제 시장 평균 DB
- 경쟁사 자동 분석 DB
- POS·Shopify·예약 시스템 자동 연동
- Meta·TikTok·YouTube·LinkedIn 성과 자동 수집
- 고객 웹사이트·광고 계정의 자동 진단
- 고객별 과거 성과를 모델 가중치에 반영하는 학습 시스템
- 검증된 업종별 전환율·마진·광고비 벤치마크

현재 기능의 정확한 설명은 다음과 같다.

> 고객이 제공한 사업 정보와 증거를 구조화하고, 업종별 질문과 규칙을 이용해 누락 정보·위험 신호·다음 행동을 제안하며, 외부 LLM은 그 결과를 설명하고 마케팅 초안을 만드는 시스템이다.

### 2.3 현재 서버와 데이터 저장

현재 저장소는 다음 기술 전제를 갖는다.

- Next.js / Node.js 서버 런타임
- Node.js 24 기준
- 서버 전용 SQLite
- SQLite WAL 모드
- 기본 데이터 경로 `.data/nexora.sqlite`
- `NEXORA_DB_PATH`로 운영 경로 지정
- 단일 애플리케이션 인스턴스와 영구 디스크 필요
- 이미지 처리 worker 구조
- Stripe, Resend, OpenAI 계정 연동 구조

현재 코드 저장소 자체가 정식 운영 호스팅 사업자를 확정한 것은 아니다. Preview는 개발·검토 환경이며 Production 서버와 동일한 운영 증거가 아니다.

SQLite 파일을 임시 디스크에 저장하거나 여러 인스턴스에 분산하면 계정·결제·승인 데이터가 일관되지 않을 수 있다. 초기에는 단일 Node.js 서버와 영구 SSD로 운영할 수 있지만, 고객 수가 증가하면 PostgreSQL과 object storage, queue worker로 이전해야 한다.

---

## 3. 각 질문에 대한 직접 답변

### Q1. 현재 NEXORA의 AI는 무엇인가?

현재는 NEXORA 자체 모델이 아니라 **OpenAI Responses API를 직접 호출하는 텍스트 생성 경로**다. `OPENAI_MODEL`로 OpenAI 계정에서 사용할 모델 ID를 선택할 수는 있지만, 현재 코드에는 `AI_BASE_URL`이나 provider adapter가 없어 다른 회사의 API로 바꾸는 설정은 지원하지 않는다. 따라서 환경변수 이름은 일반화되어 있어도 실제 구현은 OpenAI-specific이다.

이 구분은 중요하다. 사업적으로는 NEXORA가 작업별로 가장 적합한 provider를 선택해야 하지만, 그 목표는 현재 구현에 이미 완성된 기능이 아니다. 현재 코드의 사실과 향후 설계 목표를 분리해 설명해야 한다.

### Q2. 업종 상태와 문제를 파악할 수 있는가?

부분적으로 가능하다. 업종별 질문과 규칙은 있으며, 고객의 입력과 증거를 바탕으로 문제 영역과 누락 정보를 제안할 수 있다. 그러나 외부 데이터와 자동 connector가 없으므로 업계 평균 대비 진단, 경쟁사 비교, 광고 계정 기반 원인 분석은 할 수 없다.

### Q3. 외부 DB가 없으면 어떻게 판단하는가?

다음 순서로 판단해야 한다.

```text
고객의 사업 프로필
→ 업종별 질문
→ 증거·측정 기간·출처 확인
→ 사실·추정·가설·누락 분리
→ 규칙 기반 위험 탐지
→ AI의 설명과 다음 질문
→ 작은 실행
→ 실제 결과 기록
```

NEXORA는 모르는 것을 아는 척하지 않고, 판단 가능 범위를 표시해야 한다. “광고가 실패했다”가 아니라 “광고비·구매 기간·구매 수가 없어 실패 여부를 판단할 수 없다”라고 말해야 한다.

### Q4. 사전 딥러닝이 필요한가?

현재는 필요하지 않다. 데이터가 적고 성공·실패 라벨이 없으며 업종별 지표 정의도 표준화되지 않았기 때문이다. 먼저 규칙 기반 Decision Engine, 업종 지식 구조, Evidence Quality, 고객별 Business Memory, 결과 평가 데이터를 만들어야 한다.

파인튜닝은 다음 조건 이후에 검토한다.

- 익명화된 고객 사례가 충분할 것
- 최소 수개월 이상의 결과 데이터가 있을 것
- 업종별 지표 정의가 통일되어 있을 것
- 전문가가 정답을 검토할 것
- 고객 데이터 사용 동의가 있을 것
- 모델 평가 세트와 실패 기준이 있을 것

### Q5. 무료 이미지·영상 API가 있는가?

상업 서비스의 안정적인 운영을 무료 API에 의존하기는 어렵다. 무료 티어는 호출량·속도·상업적 사용·데이터 처리·모델 변경 조건이 제한될 수 있다.

Google의 최신 Gemini 이미지 모델은 공식 가격표에서 모델별 Free Tier가 없거나 제한적으로 표시되며, AI Studio 테스트와 상업용 API 운영을 구분해야 한다. [1] OpenAI 이미지 API도 입력·출력 이미지 토큰에 비용이 부과된다. [2] Runway Dev는 credit 기반이며 1 credit이 $0.01이고, 영상 모델별 초당 credit이 부과된다. [3]

무료에 가까운 대안은 로컬 오픈소스 모델이지만 GPU·운영·스토리지·라이선스·품질 비용이 발생하므로 사업 관점에서 완전 무료가 아니다.

### Q6. 이미지·영상을 NEXORA에서 꼭 만들어야 하는가?

지금 당장은 꼭 만들 필요가 없다. 현재 고객이 지불해야 하는 핵심 문제는 “이미지 파일을 하나 더 얻는 것”보다 “무엇을 홍보해야 하는지 모르고, 만든 콘텐츠를 실제 사업 결과와 연결하지 못하는 것”에 가깝다.

이미지·영상은 다음 조건이 충족된 뒤 제공하는 것이 좋다.

- promotion 목표가 명확하다.
- 고객과 offer가 정리되어 있다.
- 사용 채널이 정해져 있다.
- CTA와 측정 지표가 있다.
- 고객이 실제 사진·로고·사실을 제공했다.
- 생성 결과를 승인하고 실제 사용 기록을 남길 수 있다.

이 조건 없이 이미지를 생성하면 NEXORA는 일반 AI 도구와 차이가 없어지고, 생성 원가와 고객 지원 부담만 커진다.

---

## 4. 자체 AI를 개발한다면 어떤 형태여야 하는가

처음부터 NEXORA 전용 대형 언어모델을 학습하는 것은 추천하지 않는다. NEXORA가 개발해야 할 것은 **NEXORA Intelligence**다.

```text
범용 LLM
+ 업종별 지식 베이스
+ 고객별 Business Memory
+ Evidence Quality Engine
+ 규칙 기반 Decision Engine
+ 모델 평가 시스템
+ 결과 데이터
```

### 4.1 Business Context Graph

사업자·상품·고객·목표·채널·비용·운영 제약·승인 문구·실행·결과·다음 가설을 서로 연결한다.

### 4.2 Evidence Quality Engine

모든 입력을 같은 사실로 취급하지 않는다.

- `verified`: 자료로 확인
- `reported`: 고객 직접 입력
- `estimated`: 추정
- `hypothesis`: 가설
- `missing`: 없음
- `conflicting`: 충돌

### 4.3 Decision Engine

AI가 바로 콘텐츠를 만들기 전에 다음을 확인한다.

```text
상품/서비스 있음
+ 고객 있음
+ 목표 있음
+ 채널 있음
+ 기본 offer 정보 있음
= 생성 허용
```

조건이 부족하면 콘텐츠 대신 질문과 데이터 수집 행동을 제공한다.

### 4.4 Model Router

모든 작업에 비싼 모델을 쓰지 않는다.

- 저비용 모델: 분류·정리·누락 탐지
- 고성능 모델: 복합 진단·가설 비교
- 별도 모델: 문구 안전성·사실성 검사
- 외부 이미지·영상 provider: 승인된 brief에 따른 결과물 생성

이 구조는 OpenAI, Google, 오픈소스 모델이 바뀌어도 NEXORA의 핵심 로직을 유지할 수 있게 한다.

---

## 5. 해결책: 제품 전략을 어떻게 바꿀 것인가

### 5.1 포지셔닝 수정

위험한 표현:

> NEXORA creates AI images and videos for your business.

권장 표현:

> NEXORA helps small businesses decide what to promote, prepare one approved promotion, use it, and understand what happened next.

한국어:

> NEXORA는 콘텐츠를 무작정 만드는 대신, 초보 사업자가 무엇을 홍보하고 어떻게 실행하며 결과를 어떻게 판단할지 돕습니다.

### 5.2 제품 우선순위

**1순위: Decision Engine**

- 업종별 metric ontology
- 사실·가설·추정·누락 분리
- confidence 표시
- 원인 후보와 추가 질문
- 광고 제작이 필요한지 여부 판단

**2순위: Business Memory**

- 사업·offer·고객·채널·비용 저장
- 승인된 표현과 금지 표현 저장
- 과거 결과 연결
- 고객이 같은 설명을 반복하지 않도록 개선

**3순위: Promotion Brief**

- 한 offer
- 한 목표
- 한 고객
- 한 채널
- 한 CTA
- 한 measurement metric
- 광고비 책임 주체

**4순위: 콘텐츠 생성**

이미지·영상은 Promotion Brief가 승인된 뒤에 생성한다.

**5순위: Connector**

자동 게시보다 먼저 결과의 정의·기간·출처·광고비를 표준화한다.

---

## 6. 현실적인 자체 AI 개발 로드맵

### Phase 1 · 0~3개월: 지식과 판단 구조

- Evidence status 도입
- 업종별 metric ontology 정리
- 사실·가설·추정·누락 저장
- AI 판단 근거 저장
- 추천 confidence 추가
- 고객이 AI 판단을 수정하는 흐름 추가
- 콘텐츠 생성 허용 조건 구현
- 고객별 Business Memory의 첫 버전 구축

### Phase 2 · 3~6개월: 평가와 데이터 자산

- 고객별 과거 결과 retrieval
- promotion 결과와 다음 추천 연결
- 데이터 익명화 파이프라인
- 전문가 검토 평가 세트 구축
- 모델별 품질·비용·실패율 비교
- PostgreSQL·object storage·worker 구조 검토

### Phase 3 · 6~12개월: 일부 자체 모델화

- 업종 분류 모델
- 누락 데이터 분류 모델
- 위험 신호 탐지 모델
- promotion 추천 모델
- 콘텐츠 사실성·정책 검토 모델
- 작은 오픈소스 모델 파인튜닝

### Phase 4 · 12개월 이후: 선택적 자체 추론

- 충분한 익명 데이터가 있을 때 자체 진단 모델 검토
- 외부 LLM과 자체 모델의 품질 비교
- 비용·지연·개인정보 요구가 명확한 작업부터 자체화
- 대형 범용 모델 학습은 별도 투자 판단으로 분리

---

## 7. 출시에 반영해야 할 변경사항

현재 정식 출시 전에 반드시 다음을 반영해야 한다.

### 고객 커뮤니케이션

- “자체 AI 모델”이라는 표현 금지
- “AI가 사업을 정확히 진단한다”는 표현 완화
- 고객이 입력한 자료에 기반한 보조 판단임을 표시
- 시장 평균·경쟁사·광고 성과를 자동으로 안다고 표현하지 않음
- 이미지·영상이 현재 완전한 production delivery인지 구분
- NEXORA가 광고비를 부담하지 않는다는 안내 유지
- 성과 보장 문구 금지

### 제품 기능

- 모든 진단 결과에 판단 근거 표시
- 판단 신뢰도 표시
- 데이터가 없을 때 “판단 불가” 표시
- 가설과 사실의 시각적 구분
- 다음 질문을 선택한 이유 표시
- recommendation을 실행했는지와 결과를 연결
- AI 콘텐츠 생성 전 promotion brief 확인
- 생성 결과에 provider와 모델 정보를 내부적으로 기록

### 데이터·인프라

- 영구 DB와 백업·복원 자동화
- production과 test 데이터 분리
- OpenAI 또는 다른 provider 장애 시 graceful failure
- 이미지·영상 생성 작업의 큐·재시도·취소·만료 처리
- 고객 파일의 접근 제어와 삭제 정책
- provider 데이터 사용 조건 검토
- 실제 운영 서버와 Preview 환경 분리

### 출시 검증

- 5~10명의 실제 고객으로 controlled beta
- 고객이 “콘텐츠 생성”이 아니라 “다음 행동 결정”에 비용을 지불하는지 확인
- 진단 결과의 사실성·유용성·실행률 측정
- 생성 콘텐츠 사용률 측정
- 고객의 주간 재방문·재기록 측정
- 실제 결과 기록이 다음 추천에 도움이 되는지 검증
- 최소 1개월의 사용 후 유료 전환 의사 확인

---

## 8. Go / No-Go 판단

### 현재 상태

**Go:** 무료 First Check, 계정, 프로필, Evidence, Assessment, 주간 행동, 승인·기록 흐름의 제한적 베타 테스트  
**No-Go:** 자체 AI라고 홍보, 완전 자동 사업 진단이라고 홍보, 검증되지 않은 영상 납품 판매, 광고 성과 보장, 무료 provider에 상업 운영을 전부 의존

### 정식 유료 출시의 최소 조건

1. NEXORA Intelligence의 범위를 고객에게 명확히 설명한다.
2. 진단 결과에 근거·누락·신뢰도를 표시한다.
3. 한 업종 또는 한 고객군에서 실제 사용 결과를 확보한다.
4. 실제 이미지·영상 납품이 가능한 경우에만 판매한다.
5. 그렇지 않으면 이미지·영상은 준비 중이거나 고객 자산 기반 디자인으로 제한한다.
6. DB 백업·복원과 provider 장애 대응을 검증한다.
7. 법률·개인정보·판매자·세금·약관을 전문가와 확정한다.
8. 고객이 단순 콘텐츠보다 의사결정과 실행 연결에 돈을 지불하는지 검증한다.

---

## 9. NEXORA에 가장 적합한 provider 선택

한 회사만 선택해야 한다면 NEXORA의 장기 주력 플랫폼은 **Google Cloud Vertex AI·Gemini 생태계**가 가장 적합하다. 이유는 사업 진단용 텍스트, JSON Schema 구조화 출력, 이미지 이해·생성, 영상 이해·생성, 기업용 IAM·로그·데이터 운영을 하나의 생태계 안에서 연결할 수 있기 때문이다. Gemini는 구조화 출력이 데이터 추출, 분류, agentic workflow에 적합하다고 공식 문서에 명시한다. [6]

다만 이는 무료 Gemini API 키를 고객 데이터에 사용하는 의미가 아니다. 운영 환경에서는 Google Cloud 프로젝트와 Vertex AI의 유료·기업용 설정, 권한 관리, 데이터 처리 조건을 확정해야 한다. Gemini API의 영상 모델은 버전별 수명과 중단 정책이 있으므로, 2026년 10월 종료된 Veo 3.1 Preview처럼 모델 ID를 제품에 영구적으로 하드코딩하지 않고 adapter와 model catalog로 관리해야 한다. [7]

Anthropic은 사업 상태 해석과 structured decision output의 benchmark provider로 적합하다. Claude API는 JSON Schema 출력과 strict tool use를 지원하고, 조직 조건에 따라 Zero Data Retention을 신청할 수 있다. 다만 이미지·영상 제작까지 한 회사에서 묶는 주력 생태계로는 부족하므로 보조 모델로 두는 편이 합리적이다. [8] [9]

OpenAI는 현재 코드와 가장 가까운 호환 경로다. Responses API와 structured output, 이미지 입력·생성 확장이 가능하므로 초기 마이그레이션과 품질 비교에 유용하다. 하지만 NEXORA의 영상까지 포함한 단일 provider 전략에는 약점이 있다. [10]

영상은 Runway 같은 전문 provider를 별도 adapter로 두는 것이 좋다. Runway Dev는 모델별 초당 credit 과금과 여러 영상 모델을 제공하지만, NEXORA의 사업 판단 AI가 아니라 결과물 생성 계층으로 사용하는 것이 맞다. [11]

권장 운영 구조는 다음과 같다.

```text
주력: Google Cloud Vertex AI / Gemini
benchmark·fallback: Anthropic 또는 OpenAI
전문 영상: Runway 등 별도 video provider
NEXORA 고유 계층: Decision Engine, Business Memory, Evidence Quality, 결과 평가
```

이번 코드 업데이트에는 1단계 provider adapter가 반영되었다. `AI_PROVIDER=google` 또는 `gemini`를 선택하면 Gemini의 `generateContent`와 JSON Schema 출력을 사용하고, `AI_PROVIDER=openai` 또는 provider 미설정 상태에서는 기존 OpenAI Responses 호출을 사용한다. `AI_API_KEY`, `AI_MODEL`, `AI_BASE_URL`, `AI_TIMEOUT_MS`를 새 공통 설정으로 추가했고, `OPENAI_API_KEY`와 `OPENAI_MODEL`은 기존 배포를 위한 legacy 호환으로 남겼다. 실제 작업 기록에도 선택된 provider와 model을 저장하며, 출시 preflight와 Creative 결제 개방 조건도 선택된 provider 설정을 확인한다.

현재 구현된 Google adapter는 Gemini Developer API 키 방식이다. Vertex AI의 production workload identity, Google Cloud IAM, 프로젝트·리전 정책은 별도 운영 설정 단계에서 추가해야 한다. 따라서 이번 업데이트를 “Vertex AI 운영 연결 완료”라고 표현하지 않고, **Google 계열 provider로 교체 가능한 첫 adapter를 구현했다**고 표현하는 것이 정확하다. provider가 바뀌어도 고객의 사업 판단·증거·승인·실행·결과 데이터 구조는 바뀌지 않아야 한다.

## 10. 최종 해결책

NEXORA는 자체 AI를 개발해야 한다. 그러나 그 의미는 OpenAI를 대체할 거대한 모델을 만드는 것이 아니다.

NEXORA가 먼저 독점해야 하는 것은 다음이다.

```text
고객의 사업 상태
+ 업종별 판단 구조
+ 증거의 품질
+ promotion 의사결정
+ 승인된 표현
+ 실제 실행 기록
+ 결과와 다음 행동의 연결
```

이 자산이 쌓인 뒤에야 일부 분류·진단·평가 모델을 자체화할 수 있다. 이미지와 영상은 provider를 빌려도 되지만, 무엇을 만들지 결정하는 brief, 사실성 검토, 채널 적합성, 승인, 사용, 결과 측정은 NEXORA가 소유해야 한다.

따라서 권장되는 최종 구조는 다음과 같다.

```text
외부 AI 모델 = 생성 능력
NEXORA Intelligence = 사업 판단·검증·기억·실행·학습 구조
NEXORA 콘텐츠 기능 = 판단이 끝난 뒤 필요한 결과물 제작
```

현재 NEXORA는 이 방향으로 전환하면 충분히 차별화 가능성이 있다. 그러나 현재 구현 상태만으로는 아직 그 차별화가 완성된 것이 아니다. 다음 개발의 핵심은 이미지·영상 API를 추가하는 것이 아니라, **고객이 NEXORA의 판단을 신뢰하고 실제 행동을 바꾸는지 검증하는 것**이다.

---

## 참고 자료

[1]: https://ai.google.dev/gemini-api/docs/pricing "Google Gemini API Pricing"

[2]: https://developers.openai.com/api/docs/pricing "OpenAI API Pricing"

[3]: https://docs.dev.runwayml.com/guides/pricing/ "Runway Dev API Pricing and Costs"

[4]: https://developers.openai.com/api/docs/models "OpenAI API Models"

[5]: https://docs.dev.runwayml.com/guides/models/ "Runway Dev Models"

[6]: https://ai.google.dev/gemini-api/docs/structured-output "Gemini API Structured Outputs"

[7]: https://ai.google.dev/gemini-api/docs/veo "Gemini API Video Generation with Veo"

[8]: https://platform.claude.com/docs/en/build-with-claude/structured-outputs "Claude Structured Outputs"

[9]: https://platform.claude.com/docs/en/manage-claude/api-and-data-retention "Claude API Data Retention"

[10]: https://developers.openai.com/api/docs/guides/images-vision "OpenAI Images and Vision"

[11]: https://docs.dev.runwayml.com/guides/pricing/ "Runway Dev API Pricing and Costs"
