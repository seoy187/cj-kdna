const PAGE_SIZE = 1000;

const PRODUCT_SELECT = `*,
  product_options(*),
  product_storage(*),
  product_notes(*),
  product_sale_periods(*),
  product_ingredients(*),
  product_allergens(*)`;

const bySortOrder = (a, b) => a.sort_order - b.sort_order;
const withOrder = (rows, productId) =>
  rows.map((row, index) => ({ product_id: productId, ...row, sort_order: index + 1 }));

function unwrap({ data, error }) {
  if (error) throw error;
  return data;
}

function toProduct(row) {
  const {
    product_options, product_storage, product_notes, product_sale_periods,
    product_ingredients, product_allergens, ...product
  } = row;
  return {
    ...product,
    options: [...product_options].sort(bySortOrder),
    storage: [...product_storage].sort(bySortOrder),
    notes: [...product_notes].sort(bySortOrder),
    sale_periods: product_sale_periods,
    ingredients: [...product_ingredients].sort(bySortOrder),
    allergens: [...product_allergens].sort(bySortOrder),
  };
}

export function createSupabaseStore(client) {
  return {
    async list() {
      // Supabase는 한 번에 최대 1000행을 돌려주므로 끝까지 나눠 읽는다
      const rows = [];
      for (let from = 0; ; from += PAGE_SIZE) {
        const page = unwrap(await client
          .from('products')
          .select(PRODUCT_SELECT)
          .order('product_id')
          .range(from, from + PAGE_SIZE - 1));
        rows.push(...page);
        if (page.length < PAGE_SIZE) break;
      }
      return rows.map(toProduct);
    },

    async meta() {
      const [allergens, policies] = await Promise.all([
        client.from('master_allergens').select('allergen').order('allergen'),
        client.from('shipping_policies').select('shipping_policy_id').order('shipping_policy_id'),
      ]);
      return {
        allergens: unwrap(allergens).map((r) => r.allergen),
        shipping_policies: unwrap(policies).map((r) => r.shipping_policy_id),
      };
    },

    async create(input) {
      const {
        options, storage, notes, sale_periods, ingredients, allergens, ...product
      } = input;
      const id = product.product_id;
      unwrap(await client.from('products').insert(product));

      const children = [
        ['product_options', withOrder(options, id)],
        ['product_storage', withOrder(storage, id)],
        ['product_notes', withOrder(notes, id)],
        ['product_sale_periods', sale_periods.map((row) => ({ product_id: id, ...row }))],
        ['product_ingredients', withOrder(ingredients, id)],
        ['product_allergens', withOrder(allergens, id)],
      ];
      try {
        for (const [table, rows] of children) {
          if (rows.length) unwrap(await client.from(table).insert(rows));
        }
      } catch (error) {
        // API로는 트랜잭션을 묶을 수 없어, 실패하면 상품을 지워 하위 행까지 함께 되돌린다
        const { error: rollbackError } = await client.from('products').delete().eq('product_id', id);
        if (rollbackError) {
          error.message = `${error.message} (되돌리기도 실패: ${id}를 직접 확인하세요)`;
        }
        throw error;
      }
    },

    async remove(id) {
      const rows = unwrap(await client
        .from('products')
        .delete()
        .eq('product_id', id)
        .select('product_id'));
      return rows.length > 0;
    },
  };
}
