#!/usr/bin/env python3
# data/의 시트에서 docs/dummy/products/*.md를 생성한다. --check는 파일을 쓰지 않고 어긋난 문서만 알려 준다
import csv
import sys
from collections import defaultdict
from pathlib import Path

DUMMY_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = DUMMY_DIR / 'data'
OUT_DIR = DUMMY_DIR / 'products'
NOTICE = '<!-- products.csv 등에서 생성된 문서. 직접 고치지 말고 CSV를 고친 뒤 generate_docs.py를 실행한다 -->'


def load(name):
    with open(DATA_DIR / f'{name}.csv', encoding='utf-8', newline='') as f:
        return list(csv.DictReader(f))


def group(name, key):
    grouped = defaultdict(list)
    for row in load(name):
        grouped[row[key]].append(row)
    return grouped


def won_short(amount):
    # 30000 → 3만원
    return f'{amount // 10000}만원' if amount % 10000 == 0 else f'{amount:,}원'


def cutoff_text(cutoff):
    # 14:00 → 오후 2시
    hour, minute = map(int, cutoff.split(':'))
    period = '오전' if hour < 12 else '오후'
    text = f'{period} {hour % 12 or 12}시'
    return f'{text} {minute}분' if minute else text


def days_text(rows):
    # 월 · 화 · 수 · 목 → 월~목
    items = [r['day'] for r in rows]
    return f'{items[0]}~{items[-1]}' if len(items) > 2 else ' · '.join(items)


def summary_line(product, options, periods):
    prices = ' / '.join(f'{o["package"]} · {int(o["price"]):,}원' for o in options)
    text = f'{product["description"]}. {prices}'
    for period in periods:
        text += f'. {period["start_month"]}~{period["end_month"]}월 한정 판매'
    return text


def storage_line(rows):
    rows = sorted(rows, key=lambda r: int(r['sort_order']))
    guides = [r['text'] for r in rows if r['type'] == 'guide']
    warnings = [r['text'] for r in rows if r['type'] == 'warning']
    parts = guides[:]
    if warnings:
        parts.append(f'**{". ".join(warnings)}**')
    return '. '.join(parts)


def ingredient_line(rows):
    parts = []
    for row in rows:
        text = row['ingredient']
        if row['percent']:
            text += f' {row["percent"]}%'
        if row['origin']:
            text += f' ({row["origin"]})'
        parts.append(text)
    return '- ' + ' · '.join(parts)


def allergen_lines(product, rows):
    contains = [r['allergen'] for r in rows if r['type'] == 'contains']
    cross = [r['allergen'] for r in rows if r['type'] == 'cross_contact']
    lines = []
    if contains:
        lines.append(f'- **{" · ".join(contains)} 알레르기 주의**')
    for name in cross:
        lines.append(f'- **{name} 생산 라인 공유 — {name} 알레르기 주의**')
    # 확인된 상품만 "없음"이라고 적는다. 미확인 상품에 없다고 쓰면 위험하다
    if not rows and product['allergen_checked'] == 'true':
        lines.append('- 알레르기 유발 물질 없음')
    return lines


def shipping_lines(policy, areas, days):
    area_text = ' · '.join(r['area'] for r in areas)
    minimum = won_short(int(policy['free_shipping_min']))
    return [
        f'- {area_text}는 당일 배송({cutoff_text(policy["same_day_cutoff"])} 이전 주문), 그 외 지역은 익일 배송',
        f'- {minimum} 이상 무료 배송, {minimum} 미만은 배송비 {int(policy["shipping_fee"]):,}원',
        f'- 신선 식품은 {days_text(days)} 발송, {policy["fresh_ship_note"]}',
    ]


def main():
    check_only = '--check' in sys.argv[1:]
    options = group('product_options', 'product_id')
    storage = group('product_storage', 'product_id')
    notes = group('product_notes', 'product_id')
    periods = group('product_sale_periods', 'product_id')
    ingredients = group('product_ingredients', 'product_id')
    allergens = group('product_allergens', 'product_id')
    policies = {p['shipping_policy_id']: p for p in load('shipping_policies')}
    areas = group('shipping_same_day_areas', 'shipping_policy_id')
    days = group('shipping_fresh_days', 'shipping_policy_id')

    stale = []
    for product in load('products'):
        pid = product['product_id']
        policy_id = product['shipping_policy_id']
        origin_lines = [ingredient_line(ingredients[pid])] + allergen_lines(product, allergens[pid])
        origin_lines += [f'- {n["note"]}' for n in notes[pid]]
        text = '\n'.join([
            f'# {product["name"]} {pid} (가상 상품)',
            '',
            '## 설명',
            summary_line(product, options[pid], periods[pid]),
            '',
            '## 보관법',
            storage_line(storage[pid]),
            '',
            '## 알레르기 · 원산지',
            *origin_lines,
            '',
            '## 배송',
            *shipping_lines(policies[policy_id], areas[policy_id], days[policy_id]),
            '',
            NOTICE,
            '',
        ])
        path = OUT_DIR / f'{pid}_{product["name"]}.md'
        current = path.read_text(encoding='utf-8') if path.exists() else None
        if current != text:
            stale.append(path.name)
            if not check_only:
                path.write_text(text, encoding='utf-8')

    if check_only:
        print('\n'.join(f'어긋남: {name}' for name in stale) or '문서가 CSV와 일치함')
        return 1 if stale else 0
    print(f'문서 {len(stale)}건 갱신')
    return 0


if __name__ == '__main__':
    sys.exit(main())
