import unittest
from calculate import ASSUMPTIONS, monthly, required, personal_tax, franchise_tax, growth_cashflow, assumptions


class CompletePlanningTests(unittest.TestCase):
    def test_real_tax_components_and_budget_are_separate(self):
        r=monthly(900)
        total=r['corporate_delaware_tax_krw']+r['corporate_federal_tax_krw']+r['corporate_additional_reserve_krw']
        self.assertAlmostEqual(total,r['corporate_total_reserve_krw'])
        self.assertAlmostEqual(total,r['operating_profit_krw']*.35)
        self.assertGreater(r['corporate_additional_reserve_krw'],0)
        p=personal_tax(300_000_000,ASSUMPTIONS)
        self.assertAlmostEqual(p['total'],135_000_000)
        self.assertAlmostEqual(p['total'],p['us_withholding']+p['korea_national']+p['korea_local']-p['foreign_credit']+p['additional_reserve'])

    def test_franchise_methods_use_shares_and_assets(self):
        a=assumptions()
        low=franchise_tax(500_000,a);high=franchise_tax(2_000_000,a)
        self.assertEqual(low['selected_usd'],400)
        self.assertEqual(high['selected_usd'],1200)
        a['authorized_shares_assumption']=100000
        self.assertEqual(franchise_tax(2_000_000,a)['authorized_method_usd'],1015)

    def test_full_premium_and_company_paid_candidates_are_costed(self):
        r=monthly(900)
        self.assertAlmostEqual(r['plan_costs_usd'][0]['total'],60)
        self.assertAlmostEqual(r['plan_costs_usd'][1]['total'],154)
        self.assertLess(monthly(900,changes={'company_paid_candidates':1})['production_krw'],r['production_krw'])

    def test_monthly_cost_tax_cash_and_owner_waterfalls_reconcile(self):
        r=monthly(900)
        costs=sum(r[k] for k in ['payment_krw','production_krw','support_krw','replacement_cac_krw','fixed_krw','maintenance_monthly_krw'])
        self.assertAlmostEqual(r['net_monthly_revenue_krw']-costs,r['operating_profit_krw'])
        self.assertAlmostEqual(r['after_corporate_reserve_cash_krw'],r['reinvestment_retained_krw']+r['monthly_dividend_capacity_if_liquidity_funded_krw'])
        owner=sum(r[k] for k in ['personal_total_reserve_krw','personal_remittance_krw','personal_extra_krw','personal_take_home_krw'])
        self.assertAlmostEqual(owner,r['monthly_dividend_capacity_if_liquidity_funded_krw'])

    def test_loss_making_old_offer_has_no_fake_required_count(self):
        r=required('old_advertised')
        self.assertFalse(r['attainable'])
        self.assertNotIn('customers',r)
        self.assertEqual(monthly(750,'old_advertised')['personal_take_home_krw'],0)

    def test_minimum_count_is_an_actual_boundary(self):
        r=required();previous=monthly(r['customers']-1)
        self.assertGreaterEqual(r['personal_take_home_krw'],20_000_000)
        self.assertGreaterEqual(r['annualized_net_revenue_krw'],1_000_000_000)
        self.assertTrue(previous['personal_take_home_krw']<20_000_000 or previous['annualized_net_revenue_krw']<1_000_000_000)

    def test_cash_floor_is_a_balance_not_a_recurring_expense(self):
        r=monthly(900)
        core=r['fixed_krw']+r['support_krw']+r['maintenance_monthly_krw']
        self.assertAlmostEqual(r['target_cash_6m_krw']-r['minimum_cash_3m_krw'],core*3)
        self.assertEqual(r['operating_profit_krw'],monthly(900,changes={'payout_runway_months':3})['operating_profit_krw'])

    def test_forecast_cac_cash_and_tax_reserve_no_double_deductions(self):
        ramp=growth_cashflow(900)
        self.assertAlmostEqual(ramp['months'][11]['customers'],900)
        for r in ramp['months']:
            self.assertAlmostEqual(r['closing_free_cash_krw'],r['opening_free_cash_krw']+r['free_operating_cash_krw']-r['reinvestment_added_krw']-r['dividend_krw'])
            if r['dividend_krw']>0:self.assertGreaterEqual(r['closing_free_cash_krw']+.01,r['liquidity_target_krw'])
        self.assertGreater(ramp['months'][-1]['additional_crossborder_tax_cash_balance_krw'],0)
        self.assertEqual(ramp['months'][0]['dividend_krw'],0)

    def test_funding_covers_cash_shortfall_without_becoming_income(self):
        unfunded=growth_cashflow(900)
        funded=growth_cashflow(900,opening_capital=600_000_000)
        self.assertEqual(funded['minimum_additional_funding_krw'],0)
        self.assertLessEqual(funded['first_target_take_home_month'],unfunded['first_target_take_home_month'])
        self.assertAlmostEqual(funded['first_year_net_revenue_krw'],unfunded['first_year_net_revenue_krw'])
        self.assertLess(funded['additional_funding_for_6m_floor_krw'],.01)

    def test_first_year_agent_is_not_paid_twice(self):
        year1=monthly(900,year=1);year2=monthly(900,year=2)
        self.assertEqual(year1['registered_agent_usd'],0)
        self.assertEqual(year2['registered_agent_usd'],100)


if __name__=='__main__':unittest.main()
