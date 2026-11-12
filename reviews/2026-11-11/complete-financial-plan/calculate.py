"""Complete reproducible planning ledger. All uncertain legal facts are explicit scenarios."""
import copy
import csv
import json
import math
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[2]
ASSUMPTIONS = json.loads((HERE/'assumptions.json').read_text(encoding='utf-8'))


def national_tax(annual):
    bands = [(14e6,.06,0),(50e6,.15,1.26e6),(88e6,.24,5.76e6),(150e6,.35,15.44e6),
             (300e6,.38,19.94e6),(500e6,.40,25.94e6),(1e9,.42,35.94e6),(math.inf,.45,65.94e6)]
    return next(max(0.,annual*rate-deduction) for ceiling,rate,deduction in bands if annual<=ceiling)


def personal_tax(annual_dividend, a):
    us = annual_dividend*a['us_dividend_withholding']
    other=max(0.,a['owner_other_income_annual_krw']-a['owner_deductions_annual_krw'])
    national = national_tax(other+annual_dividend)-national_tax(other)
    credit = min(us,national)
    local = national*.1
    reference = us+national+local-credit
    extra = (max(0.,annual_dividend*a['personal_tax_reserve_floor']-reference)
             if a['personal_tax_mode']=='reserve_45' else 0.)
    return dict(us_withholding=us,korea_national=national,korea_local=local,
                foreign_credit=credit,additional_reserve=extra,total=reference+extra)


def franchise_tax(assets_usd, a):
    authorized = a['authorized_shares_assumption'];issued = a['issued_shares_assumption']
    if authorized<=0 or issued<=0 or assets_usd<0:
        raise ValueError('Positive shares and nonnegative assets required')
    share_method = 175. if authorized<=5000 else 250.+max(0,math.ceil((authorized-10000)/10000))*85.
    assumed_capital = max(a['par_value_usd_assumption'],assets_usd/issued)*authorized
    par_method = max(400.,math.ceil(assumed_capital/1e6)*400.)
    return dict(authorized_method_usd=min(200000.,share_method),
                assumed_par_method_usd=min(200000.,par_method),
                selected_usd=min(200000.,share_method,par_method),gross_assets_usd=assets_usd)


def plan_cost(plan, a):
    candidates = a['company_paid_candidates'];use = a['utilization']
    image = plan['images']*(a['image_output_usd']+a['image_input_review_budget_usd'])*candidates*use
    motion = plan['motionSeconds']*a['motion_second_usd']*candidates*use
    render = plan['videos']*a['render_voice_budget_per_video_usd']*use
    copy_cost = plan['copyBudgetUsd']*use
    storage = plan['storageBudgetUsd']
    return dict(images=image,motion=motion,render_voice=render,copy_review=copy_cost,
                storage=storage,total=image+motion+render+copy_cost+storage,direct_api=image+motion)


def assumptions(changes=None):
    a = copy.deepcopy(ASSUMPTIONS)
    a.update(changes or {})
    for key in ['focus_share','utilization','refund_rate','monthly_churn','delaware_income_share']:
        if not 0<=a[key]<=1: raise ValueError('Rate outside 0..1: '+key)
    if a['fx_krw_per_usd']<=0 or a['company_paid_candidates']<1: raise ValueError('Invalid FX/candidates')
    return a


def monthly(customers, offer='premium_rebalanced', changes=None, year=2, assets_override_krw=None):
    if customers<0: raise ValueError('Negative customer count')
    a = assumptions(changes);fx=a['fx_krw_per_usd'];share=a['focus_share']
    plans=a['offers'][offer]['plans'];costs=[plan_cost(p,a) for p in plans]
    mix=lambda values: values[0]*share+values[1]*(1-share)
    arpu=mix([p['monthlyUsd'] for p in plans])
    gross=customers*arpu*fx;refund=gross*a['refund_rate'];net=gross-refund
    sales_tax=net*a['sales_tax_collection_illustration']
    payment=gross*(1+a['sales_tax_collection_illustration'])*a['processing_rate_budget']+customers*a['processing_fixed_usd']*fx
    production=customers*mix([c['total'] for c in costs])*fx
    direct_api=customers*mix([c['direct_api'] for c in costs])*fx
    support=customers*mix([p['supportBudgetUsd'] for p in plans])*fx
    replacement=customers*a['monthly_churn']*a['cac_usd']*fx
    fixed=sum(a['fixed_costs_krw'].values())
    prepaid=direct_api*a['supplier_prepayment_days']/30
    receivable=net*a['settlement_days']/30
    franchise=400.
    # Conservative fixed point: reserve-sized balance sheet feeds the statutory franchise formula.
    for _ in range(20):
        agent=a['registered_agent_annual_usd_after_year_one'] if year>1 else 0.
        annual_maintenance=franchise+a['annual_report_usd']+agent
        maintenance=annual_maintenance*fx/12
        opex=payment+production+support+replacement+fixed+maintenance
        operating=net-opex
        taxable=max(0.,operating)
        state=taxable*a['delaware_rate']*a['delaware_income_share']
        federal=max(0.,taxable-state)*a['federal_rate']
        crossborder=max(0.,taxable*a['corporate_total_reserve_floor']-federal-state)
        corp=federal+state+crossborder
        after=operating-corp
        reinvest=max(0.,after)*a['reinvestment_share_of_positive_after_tax_cash']
        core=fixed+support+maintenance
        fulfilment=max(0.,production-prepaid)
        reserve3=core*a['minimum_runway_months']+fulfilment+replacement
        reserve6=core*a['target_runway_months']+fulfilment+replacement
        estimated_assets=(reserve6+prepaid+receivable+a['other_company_assets_krw_assumption']+
                          corp*a['corporate_tax_cash_reserve_months']+sales_tax+reinvest)
        tax_assets=estimated_assets if assets_override_krw is None else assets_override_krw
        detail=franchise_tax(max(0.,tax_assets)/fx,a)
        new=max(franchise,detail['selected_usd'])
        if new==franchise: break
        franchise=new
    else: raise ValueError('Franchise fixed point failed')
    dividend=max(0.,after-reinvest-a['other_monthly_capex_krw']-a['monthly_debt_principal_krw'])
    p=personal_tax(dividend*12,a)
    remit=dividend*a['dividend_fx_remittance_rate']+(a['dividend_wire_usd']*fx if dividend>0 else 0)
    take=max(0.,dividend-p['total']/12-remit-a['personal_extra_monthly_krw'])
    unit=net/customers-(payment+production+support+replacement)/customers if customers>0 else 0.
    return dict(customers=customers,offer=offer,arpu_usd=arpu,gross_monthly_krw=gross,
                refund_krw=refund,net_monthly_revenue_krw=net,annualized_net_revenue_krw=net*12,
                sales_tax_liability_illustration_krw=sales_tax,payment_krw=payment,
                production_krw=production,direct_api_krw=direct_api,support_krw=support,
                replacement_cac_krw=replacement,fixed_krw=fixed,franchise_usd=franchise,
                annual_report_usd=a['annual_report_usd'],registered_agent_usd=agent,
                annual_maintenance_usd=annual_maintenance,maintenance_monthly_krw=maintenance,
                operating_outlays_krw=opex,operating_profit_krw=operating,
                corporate_delaware_tax_krw=state,corporate_federal_tax_krw=federal,
                corporate_additional_reserve_krw=crossborder,corporate_total_reserve_krw=corp,
                after_corporate_reserve_cash_krw=after,reinvestment_retained_krw=reinvest,
                monthly_dividend_capacity_if_liquidity_funded_krw=dividend,
                personal_us_withholding_krw=p['us_withholding']/12,
                personal_korea_national_krw=p['korea_national']/12,personal_korea_local_krw=p['korea_local']/12,
                personal_foreign_credit_krw=p['foreign_credit']/12,
                personal_additional_reserve_krw=p['additional_reserve']/12,
                personal_total_reserve_krw=p['total']/12,personal_remittance_krw=remit,
                personal_extra_krw=a['personal_extra_monthly_krw'],personal_take_home_krw=take,
                minimum_cash_3m_krw=reserve3,target_cash_6m_krw=reserve6,
                supplier_prepayment_asset_krw=prepaid,settlement_receivable_asset_krw=receivable,
                estimated_company_assets_krw=estimated_assets,
                minimum_steady_state_capital_krw=reserve6+prepaid+receivable+a['atlas_setup_usd']*fx,
                contribution_per_customer_krw=unit,plan_costs_usd=costs,
                price_pair_usd=[p['monthlyUsd'] for p in plans],
                dividend_scope='Steady capacity only after the liquidity target is already funded; not first-month cash or guaranteed legal distributability.')


def required(offer='premium_rebalanced', changes=None):
    a=assumptions(changes)
    if monthly(1000,offer,changes)['contribution_per_customer_krw']<=0:
        return dict(attainable=False,reason='Negative or zero contribution per customer; more customers do not solve losses.')
    for n in range(1,50001):
        row=monthly(n,offer,changes)
        if row['annualized_net_revenue_krw']>=a['annual_revenue_target_krw'] and row['personal_take_home_krw']>=a['founder_target_monthly_krw']:
            return dict(attainable=True,**row)
    return dict(attainable=False,reason='Targets not reached within 50,000 paying customers under these assumptions.')


def growth_cashflow(target, offer='premium_rebalanced', changes=None, months=36, ramp_months=12, opening_capital=0.):
    a=assumptions(changes);fx=a['fx_krw_per_usd'];churn=a['monthly_churn']
    additions=target/ramp_months if churn==0 else target*churn/(1-(1-churn)**ramp_months)
    customers=0.;free=opening_capital-a['atlas_setup_usd']*fx;reinvest_balance=0.
    receivable=0.;prepaid=0.;retained_profit=0.;year_dividend=0.;year_personal_tax=0.
    rows=[];lowest=min(0.,free);tax_reserve_balance=0.;additional_tax_balance=0.;sales_tax_balance=0.;maintenance_balance=0.
    for month in range(1,months+1):
        year=1+(month-1)//12
        if (month-1)%12==0: year_dividend=0.;year_personal_tax=0.
        new=additions if month<=ramp_months else customers*churn
        customers=customers*(1-churn)+new
        actual_assets=max(0.,free)+reinvest_balance+receivable+prepaid+tax_reserve_balance+additional_tax_balance+sales_tax_balance+maintenance_balance+a['other_company_assets_krw_assumption']
        base=monthly(customers,offer,changes,year,assets_override_krw=actual_assets)
        # Replace replacement marketing with actual acquisition; do not charge both.
        actual_acquisition=new*a['cac_usd']*fx
        operating=base['operating_profit_krw']+base['replacement_cac_krw']-actual_acquisition
        taxable=max(0.,operating)
        de=taxable*a['delaware_rate']*a['delaware_income_share']
        fed=max(0.,taxable-de)*a['federal_rate']
        extra=max(0.,taxable*a['corporate_total_reserve_floor']-de-fed)
        corp=de+fed+extra
        delta_ar=base['settlement_receivable_asset_krw']-receivable
        delta_prepaid=base['supplier_prepayment_asset_krw']-prepaid
        capex=a['other_monthly_capex_krw'];debt=a['monthly_debt_principal_krw']
        free_operating_cash=operating-corp-delta_ar-delta_prepaid-capex-debt
        invested=max(0.,free_operating_cash)*a['reinvestment_share_of_positive_after_tax_cash']
        before=free;free+=free_operating_cash-invested;reinvest_balance+=invested
        retained_profit+=operating-corp
        target_cash=(base['target_cash_6m_krw'] if a['payout_runway_months']>=a['target_runway_months'] else base['minimum_cash_3m_krw'])
        dividend=max(0.,min(free-target_cash,retained_profit-reinvest_balance))
        free-=dividend;retained_profit-=dividend
        year_dividend+=dividend
        p=personal_tax(year_dividend,a)
        personal=max(0.,p['total']-year_personal_tax);year_personal_tax=p['total']
        remit=dividend*a['dividend_fx_remittance_rate']+(a['dividend_wire_usd']*fx if dividend else 0.)
        take=max(0.,dividend-personal-remit-a['personal_extra_monthly_krw'])
        lowest=min(lowest,free)
        tax_reserve_balance+=de+fed;additional_tax_balance+=extra
        sales_tax_balance+=base['sales_tax_liability_illustration_krw'];maintenance_balance+=base['maintenance_monthly_krw']
        # Payments are from earmarked balances; never deduct again from free cash.
        corp_paid=tax_reserve_balance if month%3==0 else 0.
        sales_paid=sales_tax_balance
        maintenance_paid=maintenance_balance if month%12==0 else 0.
        tax_reserve_balance-=corp_paid;sales_tax_balance-=sales_paid;maintenance_balance-=maintenance_paid
        receivable=base['settlement_receivable_asset_krw'];prepaid=base['supplier_prepayment_asset_krw']
        rows.append(dict(month=month,customers=customers,new_customers=new,
                         net_revenue_krw=base['net_monthly_revenue_krw'],actual_acquisition_krw=actual_acquisition,
                         operating_profit_krw=operating,corporate_cash_reserve_krw=corp,
                         cash_receipts_ex_tax_krw=base['net_monthly_revenue_krw']-delta_ar,
                         change_receivable_krw=delta_ar,change_supplier_prepayment_krw=delta_prepaid,
                         free_operating_cash_krw=free_operating_cash,reinvestment_added_krw=invested,
                         reinvestment_cash_balance_krw=reinvest_balance,
                         liquidity_target_krw=target_cash,minimum_cash_3m_krw=base['minimum_cash_3m_krw'],opening_free_cash_krw=before,
                         closing_free_cash_krw=free,dividend_krw=dividend,personal_tax_reserve_krw=personal,
                         personal_remittance_krw=remit,personal_take_home_krw=take,
                         taxes_paid_from_earmarked_balance_krw=corp_paid+sales_paid,
                         maintenance_paid_from_earmarked_balance_krw=maintenance_paid,
                         earmarked_tax_cash_balance_krw=tax_reserve_balance+additional_tax_balance+sales_tax_balance,
                         additional_crossborder_tax_cash_balance_krw=additional_tax_balance,
                         statutory_maintenance_balance_krw=maintenance_balance))
    return dict(target=target,opening_capital_krw=opening_capital,monthly_new_during_ramp=additions,
                minimum_additional_funding_krw=max(0.,-lowest),
                additional_funding_for_3m_floor_krw=max(0.,max(r['minimum_cash_3m_krw']-r['closing_free_cash_krw'] for r in rows)),
                additional_funding_for_6m_floor_krw=max(0.,max(r['liquidity_target_krw']-r['closing_free_cash_krw'] for r in rows)),
                first_year_net_revenue_krw=sum(r['net_revenue_krw'] for r in rows[:12]),
                first_year_acquisition_krw=sum(r['actual_acquisition_krw'] for r in rows[:12]),
                first_dividend_month=next((r['month'] for r in rows if r['dividend_krw']>0),0),
                first_target_take_home_month=next((r['month'] for r in rows if r['personal_take_home_krw']>=a['founder_target_monthly_krw']),0),
                ending_free_cash_krw=free,ending_reinvestment_cash_krw=reinvest_balance,months=rows)


def report():
    offer=ASSUMPTIONS['recommended_offer']
    minimum=required(offer)
    operating_target=math.ceil(minimum['customers']/100)*100 if minimum['attainable'] else 1000
    cases=[('base',{}),('us_federal_reference',{'delaware_income_share':0,'corporate_total_reserve_floor':0,'personal_tax_mode':'statutory_reference'}),
           ('full_delaware_reference',{'corporate_total_reserve_floor':0,'personal_tax_mode':'statutory_reference'}),
           ('cash_minimum_3m',{'payout_runway_months':3}),('one_candidate',{'company_paid_candidates':1}),
           ('three_candidates',{'company_paid_candidates':3}),('full_use_fx1200',{'fx_krw_per_usd':1200}),
           ('churn_8pct',{'monthly_churn':.08}),('all_focus',{'focus_share':1}),('all_growth',{'focus_share':0}),
           ('use_60pct',{'utilization':.6}),('motion_price_double',{'motion_second_usd':.8}),
           ('owner_other_income_1b',{'owner_other_income_annual_krw':1e9})]
    base_growth=growth_cashflow(operating_target,offer)
    funding=math.ceil(base_growth['additional_funding_for_6m_floor_krw']/10e6)*10e6
    return dict(as_of=ASSUMPTIONS['as_of'],status='complete_conditional_planning_calculation',
                assumptions=ASSUMPTIONS,offers={key:dict(at_750=monthly(750,key),minimum=required(key)) for key in ASSUMPTIONS['offers']},
                recommended_offer=offer,minimum=minimum,operating_target=monthly(operating_target,offer),
                scenarios=[dict(scenario=name,changes=changes,at_operating_target=monthly(operating_target,offer,changes),minimum=required(offer,changes)) for name,changes in cases],
                unfunded_growth=base_growth,funded_growth=growth_cashflow(operating_target,offer,opening_capital=funding),
                recommended_initial_funding_krw=funding)


def write_csv(path, rows):
    if not rows: return
    with path.open('w',newline='',encoding='utf-8-sig') as stream:
        writer=csv.DictWriter(stream,fieldnames=list(rows[0]));writer.writeheader();writer.writerows(rows)


if __name__=='__main__':
    result=report()
    (HERE/'financial-model.json').write_text(json.dumps(result,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    write_csv(HERE/'scenarios.csv',[dict(scenario=r['scenario'],attainable=r['minimum']['attainable'],
              customers=r['minimum'].get('customers',0),annualized_revenue_krw=r['minimum'].get('annualized_net_revenue_krw',0),
              founder_net_krw=r['minimum'].get('personal_take_home_krw',0),
              six_month_cash_krw=r['minimum'].get('target_cash_6m_krw',0)) for r in result['scenarios']])
    write_csv(HERE/'cashflow-36-months-unfunded.csv',result['unfunded_growth']['months'])
    write_csv(HERE/'cashflow-36-months-funded.csv',result['funded_growth']['months'])
    print(json.dumps(dict(minimum={k:result['minimum'].get(k) for k in ['attainable','customers','annualized_net_revenue_krw','personal_take_home_krw']},
                         target={k:result['operating_target'][k] for k in ['customers','annualized_net_revenue_krw','personal_take_home_krw','target_cash_6m_krw','operating_profit_krw','corporate_total_reserve_krw','reinvestment_retained_krw']},
                         offers={k:dict(attainable=v['minimum']['attainable'],customers=v['minimum'].get('customers',0),net750=v['at_750']['personal_take_home_krw']) for k,v in result['offers'].items()},
                         growth={key:{k:v for k,v in result[key].items() if k!='months'} for key in ['unfunded_growth','funded_growth']}),ensure_ascii=False,indent=2))
