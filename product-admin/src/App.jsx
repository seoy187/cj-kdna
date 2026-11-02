import { useCallback, useEffect, useMemo, useState } from 'react';
import AllergenBadges from './AllergenBadges.jsx';
import { createProduct, deleteProduct, fetchMeta, fetchProducts } from './api.js';
import { allergenNames, isAllergenUnknown, STATUS_LABELS, won } from './labels.js';
import ProductDetail from './ProductDetail.jsx';
import ProductForm from './ProductForm.jsx';

const ALLERGEN_FILTERS = {
  all: { label: '전체', test: () => true },
  contains: { label: '함유 물질 있음', test: (p) => allergenNames(p, 'contains').length > 0 },
  cross: { label: '라인 공유 있음', test: (p) => allergenNames(p, 'cross_contact').length > 0 },
  unknown: { label: '함유 미확인', test: isAllergenUnknown },
};

function searchText(product) {
  return [
    product.product_id,
    product.name,
    product.description,
    ...product.ingredients.flatMap((i) => [i.ingredient, i.origin]),
    ...product.allergens.map((a) => a.allergen),
  ].filter(Boolean).join(' ').toLowerCase();
}

export default function App() {
  const [products, setProducts] = useState([]);
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState('');
  const [query, setQuery] = useState('');
  const [status, setStatus] = useState('all');
  const [allergen, setAllergen] = useState('all');
  const [selectedId, setSelectedId] = useState(null);
  const [adding, setAdding] = useState(false);
  const [notice, setNotice] = useState('');

  const load = useCallback(async () => {
    setLoading(true);
    setLoadError('');
    try {
      const [nextProducts, nextMeta] = await Promise.all([fetchProducts(), fetchMeta()]);
      setProducts(nextProducts);
      setMeta(nextMeta);
    } catch (e) {
      setLoadError(e.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const filtered = useMemo(() => {
    const words = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    return products.filter((p) => {
      if (status !== 'all' && p.status !== status) return false;
      if (!ALLERGEN_FILTERS[allergen].test(p)) return false;
      const haystack = searchText(p);
      return words.every((word) => haystack.includes(word));
    });
  }, [products, query, status, allergen]);

  const selected = products.find((p) => p.product_id === selectedId);

  async function handleCreate(product) {
    await createProduct(product);
    setAdding(false);
    setSelectedId(product.product_id);
    setNotice(`${product.name}을(를) 추가했습니다.`);
    await load();
  }

  async function handleDelete(id) {
    const name = products.find((p) => p.product_id === id)?.name ?? id;
    await deleteProduct(id);
    setSelectedId(null);
    setNotice(`${name}을(를) 삭제했습니다.`);
    await load();
  }

  return (
    <div className="app">
      <header className="topbar">
        <div>
          <h1>상품 관리</h1>
          <p className="subtle">
            {loading ? '불러오는 중…' : `전체 ${products.length}건 중 ${filtered.length}건 표시`}
          </p>
        </div>
        <button
          type="button"
          className="primary"
          disabled={!meta}
          onClick={() => { setAdding(true); setSelectedId(null); setNotice(''); }}
        >
          + 상품 추가
        </button>
      </header>

      {import.meta.env.PROD && (
        <p className="demo-note">
          실습용 가상 상품입니다. 실제로 판매하지 않으며, 가격 · 알레르기 정보도 실제가 아닙니다.
          로그인 없이 누구나 추가 · 삭제할 수 있으니 중요한 내용을 넣지 마세요.
        </p>
      )}

      <div className="filters" role="search">
        <label className="grow">
          검색
          <input
            type="search"
            placeholder="코드, 상품명, 설명, 재료, 원산지, 알레르기"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <label>
          상태
          <select value={status} onChange={(e) => setStatus(e.target.value)}>
            <option value="all">전체</option>
            {Object.entries(STATUS_LABELS).map(([value, label]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
        <label>
          알레르기
          <select value={allergen} onChange={(e) => setAllergen(e.target.value)}>
            {Object.entries(ALLERGEN_FILTERS).map(([value, { label }]) => (
              <option key={value} value={value}>{label}</option>
            ))}
          </select>
        </label>
      </div>

      {notice && <p className="notice" role="status">{notice}</p>}
      {loadError && (
        <div className="error-box" role="alert">
          <p>{loadError}</p>
          <button type="button" className="ghost" onClick={load}>다시 시도</button>
        </div>
      )}

      <main className={selected || adding ? 'layout with-panel' : 'layout'} hidden={Boolean(loadError) && !products.length}>
        <div className="table-wrap">
          <table>
            <thead>
              <tr>
                <th>코드</th>
                <th>상품명</th>
                <th>포장 · 가격</th>
                <th>신선</th>
                <th>알레르기</th>
                <th>상태</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((p) => (
                <tr key={p.product_id} className={p.product_id === selectedId ? 'selected' : undefined}>
                  <td className="mono">{p.product_id}</td>
                  <td>
                    <button
                      type="button"
                      className="link"
                      onClick={() => { setSelectedId(p.product_id); setAdding(false); setNotice(''); }}
                    >
                      {p.name}
                    </button>
                  </td>
                  <td>
                    {p.options.map((o) => (
                      <div key={o.package}>{o.package} · {won(o.price)}</div>
                    ))}
                  </td>
                  <td>{p.is_fresh ? '신선' : '—'}</td>
                  <td><AllergenBadges product={p} /></td>
                  <td><span className={`status ${p.status}`}>{STATUS_LABELS[p.status]}</span></td>
                </tr>
              ))}
            </tbody>
          </table>
          {!loading && !loadError && filtered.length === 0 && (
            <p className="empty">
              {products.length ? '조건에 맞는 상품이 없습니다.' : '등록된 상품이 없습니다.'}
            </p>
          )}
        </div>

        {adding && meta && (
          <ProductForm meta={meta} onCancel={() => setAdding(false)} onSubmit={handleCreate} />
        )}
        {selected && !adding && (
          <ProductDetail
            key={selected.product_id}
            product={selected}
            onClose={() => setSelectedId(null)}
            onDelete={handleDelete}
          />
        )}
      </main>
    </div>
  );
}
