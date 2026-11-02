-- 가상 상품 스키마. Supabase SQL Editor에서 01 → 02 순서로 실행한다
-- 실습 데이터이므로 실제 상품이 있는 프로젝트가 아니라 실습 전용 프로젝트에서 실행한다

begin;

-- 기준 목록
create table public.master_allergens (
  allergen text primary key check (allergen <> '')
);

-- 배송
create table public.shipping_policies (
  shipping_policy_id text primary key check (shipping_policy_id <> ''),
  free_shipping_min integer not null check (free_shipping_min >= 0),
  shipping_fee integer not null check (shipping_fee >= 0),
  same_day_cutoff time not null,
  fresh_ship_note text not null
);

create table public.shipping_same_day_areas (
  shipping_policy_id text not null references public.shipping_policies on delete cascade,
  area text not null check (area <> ''),
  sort_order integer not null check (sort_order > 0),
  primary key (shipping_policy_id, area)
);

create table public.shipping_fresh_days (
  shipping_policy_id text not null references public.shipping_policies on delete cascade,
  day text not null check (day in ('월', '화', '수', '목', '금', '토', '일')),
  sort_order integer not null check (sort_order > 0),
  primary key (shipping_policy_id, day)
);

-- 상품
create table public.products (
  product_id text primary key check (product_id ~ '^P-[0-9]{4}$'),
  name text not null check (name <> ''),
  description text not null check (description <> ''),
  is_fresh boolean not null,
  -- 함유 알레르기 행이 없을 때 true면 "없음", false면 "미확인"
  allergen_checked boolean not null default false,
  status text not null default 'active' check (status in ('active', 'paused', 'discontinued')),
  shipping_policy_id text not null references public.shipping_policies on delete restrict,
  updated_at timestamptz not null default now()
);

create index products_shipping_policy_id_idx on public.products (shipping_policy_id);

create table public.product_options (
  product_id text not null references public.products on delete cascade,
  package text not null check (package <> ''),
  price integer not null check (price > 0),
  sort_order integer not null check (sort_order > 0),
  primary key (product_id, package)
);

create table public.product_storage (
  product_id text not null references public.products on delete cascade,
  sort_order integer not null check (sort_order > 0),
  type text not null check (type in ('guide', 'warning')),
  text text not null check (text <> ''),
  primary key (product_id, sort_order)
);

create table public.product_notes (
  product_id text not null references public.products on delete cascade,
  sort_order integer not null check (sort_order > 0),
  note text not null check (note <> ''),
  primary key (product_id, sort_order)
);

create table public.product_sale_periods (
  product_id text not null references public.products on delete cascade,
  start_month integer not null check (start_month between 1 and 12),
  end_month integer not null check (end_month between 1 and 12),
  primary key (product_id, start_month, end_month)
);

create table public.product_ingredients (
  product_id text not null references public.products on delete cascade,
  ingredient text not null check (ingredient <> ''),
  -- 문서에 없는 값은 null
  origin text,
  percent integer check (percent between 1 and 100),
  sort_order integer not null check (sort_order > 0),
  primary key (product_id, ingredient)
);

create table public.product_allergens (
  product_id text not null references public.products on delete cascade,
  allergen text not null references public.master_allergens on delete restrict,
  type text not null check (type in ('contains', 'cross_contact')),
  sort_order integer not null check (sort_order > 0),
  primary key (product_id, allergen)
);

-- "이 물질이 든 상품" 조회용
create index product_allergens_allergen_idx on public.product_allergens (allergen);

-- products 행을 고치면 수정일을 자동으로 갱신한다. 하위 테이블 변경은 반영되지 않는다
create function public.set_updated_at()
returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create trigger products_set_updated_at
before update on public.products
for each row execute function public.set_updated_at();

-- public 스키마는 API로 노출되므로 모든 테이블에 RLS를 켠다
-- 정책이 없으면 anon · authenticated 키로는 읽기와 쓰기가 모두 막힌다
alter table public.master_allergens enable row level security;
alter table public.shipping_policies enable row level security;
alter table public.shipping_same_day_areas enable row level security;
alter table public.shipping_fresh_days enable row level security;
alter table public.products enable row level security;
alter table public.product_options enable row level security;
alter table public.product_storage enable row level security;
alter table public.product_notes enable row level security;
alter table public.product_sale_periods enable row level security;
alter table public.product_ingredients enable row level security;
alter table public.product_allergens enable row level security;

commit;
