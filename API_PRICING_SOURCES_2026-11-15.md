# NEXORA API·세금 참고 자료 — 2026-11-15

- OpenAI 이미지 생성 가이드: https://developers.openai.com/api/docs/guides/image-generation
  - GPT Image 2.6: Sunburst는 편집 정밀도, Flare는 빠른 고품질 생성에 적합하다고 설명.
  - 생성·편집·Responses API 반복 편집, 품질·크기·형식 조정 지원.
- OpenAI API 가격: https://developers.openai.com/api/docs/pricing
  - 공식 이미지 모델 가격표는 모델·입출력 이미지 토큰 기준이며 최신 모델·단위는 출시 전 다시 확인.
- Runway 모델 목록: https://docs.dev.runwayml.com/guides/models/
  - Gen-4.5 $0.12/sec, Gen-4 Turbo $0.05/sec.
  - Kling 3.0 Pro 3–15 sec, from $0.12/sec.
  - WAN 3.0 2–30 sec, from $0.05/sec.
  - Veo 3.1 from $0.20/sec.
- Runway API 가격: https://docs.dev.runwayml.com/guides/pricing/
  - 1 credit = $0.01.
  - Kling 3.0 Pro 무음 12 credits/sec, 오디오 17 credits/sec.
  - Gen-4.5 12 credits/sec, Gen-4 Turbo 5 credits/sec.
  - Veo 3.1 무음 20 credits/sec, 오디오 40 credits/sec.
- Stripe 결제 가격: https://stripe.com/pricing
  - 미국 국내 카드 표준 2.9% + $0.30/성공 결제.
- Delaware Division of Corporations: https://corp.delaware.gov/paytaxes/
  - 국내 법인 Annual Report filing fee $50.
  - Franchise Tax 최소액은 계산 방식에 따라 $175 또는 $400.
  - Annual Report와 franchise tax는 3월 1일까지.
- Stripe Atlas 세금 안내: https://docs.stripe.com/atlas/business-taxes
  - Delaware C-Corp는 franchise tax와 annual report 의무가 있으며, 다른 주의 세금·등록·보고가 추가될 수 있음.
- IRS Publication 542: https://www.irs.gov/publications/p542
  - 일반적인 C-Corp 법인세율 21% 설명.

가격은 API 원가만으로 확정하지 않고 실패 재시도·저장·지원·Stripe 수수료·법인 운영비를 포함한 베타 검증 후 확정한다.
