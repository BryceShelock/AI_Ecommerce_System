export type Product = {
  id: number | string;
  name: string;
  sku?: string;
  price?: number;
  stock?: number;
  category?: string;
  potential_score?: number;
  selection_reason?: string;
};

const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';

export async function getProducts(page = 1, pageSize = 9, search?: string): Promise<{ results: Product[]; count?: number; next?: string; previous?: string }> {
  try {
    let url = `${API_BASE}/products/api/products/?page=${page}&page_size=${pageSize}`;
    if (search) {
      const q = encodeURIComponent(search);
      url += `&search=${q}`;
    }
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      console.error('产品 API 返回错误', res.status);
      return { results: [] };
    }
    const data = await res.json();
    // DRF pagination returns {count, next, previous, results}
    return data;
  } catch (err) {
    console.error('获取产品列表失败', err);
    return { results: [] };
  }
}

export async function getProductById(id: number | string): Promise<Product | null> {
  try {
    const url = `${API_BASE}/products/api/products/${id}/`;
    const res = await fetch(url, {
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
    });
    if (!res.ok) {
      console.error('产品详情 API 返回错误', res.status);
      return null;
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error('获取产品详情失败', err);
    return null;
  }
}

export async function addToCart(productId: number | string, quantity: number = 1): Promise<boolean> {
  try {
    const url = `${API_BASE}/products/api/cart/`;
    const res = await fetch(url, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      credentials: 'include',
      body: JSON.stringify({ product_id: productId, quantity }),
    });
    return res.ok;
  } catch (err) {
    console.error('添加到购物车失败', err);
    return false;
  }
}