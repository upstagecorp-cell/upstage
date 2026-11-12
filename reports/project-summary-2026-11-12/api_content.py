"""Source-checked API and page appendix for the internal project report."""
from __future__ import annotations
import re

API_INFO = {
    '/api/account/complete': ('일회 토큰', '이메일 인증·비밀번호 재설정 완료'),
    '/api/account/email': ('인증/공개 혼합', '인증 메일은 로그인 필요, 재설정은 이메일 입력'),
    '/api/assessments': ('로그인·소유자', '선택 근거로 새 진단·프로필 스냅샷 저장'),
    '/api/assets/[id]': ('로그인·소유자', '텍스트 수정본을 새 버전으로 보존'),
    '/api/assets/[id]/approve': ('로그인·소유자', '현재 텍스트의 정확한 버전 승인'),
    '/api/assets/[id]/download': ('로그인·소유자', '승인된 지정 버전의 TXT 다운로드'),
    '/api/auth/login': ('공개·자격검증', '비밀번호 확인 후 서버 세션 쿠키 발급'),
    '/api/auth/logout': ('동일 출처', '현재 세션 제거·쿠키 만료'),
    '/api/auth/register': ('공개·자격검증', '계정 생성·암호 해시·서버 세션 발급'),
    '/api/billing/checkout': ('로그인·출시게이트', '기존 텍스트 구독 Checkout; 현재 신규 차단'),
    '/api/billing/creative/cancel': ('로그인·소유자', 'creative 구독 기간 말 해지·상태 동기화'),
    '/api/billing/creative/checkout': ('로그인·출시게이트', '새 creative 월 구독; preview에서 차단'),
    '/api/billing/creative/quantity': ('로그인·소유자', '다음 결제 기간의 월 장면 수량 예약 변경'),
    '/api/billing/creative/top-up': ('로그인·출시게이트', '일회 장면 추가 Checkout; 신규 구매 차단'),
    '/api/billing/portal': ('로그인·소유자', '해당 Stripe 고객의 청구 포털 열기'),
    '/api/billing/refresh': ('로그인·소유자', 'Stripe 현재 상태 재조회·권리 동기화'),
    '/api/billing/webhook': ('Stripe 서명', '원문 서명 확인·결제/구독/환불 이벤트 처리'),
    '/api/evidence': ('로그인·소유자', '기간·통화·출처 있는 수동 측정 근거 저장'),
    '/api/executions': ('로그인·소유자', '사업 행동 또는 승인 자산의 실제 사용 기록'),
    '/api/first-check': ('로그인·명시확인', '탭의 첫 체크를 프로필·근거·진단으로 저장'),
    '/api/generate': ('로그인·유료한도', '추천 마케팅 행동의 실제 텍스트 생성 요청'),
    '/api/goals': ('로그인·소유자', '진단/행동/자산 버전에 연결한 주간 계획 생성'),
    '/api/goals/[id]': ('로그인·소유자', '주간 계획 상태·기한·메모·자산 링크 수정'),
    '/api/health': ('공개', '프로세스 생존 응답; 외부 연결 점검은 아님'),
    '/api/internal/image-worker': ('워커 Bearer', '대기 정적 이미지 작업 최대 1개 처리'),
    '/api/internal/readiness': ('워커 Bearer', 'DB·private files·최근 heartbeat 확인'),
    '/api/legacy-import': ('로그인·소유자', '옛 브라우저 원문을 읽기 전용 보관함에 1회 저장'),
    '/api/media/files': ('로그인·소유자', 'GET 파일 목록 / POST 사진·로고 업로드'),
    '/api/media/files/[id]': ('로그인·소유자', '체크섬 확인한 비공개 이미지 열기/다운로드'),
    '/api/media/projects': ('로그인·소유자', '사진 기반 정적 이미지 디자인 첫 버전 저장'),
    '/api/media/projects/[id]': ('로그인·소유자', '충돌 검사 후 미승인 디자인 버전 추가'),
    '/api/media/projects/[id]/approve': ('로그인·소유자', '상품 사실·권리 확인 후 지정 디자인 승인'),
    '/api/media/projects/[id]/export': ('로그인·creative권리', '승인 버전 PNG/JPG 작업 예약; 202 응답'),
    '/api/media/workspace': ('로그인·소유자', '파일·디자인·작업·이미지 한도·워커 상태 조회'),
    '/api/profile': ('로그인·소유자', '현재 사업 프로필 수정·이전 버전 보존'),
    '/api/results': ('로그인·소유자', '실행 연결 측정 저장·재진단용 근거 생성'),
    '/api/session': ('공개 조회', '현재 세션 사용자 또는 null 반환'),
    '/api/workspace': ('로그인·소유자', '본인 사업·진단·자산·계획·결과·청구 조회'),
}

PAGE_INFO = {
    '/': '공개 홈·제품 가치와 실제 경로 안내',
    '/account/reset': '토큰으로 새 비밀번호 설정',
    '/account/verify': '토큰으로 이메일 주소 인증',
    '/action': '이동 → /workspace#assets',
    '/dashboard': '이동 → /workspace',
    '/demo': '명시적으로 허구인 텍스트 체험',
    '/diagnosis': '이동 → /workspace#assessment',
    '/diagnosis/result': '이동 → /workspace#assessment',
    '/explore': '실행 가이드·원래 진단/계획으로 복귀',
    '/forgot-password': '비밀번호 재설정 메일 요청',
    '/goals': '공통 WorkspaceApp의 주간 계획 화면',
    '/guide': '사업 체크→행동→측정 사용 안내',
    '/history': '이동 → /workspace#history',
    '/login': '이메일·비밀번호 로그인',
    '/metrics': '공통 WorkspaceApp의 성과 측정 화면',
    '/onboarding': '이동 → /workspace#profile',
    '/pricing': '예정 가격·총량·자동 갱신·견적 위젯',
    '/privacy': '동적 개인정보 처리 안내',
    '/product': '제품 기능·연결 업무 탐색',
    '/register': '신규 계정 생성',
    '/resources': '가이드·상품/계정 지원 경로',
    '/solutions': '서비스·온라인 매장·크리에이터 경로',
    '/start': '가입 전 첫 체크·탭 저장·명시적 계정 저장',
    '/terms': '동적 약관·환불/갱신 안내',
    '/workspace': '계정 기반 공통 작업 공간·여러 내부 섹션',
}

def api_pages(root):
    app = root / 'src' / 'app'
    routes = []
    for path in sorted((app / 'api').rglob('route.ts')):
        route = '/' + path.parent.relative_to(app).as_posix()
        methods = re.findall(r'export\s+(?:async\s+)?function\s+(GET|POST|PUT|PATCH|DELETE|HEAD|OPTIONS)\b', path.read_text(encoding='utf-8'))
        role, description = API_INFO[route]
        routes.append([route, '/'.join(methods), role, description])
    assert len(routes) == len(API_INFO) == 38, 'API source list changed'
    pages = []
    notes = [
        'HTTP 메서드는 각 route.ts의 명시적 export 기준이다. Next.js 자동 OPTIONS/HEAD 동작이나 별도 sitemap/robots는 이 API 수에 더하지 않았다. 로그인만으로 결제·생성 권리가 생기지 않는다.',
        '일반 JSON 변경 요청은 동일 출처·JSON 본문 검사를 거친다. Stripe 웹훅은 원문 서명, 내부 워커는 별도 Bearer로 검증한다. 업로드는 multipart와 동일 출처를 별도로 검사한다.',
        '첫 체크의 가입 전 계산은 브라우저에서 수행한다. /api/first-check POST는 로그인·명시적 저장 확인 후 DB에 저장한다. media export는 대기 작업 응답이며 파일 완성을 뜻하지 않는다.',
    ]
    for i in range(3):
        pages.append({
            'title': f'전체 API 목록 · {i + 1}/3', 'part': 'TECHNICAL APPENDIX',
            'blocks': [
                {'kind': 'p', 'text': f'38개 route 파일을 코드와 대조했다. 아래는 {i * 13 + 1}~{min((i + 1) * 13, len(routes))}번째 경로다.'},
                {'kind': 'table', 'headers': ['경로', '메서드', '접근 경계', '실제 동작'], 'rows': routes[i * 13:(i + 1) * 13], 'class': 'compact'},
                {'kind': 'p', 'text': notes[i]},
            ],
            'sources': 'src/app/api/**/route.ts; src/lib/server/auth.ts; http.ts; billing.ts; image-studio.ts',
        })
    screens = []
    for path in sorted(app.rglob('page.tsx')):
        route = '/' + path.parent.relative_to(app).as_posix()
        if route == '/.': route = '/'
        screens.append([route, PAGE_INFO[route]])
    assert len(screens) == len(PAGE_INFO) == 25, 'Page source list changed'
    pages.append({
        'title': '전체 화면 경로 · 25개 파일', 'part': 'TECHNICAL APPENDIX',
        'blocks': [
            {'kind': 'p', 'text': '25개 page.tsx는 URL 진입점 수다. 공통 작업 공간을 공유하거나 기존 주소를 이동시키는 파일을 포함하므로 25개의 독립 앱 기능이라는 뜻은 아니다.'},
            {'kind': 'table', 'headers': ['경로', '화면·연결 동작'], 'rows': screens, 'class': 'compact'},
        ],
        'sources': 'src/app/**/page.tsx; src/components/workspace/WorkspaceApp.tsx',
    })
    return pages
