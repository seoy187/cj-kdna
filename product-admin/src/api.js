async function request(path, options) {
  const res = await fetch(`/api${path}`, options);
  if (res.status === 204) return null;
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error ?? `요청 실패 (${res.status})`);
  return body;
}

export const fetchProducts = () => request('/products').then((body) => body.products);

export const fetchMeta = () => request('/meta');

export const createProduct = (product) => request('/products', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(product),
});

export const deleteProduct = (id) => request(`/products/${encodeURIComponent(id)}`, {
  method: 'DELETE',
});
