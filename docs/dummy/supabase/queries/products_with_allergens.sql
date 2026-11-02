-- 알레르기 유발 물질이 실제로 함유(contains)된 상품을 상품당 한 행으로 조회한다
-- 생산 라인 공유(cross_contact)만 있는 상품과 함유 물질이 미확인인 상품은 나오지 않는다
select
  p.product_id,
  p.name,
  string_agg(a.allergen, ', ' order by a.sort_order) as allergens,
  p.status
from public.products p
join public.product_allergens a on a.product_id = p.product_id
where a.type = 'contains'
group by p.product_id
order by p.product_id;
