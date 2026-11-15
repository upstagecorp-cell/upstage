#import "report-theme.typ": report-accent, report-theme

#show: report-theme.with(
  title: "NEXORA 최종 출시 준비 보고서",
  author: "Manus AI",
  rhythm: "report",
  running-header: true,
)

#let navy = rgb("142b36")
#let teal = rgb("287b72")
#let amber = rgb("b7791f")
#let coral = rgb("b34b3c")
#let pale = rgb("f2f6f4")
#let warn = rgb("fff4df")
#let danger = rgb("fff0ee")
#let pass = rgb("eaf6f1")
#let status(label, fill: pale, color: navy) = box(fill: fill, radius: 3pt, inset: (x: 7pt, y: 3pt))[#text(size: 8.5pt, weight: "bold", fill: color)[#label]]
#let callout(title, body, fill: pale, border: teal) = block(fill: fill, stroke: 1pt + border, radius: 5pt, inset: 11pt)[
  #text(weight: "bold", fill: border)[#title] \
  #v(3pt)
  #body
]

#page(margin: (top: 30%, x: 2.2cm), numbering: none, header: none)[
  #set par(first-line-indent: 0em)
  #align(center)[
    #text(size: 27pt, weight: "bold", fill: report-accent)[NEXORA]
    #v(0.6em)
    #text(size: 20pt, weight: "bold")[최종 출시 준비 보고서]
    #v(0.7em)
    #text(size: 13pt, fill: luma(80))[프로덕션 출시까지 남은 사항 · 2026년 11월 15일 기준]
    #v(2em)
    #line(length: 40%, stroke: 0.8pt + report-accent)
    #v(2em)
    #text(size: 11pt)[작성: Manus AI · 기준: GitHub main / Preview / 출시 문서 대조]
  ]
]

#page(numbering: none, header: none)[
  #outline(title: [목차], indent: 1.5em)
]

#counter(page).update(1)

= 출시 판정 요약

#callout([현재 판정: 프로덕션 출시 보류], [
코드 품질과 핵심 사용자 흐름은 출시 후보 수준이다. GitHub CI는 Lint, TypeScript, 209개 단위 테스트, 프로덕션 빌드, 고위험 취약점 감사를 모두 통과했다. 그러나 실제 프로덕션 배포 URL이 없고, 미디어 상품은 아직 `preview` 상태이며 실제 결제·메일·AI 결과·백업 복구·법률 판매자 정보가 운영 환경에서 검증되지 않았다.
], fill: danger, border: coral)

#table(
  columns: (1.5fr, 1.2fr, 3fr),
  inset: 7pt,
  fill: (_, y) => if y == 0 { navy } else if calc.odd(y) { pale } else { white },
  [*영역*], [*현재 상태*], [*판정*],
  [코드·CI], [통과], [GitHub CI 성공.],
  [Preview], [통과], [홈과 `/api/health` HTTP 200.],
  [프로덕션 배포], [차단], [관리형 프로젝트 `not_deployed`, 공개 URL 없음.],
  [미디어 상품], [차단], [`status: preview`, `mediaDelivery: false`, `versionedBilling: false`.],
  [결제·메일·AI], [미검증], [외부 운영 계정과 실제 네트워크 검증 필요.],
  [법률·세금·백업], [미검증], [운영자와 전문가의 최종 확인 필요.],
)

#callout([사용자에게 공개 가능한 현재 주소], [Preview 주소는 `https://8328-izdtv6bggioerlxcvbeks-814a44d4.sg2.manus.computer`이며 홈페이지와 `/api/health`가 HTTP 200을 반환한다. 이 주소는 사용자 대상 프로덕션 URL이 아니다.], fill: pass, border: teal)

= P0 · 출시 전 반드시 끝낼 항목

== 1. 프로덕션 호스팅과 공개 도메인

#status([차단], fill: danger, color: coral) 현재 관리형 프로젝트는 호스팅과 프로덕션 배포가 선언되지 않았다.

- 실제 호스팅 환경과 단일 Node.js 24.14 이상 런타임을 결정한다.
- 공개 도메인과 HTTPS 인증서를 연결한다.
- `APP_ORIGIN`과 `NEXT_PUBLIC_SITE_URL`을 같은 공개 HTTPS 루트로 설정한다.
- Preview나 localhost를 canonical URL로 사용하지 않는다.
- 단일 애플리케이션 인스턴스와 영구 볼륨을 준비한다.
- `/api/health`, readiness, 로그인, 이메일 링크, 결제 반환 URL을 공개 도메인에서 확인한다.
- 프로세스 재시작 뒤에도 계정·승인·측정·사용량·구독 상태가 보존되는지 확인한다.

#callout([완료 증거], [공개 URL, HTTPS 검사 결과, 배포 로그, `/api/health` 200, 재시작 후 DB 보존 캡처를 출시 기록에 남긴다.], fill: pale, border: teal)

== 2. 상품·가격·포함량 기준 통일

현재 문서와 카탈로그가 서로 다른 가격·수량을 갖고 있다. 출시 전에 단 하나의 상품 정의를 선택하고 화면·서버·Stripe Price·약관을 모두 같은 기준으로 맞춰야 한다.

#table(
  columns: (1.3fr, 1.2fr, 1.3fr, 1.3fr, 1.5fr),
  inset: 6pt,
  fill: (_, y) => if y == 0 { navy } else if calc.odd(y) { pale } else { white },
  [*기준*], [*Focus*], [*Growth*], [*상태*], [*조치*],
  [현재 creative catalog], [$79/월], [$149/월], [Preview], [납품·청구 구현 후 확정],
  [출시 계획 문서], [$79/월], [$149/월], [수량 불일치], [이미지·영상 수량 재결정],
  [기존 text catalog], [$149/월], [$299/월], [별도 제품], [첫 출시 제품인지 결정],
)

확정해야 하는 항목은 상품명, 가격, 캠페인 수, 이미지·영상 정의, AI 장면 초 과금, 실패·재생성 차감, 월 초기화, 일회성 상품, 환불, 취소, 기존 고객 가격 보호다. 결정 전에는 유료 버튼을 열지 않는다.

== 3. 실제 미디어 납품

미디어 상품을 출시하려면 다음을 실제 공급자와 저장소에서 검증한다.

- 이미지 생성·저장·다운로드·삭제·권한 확인
- 숏폼 영상 생성 또는 편집, 길이 제한, 파일 무결성 확인
- 성공·실패·timeout·재시도·중복 과금 방지
- 고객 사용량과 공급자 원가를 별도 기록
- 승인본과 미승인본 분리
- 공급자 장애와 대용량 파일 처리
- 실제 업종 20개 사례에서 가격·대상·채널·주장 검토
- 이미지 최소 20개, 영상 최소 10개를 실제 결과로 검사

#status([현재 차단], fill: danger, color: coral) `creative-plans.json`은 아직 `status: preview`이며 납품과 versioned billing이 false다.

== 4. Stripe 운영 연결

실제 판매자 심사, 은행계좌, Live API key, 상품 Price, Tax, 고객 포털, Webhook을 운영 환경에서 연결한다.

필수 Webhook은 `checkout.session.completed`, subscription create/update/delete, `invoice.paid`, `invoice.payment_failed`, `invoice.payment_action_required`다. Checkout 성공 URL만으로 권한을 주지 않고 Webhook과 현재 구독 상태를 기준으로 권한을 부여한다.

실제 테스트는 결제 성공, 카드 거절, 추가 인증, 중복 클릭, 네트워크 중단, Webhook 재전송, 갱신, 갱신 실패, 기간 말 해지, 환불, 다른 계정 접근 차단을 포함한다.

== 5. 이메일 운영 연결

Resend 발신 도메인, SPF, DKIM, 필요 시 DMARC를 설정한다. 인증과 복구 메일을 Gmail·Outlook 등 실제 우편함에서 확인한다. 만료 링크, 재사용, 다른 계정 토큰 접근, 기존 세션 종료, 발신자·지원 주소를 검증한다.

== 6. 운영 환경 변수와 사전 점검

운영 환경에 다음 그룹을 설정한다.

#table(
  columns: (2fr, 3fr),
  inset: 6pt,
  fill: (_, y) => if calc.odd(y) { pale } else { white },
  [*그룹*], [*필수 값*],
  [공개 주소·DB], [`APP_ORIGIN`, `NEXT_PUBLIC_SITE_URL`, 절대 경로 `NEXORA_DB_PATH`],
  [AI], [`OPENAI_API_KEY`, `OPENAI_MODEL`],
  [Stripe], [Live secret, webhook secret, Price ID, portal configuration],
  [메일], [`RESEND_API_KEY`, `NEXORA_EMAIL_FROM`],
  [법률·지원], [`NEXT_PUBLIC_SUPPORT_EMAIL`, 판매자명, 판매자주소],
  [출시 플래그], [`NEXORA_LEGAL_APPROVED`, `NEXORA_LIVE_TESTS_APPROVED`, `NEXORA_PAID_LAUNCH_ENABLED`],
)

최종 시점에 `npm run launch:preflight`를 실행한다. 이 검사는 비밀값을 출력하지 않고 외부 결제나 메일을 호출하지 않는다. 모든 차단 조건을 해결하기 전에는 유료 출시 플래그를 true로 바꾸지 않는다.

= P1 · 운영·법률·데이터 준비

== 데이터와 백업

SQLite를 임시 디스크에 두지 않는다. 영구 볼륨, 접근 권한 제한, 암호화된 백업, 보관 기간, 책임자를 정한다. WAL 사용 중인 파일을 임의 복사하지 말고 SQLite 백업 기능 또는 일관된 정지 복사본을 사용한다.

별도 복구 환경에서 계정, 사업 프로필, 측정치, 승인본, 사용량, 결제 상태를 복원하고 로그인·최근 승인본·구독 상태를 확인한다. 원본 운영 DB에 시험 복원을 하지 않는다.

== 보안과 운영 보호

- GitHub secret과 호스팅 secret store만 사용한다.
- 운영자 계정 MFA와 저장소 보호 브랜치를 설정한다.
- Webhook 서명, 계정 ID, 다운로드 권한, 복구 토큰을 검증한다.
- 로그인·생성·계정별 시간당·전체 일일 rate limit을 운영값으로 설정한다.
- API key, 토큰, DB 경로가 오류와 로그에 노출되지 않도록 확인한다.
- 공급자 비용 상한과 장애 알림을 설정한다.
- Webhook·메일·백업·생성 실패 알림 수신자를 정한다.

== 법률과 세금

`/terms`와 `/privacy`의 초안 표시를 실제 판매자 정보로 교체하기 전에 전문가 검토를 받는다. 판매자 법인명·주소·지원 이메일·데이터 처리자·보관 국가·삭제 요청·환불·구독 갱신·고객 콘텐츠 권리·AI 결과 책임 범위를 확정한다.

미국 법인 형태, 사업자 등록 주, Sales Tax, Stripe Tax, 한국 거주 대표의 배당·급여·조세조약·해외법인 신고는 코드가 결정할 수 없는 사항이다. 재무 시뮬레이터의 매출과 대표 수령액은 가정이지 보장값이나 신고액이 아니다.

= P1 · 실제 사용자 테스트

초기 미국 소규모 서비스 사업자 5~10명을 대상으로 제한 공개한다. 각 사용자가 랜딩 → 첫 체크 → 상품·목표·채널 → 저장 → 추천 행동 → 초안 → 수정 → 승인 → 실제 사용 → 결과 기록 → 다음 주 재방문까지 수행하는지 관찰한다.

측정할 지표는 첫 체크 완료율, 저장률, 첫 승인까지 걸린 시간, 실제 사용 여부, 다음 주 재방문, 생성 실패율, 공급자 원가, 결제 실패, 환불 사유, 지원 시간이다. 낮은 이탈률·높은 유지율·매출 보장은 아직 주장하지 않는다.

실기기에서는 iPhone Safari, Android Chrome, 키보드 탐색, 스크린리더, 200% 확대, 느린 네트워크, 이메일 링크, Checkout 왕복, 해지, 다운로드, 네트워크 중단을 확인한다.

= 출시 실행 순서

#table(
  columns: (0.7fr, 2.4fr, 2.6fr),
  inset: 7pt,
  fill: (_, y) => if y == 0 { navy } else if calc.odd(y) { pale } else { white },
  [*순서*], [*실행*], [*완료 증거*],
  [1], [상품·가격·포함량 하나로 결정], [코드·화면·Stripe·약관 일치],
  [2], [법인·은행·Stripe·Resend·AI 계정 연결], [심사 완료·도메인 인증·키 보관],
  [3], [프로덕션 배포·도메인·HTTPS·영구 DB], [공개 URL·health 200·재시작 보존],
  [4], [테스트 결제·메일·AI·Webhook·백업 복구], [시나리오별 로그와 결과 기록],
  [5], [실제 사용자 5~10명 제한 공개], [첫 업무 완료·지원·원가 관찰],
  [6], [일반 공개 판정], [모든 P0 통과 후에만 유료 플래그 활성화],
)

= 최종 Go / No-Go 기준

#callout([GO 조건], [상품 정의가 하나로 통일되고, 실제 프로덕션 URL과 HTTPS가 있으며, 실제 결제·메일·AI 결과·Webhook·백업 복구가 검증되고, 법률 판매자 정보와 지원 체계가 확정된 경우에만 제한 공개한다.], fill: pass, border: teal)

#callout([NO-GO 조건], [프로덕션 URL 없음, 미디어 납품 미완료, Stripe Live 검증 미완료, 실제 이메일 미검증, 영구 DB·복구 미검증, 법률 정보 미확정, 상품 수량 불일치 중 하나라도 남으면 유료 공개를 보류한다.], fill: danger, border: coral)

#v(1em)
*결론:* 현재 NEXORA는 코드와 Preview 검증은 완료됐지만, 외부 운영 계정·프로덕션 배포·실결제·실제 납품·법률·복구 검증 전 단계다. 가장 먼저 상품 범위를 확정하고 프로덕션 인프라를 만든 뒤, 실제 운영 시나리오를 증거로 남기는 순서가 안전하다.
