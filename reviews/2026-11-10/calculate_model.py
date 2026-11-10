from pathlib import Path
import csv
import json
import math

ROOT = Path(__file__).resolve().parent
ROOT.mkdir(parents=True, exist_ok=True)
BASE = dict(price_usd=299, customers=204, fx=1400, refund_rate=.02,
            direct_rate=.15, payment_rate=.035, churn=.03, cac_usd=400,
            fixed_krw=16_000_000, tax_haircut=.30, reserve_krw=3_000_000)

def calculate(**changes):
    x = BASE | changes
    gross = x['price_usd'] * x['customers'] * x['fx']
    refunds = gross * x['refund_rate']
    revenue = gross - refunds
    direct = gross * x['direct_rate']
    payments = gross * x['payment_rate']
    replacement = x['customers'] * x['churn'] * x['cac_usd'] * x['fx']
    available = revenue - direct - payments - replacement - x['fixed_krw']
    tax = max(available, 0) * x['tax_haircut']
    distributable = available - tax - x['reserve_krw']
    return x | dict(gross_monthly_krw=gross, refunds_monthly_krw=refunds,
        net_monthly_revenue_krw=revenue, annualized_net_revenue_krw=revenue*12,
        direct_monthly_krw=direct, payment_monthly_krw=payments,
        replacement_acquisition_monthly_krw=replacement,
        owner_pool_before_tax_krw=available, tax_sensitivity_krw=tax,
        owner_takehome_capacity_krw=distributable)

scenarios = [('efficient_illustration', {}), ('direct_cost_20pct', {'direct_rate':.20}),
    ('direct_cost_30pct', {'direct_rate':.30}), ('monthly_churn_8pct', {'churn':.08}),
    ('cac_800usd', {'cac_usd':800}), ('fx_1200', {'fx':1200}),
    ('tax_haircut_40pct', {'tax_haircut':.40}), ('fixed_cost_25m', {'fixed_krw':25_000_000}),
    ('240_customers_direct20', {'customers':240,'direct_rate':.20}),
    ('240_customers_direct20_tax40', {'customers':240,'direct_rate':.20,'tax_haircut':.40})]
rows = [dict(scenario=name, **calculate(**change)) for name, change in scenarios]
with (ROOT/'financial-scenarios.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=rows[0].keys()); writer.writeheader(); writer.writerows(rows)

prices=[]
for p in [49,99,199,299,499,999]:
    n=math.ceil(1_000_000_000/(12*p*1400*.98))
    prices.append(dict(price_usd=p,fx_assumption=1400,refund_assumption=.02,
        customers_for_net_1b_annual=n,annualized_net_revenue_krw=n*p*1400*.98*12,
        replacement_customers_per_month_at_3pct=n*.03))
with (ROOT/'price-customer-requirements.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=prices[0].keys());writer.writeheader();writer.writerows(prices)

def cohort(new,churn=.03):
    n=0; records=[]
    for month in range(1,13):
        previous=n; lost=n*churn; n=n-lost+new
        gross=n*299*1400
        revenue=gross*.98
        acq=new*400*1400
        pool=revenue-gross*.15-gross*.035-acq-16_000_000
        records.append(dict(month=month,opening_accounts=previous,churned_accounts=lost,
            new_accounts=new,closing_accounts=n,recognized_net_revenue_krw=revenue,
            acquisition_spend_krw=acq,owner_pool_before_tax_krw=pool))
    return records

unit=cohort(1)
new_for_annual=1_000_000_000/sum(r['recognized_net_revenue_krw'] for r in unit)
new_for_204=204/unit[-1]['closing_accounts']
growth_rows=cohort(new_for_annual)
with (ROOT/'first-year-growth-illustration.csv').open('w',encoding='utf-8-sig',newline='') as f:
    writer=csv.DictWriter(f,fieldnames=growth_rows[0].keys());writer.writeheader();writer.writerows(growth_rows)

summary=dict(base=rows[0],scenarios=[{k:r[k] for k in ['scenario','annualized_net_revenue_krw','owner_takehome_capacity_krw']} for r in rows],prices=prices,
    growth=dict(new_paid_each_month_for_first_year_net_1b=new_for_annual,
        month12_accounts=growth_rows[-1]['closing_accounts'],
        first_year_acquisition_krw=sum(r['acquisition_spend_krw'] for r in growth_rows),
        monthly_new_for_204_by_month12=new_for_204,
        first_year_revenue_when_204_at_month12=sum(r['recognized_net_revenue_krw'] for r in cohort(new_for_204)),
        first_year_owner_pool_before_tax=sum(r['owner_pool_before_tax_krw'] for r in growth_rows)))
(ROOT/'model-assumptions.json').write_text(json.dumps(summary,ensure_ascii=False,indent=2),encoding='utf-8')
print(json.dumps(summary,ensure_ascii=False,indent=2))

