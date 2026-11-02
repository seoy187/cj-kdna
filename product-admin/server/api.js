import express from 'express';

const STATUSES = ['active', 'paused', 'discontinued'];
const STORAGE_TYPES = ['guide', 'warning'];
const ALLERGEN_TYPES = ['contains', 'cross_contact'];
const LOCAL_HOSTNAMES = ['127.0.0.1', 'localhost'];

const text = (value) => (typeof value === 'string' ? value.trim() : '');
const list = (value) => (Array.isArray(value) ? value : []);
const isIntBetween = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;

function hasDuplicate(values) {
  return new Set(values).size !== values.length;
}

// 입력을 정리하고 검사한다. DB 제약과 같은 규칙을 적어 친절한 오류를 먼저 보여 준다
export function validateProduct(body) {
  const errors = [];
  const input = body && typeof body === 'object' ? body : {};
  const value = {
    product_id: text(input.product_id),
    name: text(input.name),
    description: text(input.description),
    is_fresh: input.is_fresh,
    allergen_checked: input.allergen_checked,
    status: input.status,
    shipping_policy_id: text(input.shipping_policy_id),
    options: list(input.options).map((r) => ({ package: text(r?.package), price: r?.price })),
    storage: list(input.storage).map((r) => ({ type: r?.type, text: text(r?.text) })),
    notes: list(input.notes).map((r) => ({ note: text(r?.note) })),
    sale_periods: list(input.sale_periods).map((r) => ({
      start_month: r?.start_month,
      end_month: r?.end_month,
    })),
    ingredients: list(input.ingredients).map((r) => ({
      ingredient: text(r?.ingredient),
      origin: text(r?.origin) || null,
      percent: r?.percent ?? null,
    })),
    allergens: list(input.allergens).map((r) => ({ allergen: text(r?.allergen), type: r?.type })),
  };

  if (!/^P-[0-9]{4}$/.test(value.product_id)) errors.push('상품 코드는 P-0000 형식이어야 합니다.');
  if (!value.name) errors.push('상품명을 입력하세요.');
  if (!value.description) errors.push('상품 설명을 입력하세요.');
  if (typeof value.is_fresh !== 'boolean') errors.push('신선 식품 여부가 올바르지 않습니다.');
  if (typeof value.allergen_checked !== 'boolean') errors.push('알레르기 확인 여부가 올바르지 않습니다.');
  if (!STATUSES.includes(value.status)) errors.push('판매 상태가 올바르지 않습니다.');
  if (!value.shipping_policy_id) errors.push('배송 정책을 선택하세요.');

  if (!value.options.length) errors.push('포장 · 가격을 하나 이상 입력하세요.');
  if (value.options.some((r) => !r.package || !isIntBetween(r.price, 1, 2147483647))) {
    errors.push('포장 단위와 1원 이상의 정수 가격을 입력하세요.');
  }
  if (hasDuplicate(value.options.map((r) => r.package))) errors.push('포장 단위가 중복되었습니다.');

  if (!value.storage.length) errors.push('보관법을 하나 이상 입력하세요.');
  if (value.storage.some((r) => !r.text || !STORAGE_TYPES.includes(r.type))) {
    errors.push('보관법의 내용과 유형을 확인하세요.');
  }

  if (value.notes.some((r) => !r.note)) errors.push('빈 기타 안내가 있습니다.');

  if (value.sale_periods.some((r) => !isIntBetween(r.start_month, 1, 12) || !isIntBetween(r.end_month, 1, 12))) {
    errors.push('판매 기간은 1~12월로 입력하세요.');
  }
  if (hasDuplicate(value.sale_periods.map((r) => `${r.start_month}-${r.end_month}`))) {
    errors.push('판매 기간이 중복되었습니다.');
  }

  if (!value.ingredients.length) errors.push('재료를 하나 이상 입력하세요.');
  if (value.ingredients.some((r) => !r.ingredient)) errors.push('재료명을 입력하세요.');
  if (value.ingredients.some((r) => r.percent !== null && !isIntBetween(r.percent, 1, 100))) {
    errors.push('함량은 1~100 사이의 정수로 입력하세요.');
  }
  if (hasDuplicate(value.ingredients.map((r) => r.ingredient))) errors.push('재료가 중복되었습니다.');

  if (value.allergens.some((r) => !r.allergen || !ALLERGEN_TYPES.includes(r.type))) {
    errors.push('알레르기 물질과 유형을 확인하세요.');
  }
  if (hasDuplicate(value.allergens.map((r) => r.allergen))) errors.push('알레르기 물질이 중복되었습니다.');

  return { errors, value };
}

function hostnameOf(value) {
  try {
    return new URL(`http://${value}`).hostname;
  } catch {
    return '';
  }
}

// 다른 웹사이트가 브라우저를 통해 이 API를 호출하지 못하게 막는다
function localOnly(req, res, next) {
  const origin = req.headers.origin;
  const originHost = origin ? hostnameOf(origin.replace(/^https?:\/\//, '')) : null;
  if (!LOCAL_HOSTNAMES.includes(hostnameOf(req.headers.host)) ||
      (origin && !LOCAL_HOSTNAMES.includes(originHost))) {
    return res.status(403).json({ error: '로컬에서만 사용할 수 있습니다.' });
  }
  next();
}

// 배포본은 호스트가 정해져 있지 않으므로, 페이지와 같은 주소에서 온 요청만 받는다
function sameOriginOnly(req, res, next) {
  const origin = req.headers.origin;
  if (origin && origin.replace(/^https?:\/\//, '') !== req.headers.host) {
    return res.status(403).json({ error: '다른 사이트에서는 사용할 수 없습니다.' });
  }
  next();
}

function sendStoreError(res, error) {
  if (error?.code === '23505') {
    return res.status(409).json({ error: '이미 있는 상품 코드이거나 중복된 값이 있습니다.' });
  }
  if (error?.code === '23503') {
    return res.status(400).json({ error: '없는 배송 정책이나 알레르기 물질을 지정했습니다.' });
  }
  if (error?.code === '42P01' || error?.code === 'PGRST205') {
    return res.status(503).json({ error: 'Supabase에 테이블이 없습니다. 01_schema.sql과 02_seed.sql을 먼저 실행하세요.' });
  }
  console.error('[api]', error?.code, error?.message);
  return res.status(502).json({ error: `Supabase 요청 실패: ${error?.message ?? '알 수 없는 오류'}` });
}

export function createApi(store, { deployed = false } = {}) {
  const app = express();
  app.use(deployed ? sameOriginOnly : localOnly);
  app.use(express.json({ limit: '200kb' }));

  app.use((req, res, next) => {
    if (store) return next();
    res.status(503).json({
      error: deployed
        ? 'Vercel 환경 변수에 SUPABASE_URL과 SUPABASE_SECRET_KEY를 넣고 다시 배포하세요.'
        : '.env.local에 SUPABASE_URL과 SUPABASE_SECRET_KEY를 넣고 서버를 다시 시작하세요.',
    });
  });

  app.get('/products', async (req, res) => {
    try {
      res.json({ products: await store.list() });
    } catch (error) {
      sendStoreError(res, error);
    }
  });

  app.get('/meta', async (req, res) => {
    try {
      res.json(await store.meta());
    } catch (error) {
      sendStoreError(res, error);
    }
  });

  app.post('/products', async (req, res) => {
    const { errors, value } = validateProduct(req.body);
    if (errors.length) return res.status(400).json({ error: errors.join(' ') });
    try {
      await store.create(value);
      res.status(201).json({ product_id: value.product_id });
    } catch (error) {
      sendStoreError(res, error);
    }
  });

  app.delete('/products/:id', async (req, res) => {
    try {
      const removed = await store.remove(req.params.id);
      if (!removed) return res.status(404).json({ error: '이미 삭제되었거나 없는 상품입니다.' });
      res.status(204).end();
    } catch (error) {
      sendStoreError(res, error);
    }
  });

  // 형식이 잘못된 JSON 본문 등
  app.use((error, req, res, next) => {
    res.status(error.status ?? 500).json({ error: '요청을 처리할 수 없습니다.' });
  });

  return app;
}
