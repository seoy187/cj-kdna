import { useState } from 'react';
import { STATUS_LABELS } from './labels.js';

const EMPTY_ROWS = {
  options: { package: '', price: '' },
  storage: { type: 'guide', text: '' },
  notes: { note: '' },
  sale_periods: { start_month: '', end_month: '' },
  ingredients: { ingredient: '', origin: '', percent: '' },
  allergens: { allergen: '', type: 'contains' },
};

const initialForm = (meta) => ({
  product_id: '',
  name: '',
  description: '',
  is_fresh: false,
  allergen_checked: false,
  status: 'active',
  shipping_policy_id: meta.shipping_policies[0] ?? '',
  options: [{ ...EMPTY_ROWS.options }],
  storage: [{ ...EMPTY_ROWS.storage }],
  notes: [],
  sale_periods: [],
  ingredients: [{ ...EMPTY_ROWS.ingredients }],
  allergens: [],
});

const toNumber = (value) => (value === '' ? null : Number(value));

// 폼 문자열을 API 형식으로 바꾼다. 숫자 칸의 잘못된 값은 서버 검증이 잡는다
function toPayload(form) {
  return {
    ...form,
    options: form.options.map((r) => ({ ...r, price: toNumber(r.price) })),
    sale_periods: form.sale_periods.map((r) => ({
      start_month: toNumber(r.start_month),
      end_month: toNumber(r.end_month),
    })),
    ingredients: form.ingredients.map((r) => ({ ...r, percent: toNumber(r.percent) })),
  };
}

function RowsField({ title, addLabel, rows, minRows = 0, onAdd, onRemove, children }) {
  return (
    <fieldset>
      <legend>{title}</legend>
      {rows.map((row, index) => (
        <div className="row" key={index}>
          {children(row, index)}
          <button
            type="button"
            className="ghost icon"
            aria-label={`${title} ${index + 1}번째 행 삭제`}
            disabled={rows.length <= minRows}
            onClick={() => onRemove(index)}
          >
            ×
          </button>
        </div>
      ))}
      <button type="button" className="ghost" onClick={onAdd}>+ {addLabel}</button>
    </fieldset>
  );
}

export default function ProductForm({ meta, onCancel, onSubmit }) {
  const [form, setForm] = useState(() => initialForm(meta));
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const setField = (name, value) => setForm((f) => ({ ...f, [name]: value }));
  const addRow = (name) => setField(name, [...form[name], { ...EMPTY_ROWS[name] }]);
  const removeRow = (name, index) => setField(name, form[name].filter((_, i) => i !== index));
  const setCell = (name, index, key, value) => setField(
    name,
    form[name].map((row, i) => (i === index ? { ...row, [key]: value } : row)),
  );
  const rowsProps = (name) => ({
    rows: form[name],
    onAdd: () => addRow(name),
    onRemove: (index) => removeRow(name, index),
  });

  async function handleSubmit(event) {
    event.preventDefault();
    setSaving(true);
    setError('');
    try {
      await onSubmit(toPayload(form));
    } catch (e) {
      setError(e.message);
      setSaving(false);
    }
  }

  return (
    <aside className="panel" aria-label="상품 추가">
      <header className="panel-header">
        <h2>상품 추가</h2>
        <button type="button" className="ghost" onClick={onCancel}>닫기</button>
      </header>

      <form onSubmit={handleSubmit}>
        <label>
          상품 코드
          <input
            value={form.product_id}
            placeholder="P-0000"
            required
            pattern="P-[0-9]{4}"
            title="P-0000 형식"
            onChange={(e) => setField('product_id', e.target.value)}
          />
        </label>
        <label>
          상품명
          <input value={form.name} required onChange={(e) => setField('name', e.target.value)} />
        </label>
        <label>
          설명
          <textarea
            rows="2"
            value={form.description}
            required
            onChange={(e) => setField('description', e.target.value)}
          />
        </label>

        <div className="two">
          <label>
            판매 상태
            <select value={form.status} onChange={(e) => setField('status', e.target.value)}>
              {Object.entries(STATUS_LABELS).map(([value, label]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>
          </label>
          <label>
            배송 정책
            <select
              value={form.shipping_policy_id}
              required
              onChange={(e) => setField('shipping_policy_id', e.target.value)}
            >
              {meta.shipping_policies.map((id) => <option key={id} value={id}>{id}</option>)}
            </select>
          </label>
        </div>

        <label className="check">
          <input
            type="checkbox"
            checked={form.is_fresh}
            onChange={(e) => setField('is_fresh', e.target.checked)}
          />
          신선 식품
        </label>

        <RowsField title="포장 · 가격" addLabel="포장 추가" minRows={1} {...rowsProps('options')}>
          {(row, i) => (
            <>
              <input
                aria-label="포장 단위"
                placeholder="500g"
                value={row.package}
                required
                onChange={(e) => setCell('options', i, 'package', e.target.value)}
              />
              <input
                aria-label="가격(원)"
                placeholder="가격(원)"
                type="number"
                min="1"
                step="1"
                value={row.price}
                required
                onChange={(e) => setCell('options', i, 'price', e.target.value)}
              />
            </>
          )}
        </RowsField>

        <RowsField title="재료 · 원산지" addLabel="재료 추가" minRows={1} {...rowsProps('ingredients')}>
          {(row, i) => (
            <>
              <input
                aria-label="재료명"
                placeholder="재료명"
                value={row.ingredient}
                required
                onChange={(e) => setCell('ingredients', i, 'ingredient', e.target.value)}
              />
              <input
                aria-label="원산지"
                placeholder="원산지(선택)"
                value={row.origin}
                onChange={(e) => setCell('ingredients', i, 'origin', e.target.value)}
              />
              <input
                className="narrow"
                aria-label="함량(%)"
                placeholder="%"
                type="number"
                min="1"
                max="100"
                step="1"
                value={row.percent}
                onChange={(e) => setCell('ingredients', i, 'percent', e.target.value)}
              />
            </>
          )}
        </RowsField>

        <RowsField title="알레르기" addLabel="물질 추가" {...rowsProps('allergens')}>
          {(row, i) => (
            <>
              <select
                aria-label="알레르기 물질"
                value={row.allergen}
                required
                onChange={(e) => setCell('allergens', i, 'allergen', e.target.value)}
              >
                <option value="">물질 선택</option>
                {meta.allergens.map((name) => <option key={name} value={name}>{name}</option>)}
              </select>
              <select
                aria-label="알레르기 유형"
                value={row.type}
                onChange={(e) => setCell('allergens', i, 'type', e.target.value)}
              >
                <option value="contains">함유</option>
                <option value="cross_contact">라인 공유</option>
              </select>
            </>
          )}
        </RowsField>
        <label className="check">
          <input
            type="checkbox"
            checked={form.allergen_checked}
            onChange={(e) => setField('allergen_checked', e.target.checked)}
          />
          함유 알레르기 확인 완료
        </label>
        <p className="hint">체크하지 않고 함유 물질도 없으면 "없음"이 아니라 "미확인"으로 표시됩니다.</p>

        <RowsField title="보관법" addLabel="문장 추가" minRows={1} {...rowsProps('storage')}>
          {(row, i) => (
            <>
              <select
                className="narrow-select"
                aria-label="보관법 유형"
                value={row.type}
                onChange={(e) => setCell('storage', i, 'type', e.target.value)}
              >
                <option value="guide">안내</option>
                <option value="warning">금지 · 주의</option>
              </select>
              <input
                aria-label="보관법 내용"
                placeholder="냉장 보관 7일"
                value={row.text}
                required
                onChange={(e) => setCell('storage', i, 'text', e.target.value)}
              />
            </>
          )}
        </RowsField>

        <RowsField title="기타 안내" addLabel="안내 추가" {...rowsProps('notes')}>
          {(row, i) => (
            <input
              aria-label="기타 안내"
              value={row.note}
              required
              onChange={(e) => setCell('notes', i, 'note', e.target.value)}
            />
          )}
        </RowsField>

        <RowsField title="한정 판매 기간" addLabel="기간 추가" {...rowsProps('sale_periods')}>
          {(row, i) => (
            <>
              <input
                aria-label="시작 월"
                placeholder="시작 월"
                type="number"
                min="1"
                max="12"
                value={row.start_month}
                required
                onChange={(e) => setCell('sale_periods', i, 'start_month', e.target.value)}
              />
              <input
                aria-label="끝 월"
                placeholder="끝 월"
                type="number"
                min="1"
                max="12"
                value={row.end_month}
                required
                onChange={(e) => setCell('sale_periods', i, 'end_month', e.target.value)}
              />
            </>
          )}
        </RowsField>

        {error && <p className="error" role="alert">{error}</p>}
        <div className="actions">
          <button type="submit" className="primary" disabled={saving}>
            {saving ? '저장 중…' : '상품 저장'}
          </button>
          <button type="button" className="ghost" disabled={saving} onClick={onCancel}>취소</button>
        </div>
      </form>
    </aside>
  );
}
