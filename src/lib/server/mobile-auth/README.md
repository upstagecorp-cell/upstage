# 모바일 인증 선행 코드

이 코드는 **서버 전용 라이브러리**이며 외부 API 라우트, OAuth/OIDC 서버, 웹 쿠키 또는 UI를 만들지 않는다. 기존 웹 로그인은 SQLite를 사용한다. 이 라이브러리는 PostgreSQL `public.users`만 사용하므로, 기존 계정이 PostgreSQL에 정확히 이관·동기화되었다는 보장은 없다. 계정의 단일 권위 원본과 충돌 없는 이관을 검증하기 전에는 연결하지 않는다. 이메일 정규화와 `saltHex:scryptHex`(scrypt 입력은 16바이트 salt의 **hex 문자열**, 출력 64바이트)는 기존 웹 형식과 같다.

## 서버 계약

호출자는 보안 설정이 된 `pg.Pool`을 만들고 `createMobileAuth(pool, config?)`를 호출한다. 풀 생명주기는 호출자가 관리한다. `config`는 **서버 설정**이며 요청에서 받을 수 없다.

- `signIn({ email, password })`: 인증 성공 시 `TokenPair` 반환. 이메일은 trim/lowercase, 비밀번호는 기존과 같이 12~128자다. 회원가입은 제공하지 않는다.
- `refresh(refreshToken)`: 회전된 `TokenPair` 반환. 이전 refresh는 소비되고 이전 access도 즉시 폐기된다.
- `withAuthorizedSession(accessToken, async (principal, client) => ...)`: 토큰과 세션을 DB에서 검증한 뒤, 동일 트랜잭션 및 사용자·세션 잠금 안에서 콜백을 실행한다. 보호 리소스 SQL은 반드시 `principal.user.id`로 소유 범위를 제한하고, 같은 `client`를 사용해야 한다. 콜백에 외부 네트워크 호출이나 장시간 작업을 넣지 않는다. 트랜잭션 밖으로 복사한 principal은 이후 폐기 여부를 보장하지 않는다.
- `logout(accessToken)`: 현재 세션(토큰 family)을 폐기한다. `revokeSession(accessToken, sessionId)`는 인증된 사용자 소유 세션만 폐기하며, 타인의 ID와 없는 ID는 모두 404다. `revokeAll(accessToken)`은 인증된 사용자 전체 모바일 세션을 폐기한다. 셋 다 유효한 access가 필요하며 클라이언트 제공 owner ID를 신뢰하지 않는다. 만료된 access로 로그아웃하려면 유효한 refresh로 먼저 회전하거나 자연 만료를 기다려야 한다.

`TokenPair` 필드는 `tokenType: 'Bearer'`, `accessToken`, `accessExpiresAt`, `refreshToken`, `refreshExpiresAt`, `sessionExpiresAt`, `sessionId`, `user: { id, email, locale }`이다. 시각은 UTC ISO 8601이다. 토큰은 각각 독립적인 256비트 랜덤 hex 문자열이며 DB에는 SHA-256 해시만 저장한다. 세션 ID는 인증 수단이 아니다. 기본 access 15분, refresh 7일, family 절대 만료 30일이다. 서버 설정 상한은 access 15분, refresh 30일, family 90일이고 양수 정수 및 상호 관계를 검증한다. 회전 시 토큰 만료는 family 절대 만료를 넘지 않는다.

소비된 refresh의 재사용은 **이미 그 refresh 자체가 만료되었더라도** family와 모든 access를 폐기한다. 이 폐기는 인증 실패를 반환하기 전에 커밋된다. 트랜잭션마다 `READ COMMITTED`를 명시하고 사용자 행 → 세션 행 순서의 잠금으로 동시 회전 및 전체 폐기를 직렬화한다. 같은 refresh를 동시에 두 번 보내면 하나가 성공했더라도 다른 요청의 재사용 탐지로 그 성공 결과까지 폐기된다. 클라이언트는 refresh를 단일 비행(single-flight)으로 직렬화해야 한다. 타임아웃/연결 단절 시 서버 커밋 결과는 불명이며, 옛 refresh의 무조건 재시도는 재사용 폐기를 유발할 수 있으므로 재로그인해야 한다. 동시 로그아웃/회전 역시 직렬화하고, 성공한 폐기만 확정된 것으로 취급한다. 폐기 후 별도 로그인은 새 세션을 만들 수 있다.

예상 오류는 `MobileAuthError`의 `code`, `status`, 고정 메시지로 제공된다: `INVALID_INPUT` 400, `INVALID_CREDENTIALS`/`INVALID_TOKEN` 401, `NOT_FOUND` 404, `SERVER_ERROR` 503. 예상치 못한 DB·드라이버 오류와 콜백 오류의 내부 내용은 노출하지 않으며 이 모듈은 로그를 남기지 않는다. 클라이언트 입력을 에러 메시지에 덧붙이지 않는다.

## 실서비스 연결 전 필수 조건

1. 초기 마이그레이션 다음에 신규 `20261117000000_mobile_auth.sql`을 명시적으로 적용하고 롤백/백업 절차를 검증한다. 기존 `scripts/supabase-migrate.mjs`는 초기 파일만 적용하므로 **새 파일을 자동 적용하지 않는다**. 마이그레이션 소유자와 런타임 계정을 분리한다. 예를 들어 비밀값을 명령행에 넣지 않는 안전한 `PGSERVICE` 구성에서 `psql -v ON_ERROR_STOP=1 --single-transaction -f supabase/migrations/20261117000000_mobile_auth.sql`을 사용한다.
2. 서버만 DB 비밀을 보유하고, 전송 시 PostgreSQL TLS 인증서·호스트 검증(`verify-full` 상당), 네트워크 제한과 최소 권한을 적용한다. 기존 마이그레이션의 서버 역할 모델처럼 모바일 세 테이블에 RLS를 켜고 PUBLIC/anon/authenticated 권한을 회수했다. 애플리케이션 역할은 `users` 조회와 모바일 테이블 권한이 필요하고 RLS 우회(`BYPASSRLS`)가 있어야 한다. 실제 Supabase 역할 및 정책을 별도 검증해야 하며, 서비스 역할/DB 비밀을 앱에 배포하면 안 된다.
3. 미래의 전송 계층은 HTTPS만 허용하고, access를 `Authorization: Bearer <token>`으로 수신하며, 인증·회전·폐기는 URL이 아닌 제한 크기의 JSON POST 본문으로 처리한다. 비밀번호/refresh를 URL, 쿠키, 분석 이벤트에 넣지 않는다. 응답은 `Cache-Control: no-store` 및 `Pragma: no-cache`, 401에는 `WWW-Authenticate: Bearer`를 사용한다. 이 계약은 RFC 6750 스타일의 bearer 사용일 뿐 OAuth/OIDC 완전 구현을 의미하지 않는다.
4. 모든 경로에 중앙화된 계정·IP·전역 속도 제한/악용 대응, 요청 크기 제한, 암호 추측 방어, 비밀정보 비노출 모니터링과 경보를 추가한다. 로그인/refresh 속도 제한은 이 라이브러리의 범위 밖이다. HTTP/프록시/DB/APM/예외 로그와 크래시 보고서에서 `Authorization`, 비밀번호, access/refresh, SQL 파라미터 및 연결 문자열을 반드시 제거한다. 모바일에서는 토큰을 OS 보안 저장소에 보관하고 백업·스크린샷·클립보드·일반 로그에 노출하지 않는다.
5. 비밀번호 재설정, 계정 삭제, 관리자 강제 폐기는 이 라이브러리의 동일한 사용자 행 잠금 순서로 모든 모바일 family 폐기와 원자적으로 연결해야 한다. 기존 웹의 비밀번호 변경/웹 세션 폐기는 자동으로 모바일에 반영되지 않는다. 통합 전 경합 및 권한 변경 경로를 검토한다.
6. 저장량 제한과 만료 세션 정리 작업을 운영에 준비한다. **활성 family에 속한 소비 refresh 기록은 절대 일찍 삭제하지 않는다.** 그 기록이 없으면 재사용 탐지가 불가능하다. family가 절대 만료된 후 그 세션을 삭제하면 외래키 cascade로 토큰이 정리된다. 정리·보관 정책을 감사/복구 요건과 함께 검증한다.

## 테스트

Node 24와 npm 의존성이 필요하다. 단위 테스트는 `npx vitest run --configLoader native src/lib/server/mobile-auth/mobile-auth.test.ts`. 실 PostgreSQL 통합 테스트는 초기 스키마, 모바일 마이그레이션 및 Supabase 테스트 역할이 **이미 적용된 빈 일회용 로컬 DB**에서만 실행한다. `MOBILE_AUTH_TEST_DATABASE_URL`은 `postgresql://postgres@127.0.0.1:55432/nexora_test`만 허용하며, 미설정 시 skip되고 다른 값은 실패한다. 테스트는 마이그레이션하지 않고 무작위 테스트 사용자만 생성·삭제한다. 예: `MOBILE_AUTH_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/nexora_test npx vitest run --configLoader native src/lib/server/mobile-auth`. 운영 DB와 실제 데이터는 사용하지 않는다. **운영 DB로 향하는 터널·포트 포워딩도 절대 금지한다.** URL 검사는 터널의 반대편을 판별하지 못한다.

로컬 테스트 DB의 수퍼유저로 통합 테스트를 수행하는 경우 로컬 SQL/트랜잭션 동작만 확인한 것이며, 실제 Supabase의 접속·TLS·역할/RLS 우회와 배포 설정 검증을 대체하지 않는다. 외부 노출 경로, 분산 rate limit, 실제 기기 보안 저장소, 보안 감사·침투 테스트도 별도로 필요하다.
