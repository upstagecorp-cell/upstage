"""Premium API and liquidity sensitivity audit; no actual tax return or bank reconciliation."""
import importlib.util
import json
from pathlib import Path

HERE = Path(__file__).resolve().parent
spec = importlib.util.spec_from_file_location('legacy_planning', HERE/'calculate_model.py')
legacy = importlib.util.module_from_spec(spec)
spec.loader.exec_module(legacy)

# 4K image output $0.24 + $0.01 input/review budget (not a quoted fixed input price).
# Veo 3.1 with audio via Runway $0.40 per generated second. No ranking claim.
PROFILES = [
    ('legacy_budget', '기존 저원가 가정', .04, .075),
    ('premium_one_call', '고급 이미지 4K·영상 1080p / 1회 생성', .25, .40),
    ('premium_1_5_calls', '같은 채택량에 회사 부담 후보 1.5회', .375, .60),
    ('premium_two_calls', '같은 채택량에 회사 부담 후보 2회', .50, .80),
    ('premium_motion_060_sensitivity', '영상 초당 $0.60 비용 민감도 / 1회 생성', .25, .60),
]


def audit(profile, customers=750):
    key, label, image, motion = profile
    old = legacy.model(customers, image_usd=image, motion_second_usd=motion, state_rate=0)
    # A lower-bound C-corp illustration: $400 franchise + $50 report + $100 agent renewal.
    # Actual franchise tax depends on shares/assets. Agent's first year is in Atlas's setup fee.
    annual_maintenance_usd = 550.
    maintenance = annual_maintenance_usd*legacy.BASE['fx']/12
    opex = sum(old[k] for k in ['payment_krw','production_krw','support_krw','replacement_cac_krw','fixed_krw'])+maintenance
    operating = old['net_monthly_revenue_krw']-opex
    federal_only = max(0.,operating)*.21
    full_de_tax_sensitivity = max(0.,operating)*(.21+.087*(1-.21))
    after_federal = operating-federal_only
    core_monthly = old['fixed_krw']+old['support_krw']+maintenance
    fulfilment = old['production_krw']
    next_period_replacement = old['replacement_cac_krw']
    # Recommended policy: runway for committed costs + next-period delivery and maintenance marketing.
    reserve3 = core_monthly*3+fulfilment+next_period_replacement
    reserve6 = core_monthly*6+fulfilment+next_period_replacement
    cash_distribution_from_zero = max(0.,after_federal-reserve3)
    cash_distribution_with_floor_funded = max(0.,after_federal)
    costs = {}
    for plan in legacy.CATALOG['plans']:
        assumptions = legacy.BASE | dict(image_usd=image,motion_second_usd=motion)
        costs[plan['id']] = legacy.plan_cost(plan,assumptions)
    return dict(profile=key,label=label,customers=customers,image_unit_usd=image,
                motion_second_usd=motion,production_per_plan_usd=costs,
                annualized_net_revenue_krw=old['annualized_net_revenue_krw'],
                monthly_net_revenue_krw=old['net_monthly_revenue_krw'],
                monthly_production_krw=old['production_krw'],monthly_operating_outlays_krw=opex,
                monthly_operating_profit_krw=operating,annual_maintenance_budget_usd=annual_maintenance_usd,
                monthly_maintenance_budget_krw=maintenance,federal_only_tax_illustration_krw=federal_only,
                full_delaware_apportionment_tax_sensitivity_krw=full_de_tax_sensitivity,
                monthly_cash_after_federal_illustration_krw=after_federal,
                core_committed_monthly_krw=core_monthly,next_period_fulfilment_krw=fulfilment,
                next_period_replacement_marketing_krw=next_period_replacement,
                recommended_three_month_floor_krw=reserve3,six_month_target_krw=reserve6,
                three_month_total_outlay_stress_cash_krw=opex*3,
                cash_distribution_cap_from_zero_opening_cash_krw=cash_distribution_from_zero,
                cash_distribution_cap_if_floor_already_funded_krw=cash_distribution_with_floor_funded,
                personal_after_tax_take_home_krw=None,
                tax_status='Unconfirmed: C-corp illustration only; entity choice, actual nexus, Korean corporate residence/PE, deductions, other taxes and personal tax remain unresolved.')


def verify(rows):
    for row in rows:
        assert abs(row['monthly_net_revenue_krw']-row['monthly_operating_outlays_krw']-row['monthly_operating_profit_krw'])<.01
        assert abs(row['six_month_target_krw']-row['recommended_three_month_floor_krw']-3*row['core_committed_monthly_krw'])<.01
        assert row['cash_distribution_cap_from_zero_opening_cash_krw']<=row['cash_distribution_cap_if_floor_already_funded_krw']
    assert rows[1]['monthly_operating_profit_krw']>0
    assert rows[2]['monthly_operating_profit_krw']<0
    assert rows[1]['cash_distribution_cap_from_zero_opening_cash_krw']==0
    assert all(row['personal_after_tax_take_home_krw'] is None for row in rows)


if __name__ == '__main__':
    rows = [audit(profile) for profile in PROFILES]
    verify(rows)
    output = dict(as_of='2026-11-11',status='audit_not_complete_tax_or_cash_flow_forecast',
                  rows=rows,notes=[
                      'Public prices and monthly allowances are unchanged; premium unit costs are illustrative.',
                      'Candidate multipliers assume company-paid additional candidates for the same accepted output count. They must not be added again if every successful regeneration already consumes the advertised allowance.',
                      'Render, copy, support and acquisition budgets otherwise retain the old assumptions; premium creative direction/voice and extra QA may cost more.',
                      'State income tax is zero only for the federal-only illustration, not a legal finding of no state liability.',
                      '$550 is a recurring lower-bound planning example, not a universal annual Delaware bill; first-year agent service is included in the separate $500 Atlas setup fee.',
                      'Reserve floors exclude separately earmarked taxes, VAT/sales-tax liabilities, extra growth budgets, settlement delays, capex and debt principal; add actual values before distributions.',
                      'Accounting expenses, cash movements and earmarked cash are different. Opening unrestricted cash is zero only in the labelled illustration.',
                      'Cash availability does not establish legally distributable corporate profit. Personal take-home remains uncalculated pending entity/tax facts.',
                  ])
    (HERE/'premium-tax-cash-audit.json').write_text(json.dumps(output,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    print(json.dumps([dict(profile=row['profile'],production=row['monthly_production_krw'],
                           operating_profit=row['monthly_operating_profit_krw'],
                           reserve3=row['recommended_three_month_floor_krw'],reserve6=row['six_month_target_krw'],
                           federal_only_cash=row['monthly_cash_after_federal_illustration_krw']) for row in rows],ensure_ascii=False,indent=2))
