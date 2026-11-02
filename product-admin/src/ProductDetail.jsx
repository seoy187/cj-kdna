import { useState } from 'react';
import AllergenBadges from './AllergenBadges.jsx';
import { isAllergenUnknown, STATUS_LABELS, won } from './labels.js';

export default function ProductDetail({ product, onClose, onDelete }) {
  const [confirming, setConfirming] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState('');

  async function handleDelete() {
    setDeleting(true);
    setError('');
    try {
      await onDelete(product.product_id);
    } catch (e) {
      setError(e.message);
      setDeleting(false);
    }
  }

  return (
    <aside className="panel" aria-label="상품 상세">
      <header className="panel-header">
        <div>
          <p className="eyebrow">{product.product_id}</p>
          <h2>{product.name}</h2>
        </div>
        <button type="button" className="ghost" onClick={onClose}>닫기</button>
      </header>

      <p>{product.description}</p>

      <dl className="facts">
        <dt>상태</dt>
        <dd>{STATUS_LABELS[product.status]}</dd>
        <dt>신선 식품</dt>
        <dd>{product.is_fresh ? '예' : '아니요'}</dd>
        <dt>배송 정책</dt>
        <dd>{product.shipping_policy_id}</dd>
        {product.sale_periods.map((p) => (
          <FragmentPeriod key={`${p.start_month}-${p.end_month}`} period={p} />
        ))}
      </dl>

      <h3>포장 · 가격</h3>
      <ul>
        {product.options.map((o) => <li key={o.package}>{o.package} · {won(o.price)}</li>)}
      </ul>

      <h3>알레르기</h3>
      <AllergenBadges product={product} />
      {isAllergenUnknown(product) && (
        <p className="hint">함유 물질을 아직 확인하지 않았습니다. 없다는 뜻이 아닙니다.</p>
      )}

      <h3>재료 · 원산지</h3>
      <ul>
        {product.ingredients.map((i) => (
          <li key={i.ingredient}>
            {i.ingredient}{i.percent ? ` ${i.percent}%` : ''}
            {' '}<span className="subtle">{i.origin ?? '원산지 미표기'}</span>
          </li>
        ))}
      </ul>

      <h3>보관법</h3>
      <ul>
        {product.storage.map((s) => (
          <li key={s.sort_order} className={s.type === 'warning' ? 'warning-text' : undefined}>
            {s.text}
          </li>
        ))}
      </ul>

      {product.notes.length > 0 && (
        <>
          <h3>기타 안내</h3>
          <ul>{product.notes.map((n) => <li key={n.sort_order}>{n.note}</li>)}</ul>
        </>
      )}

      <div className="danger-zone">
        {error && <p className="error" role="alert">{error}</p>}
        {confirming ? (
          <>
            <p>"{product.name}" 상품과 포장 · 재료 · 알레르기 정보까지 영구 삭제합니다. 되돌릴 수 없습니다.</p>
            <div className="actions">
              <button type="button" className="danger" disabled={deleting} onClick={handleDelete}>
                {deleting ? '삭제 중…' : '영구 삭제'}
              </button>
              <button type="button" className="ghost" disabled={deleting} onClick={() => setConfirming(false)}>
                취소
              </button>
            </div>
          </>
        ) : (
          <button type="button" className="danger-outline" onClick={() => setConfirming(true)}>
            상품 삭제
          </button>
        )}
      </div>
    </aside>
  );
}

function FragmentPeriod({ period }) {
  return (
    <>
      <dt>한정 판매</dt>
      <dd>{period.start_month}~{period.end_month}월</dd>
    </>
  );
}
