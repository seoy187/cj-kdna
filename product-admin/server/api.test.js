import assert from 'node:assert/strict';
import test from 'node:test';
import { createApi, validateProduct } from './api.js';
import { createSupabaseStore } from './supabaseStore.js';

const validProduct = () => ({
  product_id: 'P-9001',
  name: '테스트 상품',
  description: '테스트 설명',
  is_fresh: false,
  allergen_checked: false,
  status: 'active',
  shipping_policy_id: 'S-TEST',
  options: [{ package: '100g', price: 1000 }],
  storage: [{ type: 'guide', text: '상온 보관' }],
  notes: [],
  sale_periods: [],
  ingredients: [{ ingredient: '재료', origin: '', percent: null }],
  allergens: [],
});

async function withServer(store, run) {
  const server = createApi(store).listen(0, '127.0.0.1');
  await new Promise((resolve) => server.once('listening', resolve));
  try {
    await run(`http://127.0.0.1:${server.address().port}`);
  } finally {
    await new Promise((resolve) => server.close(resolve));
  }
}

// supabase-js의 호출 방식만 흉내 내는 가짜 클라이언트
function fakeClient({ failTable, pages = [[]] } = {}) {
  const calls = [];
  const client = {
    from(table) {
      const query = {
        select: () => query,
        order: () => query,
        range: (from) => {
          calls.push(['range', table, from]);
          return Promise.resolve({ data: pages.shift() ?? [], error: null });
        },
        insert: (rows) => {
          calls.push(['insert', table, rows]);
          return Promise.resolve(table === failTable
            ? { data: null, error: { code: '23503', message: '참조 오류' } }
            : { data: null, error: null });
        },
        delete: () => {
          calls.push(['delete', table]);
          return query;
        },
        eq: () => Promise.resolve({ data: [], error: null }),
      };
      return query;
    },
  };
  return { client, calls };
}

test('올바른 상품은 정리된 값으로 통과한다', () => {
  const { errors, value } = validateProduct({ ...validProduct(), name: '  테스트 상품  ' });
  assert.deepEqual(errors, []);
  assert.equal(value.name, '테스트 상품');
  assert.equal(value.ingredients[0].origin, null);
});

test('규칙을 어기면 오류를 돌려준다', () => {
  const cases = [
    { product_id: 'P0001' },
    { name: ' ' },
    { status: 'sold' },
    { is_fresh: 'yes' },
    { options: [] },
    { options: [{ package: '100g', price: 0 }] },
    { options: [{ package: '100g', price: 1 }, { package: '100g', price: 2 }] },
    { storage: [] },
    { storage: [{ type: 'memo', text: '내용' }] },
    { ingredients: [] },
    { ingredients: [{ ingredient: '재료', percent: 101 }] },
    { allergens: [{ allergen: '밀', type: 'maybe' }] },
    { allergens: [{ allergen: '밀', type: 'contains' }, { allergen: '밀', type: 'cross_contact' }] },
    { sale_periods: [{ start_month: 4, end_month: 13 }] },
  ];
  for (const change of cases) {
    const { errors } = validateProduct({ ...validProduct(), ...change });
    assert.ok(errors.length > 0, JSON.stringify(change));
  }
  assert.ok(validateProduct(null).errors.length > 0);
});

test('다른 사이트에서 온 요청은 막는다', async () => {
  await withServer({ list: async () => [] }, async (base) => {
    assert.equal((await fetch(`${base}/products`)).status, 200);
    const foreign = await fetch(`${base}/products`, { headers: { Origin: 'https://evil.example' } });
    assert.equal(foreign.status, 403);
  });
});

test('설정이 없으면 안내를 돌려주고, 코드 중복은 409로 알린다', async () => {
  await withServer(null, async (base) => {
    const res = await fetch(`${base}/products`);
    assert.equal(res.status, 503);
    assert.match((await res.json()).error, /\.env\.local/);
  });
  const store = { create: async () => { throw { code: '23505', message: 'dup' }; } };
  await withServer(store, async (base) => {
    const res = await fetch(`${base}/products`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(validProduct()),
    });
    assert.equal(res.status, 409);
  });
});

test('하위 행 추가에 실패하면 상품을 지워 되돌린다', async () => {
  const { client, calls } = fakeClient({ failTable: 'product_ingredients' });
  const store = createSupabaseStore(client);
  const { value } = validateProduct(validProduct());
  await assert.rejects(store.create(value), { code: '23503' });
  assert.deepEqual(calls.at(-1), ['delete', 'products']);
});

test('하위 행에 상품 코드와 순서를 넣는다', async () => {
  const { client, calls } = fakeClient();
  const store = createSupabaseStore(client);
  const { value } = validateProduct({
    ...validProduct(),
    storage: [{ type: 'guide', text: '가' }, { type: 'warning', text: '나' }],
  });
  await store.create(value);
  const [, , rows] = calls.find(([, table]) => table === 'product_storage');
  assert.deepEqual(rows.map((r) => [r.product_id, r.sort_order]), [['P-9001', 1], ['P-9001', 2]]);
});

test('목록은 1000행 넘게 끝까지 읽는다', async () => {
  const row = {
    product_options: [], product_storage: [], product_notes: [],
    product_sale_periods: [], product_ingredients: [], product_allergens: [],
  };
  const { client, calls } = fakeClient({ pages: [Array(1000).fill(row), [row]] });
  const products = await createSupabaseStore(client).list();
  assert.equal(products.length, 1001);
  assert.deepEqual(calls.map(([, , from]) => from), [0, 1000]);
});
