# NEXORA 기술 구현 감사 메모

기준: 2026-11-12 현재 작업 트리. 원본 코드·문서 읽기만 수행했으며 운영 DB·비밀 환경 변수·실제 고객 데이터는 열지 않았다. 테스트는 루트 에이전트의 실행 결과를 별도로 사용한다. route.ts 38개, page.tsx 25개를 모두 대조했다. API/화면 전체 목록은 동봉 api_content.py의 4쪽 부록에 반영했다.

## 1. 제품 방향과 고객이 직접 얻는 산출물

NEXORA는 사업 맥락과 측정 근거를 보존하고, 조사 질문→우선 행동→주간 계획→검토·승인된 산출물→실제 사용→새 측정→재진단을 연결한다. 직접 산출물은 첫 조사 방향, 버전 있는 사업 프로필과 진단, 기한/상태/평가 지표 있는 주간 과제, 마케팅 텍스트 초안·승인본, 사진 기반 정적 광고 이미지, 실행·측정 이력이다. 시간 절감·매출/전환 개선·ROAS는 현재 코드의 산출물이 아니고 실제 고객 연구로 입증해야 할 결과다.

업종은 general, restaurant, cafe, accommodation, retail, ecommerce, services, creator의 8가지 분기다. planning/launching/operating/growing/not_sure 단계가 질문 해석을 바꾼다. 업종별 성공 확률·평균 성과를 전제하지 않는다. 사용자가 입력한 사업 설명과 수동 측정은 검증된 외부 데이터로 바뀌지 않는다.

근거: README.md; src/lib/business/types.ts; src/lib/business/industry.ts; src/lib/business/assessment.ts; src/lib/marketing/catalog.ts.

## 2. 실제 계층과 저장 구조

Next.js App Router + React 19, TypeScript, Tailwind CSS, Framer Motion, lucide, Recharts, Zustand를 사용한다. package.json 버전 범위는 Next ^16.4.6, React 19.2.4, sharp 0.35.5, Stripe ^23.1.0이다. Node >=24.14.0은 node:sqlite 사용 때문에 요구된다. 설치 실버전은 루트 검증에 따른다.

프론트는 src/components/check, marketing, workspace로 나뉜다. WorkspaceApp은 여러 내부 섹션을 통합하며 /goals와 /metrics도 이 공통 앱을 다른 초기 섹션으로 연다. /dashboard, /onboarding, /diagnosis, /diagnosis/result, /action, /history 6개는 기존 주소를 공통 workspace로 redirect한다. 페이지 수를 독립 기능 수로 설명하면 부정확하다.

src/lib/business는 유효성 검사·평가 규칙·업종 질문·생성 프롬프트·계획·성과 규칙을 맡고, src/lib/server는 소유권/트랜잭션/연동/파일/결제를 맡는다. Next route는 얇은 요청 처리 계층이다. 모든 38 route는 nodejs 런타임을 명시한다.

SQLite 기본 위치는 .data/nexora.sqlite, NEXORA_DB_PATH로 변경 가능하다. foreign_keys, WAL, busy_timeout=5000을 켜고 BEGIN IMMEDIATE로 쓰기 트랜잭션을 관리한다. 기본 테이블: schema_migrations, users, sessions, records, generation_keys, rate_limits, billing_customers, billing_events, account_tokens. records는 owner_id/kind/id 복합키와 JSON payload를 사용한다. media_jobs와 media_worker_state는 이미지 모듈에서 추가 생성하고 migration version 3을 기록한다. 여러 프로세스/서버가 다른 로컬 DB를 쓰는 배포 구조는 지원 전제가 아니다. DB와 private files는 같은 영구 운영 수명으로 보관해야 한다.

주요 records kind: profile/profile_version, evidence, assessment, job, asset, execution, result, usage, weekly_plan, legacy, first_check, billing, email_verified, billing_lock, image_project, image_allowance, media_file 및 creative 결제 명령·추가권. owner_id는 모든 핵심 조회/변경에서 바인딩한다.

creative의 구체적 레코드 종류는 creative_billing_command, creative_schedule, creative_topup, creative_refund다. 설치 lock 실버전은 루트 확인에 따라 Vitest5.1.0, TypeScript5.9.3, ESLint9.39.4, Tailwind4.2.4다. package.json의 ^ 범위와 실설치 버전을 혼합하지 않는다.

근거: package.json; next.config.ts; src/lib/server/database.ts; image-studio.ts; src/components/workspace/WorkspaceApp.tsx; src/app/**/page.tsx.

## 3. 첫 체크부터 측정까지

/start 가입 전 흐름은 고민·업종·단계·선택 측정의 첫 방향을 브라우저에서 계산하며 해당 탭 sessionStorage에 재개 정보를 저장한다. 계정 생성만으로 답변을 전송하지 않는다. /api/first-check POST는 로그인, confirmed:true, expectedVersion 검증 뒤 프로필/근거/진단을 한 트랜잭션으로 저장한다. 같은 체크 ID와 같은 내용은 중복 저장하지 않으며, 다른 내용 재사용과 다른 탭 프로필 충돌은 409로 거부한다.

프로필 수정은 현재 레코드를 바꾸면서 별도 profile_version을 보존한다. 진단은 profileSnapshot과 evidenceIds, facts/opportunities/possibleCauses/alternativeExplanations/missingInformation, recommendedActions 및 이전 진단 ID를 보존한다. 평가 자체는 외부 AI 요청이 없는 규칙 기반 함수다. 기록 비용이 매출보다 크면 광고 문구보다 비용·공헌이익 확인을 앞세우고, 관측 없는 구간은 unknown으로 둔다. 없는 수치를 0으로 채우거나 종합 건강점수를 만들지 않는다.

주간 계획은 진단과 권고 행동 ID, 정확한 자산 버전 링크, weekStart/dueDate/timeZone, planned/in_progress/completed/cancelled 상태를 저장한다. 완료는 실제 자산 사용이나 매출 기록을 만들지 않는다. 사업 행동은 관련 진단 이후, 자산 사용은 정확한 버전 승인 이후 시각만 기록한다. 사용 날짜는 미래를 허용하지 않는다.

결과는 실행 ID·측정·기간·수동 출처·통화·광고비·가격 변경 메모를 저장하고 새 evidence로 연결한다. 결과 기간은 실행보다 앞서 끝날 수 없고 사업 시간대의 미래 측정은 거부한다. 과거 진단 스냅샷은 바꾸지 않는다.

performance.ts는 통화·단위·기간 길이를 구분하고 같은 지표/기간/통화 중복은 최신 관측을 사용하면서 경고한다. 전환율은 기간이 맞는 purchases/visitors와 양의 분모 및 purchases<=visitors일 때만 계산한다. 그래프 연결은 비중첩 관측과 사용자의 비교 가능성 확인을 요구한다. 인과나 업종 우열을 입증하지 않는다.

근거: src/lib/first-check-session.ts; src/lib/server/first-check.ts; operations.ts; plans.ts; src/lib/business/assessment.ts; performance.ts; planning.ts; src/components/workspace/PerformancePanel.tsx.

## 4. 텍스트 AI 생성·버전 승인

마케팅 추천 행동과 저장된 사업/고객/판매 채널이 있어야 생성한다. /api/generate는 인증 후 유효 유료 권리와 한도, 같은 계정의 running job, idempotencyKey와 payload SHA-256을 검사한다. 같은 키/다른 설정은 409, 같은 키/성공은 기존 결과 반환, 같은 키/실패는 새 요청을 명시적으로 시작하도록 안내한다. 텍스트 생성은 hooks, ad_copy, short_script, cta다.

실제 외부 경로는 https://api.openai.com/v1/responses, store:false, 서버 전용 OPENAI_API_KEY/OPENAI_MODEL이다. 도구나 URL fetch를 공급자에 제공하지 않는다. 기본 timeout 60초(설정 5~120초), 기본 max_output_tokens 6000(1000~16000), 외부 응답 최대 1MiB다. 공급자 자동 재시도는 0회다. 완료 상태·refusal·JSON 구조·요청 자산 개수·영어 등 검증 뒤 모든 자산을 트랜잭션으로 저장한다. 토큰을 모르면 null/estimated:true를 기록한다.

한 생성 패키지의 자산은 linkedProblem/target/keyMessage/channel/expectedAction/measurementMetric/claimsToVerify와 버전을 보존한다. 사용자가 선택하면 같은 사업의 승인 문구 최대 3개를 스타일 참조로 포함한다. 이는 모델 재학습/고객 성과 학습이 아니다. 참조는 신뢰하지 않는 입력이며 현재 상품 사실이 우선한다.

수정은 새 미승인 버전이다. 텍스트 승인은 현재 버전 일치 검사를 하고 승인된 지정 버전만 TXT 다운로드한다. 다운로드는 사용/게재/성과로 기록되지 않는다. 오래 running 상태의 10분 초과 작업은 failed/JOB_INTERRUPTED로 정리하며 자동 유료 재시도하지 않는다.

한도는 기본 계정 시간당10회(설정1~1000), 기간 내 시도 횟수 패키지한도의3배, 전체 UTC 일일500개(설정1~10000) 안전 차단이다. 실패 작업은 정상 패키지 소비에서 제외하지만 시도 횟수 안전 제한에는 포함한다.

근거: src/lib/server/provider.ts; operations.ts; database.ts; billing.ts; src/lib/business/generation.ts; validation.ts; approved-wording.ts.

## 5. 청구·권리: 기존 텍스트와 새 creative

중요 확인: creative 구독도 텍스트 생성 권리가 실제 코드에 연결되어 있다. billingSummary는 active+paid이고 현재 시각이 유효 결제 기간에 있을 때만 유료로 판단한다. creative가 있으면 Focus는 캠페인4개=텍스트4패키지, Growth는8패키지, 패키지당 최대12자산이다. 기존 text 계약이면 PAID_PLANS의 Focus $149/16패키지·6자산, Growth $299/48패키지·12자산을 사용한다. 같은 plan ID 이름을 쓰지만 가격·권리·카탈로그는 별개다. 새 creative 카탈로그를 미리 본다고 기존 텍스트 권리가 생기지 않으며 기존 계약을 재가격하지 않는다.

새 카탈로그 creative-v3-2026-11-12: First campaign $19 once(캠페인1/이미지4/영상2/30일), Focus$79(4/40/12), Growth$149(8/80/24), motion 8초1개$15 또는5개$59. 기본 motionSeconds=0. 모든 가격은 USD 세전 예정가다. status:preview, mediaDelivery:false, versionedBilling:false 때문에 신규 Checkout은 서버에서 닫혀 있다. 환경 플래그만으로 preview를 열 수 없다. First campaign 독립 Checkout은 없다.

creative-billing은 별도 Price ID·카탈로그 버전으로 월 구독과 월 장면 아이템, 다음 결제 기간 수량 예약, 월말 해지, 별도 mode:payment 장면 추가권을 구현한다. 수량 변경은 현재 유료 기간을 유지하며 proration none, schedule end_behavior release다. 계정 잠금·요청 명령·Stripe idempotency로 중복을 방어한다. 일회권은 현재 Stripe 결제 상태를 확인한 뒤 지급하고 재생 이벤트로 중복 부여하거나 만료를 늘리지 않는다. 전액 환불은 해당 grant를 회수하고 환불이 먼저 온 경우도 검사한다. 장면을 실제 생성/소비하는 제작 파이프라인은 미완성이다.

Stripe 고객/이벤트는 DB에 저장한다. 웹훅 서명을 원문으로 검사하고 이벤트 중복을 걸러내며 현재 구독/청구 상태를 다시 조회한다. out-of-order 응답은 revision/applied_revision으로 방어한다. 신규 판매 게이트는 법적 판매자·지원·HTTPS·메일·실테스트 승인·생성 구성 등을 요구하며 실제 외부 계정 검증은 별개다. 실결제나 배포를 이번 작업에서 수행하지 않았다.

근거: src/lib/billing/plans.ts; src/lib/marketing/creative-plans.json; creative-plans.ts; src/lib/server/billing.ts; billing-shared.ts; creative-billing.ts; CREATIVE_OFFER_IMPLEMENTATION.md.

## 6. 정적 이미지 제작: 이미 구현된 범위

최신 코드는 AI 이미지/영상이 아니라 업로드 사진·선택 로고·헤드라인·설명·가격·CTA·색상으로 만든 정적 이미지다. /workspace#media에서 파일 업로드, 디자인 저장, 정확한 버전의 상품/권리 확인 승인, 1:1(1080×1080)/4:5(1080×1350)/9:16(1080×1920) PNG/JPG 작업 요청, worker 완료 후 private download를 지원한다.

upload는 실제 PNG/JPEG/WebP byte 서명과 sharp 디코딩을 확인한다. 입력8MiB, 16MP, 변6000px, still 1page 한도; 회전 후 PNG 재인코딩으로 입력 메타데이터를 제거하며 재인코딩 결과20MiB도 제한한다. 원본 이름을 경로로 사용하지 않고 random UUID+확장자의 불변 객체, sha256/bytes/dimensions/owner metadata를 저장한다. public 아래 설정은 거부한다. 업로드 동시 처리2개, 계정 시간당30개·전체300개, body는8MiB+64KiB 한도다.

디자인 저장/수정은 업로드된 소재를 참조하고 최대100버전, 기존 예상 버전 검사로 충돌을 막는다. 내보내기 예약 때 active paid creative에서만 이미지1개를 예약한다. free와 legacy text는 이미지 권리0이다. 동일 project의 여러 비율과 수동 수정본은 디자인을 다시 차감하지 않는다. confirmed creative 기간의 한도는 Focus40/Growth80이다. 성공은 사용 확정, 모든 형제 작업 실패로 더 이상 pending이 없으면 예약을 해제한다.

media_jobs는 owner+request_key 고유키, snapshot, queued/running/succeeded/failed, lease를 영구 저장한다. worker는 sharp로 로컬 합성하며 유료 공급자를 호출하지 않는다. heartbeat 유효는60초, lease는180초, 렌더 timeout30초다. 중단 작업은 이미 기록된 file.jobId를 대조해 성공 복구 또는 WORKER_INTERRUPTED로 실패 정리한다. 큐 요청 자체는 파일 납품 완료가 아니다.

마케팅 텍스트와 이미지 디자인은 자동 변환 파이프라인으로 연결되지 않았다. 이미지를 만드는 문구·사진·색상은 별도 스튜디오에서 직접 입력한다. 캠페인·완성 동영상·voiceover·새 AI 이미지·새8초 장면·게시/광고 집행/분석 수집은 미구현이다.

근거: MEDIA_OPERATIONS.md; src/lib/server/image-studio.ts; media-files.ts; media-http.ts; src/app/api/media/**; src/components/workspace/ImageStudio.tsx; scripts/image-worker.mjs.

## 7. 보안·계정 이메일·복구 운영

비밀번호12~128자, scrypt64byte+개별 salt, unknown email도 동일한 비싼 파생 연산. 세션은 random32byte token이며 서버에는 SHA-256만 저장한다. cookie HttpOnly/SameSite=Strict/Max-Age7일, production/HTTPS에는 Secure. 로그아웃은 현재 token만 제거한다. 인증은 전체120/min, 이메일당10/15min 제한이다.

일반 JSON 변경은 Origin과 APP_ORIGIN 또는 request origin을 비교하고 cross-site/비JSON을 거부한다. JSON512KiB, 여러 DB변경 계정120/15min 제한. 일부 first-check/goal API는 별도 limit 호출이 없으므로 모든 endpoint에 같은 계정별 변경 빈도 제한이 걸렸다고 쓰면 부정확하다. 모든 핵심 레코드 조회는 owner를 포함하고 파일도 본인만 읽는다. 일반 오류는 provider payload/SQL/경로/비밀/사업 입력을 숨긴다.

Resend 이메일은 실제 fetch 경로가 있고 운영 키/발신자/출처가 필요하다. verify24h/reset30min 일회 토큰을 hash로 저장하고 링크 hash fragment에 전달한다. 재설정 성공은 계정의 모든 세션을 없앤다. 메일 전체30/min, 목적/이메일당3/15min, 토큰완료전체60/min 제한. 존재 여부 노출을 줄이는 일반 요청 응답을 사용하지만 미구성은503이다. 실배송/도메인인증은 미검증이다.

next.config.ts는 CSP/XFO/HSTS/nosniff/Referrer/Permissions/COOP/CORP를 추가한다. CSP는 inline script/style을 허용하고 개발에서 eval을 허용하므로 엄격 nonce CSP라고 부를 수 없다. 이는 침투 테스트·운영 보안 인증이 아니다. /api/health는 공개 단순 liveness; /api/internal/readiness는32자이상 워커 secret Bearer를 timingSafeEqual로 확인하고 DB·private path 읽기/쓰기·heartbeat만 확인한다. OpenAI/Stripe/Resend 인증을 증명하지 않는다.

온라인 backup 스크립트는 원본 DB를 readOnly로 열어 node:sqlite backup을 사용하고 그 스냅샷이 참조하는 immutable file만 체크섬 대조해 복사한다. verify/restore는 새 경로만 허용하고 실행 DB를 덮어쓰지 않는다. 정기 실행·원격/독립 사본·보관 정책·OS 실제 권한·알림 수신처/담당자·운영 cutover는 운영자가 마련해야 한다. Windows에서 POSIX mode 수치만으로 실제 ACL을 보장할 수 없다.

근거: src/lib/server/auth.ts; account-email.ts; http.ts; media-http.ts; next.config.ts; scripts/backup-local.mjs; verify-backup.mjs; MEDIA_OPERATIONS.md.

## 8. 과거 문서와 최신 코드의 정정 사항

README의 'Text generation is the only AI-provider integration'은 AI 공급자 범위에서는 맞지만 'Finished images/videos ... unavailable'의 이미지 부분은 이제 정적 사진 기반 PNG/JPG 일부를 지원한다. CREATIVE_OFFER_IMPLEMENTATION의 'actual image/video delivery, media usage reservation/consumption pending' 역시 이전 작업 시점이며, 최신 MEDIA_OPERATIONS와 image-studio 코드가 이미지 저장·예약·소비·private 납품을 추가했다. AI 이미지/영상·캠페인/장면 소비는 계속 미완성이다. 일괄 '미디어 없음' 또는 '미디어 전체 완성' 모두 부정확하다.

README90개·CREATIVE 문서110개 테스트 수는 해당 시점 기록이다. 현재 루트 재실행17파일123개를 이번 검증으로 따로 표시한다. 과거 $149/$299는 legacy text 가격, 새 $79/$149는 preview creative 가격이다. 같은 Focus/Growth 이름만 보고 혼합하면 한도와 사업계산이 틀어진다.

src/lib/business/assessment.ts가 평가 규칙의 근거이고 성과 시계열은 performance.ts다. metrics.ts 파일은 없다. 외부 모델/세금/원가 가정은 코드로 확인한 실제 매출·품질·수요가 아니다.

## 9. 실제 출시 과제

P0: 공개 약속과 일치하는 이미지/사진 기반 MP4/voiceover/선택 AI 장면 납품 완성, 캠페인/영상/장면/체험팩 소비·만료·예약·실패·환불 원장 연결, First campaign 독립 Checkout, 실제 공급자 및 Stripe/Resend 실계정 확인, 영구 단일 인스턴스·worker·도메인/HTTPS, 외부 감시/알림, 정기 백업/독립 사본/실제 복구, 판매자·최종 정책·세금 처리 확정. 'creative 텍스트 권리 연결 자체가 없음'은 출시 과제가 아니다. 연결 코드는 이미 있으며 전체 creative 납품과 운영 실검증이 남는다.

고객 결과 검증: 첫 방향 이해·계정 저장·첫 과제/승인/실사용 도달, 사용 가능한 파일의 정확성·수정 횟수·시간, 다음 주 재사용과 실제 측정 이행. 매출/전환 개선은 동일 정의·기간·출처의 관측과 다른 설명을 함께 확인해야 한다.

## 10. 레거시·미사용 후보·원본 자산의 보존 의미

레거시 Zustand store는 startup-platform-store의 산업/단계/점수/실행/재무/주간목표/지표/스트릭 같은 과거 브라우저 상태를 다룬다. store-persistence.ts의 sanitation과 operations.importLegacy는 이를 명시적 1회 가져오기에서 읽기 전용 보관한다. originalImport 원문도 보존하고 KRW를 유지한다. 이 레거시 점수를 현재 사업 건강지수로 해석하거나 예전 돈을 자동 USD 전환하지 않는다. src/lib/financial.ts는 예전 제품 숫자 유틸리티이며 창업자 개인 재무 모형과 별개다.

PROJECT_REVIEW_2026-11-12.md의 정적 분석상 후보 11개(src/data/benchmarks.ts, questions.ts, score-messages.ts, strategies.ts; src/lib/actions.ts, ai-feedback.ts, financial.ts, id.ts, rewards.ts, store.ts, use-local-date-key.ts)는 실행 직접 import 부재 또는 테스트 전용 참조 기록이다. 삭제 안전성 입증이 아니고 레거시 호환·테스트·동적 참조 가능성 때문에 원위치에 유지한다. 이번 현재 src/components/src/app 직접 문자열 검색도 해당 레거시 실행 import를 찾지 못했지만 저장 데이터 계약을 없애도 된다는 결론은 아니다.

공개 파일8개(file.svg, globe.svg, logo-red-bg.png, logo.jpg, next.svg, upstage-hero-violet.png, vercel.svg, window.svg)는 현재 src에서 파일명 직접 문자열을 찾지 못했다. 현재 로고는 BrandMark 컴포넌트로 그린다. 공개 URL 직접 사용·브랜드 원본·외부 참조를 전부 조사한 것은 아니므로 정리 확정 목록이 아니다. 11/12 검토의 보존 결정 및 원본을 그대로 두고 사본만 유지한다는 사용자 선택 기록을 존중한다. .data/WAL·브라우저 프로필·빌드/QA 생성물 역시 운영/검증 상태를 담을 수 있으므로 자동 이동/삭제하지 않는다.

근거: PROJECT_REVIEW_2026-11-12.md:54 이후; src/lib/store.ts; store-persistence.ts; src/lib/server/operations.ts의 importLegacy; public/8파일; src/components/brand/BrandMark.tsx.
