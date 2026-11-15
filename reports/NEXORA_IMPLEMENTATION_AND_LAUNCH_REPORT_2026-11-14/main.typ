#import "report-theme.typ": report-accent, report-theme

#let ink = rgb("12233f")
#let navy = rgb("111b3b")
#let purple = rgb("635bff")
#let teal = rgb("138a87")
#let amber = rgb("b97826")
#let coral = rgb("c65b55")
#let muted = rgb("5c6b82")
#let line = rgb("dfe4ec")
#let pale = rgb("f5f7fb")
#let okay = text(fill: teal, weight: "bold")[구현·검증]
#let partial = text(fill: amber, weight: "bold")[부분 구현]
#let pending = text(fill: coral, weight: "bold")[출시 전 필요]
#let callout(title, body, fill: pale, accent: purple) = block(fill: fill, stroke: (left: 4pt + accent), inset: 12pt, radius: 5pt)[
  #text(weight: "bold", fill: accent)[#title] \
  #body
]
#let status-row(status, item, evidence, next) = [#status, #item, #evidence, #next]

#show: report-theme.with(
  title: "NEXORA 구현 현황 및 실제 출시 준비 보고서",
  author: "Manus AI",
  rhythm: "report",
  running-header: true,
)
#set text(font: ("Noto Sans CJK KR", "Noto Sans CJK JP", "DejaVu Sans"), size: 9.5pt, fill: ink)
#set par(justify: true, leading: 0.72em, spacing: 0.8em, first-line-indent: 0em)
#show heading.where(level: 1): set text(fill: navy)
#show heading.where(level: 2): set text(fill: purple)
#show link: set text(fill: purple)

// ---------- Title page ----------
#page(margin: (top: 27%, x: 2.2cm), numbering: none, header: none)[
  #set par(first-line-indent: 0em)
  #align(center)[
    #text(size: 31pt, weight: "bold", fill: navy)[NEXORA]
    #v(0.7em)
    #text(size: 20pt, weight: "bold")[구현 현황 및 실제 출시 준비 보고서]
    #v(0.7em)
    #text(size: 12pt, fill: muted)[2026년 11월 14일 기준]
    #v(2em)
    #rect(width: 55%, height: 5pt, fill: purple, radius: 3pt)
    #v(2em)
    #text(size: 11pt, fill: muted)[현재 코드·문서·검증 기록을 기준으로 작성한 출시 판단 자료]
    #v(4em)
    #text(size: 10pt)[작성: Manus AI]
  ]
]

#page(numbering: none, header: none)[
  #outline(title: [목차], indent: 1.5em)
]
#counter(page).update(1)

= 보고서 요약

NEXORA는 소규모 사업자가 자신의 사업 맥락을 입력하고, 다음에 확인할 질문과 주간 행동을 정한 뒤, 사람이 승인한 문구와 실제 측정 결과를 연결해 기록하는 업무 공간이다. 현재 제품은 공개 랜딩, 첫 체크, 사업 프로필, 진단, 주간 계획, 문구 생성·검토·승인, 결과와 측정, 이미지 스튜디오, 계정·구독 기반을 포함한다.

#callout([현재 판정], [핵심 제품 흐름과 로컬 검증은 상당 부분 완료됐다. 그러나 실제 유료 정식 출시 완료 상태는 아니다. 운영 Stripe·Resend·AI 계정, 공개 HTTPS, 영구 저장소, 판매자·세금·약관 정보, 실제 결제·메일·생성 품질·백업 복원 검증이 남아 있다.], fill: rgb("eef1ff"), accent: purple)

== 핵심 결론

- 현재 구현은 초기 제품으로서 무료 체크 → 저장 → 주간 행동 → 승인본 → 실제 결과 기록의 흐름을 제공한다.
- 텍스트 생성은 실제 공급자 연결 구조가 있으나 운영용 AI 키·모델·원가·품질 검증이 필요하다.
- 사진 기반 이미지 합성·저장·승인·PNG/JPG 출력은 로컬 구현과 검증이 완료됐지만 AI 이미지 생성과 완성 영상은 제공하지 않는다.
- Stripe 결제·Billing·고객 포털·웹훅·사용량 권리 코드는 구현되어 있으나 실제 판매자 계정과 테스트/실결제 왕복 검증이 필요하다.
- 현재 공개 가격과 미디어 상품 정의가 여러 문서에 공존하므로 출시 전 하나의 최종 상품 카탈로그와 법적 계약을 확정해야 한다.
- 최근 공개 랜딩은 Stripe의 고급 SaaS 랜딩 구성 원리를 참고하되 NEXORA의 질문·계획·승인·측정 콘텐츠로 차별화했다. Stripe의 브랜드 자산이나 고객 실적을 사용하지 않는다.

= 제품 목표와 제공 범위

== 사업 목표

NEXORA가 판매해야 하는 것은 생성된 문구의 양이 아니라, 사업자가 매주 다음 판단을 할 수 있게 하는 연결된 맥락이다. 제품은 사실과 가설, 승인본과 초안, 활동과 실제 성과를 섞지 않는 것을 핵심 원칙으로 둔다.

#table(
  columns: (1.2fr, 2.1fr, 2.1fr),
  inset: 7pt,
  stroke: 0.5pt + line,
  fill: (x, y) => if y == 0 { navy } else { white },
  [*핵심 흐름*], [*제품에서 하는 일*], [*정직성 규칙*],
  [*사업 이해*], [사업 유형·단계·고객·제공물·채널·목표를 저장], [모르는 값은 비워 두며 추정하지 않음],
  [*다음 질문*], [첫 진단에서 조사할 한 가지와 다음 행동을 제안], [건강 점수·성공 확률·업계 평균을 만들지 않음],
  [*생성·작성*], [문구·훅·CTA·영상용 대본을 실제 공급자 요청으로 생성], [공급자 연결 없이는 가짜 성공 응답을 만들지 않음],
  [*검토·승인*], [수정본을 새 버전으로 만들고 정확한 버전을 승인·복사·다운로드], [다운로드는 게시나 판매로 기록하지 않음],
  [*실행·측정*], [주간 계획과 실제 사용·측정치·기간·출처·통화를 연결], [완료한 작업을 매출이나 성과로 표현하지 않음],
)

== 현재 공개 제공 범위

#table(
  columns: (1.8fr, 1.5fr, 2.8fr),
  inset: 7pt,
  stroke: 0.5pt + line,
  fill: (x, y) => if y == 0 { navy } else { white },
  [*기능*], [*상태*], [*현재 실제 범위*],
  [첫 체크·진단], [#okay], [가입 전 사업 고민·유형·단계 선택, 첫 방향과 측정 입력, 명시적 저장 전에는 계정 업로드 없음],
  [사업 프로필·평가], [#okay], [사업·고객·시장·목표·채널·통화·시간대·선택적 URL, 저장된 추천 순서와 전체 보고서],
  [주간 계획], [#okay], [추천 행동을 목표·기한·상태·평가 지표와 연결, 활동 완료와 성과를 분리],
  [문구 생성], [#partial], [실제 OpenAI 호환 Responses API 연결 구조와 사용량 보호가 있음. 운영 키·모델·품질 검증은 필요],
  [검토·승인·내보내기], [#okay], [정확한 버전 승인, 수정본 재승인, 복사·다운로드, 이전 버전 보존],
  [측정·성과], [#okay], [측정 기간·단위·통화·수동 출처 저장, 호환되는 관측만 비교],
  [사진 기반 이미지], [#okay], [사진·로고 업로드, 로컬 합성, 저장 디자인, 승인 버전, 1:1·4:5·9:16 PNG/JPG 출력],
  [AI 이미지·완성 영상], [#pending], [AI 이미지, MP4 렌더링, 음성·자막·외부 영상 공급자·최종 납품은 아직 미제공],
  [자동 게시·광고 집행·분석 수집], [#pending], [제품 약속 범위가 아님. 자동 게시, 광고비 집행, 외부 analytics import 없음],
)

= 현재 구현된 시스템

== 애플리케이션 구조

현재 Next.js 16.4.6, React 19, TypeScript, Node.js 24.14 이상을 기준으로 한다. 서버는 인증·API·결제·작업 처리·SQLite 저장을 같은 애플리케이션 안에서 제공한다. 운영 SQLite는 단일 Node 인스턴스와 영구 볼륨이 필요하며, 복수 인스턴스나 ephemeral 디스크에 바로 배포하면 안 된다.

#block(fill: rgb("f3f5fa"), inset: 12pt, radius: 5pt)[
  #align(center)[#text(weight: "bold", fill: navy)[공개 랜딩 / 시작 흐름]]
  #v(0.5em)
  #align(center)[첫 체크 → 사업 프로필 → 진단·추천 → 주간 계획 → 문구 생성 → 검토·승인 → 사용 기록 → 측정 → 재평가]
  #v(0.6em)
  #grid(columns: (1fr, 1fr, 1fr), gutter: 8pt,
    [#block(fill: white, inset: 8pt, radius: 4pt)[*웹 UI*\\ 공개 홈 · /start · /media · /product · /pricing · /guide]],
    [#block(fill: white, inset: 8pt, radius: 4pt)[*서버 기능*\\ 세션 · 권한 · 결제 · 웹훅 · 생성 · 미디어 작업]],
    [#block(fill: white, inset: 8pt, radius: 4pt)[*데이터*\\ SQLite · WAL · 백업/복원 · 비공개 파일 · 사용량 원장]],
  )
]

== 주요 라우트

공개·계정·작업 공간의 페이지 라우트는 다음과 같다. API 라우트는 별도 서버 엔드포인트로 빌드된다.

#table(
  columns: (1.5fr, 3fr, 1.2fr),
  inset: 6pt,
  stroke: 0.5pt + line,
  fill: (x, y) => if y == 0 { navy } else { white },
  [*영역*], [*라우트*], [*상태*],
  [공개], [경로: / · /demo · /guide · /product · /solutions · /resources · /pricing], [#okay],
  [첫 사용], [경로: /start · /diagnosis · /diagnosis/result · /onboarding], [#okay],
  [작업], [경로: /workspace · /dashboard · /goals · /history · /metrics · /action], [#okay],
  [계정], [경로: /login · /register · /forgot-password · /account/reset · /account/verify], [#okay],
  [미디어], [경로: /workspace\#media 및 관련 API], [#partial],
  [서버 API], [경로: /api/auth · /api/billing · /api/generate · /api/evidence · /api/media · /api/health 등], [#partial],
)

== 데이터·보안·복구

계정은 서버 세션과 scrypt 비밀번호 해시를 사용하며, 사업·파일·작업은 인증된 소유자 범위로 확인한다. 비공개 파일은 공개 폴더 밖 UUID 경로에 저장하고 형식·크기·픽셀·동시 요청·경로 조작을 제한한다. 이미지 버전은 승인 여부와 소유자를 확인하며 다른 계정 다운로드는 거부한다.

SQLite는 WAL 모드를 사용한다. 읽기 전용 online backup, WAL 포함 스냅샷, SHA-256 참조 파일 검증, 새 빈 경로로만 복원하는 명령이 구현되어 있다. 단, 운영 백업 주기·외부 사본·보관 기간·복원 담당자는 아직 정해야 한다.

= 검증 현황

== 자동 검사

최종 교정 버전 기준으로 타입 검사, 208개 테스트, 프로덕션 빌드가 통과했다. 앞선 미디어 구현 검증 기록에는 별도로 123개 단위 테스트와 14개 Chrome 검사가 기록되어 있으며, 이는 서로 다른 시점과 범위의 증거다. 숫자를 합산해 단일 테스트 총량으로 주장하지 않는다.

#table(
  columns: (2.3fr, 1.4fr, 2.3fr),
  inset: 7pt,
  stroke: 0.5pt + line,
  fill: (x, y) => if y == 0 { navy } else { white },
  [*검사*], [*결과*], [*해석*],
  [TypeScript], [#okay], [최종 랜딩·서버 코드 타입 검사 통과],
  [ESLint], [#okay], [최종 변경 대상 오류 없음. 기존 경고는 별도 리뷰 파일에 기록],
  [Vitest], [#okay], [최종 실행 21개 파일·208개 테스트 통과],
  [Next.js build], [#okay], [58개 페이지 생성과 API 라우트 빌드 통과],
  [운영 의존성 감사], [#okay], [기록 기준 운영 의존성 high 취약점 0건. 개발 도구 중간 위험은 남음],
  [데스크톱·모바일 UI], [#partial], [랜딩·가격·작업 흐름을 로컬/격리 브라우저로 확인. 실제 iOS Safari는 미검증],
  [실제 외부 연동], [#pending], [AI·Stripe·Resend·운영 DB·운영 메일은 fixture 또는 로컬 환경으로 대체],
)

== 현재 검증의 한계

자동 테스트 통과는 외부 서비스 계정이 실제로 작동한다는 뜻이 아니다. 실제 OpenAI 결과 품질과 원가, Stripe 네트워크 결제·갱신·환불·입금, Resend 실제 메일 도착, 운영 HTTPS 쿠키, 실기기 Safari, 스크린리더, 장기 백업 복원, 고객의 다음 주 재사용은 아직 확인하지 않았다.

= 실제 출시까지 필요한 일

== 출시 차단 항목

#callout([현재 유료 출시를 열면 안 되는 이유], [운영 preflight는 현재 19개 설정 조건에서 차단된다. 이는 19개의 독립된 기능이 모두 미구현이라는 뜻은 아니지만, 운영자 권한과 외부 계정 설정이 필요한 항목이 아직 확인되지 않았다는 뜻이다. 특히 creative catalog는 media delivery와 versioned billing이 명시적으로 출시 가능 상태가 되어야 한다.], fill: rgb("fff3ed"), accent: coral)

#table(
  columns: (0.9fr, 2fr, 2.8fr),
  inset: 6pt,
  stroke: 0.5pt + line,
  fill: (x, y) => if y == 0 { navy } else { white },
  [*우선순위*], [*출시 전 해야 할 일*], [*완료 판정 증거*],
  [P0], [실제 판매자·법인·주소·지원 이메일·세금 구조 확정], [약관·Stripe·메일·청구서의 동일 정보, 세무·법무 검토 기록],
  [P0], [공개 HTTPS 도메인·호스팅·영구 SQLite 볼륨 구성], [공개 origin, Secure 쿠키, 재배포 후 데이터 유지, health/readiness 확인],
  [P0], [운영 Stripe 상품·Price·Tax·Portal·Webhook 설정], [테스트 모드 왕복, webhook 서명·재전송·현재 상태 재조회, 포털 해지 증거],
  [P0], [Resend 발신 도메인과 인증·복구 메일 연결], [실제 우편함 수신, 만료·재사용 토큰 실패, 다른 계정 노출 없음],
  [P0], [OpenAI 호환 모델·예산·속도·실패 보호 연결], [실제 목표 업종 문구 20개 검토, 원가·실패·재시도 기록],
  [P0], [법적 문서와 판매 정책 확정], [경로 /terms · /privacy의 판매자·주소·지원·처리국가·보관·삭제·환불 내용],
  [P0], [백업·복원·모니터링·알림 운영화], [정기 백업, 외부 사본, 복원 리허설, 오류·비용·웹훅·메일 알림 수신],
  [P1], [AI 이미지·영상 상품을 실제 제공할지 결정], [미디어 기능 완성 또는 상품에서 제거, 가격·권리·사용량·납품 계약 일치],
  [P1], [5~10명 초기 고객의 유료 업무 완료 관찰], [첫 체크→승인→실제 사용→측정까지의 익명 운영 기록],
  [P1], [iOS Safari·접근성·느린 네트워크 확인], [메일 링크·Checkout·키보드·스크린리더·다운로드 실제 기기 검사],
)

== 필요한 운영 환경 변수

운영 서버에는 아래 값이 필요하다. 비밀키는 저장소·채팅·스크린샷에 넣지 않고 호스팅 secret으로만 주입한다.

#table(
  columns: (2.2fr, 2.1fr, 1.5fr),
  inset: 6pt,
  stroke: 0.5pt + line,
  fill: (x, y) => if y == 0 { navy } else { white },
  [*그룹*], [*필수 값*], [*목적*],
  [공개 origin], [APP_ORIGIN, NEXT_PUBLIC_SITE_URL], [HTTPS·canonical·sitemap],
  [저장], [NEXORA_DB_PATH], [QA가 아닌 절대 경로의 영구 SQLite],
  [AI], [OPENAI_API_KEY, OPENAI_MODEL], [실제 문구 생성],
  [Stripe], [SECRET, WEBHOOK, legacy/creative Price IDs, Portal configuration], [Checkout·구독·웹훅·해지],
  [메일], [RESEND_API_KEY, NEXORA_EMAIL_FROM, NEXT_PUBLIC_SUPPORT_EMAIL], [인증·복구·지원],
  [법적 승인], [NEXORA_LEGAL_NAME, ADDRESS, LEGAL_APPROVED], [판매자·약관·출시 승인],
  [출시 승인], [NEXORA_LIVE_TESTS_APPROVED, NEXORA_PAID_LAUNCH_ENABLED], [운영 검증 후 유료 개방],
)

== 결제·상품 출시 전 확정해야 할 충돌

문서에는 기존 텍스트 상품 Focus \$149 / Growth \$299와 새 creative 상품 Focus \$79 / Growth \$149가 함께 기록되어 있다. 기존 계약과 새 미디어 카탈로그를 분리한 구조는 코드에 반영되어 있으나, 공개 출시에서는 고객이 혼동하지 않도록 최종 상품명·가격·포함량·세금·환불·권리를 하나의 판매 정책으로 확정해야 한다.

현재 creative 계획은 First campaign USD 19 1회, Focus USD 79/month, Growth USD 149/month, motion scene USD 15 또는 five-scene pack USD 59로 기록되어 있다. 그러나 standalone First campaign Checkout, AI 이미지, 완성 영상, 전체 캠페인·영상 사용량 원장, 실제 Stripe 설정 검증은 남아 있다. 이 상태에서 유료 creative 구매를 열면 안 된다.

= 출시 실행 순서

== 권장 순서

#table(
  columns: (0.7fr, 2fr, 2.5fr),
  inset: 7pt,
  stroke: 0.5pt + line,
  fill: (x, y) => if y == 0 { navy } else { white },
  [*단계*], [*실행*], [*통과 조건*],
  [1], [법인·판매자·세금·가격 정책 확정], [대표와 전문가의 서면 결정, 공개 문서와 Stripe 정보 일치],
  [2], [운영 인프라 구성], [HTTPS·영구 DB·비밀값·메일·모니터링·백업 준비],
  [3], [외부 연동 테스트], [Stripe 테스트 모드, 실제 메일, 실제 AI 20개 결과, 실패·재시도·한도 검증],
  [4], [미디어 출시 여부 결정], [미완성 상품을 닫거나, 실제 MP4·AI 이미지·권리·원장·가격을 모두 완성],
  [5], [초기 고객 제한 공개], [5~10명, 수동 지원, 첫 업무 완료·승인·측정 관찰],
  [6], [유료 개방], [launch preflight 통과 후 PAID_LAUNCH_ENABLED=true, 실제 판매자·환불·지원 준비],
  [7], [출시 후 운영], [매일 오류·원가·지원·환불 확인, 다음 주 재사용과 다음 달 갱신 추적],
)

== 실제 운영자가 실행할 명령

#block(fill: rgb("f3f5fa"), inset: 12pt, radius: 5pt)[
  #text(font: "DejaVu Sans Mono", size: 8.5pt)[npm ci\nnpm run launch:preflight\nnpm run lint\nnpm run typecheck\nnpm run test:run\nnpm run build\nnpm run start]
]

`launch:preflight`는 비밀값을 출력하거나 결제·메일·AI를 호출하지 않는다. 통과해도 세금 등록, 공급자 건강, 결제 왕복, 백업 복원, 고객 가치를 인증하는 검사는 아니므로 운영 runbook의 실제 검증을 별도로 수행해야 한다.

= 출시 판정 체크리스트

== 유료 공개 전 반드시 Yes여야 하는 항목

#table(
  columns: (0.6fr, 3fr, 1.2fr),
  inset: 6pt,
  stroke: 0.5pt + line,
  fill: (x, y) => if y == 0 { navy } else { white },
  [*번호*], [*질문*], [*현재*],
  [1], [실제 판매자·약관·세금·환불 정책이 확정됐는가?], [아니오],
  [2], [공개 HTTPS와 영구 저장소에서 재시작·복원이 확인됐는가?], [아니오],
  [3], [실제 Stripe 테스트 결제·실패·갱신·해지·환불이 확인됐는가?], [아니오],
  [4], [인증·복구 메일이 실제 우편함에 도착하는가?], [아니오],
  [5], [실제 AI 결과 품질과 원가를 검토했는가?], [아니오],
  [6], [새 media 상품의 모든 약속이 실제 납품 가능한가?], [아니오],
  [7], [백업 복원·모니터링·알림·지원 담당이 준비됐는가?], [아니오],
  [8], [제한 고객으로 첫 업무와 다음 주 재사용을 관찰할 준비가 됐는가?], [부분],
)

#callout([출시 권고], [현재 버전은 무료 탐색·첫 체크·제품 설명·핵심 업무 흐름을 공개할 수 있는 초기 제품이다. 유료 결제와 미디어 상품은 운영·외부 연동·법적 승인·실제 품질 검증이 끝날 때까지 닫아 두는 것이 안전하다.], fill: rgb("eef8f6"), accent: teal)

= 부록: 소스 오브 트루스

이 보고서는 2026년 11월 14일 현재 작업 트리와 다음 문서를 기준으로 작성했다.

- `README.md`: 실제 라우트·제품 흐름·저장·호환성·검증 명령.
- `PROJECT_REVIEW_2026-11-14.md`: PDF 대조, 디자인 방향, 외부 연동 한계.
- `SEVEN_DAY_LAUNCH_PLAN.md`: 출시 판단·가격·운영 순서·세금 주의.
- `reviews/2026-11-10/launch/OPERATIONS_RUNBOOK.md`: 운영 계정·결제·메일·백업·출시 preflight.
- `reviews/2026-11-10/launch/VERIFICATION.md`: 자동·브라우저 검증과 한계.
- `CREATIVE_OFFER_IMPLEMENTATION.md`: creative 상품·자동 갱신·미디어 출시 상태.
- `LAUNCH_ACTIONS_2026-11-12.md`: 이미지 스튜디오·백업·복원·워커 조치 결과.
- `.env.example` 및 `scripts/launch-preflight.mjs`: 필요한 운영 환경과 자동 차단 조건.

#v(1em)
#text(size: 8.5pt, fill: muted)[이 보고서는 출시 준비를 위한 기술·운영 판단 자료이며, 세무·법률·보안 인증 또는 실제 매출을 보장하는 문서가 아니다.]
