import math
import unittest
from calculate_model import BASE, model, national_tax, required, growth_to


class FinancialModelTests(unittest.TestCase):
    def test_tax_thresholds_are_continuous(self):
        for threshold in [14_000_000,50_000_000,88_000_000,150_000_000,300_000_000,500_000_000,1_000_000_000]:
            self.assertLessEqual(abs(national_tax(threshold+1)-national_tax(threshold)),.451)
        self.assertEqual(national_tax(30_000_000),3_240_000)

    def test_required_is_first_count_meeting_both_targets(self):
        for changes in [{},{'focus_share':1},{'media_multiplier':2},{'tax_mode':'reserve'}]:
            row = required(**changes)
            previous = model(row['customers']-1,**changes)
            self.assertGreaterEqual(row['annualized_net_revenue_krw'],1_000_000_000)
            self.assertGreaterEqual(row['personal_take_home_krw'],20_000_000)
            self.assertTrue(previous['annualized_net_revenue_krw']<1_000_000_000 or previous['personal_take_home_krw']<20_000_000)

    def test_more_production_cost_reduces_take_home(self):
        self.assertLess(model(750,media_multiplier=2)['personal_take_home_krw'],model(750)['personal_take_home_krw'])
        self.assertLess(model(750)['personal_take_home_krw'],model(750,utilization=.6)['personal_take_home_krw'])

    def test_cash_reconciles_without_double_counting_taxes(self):
        row = model(750)
        expenses = sum(row[k] for k in ['payment_krw','production_krw','support_krw','replacement_cac_krw','fixed_krw','corporation_tax_reserve_krw','retained_krw','personal_tax_reserve_krw','personal_extra_krw','personal_take_home_krw'])
        self.assertAlmostEqual(row['net_monthly_revenue_krw'],expenses)
        self.assertAlmostEqual(row['personal_take_home_krw'],24_102_904.541333333)

    def test_growth_spend_replaces_steady_state_cac(self):
        ramp = growth_to(750)
        self.assertAlmostEqual(ramp['months'][-1]['ending_customers'],750)
        for month in ramp['months']:
            steady = model(month['ending_customers'])
            expected = steady['operating_profit_krw']+steady['replacement_cac_krw']-month['acquisition_krw']
            self.assertAlmostEqual(month['operating_profit_krw'],expected)
        self.assertLess(ramp['first_year_net_revenue_krw'],model(750)['annualized_net_revenue_krw'])

    def test_losses_do_not_create_personal_income(self):
        row = model(0)
        self.assertLess(row['operating_profit_krw'],0)
        self.assertEqual(row['corporation_tax_reserve_krw'],0)
        self.assertEqual(row['personal_take_home_krw'],0)


if __name__ == '__main__':
    unittest.main()
