# 2026-11-11 가격·미디어 상품·개인 실수령 검증

**후속 정정:** 아래 기존 수익 숫자는 고급 API 품질·실제 지역 세금·회사 최소 현금 잔액을 충분히 반영하지 않았다. 해당 사업의 권장 수령액으로 사용하는 결론은 철회했다. [재검토](../../../API_QUALITY_TAX_CASHFLOW_AUDIT.md)를 우선한다. 코드·수학 검사의 통과는 원가 가정이나 실제 세금의 적정성을 입증하지 않는다.

로컬 구현과 계획 모형의 검증이다. 유료 출시·실제 미디어 제공·실제 수익을 검증한 결과가 아니다.

## 적용 범위

- Focus $79 / Growth $149와 새 이미지·영상·AI 장면 포함량을 가격표·홈·제품 설명·약관·무료 계정의 과금 화면에 반영했다.
- 사이트와 계산기가 같은 공개 제공량 정의를 사용한다. 내부 제작·지원 예산은 계산 자료에 분리했다.
- 공개 화면은 준비 중인 미디어 상품으로 표시한다. 신규 Checkout은 서버에서도 닫으며, 기존 텍스트 구독의 확정 권한·사용량·갱신 취소 경로는 보존한다.
- 운영 preflight에도 미디어 상품·새 결제 정의의 출시 상태 검사를 추가했다.

## 검사

| 검사 | 결과 |
|---|---|
| TypeScript | 통과 |
| Vitest | 14개 파일·91개 테스트 통과 |
| Next.js 프로덕션 빌드 | 통과 |
| 가격 모형 unittest | 6개 통과: 누진 구간 연속성, 최소 고객 수, 비용 민감도, 현금 합계, 성장기 CAC 중복 제외, 손실 처리 |
| Chromium 공개 화면 | `/`, `/pricing`, `/product`, `/guide`, `/terms`를 320·390·768·1024·1440px에서 확인, 가로 넘침 없음 |
| 가격·범위 일치 | 홈·가격·약관·인증된 무료 계정의 결제 안내에서 새 가격·수량과 준비 중 상태 확인 |
| 신규 결제 차단 | 격리 DB의 계정에서 Checkout 요청이 503 `BILLING_UNAVAILABLE`로 종료됨 |
| 서버 회귀 검사 | 기존 출시 설정과 live 형태 fixture 키를 모두 넣어도 preview 상태에서는 공급자 호출 없이 신규 결제 차단 |
| 오프라인 시뮬레이터 | 9개 시나리오의 JavaScript 결과와 Python 결과가 0.01원 이내로 일치, 시나리오·고객 수 조작 및 최소 고객 수 이동 확인 |
| 시뮬레이터 반응형 | 320·390·768·1440px에서 가로 넘침 없음 |
| 브라우저 예외 | 최종 실행에서 없음 |

처음 Chromium 실행은 Windows 중첩 sandbox 환경에서 `Page.enable` 시간이 초과됐다. 격리한 임시 프로필로 `--no-sandbox`를 적용해 로컬 QA를 완료했다. 안내 페이지의 대문자 표시 때문에 발생한 초기 QA 텍스트 선택도 안정적인 제목 기준으로 수정했다. 제품 코드 결함으로 판정하지 않았다.

재현:

```text
npm.cmd run typecheck
npm.cmd run test:run
npm.cmd run build
python -B reviews/2026-11-11/creative-pricing/calculate_model.py
python -B -m unittest discover -s reviews/2026-11-11/creative-pricing -p test_model.py
node reviews/2026-11-11/creative-pricing/verify_site.mjs --no-sandbox
```

브라우저 검사는 `NEXORA_ISOLATED_DEV=1`, 격리된 `.qa` SQLite DB, 신규 결제 비활성 설정으로 `127.0.0.1:3100`에서 실행했다. 일회용 `example.invalid` 계정만 만들었고 실제 고객·메일·결제·AI 생성은 호출하지 않았다. 결과는 [브라우저 기록](browser-results.json)에 있다.

화면: [데스크톱 가격표](screenshots/pricing-desktop.png), [모바일 가격표](screenshots/pricing-mobile.png), [상품 설명](screenshots/creative-overview-desktop.png), [모바일 결제 안내](screenshots/billing-mobile.png), [손익 시뮬레이터](screenshots/unit-economics-desktop.png).

## 수익 숫자의 범위

646명·연환산 12.12억·개인 월 약 2,002만 원, 운영 목표 750명·연환산 14.08억·월 약 2,410만 원은 명시된 계획 가정의 결과다. 전량 사용을 반영하지만 기본 공급자·자동 편집·지원 비용은 실측 전이다. 공급자 비용·고객 유치비·이탈·환율·세금 구조가 달라지면 다시 계산해야 한다. 첫해 누적 매출과 성장 자금은 별도 모형으로 구분했다.

`launch:preflight`는 로컬에서 미디어 출시 상태와 미완성 운영 설정으로 차단된다. 이는 이번 가격 화면 변경의 실패가 아니라 아직 유료 판매를 열 수 없다는 현재 상태를 올바르게 반영한다. 이미지·두 방식의 실제 영상 제작·영구 저장·운영 결제의 구현과 실측 검증은 남아 있다. 운영 배포는 수행하지 않았다.
