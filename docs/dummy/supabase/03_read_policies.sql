-- 선택 사항. 앱이나 챗봇이 anon · authenticated 키로 상품을 읽어야 할 때만 실행한다
-- 읽기만 허용하며, 판매 중(active)이 아닌 상품과 그 하위 데이터는 보이지 않는다

begin;

grant select on
  public.master_allergens,
  public.shipping_policies,
  public.shipping_same_day_areas,
  public.shipping_fresh_days,
  public.products,
  public.product_options,
  public.product_storage,
  public.product_notes,
  public.product_sale_periods,
  public.product_ingredients,
  public.product_allergens
to anon, authenticated;

create policy "공개 읽기" on public.master_allergens
  for select to anon, authenticated using (true);
create policy "공개 읽기" on public.shipping_policies
  for select to anon, authenticated using (true);
create policy "공개 읽기" on public.shipping_same_day_areas
  for select to anon, authenticated using (true);
create policy "공개 읽기" on public.shipping_fresh_days
  for select to anon, authenticated using (true);

create policy "판매 중 상품 읽기" on public.products
  for select to anon, authenticated using (status = 'active');

-- 하위 테이블은 상품이 판매 중일 때만 읽는다
create policy "판매 중 상품 읽기" on public.product_options
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.product_id = product_options.product_id and p.status = 'active'));
create policy "판매 중 상품 읽기" on public.product_storage
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.product_id = product_storage.product_id and p.status = 'active'));
create policy "판매 중 상품 읽기" on public.product_notes
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.product_id = product_notes.product_id and p.status = 'active'));
create policy "판매 중 상품 읽기" on public.product_sale_periods
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.product_id = product_sale_periods.product_id and p.status = 'active'));
create policy "판매 중 상품 읽기" on public.product_ingredients
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.product_id = product_ingredients.product_id and p.status = 'active'));
create policy "판매 중 상품 읽기" on public.product_allergens
  for select to anon, authenticated
  using (exists (select 1 from public.products p
                 where p.product_id = product_allergens.product_id and p.status = 'active'));

commit;
