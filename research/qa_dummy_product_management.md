# 상품 데이터 관리 방안 (실습용)

대상은 `docs/dummy/`의 상품 CSV와 가상 상품 문서 10건이다. 1~3단계는 2026-11-02에 적용했다. 이후 DB는 SQLite 대신 Supabase로 정했고, SQL은 사용자가 직접 실행한다.

## Supabase로 옮기기

실습 전용 프로젝트의 SQL Editor에서 차례로 실행한다. 02까지 실행하면 Supabase가 데이터 원본이 되고, 문서 생성은 아직 CSV를 읽는다.

1. `docs/dummy/supabase/01_schema.sql`: 테이블 11개와 RLS
2. `docs/dummy/supabase/02_seed.sql`: 가상 상품 데이터
3. `docs/dummy/supabase/03_read_policies.sql`: 선택 사항, 앱이 공개 키로 읽어야 할 때만

- RLS만 켠 상태에서는 공개 키로 읽기와 쓰기가 모두 막힌다.
- CSV를 고쳐 `generate_seed_sql.py`로 시드를 다시 만들어도, 이미 들어간 행은 바뀌지 않는다.

## 사용법

CSV를 고친 뒤 아래 순서로 실행한다. 상품 문서는 직접 고치지 않는다.

```bash
python3 docs/dummy/scripts/validate.py
python3 docs/dummy/scripts/generate_docs.py
```

`generate_docs.py --check`는 파일을 쓰지 않고 CSV와 어긋난 문서만 알려 준다. 생성 전 원본 문서는 `docs/dummy/products_original/`에 있다.

## 제안과 달라진 점

- 아래 2단계의 CSV 4개를 시트 11개로 더 나눠 `docs/dummy/data/`에 모았다. 현재 구조는 `research/qa_dummy_product_fields.md`를 따른다.
- 재료 시트에 `percent`를 추가했다. 원문의 "사과 100%", "대추 100%"를 보존하기 위해서다.
- `shipping_policies.csv`에 `fresh_ship_note`를 추가했다. 금요일 주문 안내를 문서에 그대로 내기 위해서다.
- 알레르기 이름 목록은 스크립트가 아니라 `master_allergens.csv`에서 관리한다.

## 결론

상품 10건에 DB 서버는 과하다. 원본을 하나로 정하고, CSV를 나누고, 검증 스크립트를 붙인 뒤, 필요해지면 SQLite로 옮긴다.

## 현재 구조의 문제

| 문제 | 현재 모습 | 생길 수 있는 일 |
|---|---|---|
| 원본이 둘 | md 문서와 CSV에 같은 내용이 있음 | 한쪽 가격만 고쳐 값이 어긋남 |
| 한 칸에 여러 값 | `밀\|대두`, `흑마늘\|정제수` | 알레르기별 조회 · 검증이 어려움 |
| 빈칸의 의미가 모호 | `allergens`와 `origin`의 빈칸 | "없음"과 "미확인"을 구분할 수 없음 |
| 입력 검증 없음 | 가격 · 코드 · `is_fresh`를 손으로 입력 | 오타와 중복 코드를 놓침 |
| 변경 이력 없음 | 폴더가 git 저장소가 아님 | 언제 무엇이 바뀌었는지 알 수 없음 |

## 1단계: 원본과 이력 정하기

- CSV를 원본으로 정하고, 상품 문서는 CSV에서 생성한다.
- git으로 변경 이력을 남긴다.

## 2단계: CSV 나누기

여러 값이 들어가는 칸과 공통 정책을 별도 파일로 뺀다.

| 파일 | 열 |
|---|---|
| `products.csv` | product_id, name, description, price, package, storage, storage_warning, notes, sale_start_month, sale_end_month, is_fresh, status, shipping_policy_id, updated_at |
| `ingredients.csv` | product_id, ingredient, origin |
| `allergens.csv` | product_id, allergen, type |
| `shipping_policies.csv` | shipping_policy_id, free_shipping_min, shipping_fee, same_day_areas, same_day_cutoff, fresh_ship_days |

- `allergens.csv`의 `type`은 `contains`(함유)와 `cross_contact`(생산 라인 공유)로 구분한다.
- 알레르기 확인 결과는 `products.csv`에 `allergen_checked`(true/false) 열을 더해 남긴다. 행이 없고 true면 "없음", false면 "미확인"이다.
- `sale_period`는 시작 월과 끝 월로 나눠 판매 중 여부를 계산할 수 있게 한다.
- `status`는 `active`, `paused`, `discontinued`처럼 정해진 값만 쓴다.
- 보관법은 표현이 제각각이고 아직 조건 검색이 필요 없으므로 문장으로 둔다.

## 3단계: 검증 스크립트

저장 전이나 커밋 전에 실행한다.

- `product_id`가 `P-0000` 형식이고 중복이 없는지
- `price`가 양의 정수인지
- `is_fresh`, `allergen_checked`, `status`가 허용된 값인지
- `ingredients.csv`, `allergens.csv`의 `product_id`가 `products.csv`에 있는지
- 알레르기 이름이 정해진 목록에 있는지(예: `견과류`와 `견과`가 섞이지 않게)

## 4단계: SQLite로 옮기는 시점

아래 중 하나에 해당할 때 옮긴다. 2단계의 파일이 그대로 테이블이 되므로 옮기는 비용은 작다.

- 파일을 넘나드는 조회가 잦아질 때
- 앱이나 챗봇이 데이터를 직접 읽어야 할 때
- 상품이 수백 건으로 늘어날 때

여러 사람이 동시에 수정해야 하면 PostgreSQL 같은 서버 DB를 검토한다.

## 진행 전 확인할 것

- 납작만두 `origin`이 빈칸이다. 원문에 원산지가 없다.
- 납작만두의 "제조 라인에서 계란 사용"을 `cross_contact`로 분류해도 되는지 확인이 필요하다.
- 사과칩과 대추칩은 문서에 함유 알레르기 "없음"이 명시되어 있지 않아 `allergen_checked`를 false로 시작한다.
