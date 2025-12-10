import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { 
  Trash2, 
  Plus, 
  Minus, 
  ShoppingBag,
  Tag,
  ArrowRight,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";

interface CartItem {
  id: string;
  productId: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  quantity: number;
  stock: number;
  selected: boolean;
}

const Cart = () => {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [couponCode, setCouponCode] = useState('');

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    try {
      setLoading(true);
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      const userId = localStorage.getItem('userId') || '1';
      
      const res = await fetch(`${API_BASE}/products/api/cart/`, {
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
      });

      if (!res.ok) throw new Error('Failed to fetch cart');

      const data = await res.json();
      const items = (data.items || []).map((item: any) => ({
        id: String(item.id),
        productId: String(item.product_id),
        name: item.product_name,
        price: item.price,
        originalPrice: item.original_price,
        image: item.image,
        quantity: item.quantity,
        stock: item.stock,
        selected: true,
      }));

      setCartItems(items);
    } catch (error) {
      console.error('Failed to fetch cart:', error);
      toast.error('加载购物车失败');
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (id: string, delta: number) => {
    const item = cartItems.find(i => i.id === id);
    if (!item) return;

    const newQuantity = Math.max(1, Math.min(item.stock, item.quantity + delta));
    
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      const res = await fetch(`${API_BASE}/products/api/cart/`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          item_id: id,
          quantity: newQuantity,
        }),
      });

      if (!res.ok) throw new Error('Failed to update');

      setCartItems(items =>
        items.map(i => i.id === id ? { ...i, quantity: newQuantity } : i)
      );
    } catch (error) {
      console.error('Failed to update quantity:', error);
      toast.error('更新失败');
    }
  };

  const toggleSelect = (id: string) => {
    setCartItems(items =>
      items.map(item => (item.id === id ? { ...item, selected: !item.selected } : item))
    );
  };

  const toggleSelectAll = () => {
    const allSelected = cartItems.every(item => item.selected);
    setCartItems(items => items.map(item => ({ ...item, selected: !allSelected })));
  };

  const removeItem = async (id: string) => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      const res = await fetch(`${API_BASE}/products/api/cart/`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ item_id: id }),
      });

      if (!res.ok) throw new Error('Failed to delete');

      setCartItems(items => items.filter(item => item.id !== id));
      toast.success('已从购物车移除');
    } catch (error) {
      console.error('Failed to remove item:', error);
      toast.error('删除失败');
    }
  };

  const selectedItems = cartItems.filter(item => item.selected);
  const subtotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0);
  const discount = selectedItems.reduce(
    (sum, item) => sum + (item.originalPrice ? (item.originalPrice - item.price) * item.quantity : 0),
    0
  );
  const total = subtotal;

  const handleCheckout = () => {
    if (selectedItems.length === 0) {
      toast.error('请选择要结算的商品');
      return;
    }
    navigate('/checkout', { state: { items: selectedItems } });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />

      <div className="container px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <h1 className="text-3xl font-bold">购物车</h1>
          <Badge variant="secondary" className="text-base px-3 py-1">
            {cartItems.length} 件商品
          </Badge>
        </div>

        {loading ? (
          <Card className="py-20">
            <CardContent className="text-center">
              <p className="text-muted-foreground">加载中...</p>
            </CardContent>
          </Card>
        ) : cartItems.length === 0 ? (
          <Card className="py-20">
            <CardContent className="text-center">
              <ShoppingBag className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
              <h3 className="text-xl font-semibold mb-2">购物车是空的</h3>
              <p className="text-muted-foreground mb-6">快去挑选心仪的商品吧</p>
              <Button onClick={() => navigate('/')}>
                去逛逛
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Cart Items */}
            <div className="lg:col-span-2 space-y-4">
              {/* Select All */}
              <Card>
                <CardContent className="p-4">
                  <div className="flex items-center gap-3">
                    <Checkbox
                      checked={cartItems.every(item => item.selected)}
                      onCheckedChange={toggleSelectAll}
                    />
                    <span className="font-medium">全选</span>
                    <span className="text-sm text-muted-foreground">
                      已选 {selectedItems.length} 件
                    </span>
                  </div>
                </CardContent>
              </Card>

              {/* Items List */}
              {cartItems.map(item => (
                <Card key={item.id}>
                  <CardContent className="p-4">
                    <div className="flex gap-4">
                      <Checkbox
                        checked={item.selected}
                        onCheckedChange={() => toggleSelect(item.id)}
                        className="mt-2"
                      />

                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-24 h-24 rounded-lg object-cover cursor-pointer"
                        onClick={() => navigate(`/product/${item.productId}`)}
                      />

                      <div className="flex-1 min-w-0">
                        <h3 
                          className="font-medium mb-2 line-clamp-2 cursor-pointer hover:text-primary"
                          onClick={() => navigate(`/product/${item.productId}`)}
                        >
                          {item.name}
                        </h3>

                        <div className="flex items-baseline gap-2 mb-3">
                          <span className="text-xl font-bold text-cta">¥{item.price}</span>
                          {item.originalPrice && (
                            <span className="text-sm text-muted-foreground line-through">
                              ¥{item.originalPrice}
                            </span>
                          )}
                        </div>

                        <div className="flex items-center justify-between">
                          <div className="flex items-center border rounded-lg">
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, -1)}
                              disabled={item.quantity <= 1}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="px-4 text-sm font-medium">{item.quantity}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => updateQuantity(item.id, 1)}
                              disabled={item.quantity >= item.stock}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>

                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => removeItem(item.id)}
                            className="text-destructive hover:text-destructive"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}

              {/* AI Recommendations */}
              <Card className="border-accent/20 bg-accent/5">
                <CardContent className="p-4">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="h-8 w-8 rounded-lg bg-gradient-ai flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-white" />
                    </div>
                    <h3 className="font-semibold">为你推荐</h3>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {[1, 2].map(i => (
                      <div key={i} className="flex gap-3 p-3 bg-card rounded-lg hover:shadow-md transition-shadow cursor-pointer">
                        <img
                          src={`https://images.unsplash.com/photo-${1595225476474 + i}?w=80&h=80&fit=crop`}
                          alt=""
                          className="w-16 h-16 rounded-lg object-cover"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-medium line-clamp-2 mb-1">
                            相关推荐商品 {i}
                          </h4>
                          <span className="text-sm font-semibold text-cta">¥99</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Order Summary */}
            <div className="lg:col-span-1">
              <Card className="sticky top-24">
                <CardContent className="p-6 space-y-4">
                  <h3 className="text-xl font-semibold mb-4">订单摘要</h3>

                  {/* Coupon */}
                  <div className="space-y-2">
                    <label className="text-sm font-medium flex items-center gap-2">
                      <Tag className="h-4 w-4" />
                      优惠券
                    </label>
                    <div className="flex gap-2">
                      <Input
                        placeholder="输入优惠码"
                        value={couponCode}
                        onChange={(e) => setCouponCode(e.target.value)}
                      />
                      <Button variant="outline">使用</Button>
                    </div>
                  </div>

                  <div className="border-t pt-4 space-y-3">
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">小计</span>
                      <span>¥{subtotal}</span>
                    </div>

                    {discount > 0 && (
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">优惠</span>
                        <span className="text-success">-¥{discount}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">运费</span>
                      <span className="text-success">包邮</span>
                    </div>

                    <div className="border-t pt-3 flex justify-between items-baseline">
                      <span className="font-medium">合计</span>
                      <span className="text-2xl font-bold text-cta">¥{total}</span>
                    </div>
                  </div>

                  <Button 
                    size="lg" 
                    className="w-full bg-gradient-cta hover:opacity-90"
                    onClick={handleCheckout}
                  >
                    去结算 ({selectedItems.length})
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>

                  <div className="text-xs text-center text-muted-foreground">
                    已选择 {selectedItems.length} 件商品
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Cart;
