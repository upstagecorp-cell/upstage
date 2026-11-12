# NEXORA 프로젝트 종합 보고서 · 2026-11-12

최종 문서는 [50쪽 PDF](NEXORA_PROJECT_REPORT_2026-11-12.pdf)입니다.

- 프로젝트 방향·대상 고객·고객이 얻을 수 있는 직접 결과: 4~7쪽
- 변화 이력·기능별 구현·상품/결제·운영·검증: 8~27쪽
- 최신 V3 재무 가정·단위원가·정상상태·36개월 현금흐름: 28~36쪽
- 다음 과제·고객 결과 검증·남은 결정: 37~39쪽
- 데이터·폴더·출시 체크리스트 37항목·38개 API·25개 화면·근거 자료: 40~50쪽

[수정 가능한 Markdown](NEXORA_PROJECT_REPORT_2026-11-12.md)과 [인쇄용 HTML](NEXORA_PROJECT_REPORT_2026-11-12.html)을 함께 제공합니다. 목차 링크와 PDF 책갈피로 이동할 수 있습니다.

현재 코드·과거 문서·준비 중 상품·실제로 검증하지 않은 고객 효과를 구분했습니다. 외부 V2와 후속 V3는 원본을 보존하고 읽기 전용으로 대조했습니다. 비공개 재무 가정이 포함된 내부 보고서입니다.

검사 결과와 범위는 `verification/`에 있습니다. 앱 123개 테스트, 타입, 격리 빌드가 통과했고 린트는 오류 0·경고 5입니다. 로컬 유료 출시 사전 점검은 미완성 상품/운영 설정으로 24개를 차단했습니다. V3 기존 재무 테스트 8개 및 카탈로그·월별 CSV/JSON·현금 흐름 교차 확인도 통과했습니다. 실제 배포·실청구·유료 AI 호출이나 고객 효과 검증은 수행하지 않았습니다.

PDF 50쪽 모두 A4이며 제목·한글 추출·페이지 수·이미지 로딩·넘침 검사를 통과했습니다. 근거 297개 파일의 SHA-256은 `source-manifest.json`, 세부 조사 메모는 `research/`에 있습니다.

재생성:

```powershell
python -B reports/project-summary-2026-11-12/build_report.py
node reports/project-summary-2026-11-12/render_pdf.mjs
python -B reports/project-summary-2026-11-12/verify_report.py
```

로컬 Chrome·맑은 고딕·프로젝트 옆 `NEXORA_PRIVATE_2026-11-12/customer-offer-v3` 원자료와 `.qa`의 기존 QA 참고 파일이 필요합니다. PDF 텍스트 검사는 `.qa/review-tools`의 기존 pypdf를 사용합니다. 프로젝트의 앱 코드·원자료·기존 문서를 변경하지 않습니다.
