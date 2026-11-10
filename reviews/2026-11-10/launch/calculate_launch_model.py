"""Planning sensitivity, not a tax return or a forecast. No external dependencies."""
import csv
import json
import math
from pathlib import Path

ROOT = Path(__file__).resolve().parent
BASE = dict(fx=1400, focus_share=.50, refund_rate=.02, processing_rate=.042,
            processing_fixed_usd=.30, utilization=.40, attempt_multiplier=1.15,
            cost_per_attempt_usd=1., support_usd_per_account=12., churn=.03, cac_usd=400.,
            fixed_krw=12_000_000, federal_rate=.21, state_rate=.05,
            personal_effective_rate=.30, tax_mode='kr_resident_dividend', retention_krw=3_000_000, personal_extra_krw=1_000_000.)

def kr_national_income_tax(taxable):
    # Income Tax Act art.55, no deductions, credits, or other income assumed.
    bands=[(14_000_000,.06,0),(50_000_000,.15,1_260_000),(88_000_000,.24,5_760_000),
           (150_000_000,.35,15_440_000),(300_000_000,.38,19_940_000),(500_000_000,.40,25_940_000),
           (1_000_000_000,.42,35_940_000),(math.inf,.45,65_940_000)]
    return next(max(0,taxable*rate-deduction) for ceiling,rate,deduction in bands if taxable<=ceiling)

def model(customers, **changes):
    a = BASE | changes
    arpu = 149*a['focus_share']+299*(1-a['focus_share'])
    package_cap = 16*a['focus_share']+48*(1-a['focus_share'])
    gross = customers*arpu*a['fx']
    refunds = gross*a['refund_rate']
    revenue = gross-refunds  # Sales tax/VAT is collected for authorities, excluded throughout.
    payment = gross*a['processing_rate']+customers*a['processing_fixed_usd']*a['fx']
    ai = customers*package_cap*a['utilization']*a['attempt_multiplier']*a['cost_per_attempt_usd']*a['fx']
    support = customers*a['support_usd_per_account']*a['fx']
    replacement = customers*a['churn']*a['cac_usd']*a['fx']
    profit = revenue-payment-ai-support-replacement-a['fixed_krw']
    # Illustration: state income tax deductibility from the federal tax base.
    combined = a['federal_rate']+a['state_rate']*(1-a['federal_rate'])
    corporation_tax = max(0,profit)*combined
    company_cash = profit-corporation_tax
    distributable = max(0,company_cash-a['retention_krw'])
    if a['tax_mode']=='kr_resident_dividend':
        # Illustration only: Korean resident, all distribution taxable, treaty eligibility,
        # US 15% withholding fully creditable up to Korean national income tax on this income.
        national=kr_national_income_tax(distributable*12)/12
        local=national*.10
        us_withholding=distributable*.15
        foreign_credit=min(us_withholding,national)
        personal_tax=us_withholding+national+local-foreign_credit
    else:
        personal_tax=distributable*a['personal_effective_rate']
    take_home = max(0,distributable-personal_tax-a['personal_extra_krw'])
    return dict(customers=customers,arpu_usd=arpu,gross_monthly_krw=gross,
                refunds_krw=refunds,net_monthly_revenue_krw=revenue,annualized_net_revenue_krw=revenue*12,
                payment_krw=payment,ai_krw=ai,support_krw=support,replacement_cac_krw=replacement,
                fixed_krw=a['fixed_krw'],pre_corporation_tax_krw=profit,corporation_tax_krw=corporation_tax,
                company_after_tax_krw=company_cash,retained_krw=a['retention_krw'],distributable_krw=distributable,
                personal_tax_reserve_krw=personal_tax,personal_take_home_krw=take_home)

def required(**changes):
    for n in range(1,10001):
        r=model(n,**changes)
        if r['annualized_net_revenue_krw'] >= 1_000_000_000 and r['personal_take_home_krw'] >= 30_000_000:
            return r
    raise ValueError('Target not reached within 10,000 customers')

def growth(target):
    churn=BASE['churn']
    new=target*churn/(1-(1-churn)**12)
    n=0; rows=[]
    for month in range(1,13):
        n=n*(1-churn)+new
        rows.append(dict(month=month,new_customers=new,ending_customers=n,net_revenue_krw=model(n)['net_monthly_revenue_krw']))
    return dict(new_customers_per_month=new,first_year_net_revenue_krw=sum(r['net_revenue_krw'] for r in rows),
                first_year_acquisition_krw=new*12*BASE['cac_usd']*BASE['fx'],months=rows)

if __name__ == '__main__':
    revenue_n=math.ceil(1_000_000_000/(model(1)['annualized_net_revenue_krw']))
    rows=[]
    for label,changes in [('kr_resident_dividend_base',{}),('flat_30pct_no_extra',{'tax_mode':'effective','personal_effective_rate':.30,'personal_extra_krw':0.}),
                          ('flat_40pct',{'tax_mode':'effective','personal_effective_rate':.40}),
                          ('full_use',{'utilization':1.}),('churn_8pct',{'churn':.08}),
                          ('fx_1200',{'fx':1200}),('support_30_usd',{'support_usd_per_account':30.}),
                          ('growth_80pct',{'focus_share':.2}),('all_focus',{'focus_share':1.}),('all_growth',{'focus_share':0.}),
                          ('combined_stress',{'utilization':1.,'churn':.08,'support_usd_per_account':30.,'fx':1200})]:
        rows.append(dict(scenario=label,**required(**changes)))
    year_one=growth(rows[0]['customers'])
    first_year_revenue_target=growth(rows[0]['customers']*1_000_000_000/year_one['first_year_net_revenue_krw'])
    result=dict(assumptions=BASE,revenue_target_only=model(revenue_n),scenarios=rows,first_year_to_base_target=year_one,first_year_revenue_target=first_year_revenue_target)
    (ROOT/'launch-financial-model.json').write_text(json.dumps(result,ensure_ascii=False,indent=2),encoding='utf-8')
    with (ROOT/'launch-scenarios.csv').open('w',newline='',encoding='utf-8-sig') as f:
        writer=csv.DictWriter(f,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)
    print(json.dumps({'revenue_target_only':result['revenue_target_only'],'scenarios':[{k:r[k] for k in ['scenario','customers','annualized_net_revenue_krw','personal_take_home_krw']} for r in rows], 'first_year': {k: {a:b for a,b in result[k].items() if a!='months'} for k in ['first_year_to_base_target','first_year_revenue_target']}},ensure_ascii=False,indent=2))
