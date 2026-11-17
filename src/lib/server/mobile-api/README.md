# 모바일 인증: 비활성 HTTP 경로와 내부 실험 함수

`/api/mobile/v1/auth/login`, `/refresh`, `/logout`, `/logout-all`은 **완전히 비활성인 placeholder**다. 각각 Next.js Route Handler가 지원하는 GET, POST, PUT, PATCH, DELETE, HEAD, OPTIONS에 대해 설정이나 환경과 무관하게 고정 503과 `Cache-Control: no-store`를 반환한다. 요청을 읽거나 DB 드라이버 또는 `mobile-api/index.ts`를 import하지 않는다. 활성화 플래그도 없다. HEAD의 실제 HTTP 응답은 본문이 제거될 수 있다. TRACE 등 Next.js가 지원하지 않는 메서드는 프레임워크 앞단에서 400 등으로 처리될 수 있으므로 모든 HTTP 메서드에 503을 보장한다고 주장하지 않는다.

운영 노출 전에는 **프록시/방화벽 등 네트워크 계층에서 `/api/mobile/v1/auth` 전체를 차단**해야 한다. 코드의 placeholder만으로 네트워크 정책을 대체하지 않는다. 운영 웹 계정과 요청 경로는 여전히 SQLite이며 PostgreSQL 계정 이관·동기화와 분산 rate limit은 미완료다.

## 독립 함수 실험

`index.ts`의 `handleAuth(request, operation)`은 Route Handler에서 연결되지 않은 **내부 함수 테스트용**이다. 테스트에서만 직접 호출하며 HTTP API 계약이나 운영에서 동작하는 로그인 기능이 아니다. 개발·운영 서버에 이 모듈을 연결하거나 외부에 노출하지 않는다. 이 함수는 테스트용 JSON 입력, bearer 형식 및 고정 오류 처리를 실험하며, DB가 필요한 호출은 `NEXORA_MOBILE_DEV_DATABASE_URL`이 아래 URL과 바이트 단위로 정확히 같을 때만 풀을 생성한다. 이 설정은 HTTP 경로를 활성화하지 않는다.

```text
postgresql://postgres@127.0.0.1:55432/nexora_test
```

DB는 초기 스키마와 `supabase/migrations/20261117000000_mobile_auth.sql`, 필요한 테스트 역할이 **미리 적용된 빈 일회용 로컬 PostgreSQL 16**이어야 한다. 실제 사용자·계정 데이터는 넣지 않는다. URL 제한은 DNS, 비밀번호, 다른 사용자·포트·DB, 쿼리/fragment 등을 거절하지만 **터널이나 포트 포워딩의 반대편이 운영 DB인지 판별할 수 없다. 운영 Supabase나 실제 데이터에 대한 터널·포트 포워딩을 절대 사용하지 않는다.**

## 검증

Node 24와 의존성이 필요하다. 라우트 placeholder 테스트는 실제 네 라우트의 7개 함수를 여러 `NODE_ENV`/과거 플래그 조합 및 `NODE_PG_FORCE_NATIVE=1`에서 새로운 Node 프로세스로 호출하고, 드라이버/내부 함수 import와 소켓 연결을 금지한다. 이는 해당 함수에 대한 테스트이지 Next.js나 프록시의 지원하지 않는 메서드 전체에 대한 검증이 아니다.

다음 두 DB 통합 테스트는 각각 명시적 URL이 없으면 건너뛰며, URL이 위의 유일한 값과 일치하지 않으면 실패한다. 무작위 테스트 사용자만 만들고 삭제하며 마이그레이션 또는 전체 테이블 삭제는 수행하지 않는다. 별도 초기화된 빈 일회용 DB임을 실행자가 직접 보장해야 한다.

```sh
MOBILE_API_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/nexora_test \
MOBILE_AUTH_TEST_DATABASE_URL=postgresql://postgres@127.0.0.1:55432/nexora_test \
  npx vitest run --configLoader native src/lib/server/mobile-api src/lib/server/mobile-auth
```

별도 `src/lib/server/repository/parity.test.ts`의 PostgreSQL 패리티 테스트에도 위와 동일한 유일 URL 제한이 적용된다. 다만 URL만으로는 데이터 출처나 터널 연결 여부를 보장할 수 없으므로 네트워크 격리된 일회용 인스턴스만 사용한다.

실제 Supabase 접속·TLS·역할/RLS, 모바일 실기기 및 배포 환경은 이 테스트가 검증하지 않는다. 운영 사용을 위해서는 계정 이관과 단일 원본, 분산 IP/계정/전역 rate limit과 크리덴셜 스터핑 대응, 동시 요청 제한, 안전한 TLS·네트워크 정책, 비밀번호 변경/계정 삭제 시 모바일 세션의 원자적 폐기, 모니터링과 보안 감사 등이 추가로 필요하다. 이 함수로 모바일 workspace, 결제 또는 실사용 API가 완성된 것은 아니다.
