import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { Button } from "@/components/ui/button";
import { Heart, ShoppingBag } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Product {
  id: string;
  name: string;
  price: number;
  image: string;
  rating: number;
  sales: number;
}

const Favorites = () => {
  const navigate = useNavigate();
  const [favorites, setFavorites] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchFavorites();
  }, []);

  const fetchFavorites = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        navigate('/auth');
        return;
      }

      const { data: likes, error } = await supabase
        .from('product_likes')
        .select(`
          product_id,
          products (
            id,
            name,
            price,
            image_url,
            rating,
            sales_count
          )
        `)
        .eq('user_id', user.id);

      if (error) throw error;

      const products = likes?.map((like: any) => ({
        id: like.products.id,
        name: like.products.name,
        price: like.products.price,
        image: like.products.image_url || 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=400',
        rating: like.products.rating || 0,
        sales: like.products.sales_count || 0,
      })) || [];

      setFavorites(products);
    } catch (error) {
      console.error('Failed to fetch favorites:', error);
      toast.error('加载收藏失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveFavorite = async (productId: string) => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return;

      await supabase
        .from('product_likes')
        .delete()
        .eq('user_id', user.id)
        .eq('product_id', productId);

      setFavorites(prev => prev.filter(p => p.id !== productId));
      toast.success('已取消收藏');
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      toast.error('操作失败');
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      
      <div className="container px-4 py-8">
        <div className="flex items-center gap-3 mb-8">
          <Heart className="h-8 w-8 text-primary fill-primary" />
          <div>
            <h1 className="text-3xl font-bold">我的收藏</h1>
            <p className="text-muted-foreground">共 {favorites.length} 件商品</p>
          </div>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : favorites.length === 0 ? (
          <div className="text-center py-12">
            <Heart className="h-16 w-16 mx-auto mb-4 text-muted" />
            <h3 className="text-xl font-semibold mb-2">还没有收藏商品</h3>
            <p className="text-muted-foreground mb-6">快去挑选您喜欢的商品吧</p>
            <Button onClick={() => navigate('/products')}>
              <ShoppingBag className="mr-2 h-4 w-4" />
              去逛逛
            </Button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {favorites.map(product => (
              <div key={product.id} className="relative">
                <ProductCard {...product} />
                <Button
                  variant="ghost"
                  size="icon"
                  className="absolute top-2 right-2 bg-background/80 hover:bg-background"
                  onClick={() => handleRemoveFavorite(product.id)}
                >
                  <Heart className="h-4 w-4 fill-primary text-primary" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Favorites;
