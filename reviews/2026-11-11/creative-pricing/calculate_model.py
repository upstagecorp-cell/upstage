"""Reproducible planning scenarios, not a forecast or a tax return. Standard library only."""
import csv
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
REPO = HERE.parents[2]
CATALOG = json.loads((REPO / 'src/lib/marketing/creative-plans.json').read_text(encoding='utf-8'))
PLAN_BUDGETS = {
    'focus': dict(copyBudgetUsd=1.5,storageBudgetUsd=2.,supportBudgetUsd=6.),
    'growth': dict(copyBudgetUsd=3.,storageBudgetUsd=3.,supportBudgetUsd=10.),
}
BASE = dict(focus_share=.5, fx=1400., refund_rate=.02, payment_rate=.042,
            payment_fixed_usd=.30, utilization=1., media_multiplier=1.,
            image_usd=.04, video_render_usd=.15, motion_second_usd=.075,
            churn=.03, cac_usd=400., fixed_krw=12_000_000.,
            federal_rate=.21, state_rate=.05, retention_krw=3_000_000.,
            personal_extra_krw=1_000_000., tax_mode='progressive', personal_reserve_rate=.45,
            annual_revenue_target_krw=1_000_000_000., take_home_target_krw=20_000_000.)


def national_tax(annual_taxable):
    # Income Tax Act art.55 effective 2026-07-01; no other income or deductions.
    bands = [(14_000_000,.06,0),(50_000_000,.15,1_260_000),(88_000_000,.24,5_760_000),
             (150_000_000,.35,15_440_000),(300_000_000,.38,19_940_000),
             (500_000_000,.40,25_940_000),(1_000_000_000,.42,35_940_000),
             (math.inf,.45,65_940_000)]
    return next(max(0., annual_taxable*rate-deduction)
                for ceiling,rate,deduction in bands if annual_taxable <= ceiling)


def plan_cost(plan, assumptions):
    budget = PLAN_BUDGETS[plan['id']]
    return (plan['images']*assumptions['image_usd'] +
            plan['videos']*assumptions['video_render_usd'] +
            plan['motionSeconds']*assumptions['motion_second_usd'] +
            budget['copyBudgetUsd'] + budget['storageBudgetUsd'])


def model(customers, **changes):
    a = BASE | changes
    if customers < 0 or not 0 <= a['focus_share'] <= 1 or not 0 <= a['utilization'] <= 1:
        raise ValueError('Invalid customer count, plan mix, or utilization')
    if a['fx'] <= 0 or a['media_multiplier'] <= 0 or a['cac_usd'] < 0 or not 0 <= a['churn'] <= 1:
        raise ValueError('Invalid exchange rate, costs, or churn')
    focus, growth = CATALOG['plans']
    mix = lambda field: focus[field]*a['focus_share'] + growth[field]*(1-a['focus_share'])
    arpu = mix('monthlyUsd')
    unit_production = (plan_cost(focus,a)*a['focus_share'] +
                       plan_cost(growth,a)*(1-a['focus_share']))*a['utilization']*a['media_multiplier']
    gross = customers*arpu*a['fx']
    refunds = gross*a['refund_rate']
    revenue = gross-refunds
    payment = gross*a['payment_rate'] + customers*a['payment_fixed_usd']*a['fx']
    production = customers*unit_production*a['fx']
    unit_support = (PLAN_BUDGETS['focus']['supportBudgetUsd']*a['focus_share'] +
                    PLAN_BUDGETS['growth']['supportBudgetUsd']*(1-a['focus_share']))
    support = customers*unit_support*a['fx']
    replacement = customers*a['churn']*a['cac_usd']*a['fx']
    operating = revenue-payment-production-support-replacement-a['fixed_krw']
    corporation_tax = max(0.,operating)*(a['federal_rate']+a['state_rate']*(1-a['federal_rate']))
    company_after_tax = operating-corporation_tax
    distribution = max(0.,company_after_tax-a['retention_krw'])
    national = national_tax(distribution*12)/12
    withholding = distribution*.15
    credit = min(withholding,national)
    progressive_reserve = withholding+national+national*.10-credit
    personal_tax = (progressive_reserve if a['tax_mode']=='progressive'
                    else distribution*a['personal_reserve_rate'])
    take_home = max(0.,distribution-personal_tax-a['personal_extra_krw'])
    return dict(customers=customers, arpu_usd=arpu, gross_monthly_krw=gross,
                refunds_krw=refunds, net_monthly_revenue_krw=revenue,
                annualized_net_revenue_krw=revenue*12, payment_krw=payment,
                production_krw=production, support_krw=support, replacement_cac_krw=replacement,
                fixed_krw=a['fixed_krw'], operating_profit_krw=operating,
                corporation_tax_reserve_krw=corporation_tax, company_after_tax_krw=company_after_tax,
                retained_krw=min(a['retention_krw'],max(0.,company_after_tax)),
                distribution_krw=distribution, personal_tax_reserve_krw=personal_tax,
                personal_extra_krw=a['personal_extra_krw'], personal_take_home_krw=take_home)


def required(**changes):
    a = BASE | changes
    for count in range(1,20_001):
        result = model(count,**changes)
        if (result['annualized_net_revenue_krw'] >= a['annual_revenue_target_krw'] and
                result['personal_take_home_krw'] >= a['take_home_target_krw']):
            return result
    raise ValueError('Targets cannot be reached within 20,000 customers')


def growth_to(target, **changes):
    a = BASE | changes
    churn = a['churn']
    new = target/12 if churn == 0 else target*churn/(1-(1-churn)**12)
    current = 0.
    months = []
    for month in range(1,13):
        current = current*(1-churn)+new
        result = model(current,**changes)
        # Actual new-customer spend replaces steady-state replacement CAC here.
        actual_acquisition = new*a['cac_usd']*a['fx']
        operating = result['operating_profit_krw']+result['replacement_cac_krw']-actual_acquisition
        tax = max(0.,operating)*(a['federal_rate']+a['state_rate']*(1-a['federal_rate']))
        months.append(dict(month=month, ending_customers=current, new_customers=new,
                           net_revenue_krw=result['net_monthly_revenue_krw'],
                           acquisition_krw=actual_acquisition, operating_profit_krw=operating,
                           company_cash_before_distribution_krw=operating-tax))
    balance = 0.; minimum = 0.
    for row in months:
        balance += row['company_cash_before_distribution_krw']
        minimum = min(minimum,balance)
    return dict(target_customers=target, new_customers_per_month=new,
                first_year_net_revenue_krw=sum(r['net_revenue_krw'] for r in months),
                first_year_acquisition_krw=sum(r['acquisition_krw'] for r in months),
                minimum_working_capital_before_distribution_krw=-minimum,
                note='Illustrative monthly tax reserves; startup costs and founder distributions excluded.',
                months=months)


def report():
    specifications = [
        ('full_allowance',{}), ('use_60pct',{'utilization':.6}),
        ('production_cost_double',{'media_multiplier':2}), ('churn_8pct',{'churn':.08}),
        ('fx_1200',{'fx':1200}), ('all_focus',{'focus_share':1}), ('all_growth',{'focus_share':0}),
        ('personal_reserve_45pct',{'tax_mode':'reserve'}),
        ('combined_stress',{'media_multiplier':2,'churn':.08,'fx':1200}),
    ]
    revenue_only = math.ceil(BASE['annual_revenue_target_krw']/model(1)['annualized_net_revenue_krw'])
    ramp = growth_to(750)
    first_year_target = growth_to(750*BASE['annual_revenue_target_krw']/ramp['first_year_net_revenue_krw'])
    financial_catalog = CATALOG | {'plans':[plan | PLAN_BUDGETS[plan['id']] for plan in CATALOG['plans']]}
    return dict(as_of='2026-11-11', status='planning_only', catalog=financial_catalog, assumptions=BASE,
                production_cost_per_plan_usd={p['id']:plan_cost(p,BASE) for p in CATALOG['plans']},
                revenue_target_only=model(revenue_only), operating_target=model(750),
                scenarios=[dict(scenario=name,**required(**changes)) for name,changes in specifications],
                scenario_settings=dict(specifications),
                first_year_to_750=ramp, first_year_revenue_target=first_year_target,
                tax_scope='Illustrative Korean resident receiving US C-corp dividends; eligibility, 2026 rules, other income, deductions, insurance, and operating location require confirmation.')


if __name__ == '__main__':
    result = report()
    (HERE/'financial-model.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    template = HERE/'unit-economics.template.html'
    if template.exists():
        payload = json.dumps(result,ensure_ascii=False).replace('<','\\u003c')
        (HERE/'unit-economics.html').write_text(template.read_text(encoding='utf-8').replace('__REPORT_JSON__',payload),encoding='utf-8')
    with (HERE/'scenarios.csv').open('w',newline='',encoding='utf-8-sig') as stream:
        writer = csv.DictWriter(stream,fieldnames=list(result['scenarios'][0]))
        writer.writeheader(); writer.writerows(result['scenarios'])
    print(json.dumps(dict(operating_target=result['operating_target'],
                         scenarios=[{k:row[k] for k in ['scenario','customers','annualized_net_revenue_krw','personal_take_home_krw']} for row in result['scenarios']],
                         first_year={key:{k:v for k,v in result[key].items() if k!='months'}
                                     for key in ['first_year_to_750','first_year_revenue_target']}),ensure_ascii=False,indent=2))
