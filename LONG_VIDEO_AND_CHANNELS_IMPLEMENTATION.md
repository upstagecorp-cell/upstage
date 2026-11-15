# 긴 영상·채널 성과 기능 구현

## 구현된 흐름

NEXORA의 promotion은 고객의 제품 또는 서비스 하나를 기준으로 목표와 채널 하나를 선택하는 단위다. 광고 예산이나 플랫폼 광고 결제는 포함하지 않는다. 고객이 Meta, TikTok, YouTube, LinkedIn 등에서 직접 집행하고, NEXORA에는 실제 사용한 승인본·기간·성과·광고비를 직접 입력한다.

캠페인 제작 과정에서 30초 이상 영상을 원하는지 묻는다. 30초·45초·60초·90초를 선택하면 해당 요청이 generation payload에 보존되고, Plan & billing으로 연결된다. 현재 생성 작업은 장문 영상 자체를 자동 생성하지 않으며, 선택된 길이에 맞는 일회성 구매 안내를 제공한다.

첫 Creative 구독 결제에서도 long-video pack을 선택할 수 있다. 해당 Stripe Price는 첫 청구서에 한 번만 포함되며 구독 갱신에는 포함되지 않는다. 결제 후에는 `/api/billing/creative/video-top-up`에서 동일한 상품을 마이페이지에서 추가 구매할 수 있다. 구매 완료는 `creative_video_topup` 기록으로 저장되고 30일 후 만료된다. 환불 webhook이 오면 해당 권한도 회수한다.

성과 화면에는 Instagram / Meta, TikTok, YouTube, LinkedIn별 connector 준비 상태와 수동 보고서 입력 CTA가 표시된다. 실제 OAuth/API connector는 provider 앱 승인, client ID/secret, redirect URI, scope 검토 후 별도 활성화해야 한다. 현재 화면은 connector가 완성된 것처럼 약속하지 않는다.

## 출시 전 필수 설정

Stripe에 `STRIPE_PRICE_CREATIVE_PRO`와 `STRIPE_PRICE_VIDEO_{30,45,60,90}_{ONCE,PLUS_ONCE}`를 생성하고 가격·통화·tax behavior를 코드 카탈로그와 일치시킨다. 모든 가격은 USD exclusive tax 기준이며, 긴 영상 Price는 recurring이 아닌 one-time이어야 한다. 이후 staging에서 첫 구독+긴 영상, 마이페이지 추가 구매, 성공/미결제/환불/중복 webhook을 모두 확인한다.

실제 영상 provider를 연결할 때는 공급자별 초당 원가, 실패 재시도, 저장 기간, 콘텐츠 정책, 오디오·자막 포함 여부를 기록한 후 tier별 margin을 다시 계산한다. 실제 provider credentials 없이 `NEXORA_PAID_LAUNCH_ENABLED=true`로 운영을 열지 않는다.
