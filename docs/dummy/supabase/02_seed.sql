-- generate_seed_sql.py로 생성한 가상 상품 데이터. 01_schema.sql 다음에 실행한다
-- 이미 있는 행은 건드리지 않으므로 Supabase에서 고친 값을 덮어쓰지 않는다

begin;

insert into public.master_allergens ("allergen") values
  ('견과류'),
  ('계란'),
  ('대두'),
  ('밀')
on conflict do nothing;

insert into public.shipping_policies ("shipping_policy_id", "free_shipping_min", "shipping_fee", "same_day_cutoff", "fresh_ship_note") values
  ('S-01', 30000, 2500, '14:00', '금요일 주문은 다음 주 월요일 발송')
on conflict do nothing;

insert into public.shipping_same_day_areas ("shipping_policy_id", "area", "sort_order") values
  ('S-01', '수성구', 1),
  ('S-01', '달서구', 2)
on conflict do nothing;

insert into public.shipping_fresh_days ("shipping_policy_id", "day", "sort_order") values
  ('S-01', '월', 1),
  ('S-01', '화', 2),
  ('S-01', '수', 3),
  ('S-01', '목', 4)
on conflict do nothing;

insert into public.products ("product_id", "name", "description", "is_fresh", "allergen_checked", "status", "shipping_policy_id", "updated_at") values
  ('P-0113', '대구사과칩', '팔공산 사과 100%를 저온에서 말린 과자. 설탕 · 첨가물 없음', false, false, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0127', '팔공산 꿀사과', '팔공산 해발 400m 과수원의 부사. 당도 14Brix 이상 선별', true, true, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0205', '성주 참외', '성주 하우스 참외 특품', true, true, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0207', '참외청', '성주 참외와 비정제 원당을 1:1로 재운 청. 탄산수 희석 비율 1:4', false, true, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0305', '청도 반건시', '청도 감을 20일 자연 건조한 반건시. 겉은 쫀득, 속은 촉촉', false, true, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0312', '의성 마늘', '의성 한지형 마늘. 알이 단단하고 매운맛이 강함', true, true, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0318', '흑마늘 진액', '의성 마늘을 15일 숙성한 흑마늘 추출액. 하루 1포 권장', false, true, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0402', '서문시장 납작만두', '서문시장식 납작만두. 당면 · 부추 소, 간장 양념 포함', false, true, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0410', '달성 토마토', '달성군 하빈면 완숙 토마토. 산도가 낮아 생식용', true, true, 'active', 'S-01', '2026-11-02 00:00:00+09'),
  ('P-0421', '경산 대추칩', '경산 대추를 씨 빼고 말린 칩. 차로 우려도 됨(80℃ 물 300ml에 5조각)', false, false, 'active', 'S-01', '2026-11-02 00:00:00+09')
on conflict do nothing;

insert into public.product_options ("product_id", "package", "price", "sort_order") values
  ('P-0113', '60g', 4900, 1),
  ('P-0127', '2kg(7~9개)', 18000, 1),
  ('P-0205', '1.5kg(5~6개)', 12000, 1),
  ('P-0207', '350ml', 9500, 1),
  ('P-0305', '500g(10개)', 15000, 1),
  ('P-0312', '1kg(약 15통)', 11000, 1),
  ('P-0318', '70ml × 30포', 24000, 1),
  ('P-0402', '20개(500g)', 7900, 1),
  ('P-0410', '1kg(6~8개)', 8500, 1),
  ('P-0421', '50g', 5500, 1)
on conflict do nothing;

insert into public.product_storage ("product_id", "sort_order", "type", "text") values
  ('P-0113', 1, 'guide', '개봉 후 밀봉해 서늘한 곳에서 7일 이내 섭취'),
  ('P-0113', 2, 'guide', '개봉 전 유통기한 6개월'),
  ('P-0113', 3, 'warning', '개봉 후 냉장 금지 — 습기를 먹어 눅눅해짐'),
  ('P-0127', 1, 'guide', '냉장 보관 시 3주, 상온 보관 시 7일'),
  ('P-0127', 2, 'warning', '다른 과일과 함께 두지 않기(에틸렌으로 다른 과일이 빨리 익음)'),
  ('P-0205', 1, 'guide', '냉장 보관 5일'),
  ('P-0205', 2, 'guide', '꼭지가 마르면 당도가 떨어지므로 받은 날부터 3일 안에 드시는 것을 권장'),
  ('P-0207', 1, 'guide', '개봉 전 상온 보관 12개월'),
  ('P-0207', 2, 'guide', '개봉 후 냉장 보관 30일'),
  ('P-0207', 3, 'warning', '금속 숟가락 사용 금지 — 발효가 빨라짐, 나무 또는 플라스틱 사용'),
  ('P-0305', 1, 'guide', '냉장 보관 10일'),
  ('P-0305', 2, 'guide', '받은 즉시 냉장'),
  ('P-0305', 3, 'warning', '냉동 보관 금지 — 해동하면 수분이 빠져 질겨짐'),
  ('P-0312', 1, 'guide', '통풍이 잘 되는 그늘에 상온 보관 2개월'),
  ('P-0312', 2, 'guide', '망에 보관'),
  ('P-0312', 3, 'warning', '비닐봉지에 밀봉하면 곰팡이가 생김'),
  ('P-0312', 4, 'warning', '냉장 보관은 싹이 남'),
  ('P-0318', 1, 'guide', '개봉 전 상온 보관 18개월'),
  ('P-0318', 2, 'guide', '개봉한 포는 당일 섭취'),
  ('P-0318', 3, 'guide', '여름철에는 냉장 보관 권장'),
  ('P-0402', 1, 'guide', '냉동 보관 3개월'),
  ('P-0402', 2, 'guide', '해동하지 말고 냉동 상태로 팬에 기름 두르고 중불 3분'),
  ('P-0402', 3, 'warning', '전자레인지 조리 금지 — 피가 질겨짐'),
  ('P-0410', 1, 'guide', '실온 보관 3일, 냉장 보관 7일'),
  ('P-0410', 2, 'guide', '꼭지를 아래로 두고 보관 — 수분 증발을 줄임'),
  ('P-0410', 3, 'guide', '냉장 후 먹기 30분 전 꺼내면 맛이 돌아옴'),
  ('P-0421', 1, 'guide', '개봉 후 밀봉해 상온 보관 14일'),
  ('P-0421', 2, 'guide', '습기에 약하므로 실리카겔을 버리지 않기')
on conflict do nothing;

insert into public.product_notes ("product_id", "note", "sort_order") values
  ('P-0113', '글루텐 없음', 1),
  ('P-0127', '표면 왁스 코팅 없음', 1),
  ('P-0305', '표면의 흰 가루는 당분이 굳은 것으로 정상', 1),
  ('P-0318', '임산부 · 수술 전후는 섭취 전 전문가 상담', 1)
on conflict do nothing;

insert into public.product_sale_periods ("product_id", "start_month", "end_month") values
  ('P-0205', 4, 7)
on conflict do nothing;

insert into public.product_ingredients ("product_id", "ingredient", "origin", "percent", "sort_order") values
  ('P-0113', '사과', '대구 팔공산', 100, 1),
  ('P-0127', '사과', '대구 팔공산', null, 1),
  ('P-0205', '참외', '경북 성주', null, 1),
  ('P-0207', '참외', '경북 성주', null, 1),
  ('P-0207', '비정제 원당', '국내산', null, 2),
  ('P-0305', '감', '경북 청도', null, 1),
  ('P-0312', '마늘', '경북 의성', null, 1),
  ('P-0318', '흑마늘', '경북 의성', null, 1),
  ('P-0318', '정제수', null, null, 2),
  ('P-0402', '밀가루', null, null, 1),
  ('P-0402', '당면', null, null, 2),
  ('P-0402', '부추', null, null, 3),
  ('P-0402', '대두(간장)', null, null, 4),
  ('P-0410', '토마토', '대구 달성', null, 1),
  ('P-0421', '대추', '경북 경산', 100, 1)
on conflict do nothing;

insert into public.product_allergens ("product_id", "allergen", "type", "sort_order") values
  ('P-0113', '견과류', 'cross_contact', 1),
  ('P-0402', '밀', 'contains', 1),
  ('P-0402', '대두', 'contains', 2),
  ('P-0402', '계란', 'cross_contact', 3),
  ('P-0421', '견과류', 'cross_contact', 1)
on conflict do nothing;

commit;
