from pathlib import Path
import json,html,math
root=Path.cwd();folder=root/'reviews/2026-11-11/complete-financial-plan'
r=json.loads((folder/'financial-model.json').read_text(encoding='utf-8'));a=r['assumptions'];t=r['operating_target'];m=r['minimum'];g=r['funded_growth'];u=r['unfunded_growth']
won=lambda v:f'{v:,.0f}원'
eok=lambda v:f'{v/1e8:.2f}억 원'
rows=[('고객 세금 제외 청구액',t['gross_monthly_krw']),('환불',-t['refund_krw']),('순매출',t['net_monthly_revenue_krw']),('결제·Billing·Tax 예산',-t['payment_krw']),('고급 API·후보·편집·저장',-t['production_krw']),('고객지원',-t['support_krw']),('이탈 고객 대체 유치비',-t['replacement_cac_krw']),('기타 고정비',-t['fixed_krw']),('주정부 보고·프랜차이즈·등록대리인 월 적립',-t['maintenance_monthly_krw']),('법인세 전 이익',t['operating_profit_krw']),('델라웨어 소득세 예산',-t['corporate_delaware_tax_krw']),('연방 소득세 예산',-t['corporate_federal_tax_krw']),('국경간 세금 추가 예비액',-t['corporate_additional_reserve_krw']),('법인 세금·예비액 후 현금',t['after_corporate_reserve_cash_krw']),('재투자 유보 20%',-t['reinvestment_retained_krw']),('유동성 준비 완료 후 배당 여력',t['monthly_dividend_capacity_if_liquidity_funded_krw']),('개인 세금·추가 예비액',-t['personal_total_reserve_krw']),('배당 환전·송금 예산',-t['personal_remittance_krw']),('개인 추가 부담 예산',-t['personal_extra_krw']),('대표 개인 세후 월 수령',t['personal_take_home_krw'])]
planrows=[]
for p,c in zip(a['offers']['premium_rebalanced']['plans'],t['plan_costs_usd']):planrows.append([p['name'],f"${p['monthlyUsd']}",str(p['images']),str(p['videos']),str(p['motionSeconds']),f"${c['total']:.2f}"])
labels={'base':'보수적 기본','us_federal_reference':'연방만·개인 누진세 참고','full_delaware_reference':'연방+델라웨어·개인 누진세 참고','cash_minimum_3m':'3개월 현금 하한 적용','one_candidate':'회사 부담 후보 1회','three_candidates':'회사 부담 후보 3회','full_use_fx1200':'환율 1,200원','churn_8pct':'월 이탈 8%','all_focus':'전부 Focus','all_growth':'전부 Growth','use_60pct':'포함량 60% 사용','motion_price_double':'영상 단가 2배','owner_other_income_1b':'대표 다른 연소득 10억 가정'}
scenario=[]
for x in r['scenarios']:
 z=x['minimum'];scenario.append([labels[x['scenario']],str(z.get('customers','달성 불가')),eok(z.get('annualized_net_revenue_krw',0)),won(z.get('personal_take_home_krw',0))])
mdtable=lambda heads,items:'| '+' | '.join(heads)+' |\n|'+ '|'.join(['---']*len(heads))+'|\n'+ '\n'.join('| '+' | '.join(map(str,row))+' |' for row in items)
head=f'''# NEXORA 통합 손익·세금·회사 현금 계산 결과

작성: 2026-11-11. **요청한 항목을 모두 수치화해 저장한 조건부 계획 모형**이다. 고급 API·회사 부담 후보·법인세·개인세·유지비·재투자·운영 현금·정산 지연·API 선충전·창업비·36개월 현금흐름을 포함한다. C-corp·한국 거주 개인을 계산 기준으로 정했으며 법인 선택이나 실제 세액이 확정됐다는 뜻은 아니다.

## 1. 계산 결론

- 기존 $79/$149·대량 제공안은 고급 API·후보 2회 기준 고객당 기여액이 음수다. 고객 수만 늘려 목표에 도달할 수 없다.
- 재구성 계산안: **Focus $149 / Growth $299**, 아래 제공량. 사이트의 기존 공개 가격을 이번 계산 작업에서 자동 변경하지 않았다.
- 회사 운영 현금을 이미 확보한 정상 상태에서 두 목표의 최소는 **{m['customers']}명·연환산 순매출 {eok(m['annualized_net_revenue_krw'])}·개인 월 {won(m['personal_take_home_krw'])}**이다.
- 운영 계산 기준은 **{t['customers']}명·연환산 순매출 {eok(t['annualized_net_revenue_krw'])}·개인 월 {won(t['personal_take_home_krw'])}**다.
- 이때 회사에 **3개월 하한 {won(t['minimum_cash_3m_krw'])} / 6개월 목표 {won(t['target_cash_6m_krw'])}**를 남긴다. 월 재투자 유보는 별도로 **{won(t['reinvestment_retained_krw'])}**다.
- 따라서 **연매출 10억 원만으로 개인 월 2천만 원을 달성한다는 결론은 성립하지 않는다.** 이번 보수적 고급 API 기준에는 약 31억 원 이상의 연환산 순매출이 필요하다.

## 2. 가격·제공량과 원가

{mdtable(['플랜','월 가격','이미지','최대 30초 영상','선택 AI 장면 초수','제작·저장 원가'],planrows)}

이미지 4K 출력 $0.24＋입력·검토 $0.01 예산, AI 영상 $0.40/초, 회사 부담 후보 2회를 적용한다. 즉 이미지 요청당 $0.50, 선택 AI 장면 초당 $0.80의 예산이다. 고급 음성·렌더링은 편당 $0.50, 문구·검토 $5/$10, 저장 $5/$10, 지원 $12/$18을 둔다. 두 후보는 같은 최종 선택물에 회사가 부담하는 양이며 성공한 재생성을 비용과 고객 한도에 중복 반영하지 않는다. 이는 고급 API 비교 기준이며 세계 최고 성능을 실측했다는 주장이 아니다.

## 3. 세금·유지비·고정비 입력

- 미국 C-corp 연방 21%, 델라웨어 8.7%·소득 귀속 비중 100%를 보수적 계산 사례로 사용한다. 주세 공제 효과 후 법정 세율 참고 합계는 27.873%다.
- **법인 세금 총 준비금은 양의 이익의 최소 35%**로 둔다. 법정 계산액을 넘는 부분은 국경간 과세 추가 예비액이다. 35%는 실제 법정 세율이 아니다.
- 개인은 한국 누진세·지방세, 미국 배당 원천징수 15%, 국세 한도 내 외국납부세액공제를 참고 계산하고 **최소 45% 예비액**을 둔다. 다른 소득 기본값 0원, 개인 추가 부담 월 100만 원, 배당 환전·송금 0.5%＋$20/회를 추가 차감한다.
- 프랜차이즈세는 수권 1,000만 주·발행 800만 주·액면 $0.00001이라는 명시한 가정과 예상 자산으로 두 방식을 계산해 낮은 금액을 선택한다. 기준 연 ${t['franchise_usd']:.0f}, 연차 보고 $50, 2년차 등록 대리인 $100이다. 단순히 모든 회사에 $400으로 고정하지 않는다.
- Atlas $500은 최초 1회 현금 유출이며 첫해 대리인 비용은 다시 넣지 않는다. 2년차 이후 기준 유지비는 연 ${t['annual_maintenance_usd']:.0f}다.
- 고정비 월 1,200만 원: 개발·제품 외주 600만, 서버·모니터링·백업 120만, 한미 회계·신고 100만, 법무·보험·관리 80만, 도구 50만, 기타 운영 여유 250만 원. 실제 견적이 아닌 세부 예산이며 제작·지원비·법정 유지비와 중복하지 않는다.
- 판매세 예시 수납률 8%는 매출·배당에서 전액 제외한다. 결제 수수료는 세금 포함 결제액의 5%＋$0.30/계정이라는 예산이며 실제 Stripe 요금이 아니다. 기준 월 별도 판매세 예수금 {won(t['sales_tax_liability_illustration_krw'])}다.
- 한국의 회사 거주성·국내사업장·다른 주의 과세는 최종 법률 판단을 하지 않았다. 그 불확실성은 추가 예비액과 비교 시나리오로 수치화했다. LLC에 이 C-corp 계산을 그대로 적용하지 않는다.

## 4. 월 손익에서 개인 수령까지 — {t['customers']}명

{mdtable(['항목','월 금액'],[(k,won(v)) for k,v in rows])}

회사 유동성 잔액은 이 표에서 매월 비용처럼 다시 차감하지 않는다. 아래 36개월 현금흐름에서는 실제 잔액이 부족하면 먼저 채우고 그 전에는 배당을 제한한다.

## 5. 회사 유동성·추가 자금

{mdtable(['용도','금액'],[
('3개월 고정 지출＋이행 의무＋고객 유지 예산',won(t['minimum_cash_3m_krw'])),
('6개월 기준 회사 자유 현금 목표',won(t['target_cash_6m_krw'])),
('별도 API 선충전 자산, 15일분',won(t['supplier_prepayment_asset_krw'])),
('별도 정산 대기 매출채권, 7일분',won(t['settlement_receivable_asset_krw'])),
('현재 운영 규모를 즉시 갖출 경우의 현금·선충전·채권·설립비 합계',won(t['minimum_steady_state_capital_krw'])),
('매월 회사 재투자 잉여자금 유보',won(t['reinvestment_retained_krw']))])}

준비 현금은 6개월 약정 고정 지출·지원비·법정 유지비와 다음 한 기간의 제작 이행·고객 유지 예산으로 계산한다. 이미 선충전한 API 자산은 이행 의무의 현금 필요에서 빼서 중복 적립하지 않는다. 추가 국경간 세금 예비액, 판매세, 재투자금은 각각 따로 보관하며 회사 자유 현금으로 계산하지 않는다. 원금 상환·별도 설비투자는 현재 0원이라는 가정으로 넣었고 입력 파일에서 변경할 수 있다.

## 6. 0명에서 시작하는 36개월 현금흐름

월 이탈 3%, CAC $400, 12개월 말 {t['customers']}명 도달, 이후 고객 수 유지 모형이다. 성장기 실제 신규 유치비를 쓰고 기존 이탈 대체비를 또 더하지 않는다.

{mdtable(['항목','계산 결과'],[
('성장기 매월 신규 고객',f"{g['monthly_new_during_ramp']:.1f}명"),
('첫해 누적 순매출',eok(g['first_year_net_revenue_krw'])),
('첫해 신규 고객 유치비',won(g['first_year_acquisition_krw'])),
('현금 마이너스만 피하는 최소 초기 자금',won(u['minimum_additional_funding_krw'])),
('성장 내내 3개월 하한 유지에 필요한 초기 자금',won(u['additional_funding_for_3m_floor_krw'])),
('성장 내내 6개월 목표 유지에 필요한 초기 자금',won(u['additional_funding_for_6m_floor_krw'])),
('모형의 권장 초기 자금, 1천만 원 단위 올림',won(r['recommended_initial_funding_krw'])),
('권장 자금 투입 시 첫 배당 월',f"{g['first_dividend_month']}개월차"),
('권장 자금 투입 시 개인 월 2천만 원 첫 도달',f"{g['first_target_take_home_month']}개월차"),
('36개월 말 회사 자유 현금',won(g['ending_free_cash_krw'])),
('36개월 말 별도 재투자 유보 현금',won(g['ending_reinvestment_cash_krw']))])}

무자본 모형에서 나오는 음수 잔액은 그 자금 없이도 사업을 할 수 있다는 뜻이 아니라 부족한 조달액이다. 권장 초기 자금이 투자된 시나리오는 회사 현금 하한을 지키고, 초기 투자 원금을 이익인 것처럼 대표에게 지급하지 않도록 예산상 누적 이익 한도도 적용한다. 세금·법정 비용의 실제 납부일은 단순화한 분기·월·연 스케줄이며 추가 예비액을 세금으로 납부한 것처럼 처리하지 않는다.

## 7. 시나리오별 목표 고객 수 — 회사 준비금 확보 후

{mdtable(['시나리오','고객 수','연환산 순매출','개인 월 수령'],scenario)}

3개월/6개월 현금 정책은 정상 상태 이익을 바꾸는 비용이 아니므로 같은 최소 고객 수가 나올 수 있다. 대신 필요한 초기 자금과 첫 배당 시점이 달라진다.

## 8. 저장 파일과 재현

- [통합 계산기](reviews/2026-11-11/complete-financial-plan/unit-economics.html)
- [전체 입력과 근거](reviews/2026-11-11/complete-financial-plan/assumptions.json)
- [전체 결과 JSON](reviews/2026-11-11/complete-financial-plan/financial-model.json)
- [시나리오 CSV](reviews/2026-11-11/complete-financial-plan/scenarios.csv)
- [36개월 현금흐름·권장 자금 투입](reviews/2026-11-11/complete-financial-plan/cashflow-36-months-funded.csv)
- [36개월 현금흐름·자금 부족 확인용](reviews/2026-11-11/complete-financial-plan/cashflow-36-months-unfunded.csv)
- [계산 소스](reviews/2026-11-11/complete-financial-plan/calculate.py), [검증 코드](reviews/2026-11-11/complete-financial-plan/test_complete_model.py)
- [계산 결과 PDF](NEXORA_COMPLETE_FINANCIAL_PLAN_2026-11-11.pdf)

재현: `python -B reviews/2026-11-11/complete-financial-plan/calculate.py` 후 `python -B reviews/2026-11-11/complete-financial-plan/render_results.py`. 계산 검사는 `python -B -m unittest discover -s reviews/2026-11-11/complete-financial-plan -p test_complete_model.py`.

## 9. 공식 근거와 계산 가정 구분

'''
for x in a['sources']:head+=f"- [{x['title']}]({x['url']}): {x['fact']}\n"
head+='\n공식 단가·세율과 예산 가정을 구분했다. 모델의 법인·운영 장소·다른 소득·채무·실제 계좌 잔액을 확정한 세무 신고서나 매출 예측은 아니다. 고객 반응에 따른 개선은 출시 후 진행하며 사전 고객 반응 조사를 출시 조건으로 추가하지 않는다.\n'
(root/'COMPLETE_FINANCIAL_PLAN.md').write_text(head,encoding='utf-8')
old=root/'API_QUALITY_TAX_CASHFLOW_AUDIT.md'
if not (folder/'previous-audit.md').exists():(folder/'previous-audit.md').write_text(old.read_text(encoding='utf-8'),encoding='utf-8')
old.write_text(head.replace('# NEXORA 통합 손익·세금·회사 현금 계산 결과','# NEXORA API 품질·세금·회사 현금 — 통합 계산 결과',1),encoding='utf-8')
# Read-only report and offline scenario viewer. All displayed values are computed in Python.
E=html.escape
ht=lambda heads,items:'<table><thead><tr>'+''.join('<th>'+E(str(x))+'</th>' for x in heads)+'</tr></thead><tbody>'+''.join('<tr>'+''.join('<td>'+E(str(x))+'</td>' for x in row)+'</tr>' for row in items)+'</tbody></table>'
css="*{box-sizing:border-box}body{margin:0;background:#f3f5fa;color:#173040;font-family:'Malgun Gothic',system-ui,sans-serif;line-height:1.65}main{max-width:1150px;margin:auto;padding:36px 24px}h1{font-size:34px;line-height:1.35}h2{font-size:21px}p{font-size:13px}.panel{background:white;border:1px solid #dce2ec;border-radius:12px;padding:23px;margin:20px 0}.kpis{display:grid;grid-template-columns:repeat(3,1fr);gap:18px}.kpi{border-left:3px solid #635bff;padding-left:13px}.kpi strong{display:block;font-size:25px}.kpi small{color:#607283}table{border-collapse:collapse;width:100%;font-size:12px}td,th{padding:9px;border-bottom:1px solid #dce2ec;text-align:left}th{background:#f1f4f9}a{color:#5148cf}select{padding:10px;max-width:100%;width:440px;border:1px solid #bcc7d6;background:white;border-radius:7px}.scroll{overflow:auto}.note{background:#eeeaff;border-radius:9px;padding:16px}.bad{color:#b23e2c}.good{color:#0a856c}@media(max-width:650px){.kpis{grid-template-columns:1fr}main{padding:20px 14px}}"
summary=f'<p class="note">C-corp·한국 거주 개인의 조건부 계획 계산입니다. 35% 법인·45% 개인 준비금은 실제 법정 세율이 아닙니다. 수령액은 회사 6개월 현금 목표를 이미 확보한 정상 상태 기준이며, 성장기 실제 지급은 아래 현금흐름으로 구분합니다.</p>'
kpis=f'<div class="panel kpis"><div class="kpi">계산 기준 고객<strong>{t["customers"]}명</strong><small>최소 {m["customers"]}명</small></div><div class="kpi">연환산 순매출<strong>{eok(t["annualized_net_revenue_krw"])}</strong></div><div class="kpi">개인 세후 월 수령<strong>{won(t["personal_take_home_krw"])}</strong><small>회사 현금 목표 확보 후</small></div></div>'
water=ht(['항목','월 금액'],[(k,won(v)) for k,v in rows])
cap=ht(['항목','금액'],[('회사 3개월 하한',won(t['minimum_cash_3m_krw'])),('회사 6개월 목표',won(t['target_cash_6m_krw'])),('매월 별도 재투자',won(t['reinvestment_retained_krw'])),('API 선충전 자산',won(t['supplier_prepayment_asset_krw'])),('정산 대기 채권',won(t['settlement_receivable_asset_krw'])),('6개월 잔액 유지 초기 자금',won(r['recommended_initial_funding_krw'])),('첫 개인 월 2천만 원 도달',str(g['first_target_take_home_month'])+'개월차')])
html_doc=f'<!doctype html><html lang="ko"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>NEXORA 통합 손익·세금·현금 계산</title><style>{css}</style><main><p>NEXORA / 2026-11-11 / 계산 결과 저장본</p><h1>고급 API·세금·회사 현금까지<br>통합 계산 결과.</h1>{summary}{kpis}<section class="panel"><h2>시나리오 비교</h2><select id="scenario"></select><p id="scenario-result"></p><div class="scroll">{ht(["시나리오","최소 고객","연환산 순매출","개인 월 수령"],scenario)}</div></section><section class="panel"><h2>품질 우선 재구성 계산안</h2><div class="scroll">{ht(["플랜","월 가격","이미지","숏폼","AI 초수","제작·저장 원가"],planrows)}</div><p>고급 이미지·영상에 회사 부담 후보 2회를 포함했습니다. 후보 2회는 중복 과금하지 않으며, 완성 영상 편수와 AI 장면 초수는 별도입니다. 공개 사이트의 가격은 이 보고서 생성 작업에서 자동 변경하지 않았습니다.</p></section><section class="panel"><h2>월 손익 → 세금·재투자 → 개인 수령</h2><div class="scroll">{water}</div></section><section class="panel"><h2>회사 현금과 초기 자금</h2>{cap}<p>첫해 누적 순매출 {eok(g["first_year_net_revenue_krw"])} / 신규 고객 유치비 {won(g["first_year_acquisition_krw"])}. 매월 신규 {g["monthly_new_during_ramp"]:.1f}명으로 12개월 말 {t["customers"]}명에 도달하는 가정입니다. 최소 현금 잔액을 비용으로 매월 다시 차감하지 않습니다.</p></section><section class="panel"><h2>36개월 실제 지급 모형</h2><div class="scroll">{ht(["월","고객 수","회사 자유 현금","별도 재투자 현금","대표 배당","개인 월 수령"],[[x["month"],f"{x["customers"]:.1f}",won(x["closing_free_cash_krw"]),won(x["reinvestment_cash_balance_krw"]),won(x["dividend_krw"]),won(x["personal_take_home_krw"])] for x in g["months"]])}</div></section><section class="panel"><h2>입력·근거</h2><p>법인 총 준비금 35%, 개인 최소 준비금 45%, 재투자 20%, 현금 6개월, 공급자 선충전 15일, 정산 7일, 환불 2%, 결제 예산 5%+$0.30, CAC $400, 이탈 3%, 환율 1,400원. 고정비·지원·음성·추가 검토 예산은 실측 견적이 아닙니다. 기타 소득·설비투자·부채 원금은 기본 0원으로 입력했습니다.</p>'+''.join('<p><a href="'+E(x['url'])+'">'+E(x['title'])+'</a> — '+E(x['fact'])+'</p>' for x in a['sources'])+'</section></main>'
jsdata=json.dumps([dict(id=x['scenario'],label=labels[x['scenario']],minimum=x['minimum'],at=x['at_operating_target']) for x in r['scenarios']],ensure_ascii=False).replace('<','\\u003c')
html_doc+='<script>const CASES='+jsdata+';const select=document.getElementById("scenario");for(const c of CASES){const o=document.createElement("option");o.value=c.id;o.textContent=c.label;select.append(o)}function show(){const c=CASES.find(x=>x.id===select.value);const m=c.minimum;document.getElementById("scenario-result").textContent=m.attainable?`최소 ${m.customers.toLocaleString()}명 · 연환산 ${(m.annualized_net_revenue_krw/1e8).toFixed(2)}억 원 · 개인 월 ${Math.round(m.personal_take_home_krw).toLocaleString()}원 (회사 현금 준비 완료 후)`:m.reason}select.addEventListener("change",show);show();</script></html>'
(folder/'unit-economics.html').write_text(html_doc,encoding='utf-8')
legacy=root/'reviews/2026-11-11/creative-pricing/unit-economics.html'
if not (folder/'previous-unit-economics.html').exists():(folder/'previous-unit-economics.html').write_text(legacy.read_text(encoding='utf-8'),encoding='utf-8')
legacy.write_text(html_doc,encoding='utf-8')
# Five A4 pages with computed numbers, not an unresolved audit memo.
pdfcss="@page{size:A4;margin:0}*{box-sizing:border-box}html,body{margin:0;font:12px/1.6 'Malgun Gothic',sans-serif;color:#183141;-webkit-print-color-adjust:exact;print-color-adjust:exact}.page{width:210mm;height:297mm;padding:16mm 17mm 20mm;position:relative;break-after:page;overflow:hidden}.page:last-child{break-after:auto}.running{font-size:10px;color:#635bff;border-bottom:1px solid #dce2ec;padding-bottom:10px;margin-bottom:20px}.footer{position:absolute;bottom:10mm;left:17mm;right:17mm;border-top:1px solid #dce2ec;padding-top:8px;font-size:9px;color:#617487;display:flex;justify-content:space-between}h1{font-size:32px;line-height:1.3}h2{font-size:22px}h3{font-size:15px;margin:16px 0 7px}p{font-size:12px}table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:10.3px;line-height:1.55;margin:12px 0}td,th{padding:7px 8px;border-bottom:1px solid #dce2ec;vertical-align:top;text-align:left;overflow-wrap:anywhere}th{background:#f1f4f9}.note{background:#eeeaff;padding:14px;border-radius:7px}.kpis{display:grid;grid-template-columns:1fr 1fr;gap:16px}.kpis div{border-left:3px solid #635bff;padding-left:12px}.kpis strong{font-size:23px;display:block}.small{font-size:10px}a{color:#5148cf}"
texts=[]
texts.append(f'<h1>고급 API·세금·회사 현금<br>통합 계산 결과.</h1>{summary}<div class="kpis"><div>최소 고객<strong>{m["customers"]}명</strong></div><div>계산 기준 고객<strong>{t["customers"]}명</strong></div><div>연환산 순매출<strong>{eok(t["annualized_net_revenue_krw"])}</strong></div><div>개인 세후 월 수령<strong>{won(t["personal_take_home_krw"])}</strong></div></div><h3>고급 API 기준 재구성 계산안</h3>{ht(["플랜","월 가격","이미지","숏폼","AI 초수","제작·저장 원가"],planrows)}<p>기존 $79/$149·대량 제공안은 고급 API·회사 부담 후보 2회에서 고객당 기여액이 음수입니다. 같은 제공량을 유지하는 $199/$399 안의 계산상 최소는 {r["offers"]["premium_same_quantity"]["minimum"]["customers"]}명입니다. 위 $149/$299 안은 진입 가격과 원가를 조정한 계산 제안이며 시장 수요나 성능 우위를 검증한 결과는 아닙니다.</p><p>회사 현금 목표를 마련한 정상 상태 수령액입니다. 초기 현금이 부족한 성장기의 대표 수령은 4쪽에서 별도 계산했습니다. 단순히 매출 10억 원만으로 개인 월 2천만 원을 달성한다는 모형이 아닙니다.</p>')
texts.append('<h2>월 손익에서 대표 개인 수령까지</h2>'+water+'<p class="small">고객 거래의 별도 판매세 예수금은 수익과 대표 수령에서 제외합니다. 최소 회사 현금은 매월 손익 비용으로 반복 차감하지 않고 배당 전 잔액으로 유지합니다.</p>')
texts.append(f'<h2>세금·유지비·회사 현금</h2><p>계산 기준: 델라웨어 C-corp, 한국 거주 개인. 수권 1,000만 주·발행 800만 주·액면 $0.00001, 예상 자산으로 프랜차이즈세 두 방식을 계산합니다. 법인 선택·실제 귀속 소득을 확정한 신고 계산은 아닙니다.</p><p>연방 21%와 델라웨어 8.7%·소득 귀속 100%를 계산한 뒤 법인 총 준비금 최소 35%까지 추가 유보합니다. 개인은 한국 누진세·지방세·미국 원천징수·외국납부세액공제 참고액과 45% 중 큰 금액을 준비합니다. 35%와 45%는 법정 세율이 아닌 보수적 현금 정책입니다.</p><p>Atlas 설립 $500은 1회만, 첫해 대리인 $0 추가·이후 연 $100, 연 보고 $50, 계산된 프랜차이즈세 기준 연 ${t["franchise_usd"]:.0f}를 반영했습니다. 회계·신고 100만 원을 포함한 기타 고정비는 월 1,200만 원의 세부 예산입니다.</p>{cap}<p class="small">회사 현금은 6개월 고정 지출·지원과 한 기간 이행·고객 유지 예산으로 계산합니다. 선충전 자산은 이행 예산에서 차감하고, 정산 채권과 세금 예비액·재투자 현금은 자유 현금과 구분합니다. 기존 투자 원금을 배당 가능한 이익처럼 처리하지 않습니다.</p>')
flowrows=[('첫해 누적 순매출',eok(g['first_year_net_revenue_krw'])),('첫해 신규 고객 유치비',won(g['first_year_acquisition_krw'])),('현금 마이너스만 피하는 초기 자금',won(u['minimum_additional_funding_krw'])),('3개월 현금 하한 유지 초기 자금',won(u['additional_funding_for_3m_floor_krw'])),('6개월 현금 목표 유지 초기 자금',won(u['additional_funding_for_6m_floor_krw'])),('모형의 권장 초기 자금',won(r['recommended_initial_funding_krw'])),('첫 배당',str(g['first_dividend_month'])+'개월차'),('개인 월 2천만 원 첫 도달',str(g['first_target_take_home_month'])+'개월차')]
texts.append('<h2>0명에서 시작하는 자금·36개월 지급</h2>'+ht(['항목','계산 결과'],flowrows)+ht(['월','고객 수','회사 자유 현금','개인 월 수령'],[[x['month'],f"{x['customers']:.0f}",won(x['closing_free_cash_krw']),won(x['personal_take_home_krw'])] for x in g['months'] if x['month'] in [1,3,6,9,12,14,15,18,24,36]])+'<p>12개월 말 900명 도달 가정입니다. 성장기 실제 신규 유치비를 차감하고 이탈 대체비를 중복 차감하지 않습니다. 7일 정산 지연과 15일 API 선충전을 현금 이동으로 반영합니다. 배당은 회사 현금 목표와 누적 예산 이익 한도를 넘는 범위에서만 발생합니다.</p><p class="small">추가 국경간 세금 예비액은 회사에 보관하며 실제 세금으로 납부한 것처럼 처리하지 않습니다. 분기·월·연 납부 시점은 계획 스케줄이며 실제 달력과 다를 수 있습니다. 자금 부족 시나리오의 음수 잔액은 필요한 조달액입니다.</p>')
texts.append('<h2>민감도·계산 근거·저장 파일</h2>'+ht(['시나리오','최소 고객','연환산 순매출','개인 월 수령'],scenario)+'<p class="small">전량 사용, 회사 후보 2회, 이탈 3%, CAC $400, 환율 1,400원, 재투자 20%, 법인 준비금 35%, 개인 준비금 최소 45%가 기본입니다. 실제 고객 반응은 출시 후 개선합니다.</p><p class="small">저장: COMPLETE_FINANCIAL_PLAN.md / API_QUALITY_TAX_CASHFLOW_AUDIT.md / reviews/2026-11-11/complete-financial-plan/assumptions.json, financial-model.json, scenarios.csv, cashflow-36-months-funded.csv, cashflow-36-months-unfunded.csv, calculate.py.</p>'+''.join('<p class="small"><a href="'+E(x['url'])+'">'+E(x['title'])+'</a></p>' for x in a['sources']))
pdfhtml='<!doctype html><html lang="ko"><meta charset="utf-8"><title>NEXORA 통합 손익·세금·현금 계산 결과</title><style>'+pdfcss+'</style><body>'+''.join(f'<section class="page" data-page="{i+1}"><div class="running">NEXORA / COMPLETE FINANCIAL PLAN / 2026-11-11</div><div class="page-body">{content}</div><div class="footer"><span>조건부 계획 계산 · 실제 세무 신고·매출 보장 아님</span><span>{i+1:02d} / 05</span></div></section>' for i,content in enumerate(texts))+'</body></html>'
(folder/'complete-report.html').write_text(pdfhtml,encoding='utf-8')
# Stable PDF helper, isolated browser, no server/API calls.
generator=(root/'reviews/2026-11-11/launch-checklist/generate_pdf.mjs').read_text(encoding='utf-8')
generator=generator.replace("resolve('reviews/2026-11-11/launch-checklist')","resolve('reviews/2026-11-11/complete-financial-plan')").replace("'launch-checklist.html'","'complete-report.html'").replace("'NEXORA_LAUNCH_CHECKLIST_2026-11-11.pdf'","'NEXORA_COMPLETE_FINANCIAL_PLAN_2026-11-11.pdf'").replace("length === 12","length === 5").replace("[1, 7, 9, 12]","[1, 3, 5]")
(folder/'generate_pdf.mjs').write_text(generator,encoding='utf-8')
print('Saved complete report, both current Markdown entry points, offline calculators, five-page printable report, and PDF generator.')
