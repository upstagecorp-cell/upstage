import type { BusinessProfile, BusinessStage, BusinessType, MetricName, RecommendedAction } from './types'

export interface GuidedQuestion {
  id: string
  question: string
  why: string
  example: string
  evidenceHint: string
}
interface IndustryTemplate {
  id: BusinessType
  label: string
  interpretations: string[]
  questions: GuidedQuestion[]
}
const q = (id: string, question: string, why: string, example: string, evidenceHint: string): GuidedQuestion => ({ id, question, why, example, evidenceHint })
export const BUSINESS_STAGES: Array<{ id: BusinessStage; label: string; help: string }> = [
  { id: 'not_sure', label: 'Not sure yet', help: 'You can collect information without committing to a stage.' },
  { id: 'planning', label: 'Planning a business', help: 'Focus on assumptions and small validation steps; operating metrics may not exist yet.' },
  { id: 'launching', label: 'Preparing to launch', help: 'Check your offer, measurement setup, and the next launch task.' },
  { id: 'operating', label: 'Already operating', help: 'Use a consistent reporting period and real customer, cost, and sales records.' },
  { id: 'growing', label: 'Improving or growing', help: 'Check unit economics, repeat purchase, and capacity before expanding spend.' },
]
export const INDUSTRY_TEMPLATES: IndustryTemplate[] = [
  { id: 'general', label: 'Other / not sure', interpretations: ['Use a clearly defined visitor population and purchase event. Do not compare unrelated channels or reporting periods.'], questions: [q('general_population', 'What counts as a visitor and a purchase in your business?', 'A conversion rate needs compatible populations.', 'Unique website visitors and completed paid orders, excluding test orders.', 'An analytics definition and a transaction report for the same period.'), q('general_costs', 'Which costs are included in your reported cost total?', 'Incomplete cost records cannot establish profitability.', 'Product costs, shipping, platform fees, payroll, and rent; taxes not yet checked.', 'A cost breakdown identifying included and excluded items.')] },
  { id: 'restaurant', label: 'Restaurant / food service', interpretations: ['Restaurant visitors may mean people, parties, reservations, or delivery-app sessions. Pair the chosen population with a compatible order or visit event.', 'Menu costs, packaging, delivery commissions, labor, and occupancy costs may affect the amount left from a sale. Total losses alone do not establish negative contribution margins.'], questions: [q('restaurant_orders', 'Which orders and channels are included in your sales?', 'Dine-in, takeout, and delivery can have different fees and conversion definitions.', 'Dine-in checks and takeout orders; delivery orders tracked separately.', 'POS order export with channel and reporting dates.'), q('restaurant_margin', 'Have you recorded ingredients, packaging, and channel fees for a representative menu item?', 'A popular item can still contribute little after direct costs.', 'A $15 item uses $4 ingredients and $1 packaging; delivery commission still needs checking.', 'Recipe costing worksheet, supplier invoices, and the applicable platform fee schedule.'), q('restaurant_capacity', 'When do waits, preparation, or table availability limit service?', 'More demand may not help if fulfillment is already constrained.', 'Friday dinner orders wait longer; timing has not been measured.', 'Observed ticket times or reservation and table-use records.')] },
  { id: 'cafe', label: 'Cafe / bakery', interpretations: ['Cafe visitor-to-purchase conversion may use foot traffic, counter visits, or online sessions. These denominators are not interchangeable.', 'Seat occupancy and time spent in the cafe are operational context, not proof of profitability. Check orders and costs alongside them.'], questions: [q('cafe_mix', 'Which products and service channels drive your orders?', 'Beverages, food, pickup, and seated service can have different costs and constraints.', 'Espresso drinks and pastries, mostly walk-in with some pickup.', 'POS product and channel breakdown.'), q('cafe_peak', 'What do you know about waiting time during your busiest period?', 'A service bottleneck may need attention before additional promotion.', 'Orders feel slower before work; I have not measured minutes yet.', 'A small sample of actual order-to-handoff times.'), q('cafe_costs', 'Which ingredient, packaging, and waste costs have you measured?', 'Cost completeness matters more than an invented industry target.', 'Milk, beans, cups, and unsold pastries are recorded separately.', 'Supplier invoices, recipe costs, and a waste log.')] },
  { id: 'accommodation', label: 'Lodging / accommodation', interpretations: ['Booking conversion should pair qualified listing or website sessions with bookings from that same channel.', 'Booked room nights, available room nights, cancellations, and platform commissions describe different parts of lodging performance. Revenue alone does not describe occupancy or profitability.'], questions: [q('stay_channels', 'Which booking channels are included in your records?', 'A direct booking and a platform booking can have different costs and populations.', 'Direct website bookings and one booking platform; each is reported separately.', 'Channel booking and session exports for matching dates.'), q('stay_inventory', 'Do you have available and booked room-night records?', 'Inventory availability is needed before interpreting low booking volume.', 'Two rooms were unavailable for repairs during part of the period.', 'Inventory calendar, booked room nights, and cancellation records.'), q('stay_costs', 'What booking commissions, cleaning, and variable stay costs are recorded?', 'More reservations may add costs as well as revenue.', 'Platform fees and cleaning are recorded; laundry costs are incomplete.', 'Payout statements and per-stay cost records.')] },
  { id: 'retail', label: 'Physical retail', interpretations: ['Foot traffic, store entries, transactions, and items sold measure different events. Define which population is used before interpreting conversion.', 'Discounts, returns, inventory costs, and card-processing fees can change the amount retained from sales.'], questions: [q('retail_visits', 'How are store visits and paid transactions counted?', 'A conversion denominator must represent actual purchase opportunities.', 'Store entries counted by a door sensor; repeat entries may be included.', 'Foot-traffic method and POS transaction definitions.'), q('retail_returns', 'How are discounts and returns reflected in your revenue?', 'Gross sales and retained revenue can tell different stories.', 'Discounts are deducted; refunds are in a separate report.', 'POS net-sales and refund records.'), q('retail_stock', 'Were products unavailable during the reporting period?', 'Low sales can reflect availability rather than weak demand.', 'The most-requested size was out of stock for several days.', 'Stock availability and lost-sale notes.')] },
  { id: 'ecommerce', label: 'Online retail / e-commerce', interpretations: ['Use sessions or unique visitors consistently and match purchases to the same storefront and reporting period.', 'Purchases, fulfilled orders, refunds, and returning customers are distinct events. Advertising spend is not the complete cost of an order.'], questions: [q('commerce_funnel', 'Which step between a product visit and payment has supporting data?', 'A checkout or offer issue may require a different response from an acquisition issue.', 'Product views and paid orders are available; cart and checkout counts are missing.', 'Storefront funnel and paid-order exports.'), q('commerce_net', 'Does revenue account for discounts, cancellations, and refunds?', 'Gross order value can overstate retained revenue.', 'Discounts are deducted; returns have not been reconciled.', 'Net-sales, cancellation, and refund reports.'), q('commerce_margin', 'Which product, fulfillment, payment, and advertising costs are known?', 'Profitable scaling requires more than an isolated ad metric.', 'Product and shipping costs are known; payment fees still need adding.', 'Order-level cost breakdown and ad-platform spending records.')] },
  { id: 'services', label: 'Professional / local services', interpretations: ['A service inquiry, qualified lead, booking, and paid engagement are separate conversion events. Website visits divided by paid projects may hide a longer sales cycle.', 'Capacity, delivery hours, and contractor costs matter when evaluating whether more leads would help.'], questions: [q('service_pipeline', 'What are the steps from an inquiry to a paid engagement?', 'Identify the event you want to improve before writing more lead-generation copy.', 'Inquiry, discovery call, proposal, and paid contract.', 'A dated lead pipeline with explicit stage definitions.'), q('service_capacity', 'What delivery time or capacity information is available?', 'Extra leads can create a delivery bottleneck.', 'One person delivers projects; hours by project are not yet recorded.', 'Timesheets or a delivery-capacity log.'), q('service_costs', 'Which labor and outside-provider costs are included?', 'Revenue per project does not establish its margin.', 'Contractor invoices are recorded; owner delivery hours are not priced.', 'Project-level labor and direct-cost records.')] },
  { id: 'creator', label: 'Creator / content business', interpretations: ['Views, followers, site visits, signups, and paid customers represent different events. Public engagement alone does not establish purchases or return on ad spend.', 'Sponsorships, digital products, subscriptions, and services can have different revenue and fulfillment models.'], questions: [q('creator_model', 'Which offer or revenue source are you trying to improve?', 'Choose the customer action before optimizing for views.', 'A paid workshop, separate from sponsorship income.', 'Offer details and payment records.'), q('creator_path', 'How does someone move from content to the paid offer?', 'Engagement may not reveal where potential buyers stop.', 'Short video to landing page to workshop checkout.', 'Channel-tagged visits, signups, and paid transactions.'), q('creator_costs', 'What creation, platform, and fulfillment costs are recorded?', 'A popular campaign can still consume substantial resources.', 'Editing invoices and platform fees are known; preparation hours are not tracked.', 'Creation time, contractor invoices, and platform statements.')] },
]

export function industryTemplate(profile: Pick<BusinessProfile, 'businessType'>): IndustryTemplate {
  return INDUSTRY_TEMPLATES.find(item => item.id === profile.businessType) ?? INDUSTRY_TEMPLATES[0]
}
export function profileQuestions(profile: Pick<BusinessProfile, 'businessType' | 'stage'>): GuidedQuestion[] {
  const common = profile.stage === 'planning' || profile.stage === 'launching'
    ? q('stage_validation', 'Which assumption will you test before spending more?', 'A planned business may have no operating results yet. Keep expectations separate from measured evidence.', 'Ask prospective customers to review the offer before purchasing inventory.', 'Dated interview notes or a small, clearly described validation experiment.')
    : q('stage_changes', 'What changed during the reporting period?', 'Changes in prices, advertising, availability, and seasonality can provide alternative explanations.', 'Prices were unchanged; one promotion ran for three days.', 'A dated change log and the reports used to observe outcomes.')
  return [common, ...industryTemplate(profile).questions]
}
export function metricContext(metric: MetricName, profile: Pick<BusinessProfile, 'businessType'>): string {
  const template = industryTemplate(profile)
  if (metric === 'visitors' || metric === 'purchases') return template.interpretations[0]
  return template.interpretations[1] ?? template.interpretations[0]
}

export function missingGenerationFields(profile: BusinessProfile): string[] {
  return [!profile.offering.trim() && 'product or service', !profile.customerType.trim() && 'target customers', !profile.salesChannels.length && 'a sales channel'].filter((value): value is string => Boolean(value))
}

export function actionInvestigationNote(profile: BusinessProfile, action: Pick<RecommendedAction,'kind'|'area'>): string {
  const template = industryTemplate(profile)
  const question = action.kind === 'review_costs'
    ? template.questions.find(item=>/costs|margin|commerce_net/.test(item.id))
    : action.kind === 'review_operations'
      ? template.questions.find(item=>/capacity|peak|inventory|stock/.test(item.id))
      : action.kind === 'collect_data' ? template.questions[0] : undefined
  const notes: string[] = []
  if (template.id !== 'general') {
    notes.push(`${template.label} context: ${template.interpretations[action.area==='profitability'?1:0] ?? template.interpretations[0]}`)
    if (question) notes.push(`Records to gather: ${question.evidenceHint}`)
  }
  if (profile.stage === 'planning' || profile.stage === 'launching') notes.push('If operating records do not exist yet, plan a small validation step and leave performance unknown; forecasts are not measured outcomes.')
  return notes.join(' ')
}
