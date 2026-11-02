import { allergenNames, isAllergenUnknown } from './labels.js';

export default function AllergenBadges({ product }) {
  const contains = allergenNames(product, 'contains');
  const cross = allergenNames(product, 'cross_contact');
  const unknown = isAllergenUnknown(product);
  return (
    <span className="badges">
      {contains.map((name) => <span key={name} className="badge danger">함유 {name}</span>)}
      {cross.map((name) => <span key={name} className="badge warn">라인 공유 {name}</span>)}
      {unknown && <span className="badge muted">함유 미확인</span>}
      {!contains.length && !cross.length && !unknown && <span className="none">없음</span>}
    </span>
  );
}
