"""Verify PDF text, page geometry, sources, and report artifacts locally."""
from __future__ import annotations

import hashlib
import json
import re
import sys
from pathlib import Path

HERE = Path(__file__).resolve().parent
ROOT = HERE.parents[1]
sys.path.insert(0, str(ROOT / '.qa/review-tools'))
from pypdf import PdfReader


def compact(text):
    return re.sub(r'\s+', '', text)


def main():
    stem = 'NEXORA_PROJECT_REPORT_2026-11-12'
    pdf = HERE / (stem + '.pdf')
    reader = PdfReader(pdf)
    structure = json.loads((HERE / 'report-structure.json').read_text(encoding='utf-8'))
    layout = json.loads((HERE / 'verification/layout-report.json').read_text(encoding='utf-8'))
    pages = []
    text_pages = []
    failures = []
    for index, page in enumerate(reader.pages):
        text = page.extract_text()
        text_pages.append(text)
        korean = len(re.findall('[가-힣]', text))
        title_present = compact(structure[index]['title']) in compact(text) if index < len(structure) else False
        width = float(page.mediabox.width)
        height = float(page.mediabox.height)
        entry = {'page': index + 1, 'characters': len(text), 'korean_characters': korean,
                 'title_present': title_present, 'width_pt': width, 'height_pt': height}
        pages.append(entry)
        if len(text) < 100 or korean < 20 or not title_present or abs(width - 595.28) > 2 or abs(height - 841.89) > 2:
            failures.append(entry)
    text = '\n\n'.join(f'--- PAGE {i+1} ---\n{t}' for i, t in enumerate(text_pages))
    (HERE / 'verification/extracted-text.txt').write_text(text, encoding='utf-8')
    missing = [term for term in ['고객이 얻을 수 있는 결과', '프로젝트가 추구하는 방향', '123', '24', 'preview', '2,600'] if compact(term) not in compact(text)]
    if len(reader.pages) != len(structure) or layout['collisions'] or missing or '\ufffd' in text:
        failures.append({'page_count_expected': len(structure), 'page_count_actual': len(reader.pages), 'missing_terms': missing,
                         'layout_collisions': layout['collisions'], 'replacement_characters': text.count('\ufffd')})
    report = {'passed': not failures, 'pdf': pdf.name, 'pages': len(reader.pages), 'bytes': pdf.stat().st_size,
              'sha256': hashlib.sha256(pdf.read_bytes()).hexdigest(), 'korean_characters': len(re.findall('[가-힣]', text)),
              'outline_entries': len(reader.outline), 'layout_collisions': len(layout['collisions']),
              'pages_checked': pages, 'failures': failures}
    (HERE / 'verification/pdf-verification.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps({k: v for k, v in report.items() if k not in {'pages_checked'}}, ensure_ascii=False))
    if failures:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
