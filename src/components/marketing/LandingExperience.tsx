import Link from 'next/link'
import { ArrowRight, ArrowUpRight, Check, Compass, MessageSquareText, ShoppingBag, Sparkles, Store, Target } from 'lucide-react'
import { CREATIVE_PLANS, FIRST_CAMPAIGN } from '@/lib/marketing/creative-plans'
import { CapabilityGrid } from './CapabilityGrid'
import { ConnectedWorkflow } from './PlatformExperience'
import { LandingHelp } from './LandingHelp'

const businessTypes = [
  { name: 'Services', icon: MessageSquareText, href: '/solutions?business=services' },
  { name: 'Online shops', icon: ShoppingBag, href: '/solutions?business=ecommerce' },
  { name: 'Creators', icon: Sparkles, href: '/solutions?business=creator' },
  { name: 'Local businesses', icon: Store, href: '/start?focus=retention' },
  { name: 'Your next idea', icon: Target, href: '/start' },
]

const workflowRows = [
  ['01', '사업 맥락', '상품·고객·채널·목표를 남깁니다.', 'FACT'],
  ['02', '조사 방향', '아직 모르는 한 가지를 질문으로 좁힙니다.', 'QUESTION'],
  ['03', '주간 실행', '이번 주에 확인할 행동 하나를 고릅니다.', 'PLAN'],
  ['04', '정확한 승인', '사용할 버전을 사람이 확인합니다.', 'APPROVED'],
  ['05', '실제 관측', '출처와 기간이 있는 결과를 기록합니다.', 'OBSERVED'],
]

export function LandingExperience() {
  return (
    <div className="nx-platform nx-ribbon-home nx-ledger-home">
      <section className="nx-ribbon-hero nx-ledger-hero" aria-labelledby="hero-title">
        <div className="nx-ledger-grid" aria-hidden="true" />
        <div className="nx-platform-container nx-ledger-hero-inner">
          <div className="nx-ledger-hero-copy">
            <span className="nx-ledger-date">NEXORA / WORKSPACE NOTE · 2026.11</span>
            <Link href="/guide" className="nx-ribbon-kicker"><span className="nx-ledger-dot" />Your business. Your judgment. <ArrowUpRight size={14} /></Link>
            <h1 id="hero-title">무엇을 만들지보다,<br /><em>무엇을 확인할지</em>부터.</h1>
            <p className="nx-ledger-lede">사업의 맥락을 남기고, 이번 주의 질문을 고르고, 사람이 승인한 결과를 실제 관측까지 이어가는 작은 사업용 작업 공간입니다.</p>
            <div className="nx-ribbon-actions"><Link href="/start" className="nx-platform-button">첫 방향 보기 <ArrowRight size={16} /></Link><Link href="/demo" className="nx-ribbon-secondary"><Compass size={17} /> 기록 흐름 둘러보기</Link></div>
            <p className="nx-ribbon-reassurance"><Check size={13} /> 가입 전 무료 체크 · 성과를 추측하지 않음</p>
          </div>
          <div className="nx-decision-sheet" aria-label="사업 판단 기록 예시">
            <div className="nx-sheet-top"><span>FIELD NOTE / SAMPLE ONLY</span><span>v01</span></div>
            <div className="nx-sheet-title"><small>YOUR BUSINESS</small><strong>Harbor Design</strong><span>Brand design consultations · Independent businesses</span></div>
            <div className="nx-sheet-question"><span className="nx-evidence-tag nx-tag-question">QUESTION</span><h2>문의가 유료 프로젝트가 되는 지점은 어디인가?</h2><p>정답을 확정하지 않고, 한 고객 여정을 따라 다음에 확인할 일을 고릅니다.</p></div>
            <div className="nx-sheet-next"><span className="nx-evidence-tag nx-tag-plan">NEXT ACTION</span><strong>상담 제안의 다음 고객 행동을 정의하기</strong><span className="nx-sheet-arrow"><ArrowRight size={16} /></span></div>
            <div className="nx-sheet-footer"><span><i /> Context attached</span><span><i /> No account data</span></div>
          </div>
        </div>
        <div className="nx-business-types nx-platform-container" aria-label="Built for independent businesses">{businessTypes.map(({ name, icon: Icon, href }) => <Link key={name} href={href}><Icon size={19} strokeWidth={1.7} /><span>{name}</span></Link>)}</div>
      </section>

      <section className="nx-ledger-principles nx-platform-container" aria-labelledby="principles-title">
        <div className="nx-section-index">01 / WHY IT EXISTS</div>
        <div className="nx-principles-copy"><h2 id="principles-title">맥락이 남아야<br /><em>다음 판단</em>이 쉬워집니다.</h2><p>완료한 작업과 실제 사업 변화를 섞지 않습니다. 사실·가설·승인본·관측값을 분리해, 다음에 같은 설명을 반복하지 않도록 합니다.</p><Link href="/guide" className="nx-ledger-link">NEXORA의 방식 읽기 <ArrowRight size={15} /></Link></div>
        <div className="nx-principles-list">{workflowRows.map(([no, title, text, tag]) => <div key={no} className="nx-principle-row"><span>{no}</span><div><strong>{title}</strong><p>{text}</p></div><span className={`nx-evidence-tag nx-tag-${tag.toLowerCase()}`}>{tag}</span></div>)}</div>
      </section>

      <section className="nx-capabilities nx-platform-container" id="products" aria-labelledby="capabilities-title">
        <div className="nx-section-index">02 / THE WORKBENCH</div>
        <h2 id="capabilities-title"><strong>한 번의 좋은 질문이</strong><br /><span>이번 주의 일과 다음 기록으로 이어지도록.</span></h2>
        <CapabilityGrid />
        <p className="nx-capability-disclosure">허구의 제품 미리보기이며 실제 고객 성과가 아닙니다. 사진 기반 이미지 도구는 구현되어 있고, 새 creative 구매·AI 이미지·완성 영상은 아직 제공하지 않습니다.</p>
      </section>

      <section className="nx-platform-container nx-story-section nx-ledger-story" aria-labelledby="story-title"><div className="nx-story-banner"><div className="nx-story-copy"><span>03 / A SMALL ROUTINE</span><h2 id="story-title">이번 주의 질문 하나.<br /><em>다음 기록 하나.</em></h2><p>사업을 대신 운영하지 않습니다. 판단할 수 있도록 맥락을 붙여 둡니다.</p><Link href="/demo" className="nx-story-button">샘플 업무 흐름 보기 <ArrowRight size={15} /></Link></div><div className="nx-story-note"><span className="nx-evidence-tag nx-tag-observed">OBSERVED</span><strong>완료는 성과가 아닙니다.</strong><p>출처와 기간이 있는 관측이 있어야 다음 질문을 세울 수 있습니다.</p><span className="nx-note-rule" /></div><span className="nx-story-wordmark">nexora<span>.</span></span></div></section>

      <section className="nx-business-backbone nx-ledger-backbone" aria-labelledby="backbone-title"><div className="nx-platform-container"><div className="nx-section-index">04 / CONTEXT STAYS CONNECTED</div><h2 id="backbone-title">사업의 기록이<br /><em>다음 행동의 이유</em>가 됩니다.</h2><ConnectedWorkflow /><p className="nx-backbone-note">저장·다운로드·완료는 매출이나 성과로 계산하지 않습니다. 실제 측정은 출처·기간·통화와 함께 남깁니다.</p></div></section>

      <section className="nx-platform-container nx-home-plans" aria-labelledby="plans-title"><div className="nx-home-plans-heading"><div className="nx-section-index">05 / START WHERE IT FEELS STUCK</div><h2 id="plans-title">작게 시작하고,<br /><em>근거를 쌓습니다.</em></h2><p>무료 체크와 계획은 지금 사용할 수 있습니다. 제작 상품은 범위·권리·납품 준비가 끝날 때까지 예정 상태로 표시합니다.</p><Link href="/pricing" className="nx-platform-text-link">범위와 가격 확인 <ArrowRight size={16} /></Link></div><div className="nx-home-plan-cards"><article><span>AVAILABLE NOW</span><h3>$0<small> / month</small></h3><p>Business checks, weekly planning,<br />and your own records.</p><Link href="/start">첫 방향 시작 <ArrowRight size={14} /></Link></article>{CREATIVE_PLANS.map(plan => <article key={plan.id}><span>{plan.name.toUpperCase()} · PLANNED</span><h3>${plan.monthlyUsd}<small> / month</small></h3><p>{plan.campaigns} campaign kits · {plan.images} images<br />{plan.videos} short videos · planned allowances.</p><Link href="/pricing">예정 범위 보기 <ArrowRight size={14} /></Link></article>)}</div><p className="nx-home-plan-note">First campaign: ${FIRST_CAMPAIGN.oneTimeUsd} once, no subscription. Planned USD prices before tax. 새 creative checkout과 완성 영상 납품은 아직 닫혀 있습니다.</p></section>
      <section className="nx-platform-container nx-home-final"><div><div className="nx-section-index">NEXT / YOUR WORKSPACE</div><h2>다음에 확인할<br /><em>한 가지를 고르세요.</em></h2><p>사업의 맥락과 판단을 한곳에 남겨두는 것부터 시작합니다.</p></div><Link href="/start" className="nx-platform-button">첫 무료 체크 <ArrowRight size={16} /></Link></section>
      <LandingHelp />
    </div>
  )
}
