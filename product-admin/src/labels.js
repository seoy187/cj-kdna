export const STATUS_LABELS = {
  active: '판매 중',
  paused: '일시 중지',
  discontinued: '판매 종료',
};

export const won = (price) => `${price.toLocaleString('ko-KR')}원`;

export const allergenNames = (product, type) =>
  product.allergens.filter((a) => a.type === type).map((a) => a.allergen);

// 함유 물질이 없을 때 확인 전 상품을 "없음"과 구분한다
export const isAllergenUnknown = (product) =>
  !product.allergen_checked && allergenNames(product, 'contains').length === 0;
