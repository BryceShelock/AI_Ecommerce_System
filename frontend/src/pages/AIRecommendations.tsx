import { useEffect, useState } from 'react';
import Header from '@/components/Header';
import ProductCard from '@/components/ProductCard';
import { getProducts, Product as ApiProduct } from '@/lib/api';
import { Button } from '@/components/ui/button';

const PAGE_SIZE = 9;

const AIRecommendations = () => {
  const [products, setProducts] = useState<ApiProduct[]>([]);
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const list = await getProducts(page, PAGE_SIZE);
      if (mounted) {
        setProducts(list.results || []);
        setTotal(list.count || 0);
      }
    })();
    return () => { mounted = false; };
  }, [page]);

  const totalPages = Math.max(1, Math.ceil((total || products.length) / PAGE_SIZE));
  const pageItems = products;

  const transform = (p: ApiProduct) => ({
    id: String(p.id),
    name: p.name || '商品',
    price: p.price || 0,
    originalPrice: undefined,
    image: (p as any).image || 'https://images.unsplash.com/photo-1603789955942-64ca8f2d7c54?w=800&h=800&fit=crop',
    rating: Math.min(5, Math.round(((p.potential_score || 4) as number))) || 4,
    sales: (p as any).sales || 0,
    tags: (p.potential_score ? ['AI推荐'] : []),
  });

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />
      <div className="container px-4 py-8">
        <h1 className="text-2xl font-bold mb-4">AI 推荐商品</h1>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {pageItems.map((p) => {
            const card = transform(p);
            return <ProductCard key={card.id} {...(card as any)} />;
          })}
        </div>

        <div className="flex items-center justify-between mt-8">
          <div>
            第 {page} / {totalPages} 页
          </div>
          <div className="flex gap-2">
            <Button disabled={page <= 1} onClick={() => setPage((s) => Math.max(1, s - 1))}>上一页</Button>
            <Button disabled={page >= totalPages} onClick={() => setPage((s) => Math.min(totalPages, s + 1))}>下一页</Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIRecommendations;
