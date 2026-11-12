"""Build the local, dated NEXORA report without changing application files."""
from __future__ import annotations

import hashlib
import html
import json
import re
import shutil
import subprocess
from datetime import datetime, timezone, timedelta
from pathlib import Path

from report_content import make_pages

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
PRIVATE = ROOT.parent / 'NEXORA_PRIVATE_2026-11-12'
STEM = 'NEXORA_PROJECT_REPORT_2026-11-12'


def inline(text):
    text = html.escape(str(text))
    text = re.sub(r'\*\*(.+?)\*\*', r'<strong>\1</strong>', text)
    return re.sub(r'`([^`]+)`', r'<code>\1</code>', text)


def block(value):
    kind = value['kind']
    if kind in ('p', 'h2', 'h3'):
        tag = kind
        return f'<{tag}>{inline(value["text"])}</{tag}>'
    if kind == 'list':
        return '<ul>' + ''.join(f'<li>{inline(x)}</li>' for x in value['items']) + '</ul>'
    if kind == 'table':
        head = ''.join(f'<th>{inline(x)}</th>' for x in value['headers'])
        rows = ''.join('<tr>' + ''.join(f'<td>{inline(x)}</td>' for x in row) + '</tr>' for row in value['rows'])
        return f'<table class="{value.get("class", "")}"><thead><tr>{head}</tr></thead><tbody>{rows}</tbody></table>'
    if kind == 'callout':
        return f'<aside class="callout {value.get("tone", "")}"><strong>{inline(value["title"])}</strong><p>{inline(value["text"])}</p></aside>'
    if kind == 'flow':
        return '<div class="flow">' + ''.join(f'<span>{inline(x)}</span>' for x in value['items']) + '</div>'
    if kind == 'figure':
        return f'<figure><img src="{html.escape(value["src"])}" style="max-height:{value.get("height", 390)}px" alt="{html.escape(value["caption"])}"><figcaption>{inline(value["caption"])}</figcaption></figure>'
    if kind == 'html':
        return value['html']
    raise ValueError(kind)


CSS = r'''
@font-face{font-family:ReportKorean;src:local('Malgun Gothic');font-weight:400}
@font-face{font-family:ReportKorean;src:local('Malgun Gothic Bold');font-weight:700}
@page{size:A4;margin:0}
*{box-sizing:border-box}html{background:#e8edf2}body{margin:0;color:#18314a;font-family:ReportKorean,'Malgun Gothic',sans-serif;font-size:10pt;line-height:1.72;-webkit-print-color-adjust:exact;print-color-adjust:exact}
.page{width:210mm;height:297mm;position:relative;background:#fff;margin:20px auto;break-after:page;overflow:hidden}
.page:last-child{break-after:auto}.page:before{content:'';position:absolute;left:0;top:0;right:0;height:5px;background:linear-gradient(90deg,#10354b,#6c5ce7,#19a79d)}
.header{position:absolute;top:11mm;left:17mm;right:17mm;display:flex;justify-content:space-between;font-size:8px;letter-spacing:1.2px;color:#688096;text-transform:uppercase}
.page-body{position:absolute;top:23mm;left:17mm;right:17mm;bottom:19mm;overflow:visible}
.footer{position:absolute;bottom:9mm;left:17mm;right:17mm;border-top:1px solid #dce5eb;padding-top:7px;display:flex;justify-content:space-between;color:#718396;font-size:8px;letter-spacing:.2px}
.kicker{font-size:10px;letter-spacing:2px;color:#6558ce;font-weight:bold;margin:0 0 10px}
h1{font-size:25px;line-height:1.35;letter-spacing:-.9px;margin:0 0 15px;color:#102f45;font-weight:700}
h2{font-size:16px;margin:21px 0 8px;line-height:1.45;color:#183c55;letter-spacing:-.35px}
h3{font-size:13px;margin:15px 0 6px;color:#334e67}p{margin:8px 0 11px;word-break:keep-all;overflow-wrap:anywhere}
.lead{font-size:14px;color:#4d667c;line-height:1.85;margin-bottom:17px}.source{font-size:9px;color:#708296;line-height:1.65;margin-top:14px;padding-top:9px;border-top:1px solid #e5ecf1;word-break:break-word}
strong{font-weight:700;color:#12364d}code{font-family:Consolas,ReportKorean,sans-serif;font-size:.88em;color:#53537b;background:#f0f3f7;border-radius:3px;padding:1px 3px;overflow-wrap:anywhere;word-break:break-all}
ul{padding-left:20px;margin:7px 0 14px}li{margin:6px 0;word-break:keep-all;overflow-wrap:anywhere}
table{width:100%;border-collapse:collapse;font-size:11.2px;line-height:1.6;margin:12px 0 15px;table-layout:fixed}
th{background:#173c53;color:white;text-align:left;padding:8px 9px;font-weight:700;vertical-align:top;overflow-wrap:anywhere}td{padding:8px 9px;border-bottom:1px solid #dbe5ec;vertical-align:top;word-break:keep-all;overflow-wrap:anywhere}
tr:nth-child(even) td{background:#f5f8fb}table.compact{font-size:10px;line-height:1.5}table.compact td,table.compact th{padding:6px 7px}
table.financial td:not(:first-child),table.financial th:not(:first-child){text-align:right;font-variant-numeric:tabular-nums}table.wide-first th:first-child,table.wide-first td:first-child{width:39%}
table.checklist th:first-child,table.checklist td:first-child{width:9%}table.checklist th:nth-child(2),table.checklist td:nth-child(2){width:27%}
.callout{border-left:4px solid #6c5ce7;background:#f3f2fc;padding:13px 16px;margin:17px 0}.callout p{margin:6px 0 0;font-size:12px;line-height:1.8}.callout.teal{background:#edf8f6;border-color:#16a38e}.callout.amber{background:#fff8eb;border-color:#db9c37}
.flow{display:flex;flex-wrap:wrap;gap:8px;margin:17px 0}.flow span{background:#eaf1f6;padding:9px 12px;border-radius:5px;font-size:12px;font-weight:bold}.flow span:not(:last-child):after{content:' →';color:#8172d7}
figure{margin:16px 0 20px}figure img{display:block;max-width:100%;height:auto;object-fit:contain;margin:0 auto;border:1px solid #d8e3eb;border-radius:7px}figcaption{font-size:9px;line-height:1.7;color:#6a7f91;margin-top:8px}
.stats{display:grid;grid-template-columns:repeat(3,1fr);gap:13px;margin:29px 0}.stat{border:1px solid #dbe5ee;border-radius:9px;padding:17px 13px}.stat b{display:block;font-size:27px;line-height:1.3;color:#126b75}.stat span{font-size:11px;color:#5d7489}
.cover h1{font-size:47px;line-height:1.25;margin:56px 0 24px;letter-spacing:-2px}.cover .subtitle{font-size:22px;line-height:1.65;color:#405d73;letter-spacing:-.6px}.cover .cover-line{height:3px;background:linear-gradient(90deg,#6a5cdb,#1cb6a4);width:85px;margin:29px 0}.cover .meta{font-size:12px;line-height:1.9;color:#5e7588}
.toc{display:grid;grid-template-columns:1fr 1fr;gap:0 23px;margin-top:19px}.toc a{display:flex;justify-content:space-between;text-decoration:none;color:#28485f;border-bottom:1px solid #e2e9ef;font-size:11px;line-height:1.5;padding:8px 0;gap:10px}.toc .num{color:#7e6bd5;font-weight:bold;min-width:21px;text-align:right}.toc .entry{flex:1}
.small{font-size:10px}.muted{color:#697f91}.chart-label{font:11px ReportKorean,sans-serif}.caption-bar{background:#193c52;color:white;border-radius:8px;padding:17px 19px;margin:17px 0;font-size:15px;line-height:1.7}.caption-bar strong{color:#b1ece2}
@media print{html{background:white}.page{margin:0}}
'''


def main():
    (HERE / 'assets').mkdir(exist_ok=True)
    for src, dest in [
        ('.qa/recurring-billing-v3/pricing-desktop.png', 'pricing-qa.png'),
        ('.qa/recurring-billing-v3/planner-desktop.png', 'planner-qa.png'),
        ('.qa/launch-actions-2026-11-12/export-1x1.png', 'image-export-qa.png'),
    ]:
        shutil.copy2(ROOT / src, HERE / 'assets' / dest)
    for src, dest in [
        ('.qa/recurring-billing-v3/browser-results.json', 'prior-billing-browser-results.json'),
        ('.qa/launch-actions-2026-11-12/browser-results.json', 'prior-image-browser-results.json'),
        ('.qa/launch-actions-2026-11-12/checklist-status.csv', 'prior-launch-checklist-status.csv'),
        ('.qa/launch-actions-2026-11-12/restart-verification.json', 'prior-restart-verification.json'),
        ('.qa/launch-actions-2026-11-12/protected-verification.json', 'prior-price-protection.json'),
    ]:
        shutil.copy2(ROOT / src, HERE / 'verification' / dest)
    model_path = PRIVATE / 'customer-offer-v3' / 'financial-model.json'
    model = json.loads(model_path.read_text(encoding='utf-8'))
    pages = make_pages(ROOT, PRIVATE, model)
    rendered = []
    markdown = ['# NEXORA 프로젝트 종합 정리 보고서', '', '기준일: 2026-11-12 · 한국어 · 내부 검토용', '']
    for number, page in enumerate(pages, 1):
        page['number'] = number
    for page in pages:
        number = page['number']
        body = ''.join(block(x) for x in page.get('blocks', []))
        if page.get('toc'):
            entries = [p for p in pages if p['number'] > 2]
            split = (len(entries) + 1) // 2
            columns = []
            for group in (entries[:split], entries[split:]):
                columns.append('<div>' + ''.join(f'<a href="#page-{p["number"]}"><span class="entry">{inline(p["title"])}</span><span class="num">{p["number"]:02d}</span></a>' for p in group) + '</div>')
            body += '<nav class="toc">' + ''.join(columns) + '</nav>'
        sources = page.get('sources', '')
        if sources:
            body += f'<div class="source">근거 · {inline(sources)}</div>'
        title = '' if page.get('cover') else f'<p class="kicker">{inline(page.get("part", "PROJECT RECORD"))}</p><h1>{inline(page["title"])}</h1>'
        lead = f'<p class="lead">{inline(page["lead"])}</p>' if page.get('lead') else ''
        rendered.append(f'<section class="page {"cover" if page.get("cover") else ""}" id="page-{number}" data-page="{number}" data-title="{html.escape(page["title"])}"><div class="header"><span>NEXORA / PROJECT REPORT</span><span>2026.11.12 · INTERNAL</span></div><div class="page-body">{title}{lead}{body}</div><footer class="footer"><span>현재 코드 · 문서 기록 · 조건부 사업 계획</span><span>{number:02d} / {len(pages):02d}</span></footer></section>')
        markdown += [f'## {number:02d}. {page["title"]}', '']
        if page.get('lead'):
            markdown += [page['lead'], '']
        for item in page.get('blocks', []):
            kind = item['kind']
            if kind in ('p', 'h2', 'h3'):
                markdown += [(('### ' if kind == 'h2' else '#### ' if kind == 'h3' else '') + item['text']), '']
            elif kind == 'list':
                markdown += ['\n'.join('- ' + x for x in item['items']), '']
            elif kind == 'table':
                markdown += ['| ' + ' | '.join(item['headers']) + ' |', '| ' + ' | '.join('---' for _ in item['headers']) + ' |']
                markdown += ['| ' + ' | '.join(str(x).replace('|', '/') for x in row) + ' |' for row in item['rows']] + ['']
            elif kind == 'callout':
                markdown += [f'> **{item["title"]}** {item["text"]}', '']
            elif kind == 'flow':
                markdown += [' → '.join(item['items']), '']
            elif kind == 'figure':
                markdown += [f'![{item["caption"]}]({item["src"]})', '']
            elif kind == 'html' and item.get('text'):
                markdown += [item['text'], '']
        if sources:
            markdown += ['근거: ' + sources, '']
    document = '<!doctype html><html lang="ko"><head><meta charset="UTF-8"><title>NEXORA 프로젝트 종합 정리 보고서 · 2026-11-12</title><style>' + CSS + '</style></head><body>' + ''.join(rendered) + '</body></html>'
    (HERE / (STEM + '.html')).write_text(document, encoding='utf-8')
    (HERE / (STEM + '.md')).write_text('\n'.join(markdown), encoding='utf-8')
    (HERE / 'report-structure.json').write_text(json.dumps([{'page': p['number'], 'title': p['title'], 'sources': p.get('sources', '')} for p in pages], ensure_ascii=False, indent=2), encoding='utf-8')
    candidates = [ROOT / name for name in ['package.json', 'package-lock.json', 'next.config.ts', 'tsconfig.json', 'AGENTS.md', '.env.example', 'eslint.config.mjs', 'postcss.config.mjs', 'vitest.config.mts']]
    candidates += list(ROOT.glob('*.md')) + list((ROOT / 'src').rglob('*')) + list((ROOT / 'scripts').rglob('*.mjs'))
    candidates += list(ROOT.glob('*.pdf')) + list((ROOT / 'public').rglob('*')) + list((ROOT / '.github').rglob('*.yml'))
    candidates += [ROOT / '.qa/recurring-billing-v3/browser-results.json', ROOT / '.qa/launch-actions-2026-11-12/browser-results.json']
    candidates += [ROOT / '.qa/launch-actions-2026-11-12' / name for name in ['checklist-status.csv', 'restart-verification.json', 'protected-verification.json']]
    candidates += [p for p in (ROOT / 'reviews').rglob('*') if p.suffix.lower() in {'.md', '.json', '.csv', '.py', '.html', '.mjs'}]
    for folder in ['customer-offer-v2', 'customer-offer-v3']:
        candidates += [p for p in (PRIVATE / folder).glob('*') if p.suffix.lower() in {'.md', '.json', '.csv', '.py', '.html', '.pdf'}]
    manifest = []
    for path in sorted(set(p for p in candidates if p.is_file())):
        try:
            display = path.relative_to(ROOT).as_posix()
        except ValueError:
            display = '<PRIVATE>/' + path.relative_to(PRIVATE).as_posix()
        data = path.read_bytes()
        manifest.append({'path': display, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest()})
    (HERE / 'source-manifest.json').write_text(json.dumps({'captured_at_kst': datetime.now(timezone(timedelta(hours=9))).isoformat(timespec='seconds'), 'files': manifest}, ensure_ascii=False, indent=2), encoding='utf-8')
    snapshot = {
        'commit': subprocess.check_output(['git', 'rev-parse', 'HEAD'], cwd=ROOT, text=True).strip(),
        'src_files': len([p for p in (ROOT / 'src').rglob('*') if p.is_file()]),
        'pages': len(list((ROOT / 'src/app').rglob('page.tsx'))),
        'api_routes': len(list((ROOT / 'src/app/api').rglob('route.ts'))),
        'test_files': len(list((ROOT / 'src').rglob('*.test.ts'))) + len(list((ROOT / 'src').rglob('*.test.tsx'))),
        'report_pages': len(pages), 'source_files_hashed': len(manifest),
    }
    (HERE / 'verification' / 'source-snapshot.json').write_text(json.dumps(snapshot, indent=2), encoding='utf-8')
    print(json.dumps(snapshot))


if __name__ == '__main__':
    main()
