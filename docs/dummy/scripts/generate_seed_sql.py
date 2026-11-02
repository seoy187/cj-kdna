#!/usr/bin/env python3
# data/의 시트에서 supabase/02_seed.sql을 생성한다. 다시 실행해도 있는 행은 건드리지 않는 SQL을 만든다
import csv
from collections import defaultdict
from pathlib import Path

DUMMY_DIR = Path(__file__).resolve().parent.parent
DATA_DIR = DUMMY_DIR / 'data'
OUT_PATH = DUMMY_DIR / 'supabase' / '02_seed.sql'

TEXT, INT, BOOL, DATE = 'text', 'int', 'bool', 'date'

# 외래 키 순서대로 넣는다. order_by가 있으면 그 열의 값마다 행 순서를 sort_order로 저장한다
TABLES = [
    ('master_allergens', {'allergen': TEXT}, None),
    ('shipping_policies', {'shipping_policy_id': TEXT, 'free_shipping_min': INT,
                           'shipping_fee': INT, 'same_day_cutoff': TEXT,
                           'fresh_ship_note': TEXT}, None),
    ('shipping_same_day_areas', {'shipping_policy_id': TEXT, 'area': TEXT}, 'shipping_policy_id'),
    ('shipping_fresh_days', {'shipping_policy_id': TEXT, 'day': TEXT}, 'shipping_policy_id'),
    ('products', {'product_id': TEXT, 'name': TEXT, 'description': TEXT, 'is_fresh': BOOL,
                  'allergen_checked': BOOL, 'status': TEXT, 'shipping_policy_id': TEXT,
                  'updated_at': DATE}, None),
    ('product_options', {'product_id': TEXT, 'package': TEXT, 'price': INT}, 'product_id'),
    ('product_storage', {'product_id': TEXT, 'sort_order': INT, 'type': TEXT, 'text': TEXT}, None),
    ('product_notes', {'product_id': TEXT, 'note': TEXT}, 'product_id'),
    ('product_sale_periods', {'product_id': TEXT, 'start_month': INT, 'end_month': INT}, None),
    ('product_ingredients', {'product_id': TEXT, 'ingredient': TEXT, 'origin': TEXT,
                             'percent': INT}, 'product_id'),
    ('product_allergens', {'product_id': TEXT, 'allergen': TEXT, 'type': TEXT}, 'product_id'),
]


def literal(value, kind):
    # CSV 빈칸은 null로 넣는다
    if value == '':
        return 'null'
    if kind in (INT, BOOL):
        return value
    if kind == DATE:
        return f"'{value} 00:00:00+09'"
    return "'" + value.replace("'", "''") + "'"


def insert_sql(name, columns, order_by):
    with open(DATA_DIR / f'{name}.csv', encoding='utf-8', newline='') as f:
        rows = list(csv.DictReader(f))
    if not rows:
        return f'-- {name}: 행 없음\n'

    names = list(columns)
    if order_by:
        names.append('sort_order')
    counters = defaultdict(int)
    values = []
    for row in rows:
        items = [literal(row[col], kind) for col, kind in columns.items()]
        if order_by:
            counters[row[order_by]] += 1
            items.append(str(counters[row[order_by]]))
        values.append('  (' + ', '.join(items) + ')')
    # "text", "type", "day"처럼 키워드와 겹치는 이름이 있어 열 이름을 모두 따옴표로 감싼다
    quoted = ', '.join(f'"{n}"' for n in names)
    return (f'insert into public.{name} ({quoted}) values\n' + ',\n'.join(values)
            + '\non conflict do nothing;\n')


def main():
    parts = [
        '-- generate_seed_sql.py로 생성한 가상 상품 데이터. 01_schema.sql 다음에 실행한다',
        '-- 이미 있는 행은 건드리지 않으므로 Supabase에서 고친 값을 덮어쓰지 않는다',
        '',
        'begin;',
        '',
    ]
    for name, columns, order_by in TABLES:
        parts.append(insert_sql(name, columns, order_by))
    parts.append('commit;\n')
    OUT_PATH.write_text('\n'.join(parts), encoding='utf-8')
    print(f'생성: {OUT_PATH.name}')


if __name__ == '__main__':
    main()
