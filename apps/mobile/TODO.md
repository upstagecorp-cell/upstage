# NEXORA 모바일 결과 및 출시 조건

- [ ] 단일 저장소 운영: 기존 웹을 보존하고 동일 GitHub 저장소 `apps/mobile/`에 모바일 소스를 보관한다. 개발 브랜치와 빌드 사본의 동기화 상태를 명시한다.
- [ ] 데이터 계층: 사용자·세션·assessment·assets·results·billing을 지원하는 async repository와 SQLite/PostgreSQL parity; 기존 저장 데이터 이관, 백업·복구·롤백을 확인하고 안전한 feature flag로 전환한다.
- [ ] 모바일 인증: 이메일 가입·로그인·비밀번호 재설정; 짧은 access token과 안전하게 저장·회전·재사용 감지되는 refresh token; 로그아웃과 모든 기기의 세션 폐기, 계정 삭제 요청, 정책 확인.
- [ ] 첫 방향: 현재 고민, 사업 유형·단계, offer, 대상 고객, 판매·홍보 채널, 이번 달 목표 및 선택적 측정값을 입력하고 첫 방향과 다음 행동을 표시한다.
- [ ] Home·Plan: My next move, 주간 실행 목표, 관련 승인 결과물, 완료·미완료 기록 및 다음 작업, 사업 문제·우선 과제·주간 계획을 실제 저장 데이터와 연결한다.
- [ ] Create: text draft를 요청하고 생성 중·성공·실패와 재시도를 표시한다. 직접 수정, 버전 저장, 정확한 버전 승인, 복사·다운로드를 지원하며 중복 요청을 방지한다.
- [ ] Results: 실제 게시·사용 여부와 채널, 결과 기간·지표·출처, 광고비와 통화, 결과가 없는 상태를 기록한다. 이전 사용·수정·결과가 다음 화면과 생성 context에 반영되는 방식을 보여준다.
- [ ] Account·알림: 주간 목표·작업 완료·결과 기록 시점·결제 실패/구독 변경 알림, 설정 및 opt-out, 고객지원·약관·개인정보 안내를 제공한다. 유료 결제는 데이터 전환 및 스토어 정책 검증 전 폐쇄한다.
- [ ] 보안: Supabase service role·AI key·DB URL은 앱에 포함하지 않는다. 서버 owner authorization, rate limit, 짧은 private media signed URL, generation usage 원자성 및 idempotency, webhook 서명과 중복 처리, 안전한 링크 정책을 확보한다.
- [ ] 접근성·운영: 영어 UI, 접근 가능한 라벨과 동적 글자 크기, 느린 네트워크·오프라인·재연결·앱 재개, crash/API 오류 관측과 실제 디바이스 검증.
- [ ] 출시 준비: iOS/Android production builds와 TestFlight/Play internal testing, 개인정보·계정 삭제·환불·구독 관리·고객지원, 데이터 export 안내, 백업과 rollback을 검증한다. 핵심 흐름 성공률 95%, crash-free 99%는 목표이며 측정 전 실적으로 주장하지 않는다.
