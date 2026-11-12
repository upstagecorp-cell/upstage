"""Finance pages based on the preserved customer-offer-v3 planning model."""
from __future__ import annotations


def finance_pages(model):
    a = model['assumptions']
    target = model['operating_target']
    minimum = model['minimum']
    funded = model['funded_growth']
    unfunded = model['unfunded_growth']
    slower = model['slower_growth']
    P = lambda text: {'kind': 'p', 'text': text}
    H = lambda text: {'kind': 'h2', 'text': text}
    T = lambda headers, rows: {'kind': 'table', 'headers': headers, 'rows': rows, 'class': 'compact financial'}
    C = lambda title, text, tone='amber': {'kind': 'callout', 'title': title, 'text': text, 'tone': tone}
    def page(title, blocks, sources='customer-offer-v3/assumptions.json; financial-model.json; calculate.py'):
        return {'title': title, 'part': 'BUSINESS & FINANCE', 'blocks': blocks, 'sources': sources}
    def man(value, digits=1):
        return f'{value / 10000:,.{digits}f}'
    def eok(value):
        return f'{value / 100000000:,.2f}억 원'
    def usd(value):
        return f'${value:,.2f}'
    def number(value):
        return f'{value:,}'
    pages = []
    pages.append(page('재무 자료의 버전과 철회된 결론', [
        P('프로젝트의 경제성 검토는 텍스트 상품, 저원가 미디어 제안, 고급 API 재검토, 고객 우선 상품 V2, 자동 갱신 V3로 바뀌었다. **서로 다른 제공량·원가·유보 정책을 사용한 결과를 하나의 수익 예상치로 합치지 않는다.**'),
        T(['자료/시점', '그때의 전제', '현재 해석'], [
            ['과거 텍스트 상품', '$149/$299와 텍스트 중심 권리', '기존 구독의 확정 조건·관리 경로를 보존하는 별도 상품'],
            ['11/11 저원가 미디어안', '$79/$149 · 이미지80/160 · 영상16/32 · AI60/120초', '750명·개인 월2,410만원 결론은 품질 우선 사업에 적용하는 것을 철회'],
            ['11/11 API·세금·현금 재검토', '고급 생성·회사 부담 후보·운영 현금 분리', '높은 제공량과 낮은 가격의 원가 충돌을 확인한 정정 자료'],
            ['11/12 고객 제안 V2', '$19 체험 · $79/$149 · AI 장면 별도', '고객이 연 문서. 최신 기본 제공량·경제성 검토의 이전 버전'],
            ['11/12 자동 갱신 V3', 'creative-v3-2026-11-12 · 기본/선택 월상품 자동 갱신', '현재 코드 카탈로그와 연결하는 최신 사업·재무 기준'],
        ]),
        H('V2에서 V3로 달라진 핵심'),
        P('V3는 월 기본 제작과 선택한 월 AI 장면 묶음의 자동 갱신, 수량 변경의 다음 결제일 적용, 구독 후 별도 1회 구매를 명시한다. V2와 V3의 기본 제공량과 핵심 재무 결과는 같다. V3는 기본 수익 목표에 추가 반복매출을 가정하지 않는다.'),
        C('최신 결과도 조건부 계산', f'최소 {number(minimum["customers"])}명, 운영 목표 {number(target["customers"])}명은 실고객 수가 아니다. 연환산 순매출과 대표 수령능력은 모델 조건이 지속되고 필요한 유동성이 이미 확보됐을 때의 산술 결과다.'),
        P('목표는 연 순매출 10억원 이상과 대표 개인 월2천만원 이상이다. 현재 자료에는 실제 유료 고객·전환율·CAC·이탈률·납품원가·매출 실적을 확정할 운영 데이터가 없으므로 이 목표를 달성했다고 쓰지 않는다.'),
    ], 'AD_CREATIVE_PRICING_PLAN.md; API_QUALITY_TAX_CASHFLOW_AUDIT.md; customer-offer-v2/CUSTOMER_OFFER_V2.md; customer-offer-v3/RECURRING_BILLING_V3.md; creative-plans.json'))

    fixed_labels = {
        'development_product_contractors': '개발·제품 외주',
        'hosting_monitoring_backups': '호스팅·감시·백업',
        'us_korea_accounting_filing_budget': '미국·한국 회계/신고 예산',
        'legal_insurance_administration': '법률·보험·행정',
        'software_tools': '소프트웨어',
        'operating_contingency': '운영 예비비',
    }
    fixed_text = ' / '.join(f'{fixed_labels[k]} {man(v,0)}만원' for k,v in a['fixed_costs_krw'].items())
    pages.append(page('최신 모형의 입력과 세금·유보 정의', [
        T(['항목', 'V3에 사용한 가정'], [
            ['판매 구성·사용', f'Focus {a["focus_share"]:.0%} / Growth {1-a["focus_share"]:.0%}, 포함량 {a["utilization"]:.0%} 사용, 평균 월가격 ${target["arpu_usd"]:.0f}'],
            ['환율·환불', f'1달러={a["fx_krw_per_usd"]:,}원, 환불 예산 {a["refund_rate"]:.0%}'],
            ['획득·유지', f'월 이탈 {a["monthly_churn"]:.0%}, 유료 활성 구독자 1명 획득 CAC ${a["cac_usd"]:.0f}'],
            ['제작 품질 예산', f'이미지 $0.24+$0.01, 회사 부담 후보 {a["company_paid_candidates"]:.0f}회; 영상 편집·음성 $0.50/편'],
            ['결제·거래세 예시', '수수료 5%+$0.30, 거래세 별도 수취 8% 예시. 거래세는 매출·배당재원에서 제외'],
            ['법인·개인', '델라웨어 C-corp / 한국 거주 주주의 배당 시나리오. 실제 법인 형태·세금 거주 확정 아님'],
            ['법인 현금 적립', '연방21%·델라웨어8.7% 전액귀속 비교 후 추가 유보를 합해 이익의35% 이상 확보'],
            ['개인 현금 적립', '미국 배당원천징수15%·한국 누진세/공제 단순화 비교 후 배당의45% 이상 확보'],
            ['재투자·인출', '양의 세후 영업현금20% 재투자 구분, 송금0.5%+$20, 개인 추가부담 월100만원'],
            ['현금 시차·기타', 'API 선충전15일, 결제정산7일, 설비투자·부채원금0원 시나리오'],
        ]),
        P('**고정비 월1,200만원의 내역:** '+fixed_text+'. 지원비와 법정 유지비는 별도다. 이 수치는 계약서·청구서 실측이 아닌 예산이다.'),
        C('35%·45%·8%의 의미', '법인35%와 개인45%는 법정 세율이 아닌 현금 유보 정책이다. 거래세8%도 법적 혼합세율이 아닌 수취 예시다. 실제 운영지·법인형태·소득배분·다른 소득·공제·한미 신고에 따라 재계산해야 한다.'),
    ]))

    costs = target['plan_costs_usd']
    plans = a['offers']['customer_first']['plans']
    unit_rows=[]
    for label,key in [('월가격','monthlyUsd'),('이미지 제작','images'),('영상 편집·음성','render_voice'),('기획·문구 검토','copy_review'),('보관·전송','storage'),('제작·보관 합계','total')]:
        values = [p[key] for p in plans] if key=='monthlyUsd' else [c[key] for c in costs]
        unit_rows.append([label,*[usd(x) for x in values]])
    unit_rows.extend([
        ['고객지원',*[usd(p['supportBudgetUsd']) for p in plans]],
        ['환불 예산',*[usd(p['monthlyUsd']*a['refund_rate']) for p in plans]],
        ['결제 예산',*[usd(p['monthlyUsd']*(1+a['sales_tax_collection_illustration'])*a['processing_rate_budget']+a['processing_fixed_usd']) for p in plans]],
        ['이탈 대체 유치비',*[usd(a['monthly_churn']*a['cac_usd']) for p in plans]],
    ])
    contributions=[]
    for p,c in zip(plans,costs):
        contributions.append(p['monthlyUsd']*(1-a['refund_rate'])-c['total']-p['supportBudgetUsd']-(p['monthlyUsd']*(1+a['sales_tax_collection_illustration'])*a['processing_rate_budget']+a['processing_fixed_usd'])-a['monthly_churn']*a['cac_usd'])
    unit_rows.append(['고정비·세금 전 기여액',*[usd(x) for x in contributions]])
    pages.append(page('고객 한 명의 제작원가와 기여액', [
        P('아래는 기본 구독 1명·월·USD 기준이다. 이미지 후보2회와 포함량100% 사용을 적용하며, 기본 영상은 사진 기반 최대30초 MP4를 목표로 한다. 새 AI 움직임 생성은 기본 구독에 포함하지 않는다.'),
        T(['항목 / USD', 'Focus', 'Growth'], unit_rows),
        H('체험과 AI 장면 추가 판매'),
        T(['1회 상품', '가격', '이행·지원', '획득비·고정비·세금 전 기여'], [
            [u['id'],usd(u['oneTimeUsd']),usd(u['fulfilment_and_support_usd']),usd(u['contribution_before_cac_fixed_tax_usd'])]
            for u in model['unit_one_offs']
        ]),
        P('월 AI 묶음과 1회 AI 묶음은 공개 가격이 같지만 갱신·사용기간이 다르다. 위 추가 상품 표는 원자료의 1회 단위 계산이다. 기본 목표에는 이 체험 매출·AI 추가 매출을 넣지 않았다. $19 체험의 기여액만으로 구독자 CAC $400을 회수할 수 없다.'),
        C('모형과 실제 납품의 차이', '이미지 API 단가와 후보 예산은 실제 Image Studio의 사진 합성·정적 이미지 출력 비용을 실측한 값이 아니다. 고급 생성 API 공급자와 완성 영상 납품이 확정되면 성공률·재생성·지원시간을 청구서 기준으로 다시 측정해야 한다.'),
    ]))

    cases=[('매출 목표만',model['revenue_target_only']),('최신 상품 750명',model['customer_offer_at_750']),('두 목표 최소',minimum),('운영 목표',target)]
    pages.append(page('정상상태의 고객 수와 사업 목표', [
        C('최소 규모와 운영 목표', f'두 목표의 계산상 최소는 {number(minimum["customers"])}명, 연환산 순매출 {eok(minimum["annualized_net_revenue_krw"])}, 대표 월 {man(minimum["personal_take_home_krw"])}만원이다. 운영 목표 {number(target["customers"])}명은 대표 월 {man(target["personal_take_home_krw"])}만원의 정상상태 수령능력을 갖는 시나리오다.', 'teal'),
        T(['기준', '유료고객', '연환산 순매출', '대표 월 / 만원'], [[label,number(x['customers']),eok(x['annualized_net_revenue_krw']),man(x['personal_take_home_krw'])] for label,x in cases]),
        P('연환산 순매출은 그달의 환불 후·거래세 제외 순매출에12를 곱한 값이다. 고객0명에서 시작한 첫해 누적 매출과 다르다. 연매출10억원만 충족하는533명은 대표 월2천만원 목표를 충족하지 못한다.'),
        H('과거 높은 제공량을 유지하면'),
        T(['검토 상품', '월가격 Focus/Growth', '두 목표 최소', '현재 채택 여부'], [
            ['기존 제공량·고급 원가', '$79 / $149', '양의 기여액이 없어 불가', '철회된 경제성 전제'],
            ['기존 제공량·가격 인상', '$199 / $399', number(model['offers']['premium_same_quantity']['minimum']['customers'])+'명', '비교 대안'],
            ['고급 생성량 재구성', '$149 / $299', number(model['offers']['premium_rebalanced']['minimum']['customers'])+'명', '비교 대안'],
            ['고객 우선 기본 제작', '$79 / $149', number(minimum['customers'])+'명', '현재 카탈로그 방향'],
        ]),
        P('현재안은 가격을 유지하고 기본 이미지·영상을 재구성하며 비싼 AI 움직임을 선택 구매로 분리한다. 고객은 필요 없는 AI 장면 비용을 기본 요금에 강제로 포함하지 않고, 캠페인·완성 파일 중심으로 상품을 이해할 수 있다.'),
        C('인출능력의 전제', '필요 유동성 확보, 기존 누적 결손과 이익한도 확인, 모델 수준의 원가·이탈·CAC 유지가 전제다. 실제 법적 배당 가능성·고객 수요·매출이나 대표 개인 입금을 보장한 결과가 아니다.'),
    ]))

    waterfall=[
        ('거래세 제외 청구액','gross_monthly_krw','+'),('환불','refund_krw','−'),('순매출','net_monthly_revenue_krw','='),
        ('결제 비용','payment_krw','−'),('제작·보관','production_krw','−'),('고객지원','support_krw','−'),
        ('고객 유지 획득비','replacement_cac_krw','−'),('고정비 + 유지비',None,'−'),('법인세 적립 전 이익','operating_profit_krw','='),
        ('법인 세금·추가 유보','corporate_total_reserve_krw','−'),('세금 유보 후 현금','after_corporate_reserve_cash_krw','='),
        ('재투자 구분20%','reinvestment_retained_krw','−'),('유동성 충족 후 배당능력','monthly_dividend_capacity_if_liquidity_funded_krw','='),
        ('개인 세금·추가 유보','personal_total_reserve_krw','−'),('환전·송금','personal_remittance_krw','−'),
        ('개인 추가 부담','personal_extra_krw','−'),('대표 월 수령능력','personal_take_home_krw','='),
    ]
    pages.append(page('회사 현금에서 대표 수령까지의 흐름', [
        P(f'운영 목표 {number(target["customers"])}명이 이미 유지되는 상태, 월 기준·단위 **만원**. 거래세 예수금 {man(target["sales_tax_liability_illustration_krw"])}만원은 아래 매출과 인출 재원에 포함하지 않는다.'),
        T(['월 항목', '구분', '만원'], [[label,sign,man(target[key] if key else target['fixed_krw']+target['maintenance_monthly_krw'])] for label,key,sign in waterfall]),
        P(f'법인 적립 {man(target["corporate_total_reserve_krw"])}만원은 연방세 예시 {man(target["corporate_federal_tax_krw"])}만원, 주세 예시 {man(target["corporate_delaware_tax_krw"])}만원, 추가 유보 {man(target["corporate_additional_reserve_krw"])}만원으로 나뉜다. 실제 확정 세액은 아니다.'),
        P('개인 적립은 미국 원천징수·한국 소득세·지방세와 단순화한 외국납부세액공제를 비교한 뒤45% 유보 하한을 적용한다. 원천징수와 공제 전 한국 세액을 그대로 모두 더해 중복 차감하지 않는다.'),
        C('현금 잔액과 비용의 구분', '재투자 유보는 회사에 남긴 현금이며 지출한 비용으로 다시 빼지 않는다. 6개월 유동성 목표도 매달 반복 차감하는 비용이 아닌 유지해야 할 잔액이다. 이 표는 누적 결손을 가진 성장기 첫달의 인출표가 아니다.'),
    ]))

    pages.append(page('현금 확보와 12·24개월 성장의 차이', [
        T(['2,600명 정상상태에서의 잔액/자산', '금액'], [
            ['3개월 운영현금 하한',eok(target['minimum_cash_3m_krw'])],['6개월 목표 잔액',eok(target['target_cash_6m_krw'])],
            ['공급자15일 선충전 자산',eok(target['supplier_prepayment_asset_krw'])],['7일 결제정산 미수금',eok(target['settlement_receivable_asset_krw'])],
            ['정상상태 최소 자금: 목표 잔액+선충전+미수금+설립비',eok(target['minimum_steady_state_capital_krw'])],
        ]),
        H('고객0명에서 12개월 말2,600명으로 성장'),
        T(['항목', '모형 결과'], [
            ['성장기 월 신규 고객',f'{funded["monthly_new_during_ramp"]:,.1f}명; 이후 월78명 대체'],
            ['첫해 누적 순매출 / 획득비',eok(funded['first_year_net_revenue_krw'])+' / '+eok(funded['first_year_acquisition_krw'])],
            ['기초자금0원·현금적자 방지 최소 추가자금',eok(unfunded['minimum_additional_funding_krw'])],
            ['기초자금0원·3개월 / 6개월 잔액 유지 추가자금',eok(unfunded['additional_funding_for_3m_floor_krw'])+' / '+eok(unfunded['additional_funding_for_6m_floor_krw'])],
            ['6개월 기준 반올림한 시작자금 시나리오',eok(model['recommended_initial_funding_krw'])],
            ['24개월로 성장 속도를 낮춘 비교',eok(slower['required_initial_funding_krw'])+' 시작; 첫해 순매출 '+eok(slower['funded']['first_year_net_revenue_krw'])],
        ]),
        P('성장기에는 신규 고객 전체의 실제 CAC를 쓰고 정상상태의 이탈 대체 획득비를 또 빼지 않는다. 정산 미수금·공급자 선충전 증가를 비용과 구분하고, 세금 예수금과 유지비 적립을 실제 납부할 때 자유 현금에서 다시 차감하지 않는다.'),
        C('자금 확보와 개인 인출의 차이', f'{eok(funded["opening_capital_krw"])}를 넣은 경로도 누적 결손·유동성·이익한도를 반영하면 첫 배당은 {funded["first_dividend_month"]}개월째에 불과하며 36개월 내 대표 월2천만원 도달은 없다. 자금은 투자·대출 확약이나 실제 은행 잔액이 아니다.'),
    ]))

    scenario_labels={
        'base':'기본 보수 유보', 'us_federal_reference':'주세 귀속0·추가 유보 없는 참고', 'full_delaware_reference':'주세 전액·추가 유보 없는 참고',
        'cash_minimum_3m':'현금 하한3개월', 'one_candidate':'회사 부담 후보1회', 'three_candidates':'회사 부담 후보3회',
        'full_use_fx1200':'환율1,200원', 'churn_8pct':'월 이탈8%', 'all_focus':'전원 Focus', 'all_growth':'전원 Growth',
        'use_60pct':'포함량60% 사용', 'owner_other_income_1b':'개인 다른 연소득10억원', 'cac_100':'CAC $100',
        'production_double':'제작비2배', 'combined_stress':'제작비2배·이탈8%·환율1,200원',
    }
    rows=[]
    for s in model['scenarios']:
        x=s['minimum']
        rows.append([scenario_labels.get(s['scenario'],s['scenario']),number(x['customers'])+'명' if x.get('attainable') else '달성 불가',eok(x['annualized_net_revenue_krw']) if x.get('attainable') else '기여액≤0'])
    pages.append(page('민감도와 아직 검증되지 않은 사업 변수', [
        P('각 행은 해당 입력을 바꿨을 때 두 목표를 동시에 만족하는 정상상태 최소 고객 수다. 실제 발생 확률·고객 예측을 뜻하지 않는다. 연환산은 환불 후·거래세 제외 기준이다.'),
        T(['변경 조건', '최소 고객', '연환산 순매출'], rows),
        P('CAC·이탈·제작 후보 수가 수익성을 크게 바꾼다. 특히 제작비2배와 복합 스트레스에서는 고객당 기여액이0 이하라 고객 수만 늘려 해결할 수 없다. 현금 하한3개월 변경은 정상상태 고객 수를 줄이지 않으며 성장기 자금 경로에 영향을 준다.'),
        C('다음 경제성 확인에 필요한 기록', '유료 구독 획득 단가와 체험 전환, 코호트 이탈, 플랜 구성, 월 사용량, 성공·실패·재시도별 공급자 비용, 지원 시간, 환불/분쟁, 파일 보관·전송, 국가별 결제비와 정산 시차를 실측해야 한다.'),
        P('고객에게 보장하려는 직접 산출물은 제공량·파일·편집·보관·해지 조건이다. 광고 매출·ROAS·유입·구매 증가와 대표 소득은 결과가 관측돼야 판단할 성과이며 상품 가격표만으로 보장할 수 없다.'),
    ], 'customer-offer-v3/scenarios.csv; financial-model.json; assumptions.json; 상품/측정 문서'))

    for start,end in [(0,18),(18,36)]:
        months=funded['months'][start:end]
        rows=[]
        for m in months:
            rows.append([str(m['month']),f'{m["customers"]:,.1f}',man(m['net_revenue_krw'],0),man(m['actual_acquisition_krw'],0),man(m['operating_profit_krw'],0),man(m['closing_free_cash_krw'],0),man(m['personal_take_home_krw'],0)])
        blocks=[
            P(f'초기자금 {eok(funded["opening_capital_krw"])} · 12개월 성장 · 월 이탈3% · 단위 **만원**(고객은 명). 월번호는 사업 개시 후 경과월이며 실제 달력 일정이 아니다.'),
            T(['월','고객','순매출','획득비','적립 전 이익','말 자유현금','개인 수령'],rows),
        ]
        if start==0:
            blocks += [
                P('고객 수의 소수점은 기대 규모를 나타내는 연속 모형이다. 첫12개월은 매달 약254.8명 신규 고객을 유치하며, 13개월부터2,600명 유지를 위해 월78명을 대체한다. 매출은 발생주의 수치이며 정산 후 현금 유입과 다르다.'),
                C('표의 자유 현금', '세금·거래세·유지비 적립과 재투자 현금을 구분한 운영 잔액이다. 초기자금이 포함되어 있으므로 자유현금이 크다는 사실을 누적 영업이익·배당가능액으로 읽으면 안 된다.'),
            ]
        else:
            last=months[-1]
            blocks += [
                P(f'36개월 말 자유 현금 {eok(funded["ending_free_cash_krw"])}, 별도 재투자 잔액 {eok(funded["ending_reinvestment_cash_krw"])}이다. 마지막 달 배당은 {man(last["dividend_krw"],2)}만원이나 세금 유보·송금·개인 추가부담 뒤 개인 수령은0원으로 계산된다.'),
                C('성장기의 핵심 해석', '2,600명의 정상상태 월 수령능력 약2,058만원과 이36개월 경로의 실제 인출0원은 모순이 아니다. 성장기의 누적 손실이 이익한도를 제한하며, 초기 출자금과 이익이 구분되기 때문이다. 실제 법적 배당 판단은 별도 확인이 필요하다.'),
            ]
        pages.append(page(f'36개월 현금흐름 원장 · {start+1}–{end}개월',blocks,'customer-offer-v3/cashflow-36-months-funded.csv; financial-model.json / funded_growth.months; calculate.py'))
    return pages
