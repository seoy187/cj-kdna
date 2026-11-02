#!/usr/bin/env python3
# data/의 상품 시트를 검사한다. 오류가 있으면 종료 코드 1로 끝난다
import csv
import re
import sys
from datetime import date
from pathlib import Path

DATA_DIR = Path(__file__).resolve().parent.parent / 'data'

ALLERGEN_TYPES = {'contains', 'cross_contact'}
STORAGE_TYPES = {'guide', 'warning'}
STATUSES = {'active', 'paused', 'discontinued'}
BOOLEANS = {'true', 'false'}
DAYS = {'월', '화', '수', '목', '금', '토', '일'}

COLUMNS = {
    'products': ['product_id', 'name', 'description', 'is_fresh', 'allergen_checked', 'status',
                 'shipping_policy_id', 'updated_at'],
    'product_options': ['product_id', 'package', 'price'],
    'product_storage': ['product_id', 'sort_order', 'type', 'text'],
    'product_notes': ['product_id', 'note'],
    'product_sale_periods': ['product_id', 'start_month', 'end_month'],
    'product_ingredients': ['product_id', 'ingredient', 'origin', 'percent'],
    'product_allergens': ['product_id', 'allergen', 'type'],
    'master_allergens': ['allergen'],
    'shipping_policies': ['shipping_policy_id', 'free_shipping_min', 'shipping_fee',
                          'same_day_cutoff', 'fresh_ship_note'],
    'shipping_same_day_areas': ['shipping_policy_id', 'area'],
    'shipping_fresh_days': ['shipping_policy_id', 'day'],
}


def load(name, errors):
    path = DATA_DIR / f'{name}.csv'
    if not path.exists():
        errors.append(f'{name}.csv: 파일 없음')
        return []
    with open(path, encoding='utf-8', newline='') as f:
        reader = csv.DictReader(f)
        if reader.fieldnames != COLUMNS[name]:
            errors.append(f'{name}.csv: 열 구성이 다름 {reader.fieldnames}')
        rows = list(reader)
    for i, row in enumerate(rows, start=2):
        if None in row or None in row.values():
            errors.append(f'{name}.csv:{i}: 열 개수가 맞지 않음')
    return rows


def is_positive_int(value):
    return re.fullmatch(r'[1-9]\d*', value) is not None


def check_required(name, rows, columns, errors):
    for i, row in enumerate(rows, start=2):
        for col in columns:
            if not row[col]:
                errors.append(f'{name}.csv:{i}: {col} 값 누락')


def check_unique(name, rows, columns, errors):
    seen = set()
    for i, row in enumerate(rows, start=2):
        key = tuple(row[c] for c in columns)
        if key in seen:
            errors.append(f'{name}.csv:{i}: 중복 {key}')
        seen.add(key)


def check_ref(name, rows, column, allowed, errors):
    for i, row in enumerate(rows, start=2):
        if row[column] not in allowed:
            errors.append(f'{name}.csv:{i}: 없는 {column} ({row[column]})')


def check_allowed(name, rows, column, allowed, errors):
    for i, row in enumerate(rows, start=2):
        if row[column] not in allowed:
            errors.append(f'{name}.csv:{i}: {column} 값 오류 ({row[column]})')


def check_every_parent_has_row(name, rows, column, parents, errors):
    missing = parents - {row[column] for row in rows}
    if missing:
        errors.append(f'{name}.csv: 행이 없는 {column} {sorted(missing)}')


def check_values(sheets, errors):
    for i, row in enumerate(sheets['products'], start=2):
        if not re.fullmatch(r'P-\d{4}', row['product_id']):
            errors.append(f'products.csv:{i}: product_id 형식 오류 ({row["product_id"]})')
        try:
            date.fromisoformat(row['updated_at'])
        except ValueError:
            errors.append(f'products.csv:{i}: updated_at 날짜 오류 ({row["updated_at"]})')
    for i, row in enumerate(sheets['product_options'], start=2):
        if not is_positive_int(row['price']):
            errors.append(f'product_options.csv:{i}: price는 양의 정수여야 함 ({row["price"]})')
    for i, row in enumerate(sheets['product_storage'], start=2):
        if not is_positive_int(row['sort_order']):
            errors.append(f'product_storage.csv:{i}: sort_order 값 오류 ({row["sort_order"]})')
    for i, row in enumerate(sheets['product_sale_periods'], start=2):
        for col in ('start_month', 'end_month'):
            if not (row[col].isdigit() and 1 <= int(row[col]) <= 12):
                errors.append(f'product_sale_periods.csv:{i}: {col}는 1~12여야 함 ({row[col]})')
    for i, row in enumerate(sheets['product_ingredients'], start=2):
        if row['percent'] and not (row['percent'].isdigit() and 1 <= int(row['percent']) <= 100):
            errors.append(f'product_ingredients.csv:{i}: percent 값 오류 ({row["percent"]})')
    for i, row in enumerate(sheets['shipping_policies'], start=2):
        if not row['free_shipping_min'].isdigit() or not row['shipping_fee'].isdigit():
            errors.append(f'shipping_policies.csv:{i}: 금액은 정수여야 함')
        if not re.fullmatch(r'([01]\d|2[0-3]):[0-5]\d', row['same_day_cutoff']):
            errors.append(f'shipping_policies.csv:{i}: same_day_cutoff는 HH:MM이어야 함')


def main():
    errors = []
    sheets = {name: load(name, errors) for name in COLUMNS}
    # 열이 어긋난 시트는 아래 검사에서 오해를 부르므로 여기서 멈춘다
    if errors:
        print('\n'.join(errors))
        return 1

    products = sheets['products']
    product_ids = {r['product_id'] for r in products}
    policy_ids = {r['shipping_policy_id'] for r in sheets['shipping_policies']}
    allergen_names = {r['allergen'] for r in sheets['master_allergens']}

    check_required('products', products,
                   ['product_id', 'name', 'description', 'shipping_policy_id'], errors)
    check_required('product_options', sheets['product_options'], ['package', 'price'], errors)
    check_required('product_storage', sheets['product_storage'], ['text'], errors)
    check_required('product_notes', sheets['product_notes'], ['note'], errors)
    check_required('product_ingredients', sheets['product_ingredients'], ['ingredient'], errors)
    check_required('master_allergens', sheets['master_allergens'], ['allergen'], errors)

    check_unique('products', products, ['product_id'], errors)
    check_unique('product_options', sheets['product_options'], ['product_id', 'package'], errors)
    check_unique('product_storage', sheets['product_storage'], ['product_id', 'sort_order'], errors)
    check_unique('product_ingredients', sheets['product_ingredients'],
                 ['product_id', 'ingredient'], errors)
    # 같은 물질을 함유와 라인 공유로 동시에 적는 실수도 함께 잡는다
    check_unique('product_allergens', sheets['product_allergens'],
                 ['product_id', 'allergen'], errors)
    check_unique('master_allergens', sheets['master_allergens'], ['allergen'], errors)
    check_unique('shipping_policies', sheets['shipping_policies'], ['shipping_policy_id'], errors)
    check_unique('shipping_same_day_areas', sheets['shipping_same_day_areas'],
                 ['shipping_policy_id', 'area'], errors)
    check_unique('shipping_fresh_days', sheets['shipping_fresh_days'],
                 ['shipping_policy_id', 'day'], errors)

    for name in ('product_options', 'product_storage', 'product_notes', 'product_sale_periods',
                 'product_ingredients', 'product_allergens'):
        check_ref(name, sheets[name], 'product_id', product_ids, errors)
    check_ref('products', products, 'shipping_policy_id', policy_ids, errors)
    check_ref('product_allergens', sheets['product_allergens'], 'allergen', allergen_names, errors)
    for name in ('shipping_same_day_areas', 'shipping_fresh_days'):
        check_ref(name, sheets[name], 'shipping_policy_id', policy_ids, errors)

    check_allowed('products', products, 'is_fresh', BOOLEANS, errors)
    check_allowed('products', products, 'allergen_checked', BOOLEANS, errors)
    check_allowed('products', products, 'status', STATUSES, errors)
    check_allowed('product_storage', sheets['product_storage'], 'type', STORAGE_TYPES, errors)
    check_allowed('product_allergens', sheets['product_allergens'], 'type', ALLERGEN_TYPES, errors)
    check_allowed('shipping_fresh_days', sheets['shipping_fresh_days'], 'day', DAYS, errors)

    # 문서를 만들 수 없는 상품 · 정책을 미리 잡는다
    for name in ('product_options', 'product_storage', 'product_ingredients'):
        check_every_parent_has_row(name, sheets[name], 'product_id', product_ids, errors)
    for name in ('shipping_same_day_areas', 'shipping_fresh_days'):
        check_every_parent_has_row(name, sheets[name], 'shipping_policy_id', policy_ids, errors)

    check_values(sheets, errors)

    if errors:
        print('\n'.join(errors))
        print(f'오류 {len(errors)}건')
        return 1
    print('통과: ' + ', '.join(f'{name} {len(rows)}' for name, rows in sheets.items()))
    return 0


if __name__ == '__main__':
    sys.exit(main())
