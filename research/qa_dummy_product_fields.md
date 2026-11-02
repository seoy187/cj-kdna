# 상품 시트 필드명 (실습용)

`docs/dummy/products/`의 가상 상품 문서 10건을 기준으로 정리했다. 데이터는 `docs/dummy/data/`의 CSV 11개에 있고, 파일 하나가 시트 하나다.

## 상품

### `products.csv` (상품 1건에 1행)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `product_id` | 상품 코드(기본 키) | `P-0000` | P-0113 |
| `name` | 상품명 | 문자열 | 대구사과칩 |
| `description` | 상품 설명 | 문자열 | 팔공산 사과 100%를 저온에서 말린 과자 |
| `is_fresh` | 신선 식품 여부 | true/false | true |
| `allergen_checked` | 알레르기 확인 여부 | true/false | true |
| `status` | 판매 상태 | active/paused/discontinued | active |
| `shipping_policy_id` | 배송 정책 코드 | 문자열 | S-01 |
| `updated_at` | 수정일 | YYYY-MM-DD | 2026-11-02 |

### `product_options.csv` (포장 단위마다 1행)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `product_id` | 상품 코드 | `P-0000` | P-0318 |
| `package` | 포장 단위 | 문자열 | 70ml × 30포 |
| `price` | 가격(원) | 양의 정수, 쉼표 없음 | 24000 |

### `product_storage.csv` (문장마다 1행)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `product_id` | 상품 코드 | `P-0000` | P-0305 |
| `sort_order` | 문서에 나오는 순서 | 양의 정수 | 3 |
| `type` | 유형 | guide(안내)/warning(금지 · 주의) | warning |
| `text` | 내용 | 문자열 | 냉동 보관 금지 — 해동하면 수분이 빠져 질겨짐 |

### `product_notes.csv` (안내마다 1행)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `product_id` | 상품 코드 | `P-0000` | P-0113 |
| `note` | 기타 안내 | 문자열 | 글루텐 없음 |

### `product_sale_periods.csv` (판매 기간마다 1행, 상시 판매는 행 없음)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `product_id` | 상품 코드 | `P-0000` | P-0205 |
| `start_month` | 시작 월 | 1~12 | 4 |
| `end_month` | 끝 월 | 1~12 | 7 |

### `product_ingredients.csv` (재료마다 1행)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `product_id` | 상품 코드 | `P-0000` | P-0207 |
| `ingredient` | 재료명 | 문자열 | 비정제 원당 |
| `origin` | 원산지 | 문자열, 문서에 없으면 빈칸 | 국내산 |
| `percent` | 함량(%) | 1~100, 문서에 없으면 빈칸 | 100 |

### `product_allergens.csv` (물질마다 1행)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `product_id` | 상품 코드 | `P-0000` | P-0402 |
| `allergen` | 알레르기 물질 | `master_allergens.csv`에 있는 이름 | 대두 |
| `type` | 유형 | contains/cross_contact | contains |

## 기준 목록

### `master_allergens.csv`

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `allergen` | 허용된 알레르기 이름 | 문자열 | 견과류 |

## 배송

### `shipping_policies.csv` (정책마다 1행)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `shipping_policy_id` | 배송 정책 코드 | 문자열 | S-01 |
| `free_shipping_min` | 무료 배송 최소 금액(원) | 정수 | 30000 |
| `shipping_fee` | 배송비(원) | 정수 | 2500 |
| `same_day_cutoff` | 당일 배송 주문 마감 | HH:MM | 14:00 |
| `fresh_ship_note` | 신선 식품 발송 안내 | 문자열 | 금요일 주문은 다음 주 월요일 발송 |

### `shipping_same_day_areas.csv` (지역마다 1행)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `shipping_policy_id` | 배송 정책 코드 | 문자열 | S-01 |
| `area` | 당일 배송 지역 | 문자열 | 수성구 |

### `shipping_fresh_days.csv` (요일마다 1행, 요일 순서로 적음)

| 필드명 | 의미 | 형식 | 예시 |
|---|---|---|---|
| `shipping_policy_id` | 배송 정책 코드 | 문자열 | S-01 |
| `day` | 신선 식품 발송 요일 | 월~일 한 글자 | 월 |

## 설계 메모

- `product_allergens.csv`에 행이 없을 때 `allergen_checked`가 true면 "없음", false면 "미확인"이다.
- `is_fresh`는 문서에 기준이 없어 농산물(사과 · 참외 · 마늘 · 토마토 원물)만 true로 정했다. 반건시 같은 건조 가공품은 false다.
- 새 알레르기 물질은 `master_allergens.csv`에 먼저 추가한다.
- `status`, `type`처럼 값이 몇 개로 고정된 코드와 원산지 · 재료명은 별도 시트로 나누지 않았다. 표기 흔들림이 실제로 생기면 그때 기준 목록을 만든다.
- 보관 문장은 온도나 기간 열로 쪼개지 않았다. 표현이 제각각이고 아직 조건 검색이 필요 없다.
