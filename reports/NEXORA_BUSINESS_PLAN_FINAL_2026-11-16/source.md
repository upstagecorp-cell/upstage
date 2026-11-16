# NEXORA 사업 계획서

## 출시 전 최종 통합판 · 2026년 11월 16일 기준

**제품:** NEXORA Business Growth Platform  
**대상 시장:** 미국 소규모 사업자 및 초기 성장 단계 서비스 사업자  
**기준 코드:** GitHub `upstagecorp-cell/upstage` / `main` / `cf8042d`  
**문서 목적:** 현재 구현 상태, 판매 상품, 가격, 제공 범위, 수익 구조, 출시 차단 조건과 출시 후 운영 계획을 하나의 의사결정 문서로 통합한다.

> 이 문서는 제품·운영 계획이며 법률·세무·회계 자문이 아니다. 미국 C-Corp, 한국 거주 대표자의 급여·배당·외국납부세액공제, 판매세와 SaaS 세금 분류는 실제 판매자·거주지·영업 장소를 확인한 미국·한국 전문가의 검토가 필요하다.

---

## 1. 경영진 요약

NEXORA는 단순한 AI 카피 생성기가 아니라, 소규모 사업자가 **사업 맥락을 정리하고, 이번 주 실행할 홍보 작업을 하나 선택하고, 승인한 콘텐츠를 사용한 뒤 실제 결과를 기록하는 업무 시스템**이다. 핵심 차별점은 콘텐츠 개수나 모델 이름이 아니라 다음의 연결이다.

`사업 이해 → 첫 방향 → 한 promotion → 초안 생성 → 사람의 정확한 승인 → 실제 사용 기록 → 기간·출처가 있는 결과 입력 → 다음 판단`

현재 저장소에는 다음 기반이 구현되어 있다.

- 익명 첫 체크, 계정 저장, 인증·비밀번호 복구, 사업 프로필, 증거·측정치, 평가, 주간 계획, 승인본, 사용·결과 기록, 성과 화면
- Google Gemini 또는 legacy OpenAI를 선택할 수 있는 provider adapter, 구조화 출력, 월 사용량·실패·재시도 보호
- 사진 기반 정적 이미지 구성, private asset, 승인 버전, PNG/JPG export와 이미지 워커 구조
- Stripe 구독·고객 포털·웹훅·권한 재조회·중복 처리 기반
- Core / Plus / Pro Creative 가격 카탈로그, 8초 AI motion source pack, 30~90초 finished video one-time pack의 UI·권한·결제 경로 초안
- Instagram/Meta, TikTok, YouTube, LinkedIn 성과 입력 및 connector 준비 상태 CTA
- Node.js 24 기준 타입 검사, 210개 테스트, lint, production build 통과

그러나 **정식 유료 출시 상태는 아니다.** 코드의 Creative 카탈로그와 실제 기존 텍스트 구독 계약이 아직 분리되어 있고, Creative 결제는 provider·Stripe Price·미디어 납품 검증 전까지 닫혀 있다. 실제 영상 provider, 완성 MP4 저장·전달, OAuth connector, 운영 DB 백업 복원, 판매자·세금·약관·메일·모니터링의 실환경 검증이 남아 있다. Google Gemini adapter는 코드에 반영되었지만 Vertex AI의 workload identity와 기업 운영 설정은 아직 별도 검증이 필요하다.

### 출시 판단

- **현재:** Preview / controlled beta 준비 상태
- **지금 가능한 공개:** 무료 첫 체크, 제품 설명, 계정 흐름, 제한된 내부 테스트
- **지금 열면 안 되는 것:** Creative 신규 결제, 미검증 완성 영상 판매, 자동 게시, 광고비 대행, 성과 보장
- **정식 유료 출시 조건:** P0 차단 과제를 모두 증거와 함께 통과하고, 5~10명의 초기 고객으로 제한 출시한 뒤 운영 지표를 매일 확인

### 현재 상태 한눈에 보기

| 구분 | 현재 판정 | 의미 |
|---|---|---|
| 제품 핵심 흐름 | **구현 완료 / controlled beta 가능** | First Check부터 결과 기록까지 내부·제한 테스트 가능 |
| AI provider | **1단계 adapter 구현** | `AI_PROVIDER=google` Gemini JSON adapter, `openai` legacy adapter. Vertex AI 기업 운영은 미완료 |
| Creative 가격 | **정의 완료 / 판매 보류** | Core $29, Plus $59, Pro $99 및 영상 pack 가격은 catalog에 존재 |
| Creative billing readiness | **미통과** | catalog status가 preview이고 media delivery·versioned billing이 false |
| 미디어 납품 | **미완료** | AI 이미지 provider, finished MP4 생성·저장·전달이 정식 경로로 검증되지 않음 |
| 채널 analytics | **수동 입력·CTA만 제공** | Meta, TikTok, YouTube, LinkedIn OAuth 자동 수집은 미완료 |
| 정식 출시 | **NO-GO** | 판매자·Stripe·메일·DB·백업·영상·법무 외부 검증 전에는 결제 금지 |

이 표의 판정은 “코드가 있다”와 “고객에게 돈을 받고 약속해도 된다”를 구분한다. 현재 목표는 기능을 더 많이 공개하는 것이 아니라, 약속한 서비스가 실제로 전달되고 기록되는지 증거를 확보하는 것이다.

---

## 2. 사업 정의와 포지셔닝

### 2.1 고객 문제

초기 소규모 사업자는 무엇을 홍보해야 하는지는 대략 알지만, 다음 단계에서 반복적으로 막힌다.

1. 자신의 상품·고객·목표·채널을 정리하지 못한다.
2. AI가 만든 문구가 사업 사실과 맞는지 검토하기 어렵다.
3. 콘텐츠를 만들고도 실제로 사용했는지, 어떤 기간의 결과인지 기록하지 않는다.
4. 광고 플랫폼의 조회수와 실제 사업 변화를 혼동한다.
5. 이미지·영상 도구, 광고 관리자, 문서, 스프레드시트가 분리되어 매주 다음 행동이 끊긴다.

### 2.2 해결 방식

NEXORA는 고객에게 “모든 마케팅을 자동화한다”고 약속하지 않는다. 대신 한 번에 다음 범위만 좁혀 끝낸다.

> **한 상품 또는 서비스 · 한 목표 · 한 채널 · 한 검토 가능한 promotion**

여기서 promotion은 전통적인 대규모 캠페인이 아니라, 하나의 offer를 하나의 목표와 하나의 채널에 맞춰 준비하고 측정하는 단위다.

### 2.3 한 문장 포지셔닝

> NEXORA helps small businesses turn business context into one approved promotion, a weekly action, and an honest record of what happened next.

한국어 내부 설명:

> 사업 맥락을 잃지 않고, 이번 주에 실행할 홍보 하나를 승인·사용·측정까지 연결하는 성장 작업대.

### 2.4 초기 고객(ICP)

첫 출시에서는 모든 업종을 동일하게 공략하지 않는다.

- 미국에서 이미 판매·문의·예약·방문 등 실제 활동이 있는 소규모 사업자
- 대표 또는 소규모 팀이 직접 마케팅을 실행하는 사업자
- 음식점·카페·숙박·지역 소매·이커머스·서비스·creator business 중 한 가지에 집중해 검증
- Instagram/Meta, TikTok, YouTube, LinkedIn 중 최소 한 채널을 실제로 사용하는 고객
- 콘텐츠 생성보다 “이번 주 무엇을 실행하고 결과를 어떻게 확인할지”에 비용을 지불할 고객

초기에는 대행사형 고객, 여러 사업을 동시에 관리하는 팀, 완전 자동 게시를 기대하는 고객을 주된 타깃으로 삼지 않는다.

---

## 3. 제공 서비스

### 3.1 기본 업무 플랫폼

| 영역 | 고객이 받는 가치 | 현재 상태 |
|---|---|---|
| First Check | 고민·업종·단계·첫 실행 채널을 입력하고 첫 방향을 확인 | 구현 및 테스트 완료 |
| Business Profile | offer, 고객, 시장, 목표, 채널, 톤, 통화, 시간대 정리 | 구현 |
| Assessment | 사실·가능한 원인·대안·추가 질문을 분리한 판단 화면 | 구현 |
| Weekly Plan | 추천 행동을 기한·상태·측정 지표가 있는 목표로 전환 | 구현 |
| Text Drafts | hook, ad copy, short-form script, CTA 등 실제 provider 기반 초안 | provider 운영 설정 필요 |
| Human Review | 수정본을 새 버전으로 만들고 정확한 버전을 승인 | 구현 |
| Use & Results | 실제 사용 여부, 측정 기간, 출처, 통화, 광고비와 결과 저장 | 구현 |
| Performance | 호환되는 기간·단위·통화만 비교하고 빈 값을 발명하지 않음 | 구현 |
| Account & Billing | 이메일 인증, 복구, Stripe portal, 권한·한도 확인 | 코드 구현, 실환경 검증 필요 |

### 3.2 Creative 서비스의 명확한 경계

Creative 카탈로그는 다음 세 가지를 분리한다.

1. **월 구독:** 매월 promotion·정적 이미지·짧은 영상 작업량을 제공한다.
2. **AI motion source scene:** 8초 단위의 원본 motion 장면이다. 완성 광고가 아니며, 제품 사진 등에 움직임을 추가하는 재료다.
3. **Finished long video:** 30·45·60·90초의 완성형 promotion video다. 월 구독에 포함하지 않고 일회성 구매한다.

### 3.3 제공하지 않는 서비스

다음은 출시 시 명시적으로 제공 범위에서 제외한다.

- NEXORA가 고객 대신 지불하는 광고비
- Meta, TikTok, YouTube, LinkedIn에 자동으로 게시하는 기능
- 매출·조회수·전환 성과 보장
- 주문·예약·고객지원 대행
- AI 이미지·완성 영상의 무제한 생성
- 팀 협업·복수 사업·공개 API
- 플랫폼 데이터를 자동 수집하는 완성형 analytics connector
- 사실 확인 없이 생성된 문구를 게시 가능한 것으로 간주하는 것

공개 고지 문구는 다음과 같이 유지한다.

> NEXORA does not pay your ad spend. You connect and run your own channel accounts. Performance is not guaranteed.

---

## 4. 가격과 상품 구조

모든 금액은 **USD, 세금 별도(exclusive tax)** 기준의 제안 가격이다. Stripe에서 실제 tax behavior, product tax code, 판매자 주소와 등록 의무를 확인하기 전에는 확정된 세후 가격으로 광고하지 않는다.

### 4.1 Creative 월 구독

| 플랜 | 월 가격 | 월 promotion 수 | 이미지 | 짧은 영상 | 핵심 포지션 |
|---|---:|---:|---:|---:|---|
| Core | **$29** | 1 | 8 | 2 | 한 번에 한 promotion |
| Plus | **$59** | 2 | 20 | 4 | 반복 가능한 월간 리듬 |
| Pro | **$99** | 4 | 40 | 8 | 더 넓은 월간 promotion 운영 |

운영 원칙:

- 자동 갱신은 고객이 취소할 때까지 유지한다.
- 플랜별 포함량과 사용량은 서버가 검사한다.
- 실패한 provider 작업은 고객 사용량에서 차감하지 않되, provider 원가는 별도 비용 장부에 기록한다.
- 월 사용량 이월·자동 초과 청구·무제한·연간 결제·추가 좌석은 초기 출시 범위가 아니다.
- 구독 가격 카탈로그는 `creative-v5-2026-11-15-price-aligned`이며, 현재 releaseReadiness는 false다.

### 4.2 First Promotion 진입 상품

| 상품 | 가격 | 포함 |
|---|---:|---|
| First Promotion | **$59 one-time** | promotion 1개, 이미지 8개, 짧은 영상 2개, 30일 만료 |

이 상품은 고객이 월 구독 전에 NEXORA의 핵심 작업 흐름을 경험하게 하는 진입 상품으로 사용할 수 있다. 다만 Stripe 실제 Price와 미디어 납품이 검증되기 전에는 판매를 열지 않는다.

### 4.3 AI motion source pack

| 상품 | 1회 구매 | 월 옵션 | 제공 정의 |
|---|---:|---:|---|
| One short AI scene | $5 | $5/mo | 8초 원본 장면 1개 |
| Five short AI scenes | $19 | $19/mo | 8초 원본 장면 5개 |

이 상품은 완성형 광고 영상이 아니다. 화면과 checkout에서 “source scene”이라는 표현을 유지해 고객 기대를 관리한다.

### 4.4 Finished long video one-time pack

| 길이 | Basic | Plus / audio 포함 |
|---:|---:|---:|
| 30초 | $29.99 | $39.99 |
| 45초 | $39.99 | $49.99 |
| 60초 | $49.99 | $64.99 |
| 90초 | $69.99 | $89.99 |

- 월 구독과 별도 청구
- 첫 Creative checkout에서 선택 가능
- 결제 후 Plan & billing에서 추가 구매 가능
- 30일 후 만료되는 권한 모델
- refund webhook 및 권한 회수 정책 필요
- 완성 MP4 생성·저장·전달 provider가 검증되기 전에는 판매 금지

### 4.5 레거시 텍스트 구독과의 구분

현재 `src/lib/billing/plans.ts`에는 기존 고객 계약 보호를 위해 다음 레거시 계약이 별도로 남아 있다.

| 레거시 플랜 | 월 가격 | 용도 |
|---|---:|---|
| Focus | $149 | 기존 텍스트 구독 계약 |
| Growth | $299 | 기존 텍스트 구독 계약 |

Focus/Growth를 공개 Creative 가격으로 재명명하거나 기존 구독자에게 소급해 Core/Plus/Pro 가격으로 바꾸면 안 된다. 새 Creative 판매를 열기 전에 신규 상품의 Stripe Price ID·권한·고객 공지를 별도로 확정해야 한다.

---

## 5. 고객 여정과 운영 방식

### 5.1 신규 고객 흐름

1. `/start`에서 concern, business type, stage, first channel을 선택한다.
2. 무료 첫 방향을 확인한다.
3. 계정을 만들고 명시적으로 저장한다. 저장 전 답변은 해당 탭의 session storage에만 남는다.
4. Business Profile과 Evidence를 보완한다.
5. 하나의 offer·목표·채널로 첫 promotion을 선택한다.
6. 필요하면 Creative plan 또는 일회성 pack을 선택한다.
7. AI 초안을 생성한다.
8. 고객이 문구·이미지 방향·영상 스크립트를 직접 수정한다.
9. 정확한 버전을 승인한다.
10. 다운로드와 실제 사용은 분리 기록한다.
11. 고객이 기간·출처·통화·광고비와 실제 결과를 입력한다.
12. 다음 주 행동과 재평가로 연결한다.

### 5.2 채널 연결

초기에는 “연동 완료”를 가장하지 않는다.

- Instagram/Meta: connector 준비 상태 + 수동 입력 CTA
- TikTok: connector 준비 상태 + 수동 입력 CTA
- YouTube: connector 준비 상태 + 수동 입력 CTA
- LinkedIn: connector 준비 상태 + 수동 입력 CTA

실제 OAuth/API connector를 활성화하려면 각 provider의 앱 승인, client ID/secret, redirect URI, scopes, 토큰 보관, rate limit, 개인정보 처리, revoke 흐름을 별도로 검증해야 한다. 그 전까지 고객은 실제 사용·기간·결과·광고비를 직접 입력한다.

### 5.3 고객 지원 원칙

초기 5~10명은 자동화보다 수동 관찰을 우선한다.

- 계정·Stripe customer·권한을 먼저 대조한다.
- 비밀번호·secret을 이메일로 받지 않는다.
- 생성 실패와 사용량 차감을 분리한다.
- 다운로드를 게시·매출로 기록하지 않는다.
- 환불, 해지, provider 실패, 잘못된 문구를 각각 다른 원인으로 기록한다.

---

## 6. 현재 구현 상태

### 6.1 구현 완료 또는 검증된 영역

- Next.js 16.4.6, React 19, TypeScript, Node.js 24 기반
- 주요 public pages: home, product, solutions, resources, pricing, start, diagnosis, workspace, goals, metrics, login, register, privacy, terms
- 인증·세션·계정 복구·owner-scoped data access
- SQLite WAL 기반 durable server-only storage 구조
- Business Profile, Assessment, Evidence, Goals, Results, Metrics
- 실제 AI text generation route 구조와 structured output 검증
- 승인 버전, download/use/result 분리
- Stripe checkout, portal, webhook, payment status 재조회 구조
- 이미지 업로드·저장·승인·다운로드·PNG/JPG composition export 및 worker 구조
- Creative checkout 및 long-video top-up route의 코드 구조
- `AI_PROVIDER` 기반 Google Gemini / legacy OpenAI provider adapter, provider·model 사용 기록, provider-aware preflight
- 채널별 성과 입력 CTA
- CI Node.js 24 업데이트 및 미사용 변수 정리

### 6.2 코드에는 있으나 실환경에서 아직 검증되지 않은 영역

- 실제 Stripe seller account, live/test Price ID와 product tax code
- Creative Core/Plus/Pro 및 First Promotion의 실제 Stripe entitlement
- 30/45/60/90초 영상의 실제 provider 생성·실패·재시도·납품
- finished MP4의 object storage, download, retention, deletion
- 실제 Resend 발신 도메인·SPF/DKIM·메일 수신
- 선택한 Google Gemini 또는 legacy OpenAI model, budget, rate limit, content policy와 품질 검토
- 운영 SQLite persistent volume, WAL-safe backup, clean restore
- monitoring, alerting, provider-cost ledger, webhook failure alert
- iPhone Safari, keyboard, screen reader, slow network의 최종 acceptance

### 6.3 아직 제공하지 않는 영역

- AI-generated image provider 기반 이미지 생성
- 완성형 영상 자동 생성 및 전달
- 자동 광고 집행·게시
- 완성된 OAuth analytics connector와 자동 수집
- 매출·성과 보장

---

## 7. 수익 모델과 단위경제

### 7.1 수익원

1. Core/Plus/Pro 월 구독
2. First Promotion one-time entry offer
3. AI motion source pack
4. finished long-video pack
5. 향후 connector·팀·복수 사업은 초기 출시 이후 별도 검증

### 7.2 보수적 원가 원칙

현재 영상 provider 원가가 확정되지 않았으므로 고객 수나 대표 개인 수령액을 보장하는 재무 예측을 하지 않는다. 가격을 열기 전에 다음을 실제 계정에서 기록해야 한다.

- provider별 성공·실패·재시도당 원가
- 이미지·영상 저장·전송 비용
- Stripe 결제·Billing·Tax 수수료
- 이메일·호스팅·모니터링·백업 비용
- 고객 1명당 지원 시간과 환불 비용
- 월별 churn, activation, first approved asset, next-week reuse

### 7.3 출시 전 마진 가드레일

아래는 가격에서 허용되는 **모든 변동원가의 상한**을 정하기 위한 내부 기준이지, 실제 provider 비용을 대체하는 수치가 아니다.

| 플랜 | 가격 | 70% gross margin을 위한 변동원가 상한 | 60% gross margin 상한 |
|---|---:|---:|---:|
| Core | $29 | $8.70 | $11.60 |
| Plus | $59 | $17.70 | $23.60 |
| Pro | $99 | $29.70 | $39.60 |

일회성 상품은 초기 목표를 **최소 65% gross margin**으로 두고, 결제 수수료·provider·저장·지원 변동비를 실제로 측정한다.

| 상품 | 가격 | 35% 원가 상한 |
|---|---:|---:|
| 30초 Basic | $29.99 | $10.50 |
| 30초 Plus/audio | $39.99 | $14.00 |
| 60초 Basic | $49.99 | $17.50 |
| 60초 Plus/audio | $64.99 | $22.75 |
| 90초 Basic | $69.99 | $24.50 |
| 90초 Plus/audio | $89.99 | $31.50 |

실제 원가가 상한을 넘으면 provider 교체, 영상 길이·재시도 정책 조정, 가격 조정 중 하나를 선택한다. 품질을 낮춘 채 가격만 유지하지 않는다.

### 7.4 사업 목표를 다루는 방법

연매출·대표 월 수령액 목표는 고객이 실제로 지불하고 유지한다는 증거가 생긴 후 역산한다. 다음 수치를 먼저 확보한다.

- 유료 전환율: first check → account save → first purchase
- activation: 첫 승인본까지 도달한 비율
- value realization: 실제 사용 기록까지 도달한 비율
- week-2 reuse와 month-2 renewal
- gross margin per plan
- support minutes per customer
- refund 및 payment failure rate

이 지표가 없을 때 “낮은 churn”, “성과 보장”, “몇 명이면 목표 매출 달성”을 외부에 주장하지 않는다.

---

## 8. 정식 출시까지 남은 과제

### P0 — 결제·법적 판매·데이터를 열기 전 반드시 완료

| 과제 | 완료 증거 | 담당 |
|---|---|---|
| 법인·판매자 확정 | 실제 seller name, address, bank, support email | 대표 + 세무/법무 |
| 세무·판매세 검토 | C-Corp, 실제 운영국, SaaS taxability, Stripe Tax registration 판단 | 전문가 |
| 약관·개인정보 확정 | seller, address, support, subprocessors, retention, deletion, refund | 대표 + 법무 |
| Stripe 제품·가격 생성 | Core/Plus/Pro, First Promotion, motion, video Price ID와 catalog 일치 | 운영자 |
| Stripe 결제 검증 | 성공·실패·3DS·중복·renewal·cancel·refund·webhook 재전송 | 운영자 |
| Creative 권한 검증 | 무료 계정 차단, paid entitlement, period, quantity, expiry, refund 회수 | 개발 + 운영 |
| 영상 provider 검증 | 실제 30/45/60/90초 output, retry, failure, policy, audio, storage | 개발 + 운영 |
| MP4 납품 검증 | 생성 후 저장·다운로드·보존·삭제·권한 차단 | 개발 |
| 메일 발신 검증 | Resend domain, SPF/DKIM, verify/reset delivery, expiry, replay failure | 운영자 |
| 영구 DB 운영 | persistent volume, WAL-safe backup, clean restore, access control | 운영자 |
| secrets 보안 | production secrets only, no repo/log/screenshot leakage, rotation owner | 운영자 |
| paid launch switch | preflight pass 후에만 `NEXORA_PAID_LAUNCH_ENABLED=true` | 운영자 |

### P1 — 첫 5~10명 유료 베타 전에 완료

- 실제 텍스트 생성 20개 샘플 검토: 사업 사실, 고객, 채널, 주장, 톤, 금지 표현
- 30초·60초·90초 영상 최소 1개씩 end-to-end 검수
- iPhone Safari 및 Android Chrome에서 가입→결제→승인→다운로드→해지 테스트
- 키보드·screen reader·reduced motion·모바일 네트워크 점검
- webhook failure, email failure, generation failure, restore failure 알림 설정
- 고객 지원 escalation, 환불, provider 장애, 잘못된 생성에 대한 runbook 리허설
- 채널 connector는 준비 상태로만 노출하고, 미완성 자동화를 판매 문구에서 제거
- 가격·세금·갱신·광고비 별도·성과 비보장 문구를 checkout 직전 재확인

### P2 — 초기 운영 후 우선순위

- 실제 OAuth connector를 provider별로 하나씩 검증
- channel analytics import와 수동 입력의 데이터 정의 통일
- 고객별 onboarding checklist와 self-serve help
- churn survey, cohort dashboard, activation funnel
- plan change, pause, annual billing은 고객 요구와 원가 확인 후 추가
- 팀·복수 사업·agency workspace는 별도 가격 실험 후 개발
- AI 이미지 provider와 고급 영상 provider는 품질·원가·권리 검증 후 추가

---

## 9. 출시 단계와 운영 게이트

### 단계 0 — Internal Preview

조건: P0 중 법인·결제·provider를 제외한 코드·문서·UI 검증 완료.  
목적: 설명 명확성, 제품 흐름, 오류 화면, 반응형, 데이터 경계를 확인.  
판매: 금지.

### 단계 1 — Controlled Paid Beta

조건: P0 전부 통과, 실제 test/live 최소 결제·취소·환불 1회 증거, 영상 납품 통과.  
규모: 5~10명.  
운영: 고객별 수동 관찰, 매일 원가·지원·실패·승인·사용 확인.  
중단: 결제 권한 오류, 데이터 분리 실패, MP4 누락, 비밀값 노출, 반복 provider 실패.

### 단계 2 — Public Paid Launch

조건: beta 고객의 첫 승인·실제 사용·다음 주 재사용을 확인하고, 지원 시간이 계획을 넘지 않으며, 2개 이상의 가격·영상 길이에서 마진 가드레일을 통과.  
운영: 신규 고객 공개, 자동 광고 집행은 여전히 제공하지 않음.  
공개 주장: 관찰된 사실만 사용하고 고객 수·성과·ROI를 임의로 장식하지 않음.

### 단계 3 — Scale Decision

조건: 최소 한 월별 cohort의 renewal, refund, provider cost, support cost를 확보.  
결정: 가격 유지, 가격·원가 재설계, 특정 업종 집중, 또는 Creative 판매 일시 중단.

---

## 10. 핵심 운영 지표

### 퍼널

1. 방문 → First Check 시작
2. First Check 완료 → 계정 저장
3. 저장 → 첫 promotion 준비
4. 준비 → 첫 결제
5. 결제 → 첫 승인본
6. 승인 → 실제 사용 기록
7. 사용 → 다음 주 재사용
8. 구독 → 다음 달 갱신

### 품질·원가

- 생성 성공률과 p95 latency
- provider retry rate와 실패 원가
- 고객 1명당 support minutes
- plan별 gross margin
- 영상 pack별 평균 처리 시간·저장량·다운로드 성공률
- refund·chargeback·payment failure
- webhook 지연·실패·재전송

### 정직성 지표

- 다운로드를 실제 게시로 잘못 기록한 비율: 0 목표
- source scene을 finished video로 오해한 support ticket
- 광고비를 NEXORA가 부담한다고 이해한 고객 비율: 0 목표
- 보장 성과로 오인하는 문구·상담 발생 건수
- 기간·통화·출처가 없는 결과 기록 비율

---

## 11. 주요 리스크와 대응

| 리스크 | 영향 | 대응 |
|---|---|---|
| Creative 카탈로그와 실제 Stripe 계약 불일치 | 잘못된 권한·환불 분쟁 | 단일 catalog 검증, staging Price ID, live switch 전 preflight |
| 영상 provider 원가·실패율 미확정 | 가격 적자 | provider 실측 전 판매 금지, retry budget, margin gate |
| SQLite를 여러 인스턴스에 배포 | 데이터 손상·분리 | 단일 인스턴스 + persistent volume 또는 DB 아키텍처 재설계 |
| 미국 법인만으로 세금 문제 해결된다고 오해 | 신고·벌금·현금 부족 | 미국·한국 전문가 검토, 급여·배당·판매세 분리 |
| 자동 게시/성과 보장 오해 | 신뢰·법적 위험 | 명시적 disclosure, manual report, no guarantee |
| AI가 잘못된 사업 사실 생성 | 고객 손실 | structured output, human approval, source/context 분리 |
| 고객 기대가 영상 품질보다 높음 | 환불·이탈 | source scene vs finished video 구분, sample output, revision scope |
| provider 장애와 고객 사용량 혼동 | 공정성 문제 | 실패 차감 제외, provider cost ledger 분리 |
| 실제 고객 데이터·백업 노출 | 중대한 보안 사고 | secret 분리, 최소 권한, WAL-safe backup, restore drill |

---

## 12. 최종 Go / No-Go 기준

### GO

다음 10개가 모두 “통과”일 때만 Creative 유료 출시를 승인한다.

1. 실제 판매자·은행·지원 이메일 확정
2. 약관·개인정보·환불 정책 최종 승인
3. Stripe Price ID·Tax·Portal·Webhook 실환경 검증
4. Core/Plus/Pro entitlement와 legacy Focus/Growth 분리 검증
5. 영상 30/60/90초 생성·저장·다운로드·만료 검증
6. provider 원가가 plan별 margin guardrail 내에 있음
7. 인증·복구·결제·해지·환불·데이터 분리 검증
8. 백업과 clean restore 성공
9. 실제 모바일·접근성·지원 runbook 검증
10. 5~10명 controlled beta에서 첫 승인과 실제 사용 기록 확보

### NO-GO

다음 중 하나라도 있으면 무료 Preview 또는 내부 테스트만 유지한다.

- 가격 화면은 열려 있으나 Stripe Price가 없음
- 성공 URL만으로 권한이 생길 가능성이 있음
- 영상 구매 후 MP4를 안정적으로 전달하지 못함
- provider credential·원가·정책이 확정되지 않음
- 판매자·세금·환불·개인정보 문서가 초안 상태
- 데이터 백업·복원을 실제로 시험하지 않음
- NEXORA가 광고비를 낸다고 오해할 문구가 남아 있음
- 성과 보장 또는 허구 고객 실적을 공개함

---

## 13. 실행 결론

NEXORA의 현재 강점은 이미 구현된 업무 연결성이다. 단순히 “AI로 콘텐츠를 만든다”가 아니라 사업 맥락, 승인, 실제 사용, 결과 입력을 보존한다. 이는 장기적으로 가격을 콘텐츠 생성량만으로 비교당하지 않게 하는 기반이다.

반대로 현재 가장 큰 위험은 기능 부족보다 **판매 약속과 실제 납품·청구·운영 증거의 불일치**다. 따라서 다음 순서는 기능을 더 추가하는 것이 아니라 아래와 같다.

1. 기존 레거시 텍스트 계약과 새 Creative 상품을 완전히 분리한다.
2. 실제 Stripe 상품·세금·판매자 문서를 확정한다.
3. 영상 provider 한 가지를 선택해 원가·품질·납품을 끝까지 검증한다.
4. 5~10명의 고객에게 한 promotion을 실제로 끝내게 한다.
5. 승인→사용→다음 주 재사용과 원가를 확인한다.
6. 증거가 쌓인 상품만 공개적으로 확장한다.

**최종 결론:** 현재 NEXORA는 제품 구조와 핵심 업무 흐름을 갖춘 **controlled beta 직전의 구현 상태**다. 정식 출시는 가능성이 있지만, Core/Plus/Pro 가격을 공개하고 결제를 받는 시점은 P0 외부 검증과 실제 미디어 납품이 끝난 이후여야 한다. 현재 가장 합리적인 전략은 “작게 유료 검증하고, 실제 원가·사용·재방문 증거로 확장하는 것”이다.

---

## 부록 A. 기준 파일

- `src/lib/marketing/creative-plans.json` — Creative 카탈로그
- `src/lib/marketing/creative-plans.ts` — 가격·권한 파싱
- `src/lib/billing/plans.ts` — 레거시 Focus/Growth 계약
- `src/lib/server/creative-billing.ts` — Creative billing server logic
- `src/lib/server/billing.ts` — 기존 billing logic
- `src/app/api/billing/creative/video-top-up/route.ts` — 영상 pack 추가 구매 route
- `LONG_VIDEO_AND_CHANNELS_IMPLEMENTATION.md` — 장편 영상·채널 CTA 구현 문서
- `reviews/2026-11-10/launch/OPERATIONS_RUNBOOK.md` — 운영 검증 절차
- 현재 저장소의 remaining task list — 현재 남은 코드·외부 검증 항목

## 부록 B. 검증 기록

2026년 11월 16일 GitHub 반영본 기준:

- TypeScript typecheck: 통과
- Vitest: 21개 파일 / 210개 테스트 통과
- ESLint: 통과
- Next.js production build: 통과
- `git diff --check`: 통과
- GitHub commit: `cf8042ddf153f618020336baa03325f8cccf8824`
- GitHub Actions: 해당 commit에서 실행 중인 상태를 확인했으며, 최종 CI 성공은 별도 확인 필요

검증은 외부 Stripe live 결제, 실제 이메일 도착, 실제 영상 provider, 실제 광고 게시, 법인·세무 신고 완료를 의미하지 않는다.
