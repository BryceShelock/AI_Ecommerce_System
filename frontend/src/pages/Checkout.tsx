import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Separator } from "@/components/ui/separator";
import { toast } from "sonner";
import { MapPin, CreditCard, Wallet, Loader2 } from "lucide-react";

interface Address {
  id: string;
  receiver_name: string;
  phone: string;
  province: string;
  city: string;
  district: string;
  detail: string;
  is_default: boolean;
}

interface CartItem {
  id: string;
  quantity: number;
  products: {
    id: string;
    name: string;
    price: number;
    image_url: string;
  };
}

const Checkout = () => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [addresses, setAddresses] = useState<Address[]>([]);
  const [selectedAddress, setSelectedAddress] = useState<string>("");
  const [paymentMethod, setPaymentMethod] = useState("alipay");
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [newAddress, setNewAddress] = useState({
    receiver_name: "",
    phone: "",
    province: "",
    city: "",
    district: "",
    detail: "",
  });

  useEffect(() => {
    fetchData();
  }, []);

  const location = useLocation();
  const selectedItems = location.state?.items || [];

  const fetchData = async () => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      const userId = localStorage.getItem('userId') || '1';
      
      // 获取地址
      const addrRes = await fetch(`${API_BASE}/products/api/addresses/?user_id=${userId}`, {
        credentials: 'include',
      });
      if (addrRes.ok) {
        const addrData = await addrRes.json();
        setAddresses(addrData.addresses || []);
        const defaultAddr = addrData.addresses?.find((a: Address) => a.is_default);
        if (defaultAddr) setSelectedAddress(String(defaultAddr.id));
      }
      
      // 获取购物车商品（如果是从购物车跳转）
      if (selectedItems.length === 0) {
        const cartRes = await fetch(`${API_BASE}/products/api/cart/`, {
          credentials: 'include',
        });
        if (cartRes.ok) {
          const cartData = await cartRes.json();
          setCartItems(cartData.items || []);
        }
      } else {
        setCartItems(selectedItems);
      }
    } catch (error) {
      console.error('Failed to fetch data:', error);
    }
  };

  const totalAmount = cartItems.reduce(
    (sum, item) => sum + (item.price || item.products?.price || 0) * (item.quantity || 1),
    0
  );

  const handleAddAddress = async () => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      const userId = localStorage.getItem('userId') || '1';
      
      const res = await fetch(`${API_BASE}/products/api/addresses/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          ...newAddress,
          is_default: addresses.length === 0,
        }),
      });

      if (!res.ok) throw new Error('Failed to add address');

      toast.success("地址添加成功");
      setShowAddressForm(false);
      setNewAddress({
        receiver_name: "",
        phone: "",
        province: "",
        city: "",
        district: "",
        detail: "",
      });
      fetchData();
    } catch (error) {
      console.error('Failed to add address:', error);
      toast.error("添加地址失败");
    }
  };

  const handlePlaceOrder = async () => {
    if (!selectedAddress) {
      toast.error("请选择收货地址");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("购物车为空");
      return;
    }

    setLoading(true);
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      const userId = localStorage.getItem('userId') || '1';
      
      // 获取地址信息
      const selectedAddr = addresses.find(a => String(a.id) === selectedAddress);
      const shippingAddress = selectedAddr 
        ? `${selectedAddr.province} ${selectedAddr.city} ${selectedAddr.district} ${selectedAddr.detail}`
        : '';

      // 创建订单
      const orderItems = cartItems.map((item: any) => ({
        product_id: item.productId || item.product_id || item.products?.id,
        quantity: item.quantity || 1,
      }));

      const res = await fetch(`${API_BASE}/products/api/orders/`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({
          user_id: userId,
          items: orderItems,
          shipping_address: shippingAddress,
          source: 'web',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json();
        throw new Error(errorData.error || '创建订单失败');
      }

      const orderData = await res.json();
      
      // 清空购物车（可选）
      // await fetch(`${API_BASE}/products/api/cart/`, { method: 'DELETE', ... });

      toast.success("订单创建成功！");
      navigate("/orders");
    } catch (error: any) {
      console.error('Failed to place order:', error);
      toast.error(error.message || "创建订单失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />

      <div className="container px-4 py-8 max-w-6xl">
        <h1 className="text-3xl font-bold mb-8">确认订单</h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            {/* 收货地址 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MapPin className="h-5 w-5" />
                  收货地址
                </CardTitle>
              </CardHeader>
              <CardContent>
                {addresses.length === 0 && !showAddressForm ? (
                  <Button onClick={() => setShowAddressForm(true)}>
                    添加收货地址
                  </Button>
                ) : showAddressForm ? (
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div>
                        <Label>收货人</Label>
                        <Input
                          value={newAddress.receiver_name}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, receiver_name: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>电话</Label>
                        <Input
                          value={newAddress.phone}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, phone: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>省份</Label>
                        <Input
                          value={newAddress.province}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, province: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>城市</Label>
                        <Input
                          value={newAddress.city}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, city: e.target.value })
                          }
                        />
                      </div>
                      <div>
                        <Label>区县</Label>
                        <Input
                          value={newAddress.district}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, district: e.target.value })
                          }
                        />
                      </div>
                      <div className="col-span-2">
                        <Label>详细地址</Label>
                        <Input
                          value={newAddress.detail}
                          onChange={(e) =>
                            setNewAddress({ ...newAddress, detail: e.target.value })
                          }
                        />
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button onClick={handleAddAddress}>保存</Button>
                      <Button variant="outline" onClick={() => setShowAddressForm(false)}>
                        取消
                      </Button>
                    </div>
                  </div>
                ) : (
                  <RadioGroup value={selectedAddress} onValueChange={setSelectedAddress}>
                    {addresses.map((addr) => (
                      <div key={addr.id} className="flex items-start space-x-2 p-4 border rounded-lg">
                        <RadioGroupItem value={addr.id} id={addr.id} />
                        <Label htmlFor={addr.id} className="flex-1 cursor-pointer">
                          <div className="font-medium">{addr.receiver_name} {addr.phone}</div>
                          <div className="text-sm text-muted-foreground">
                            {addr.province} {addr.city} {addr.district} {addr.detail}
                          </div>
                        </Label>
                      </div>
                    ))}
                  </RadioGroup>
                )}
              </CardContent>
            </Card>

            {/* 商品清单 */}
            <Card>
              <CardHeader>
                <CardTitle>商品清单</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {cartItems.map((item: any, index: number) => (
                  <div key={item.id || index} className="flex gap-4">
                    <img
                      src={item.image || item.products?.image_url || 'https://images.unsplash.com/photo-1603789955942-64ca8f2d7c54?w=200'}
                      alt={item.name || item.products?.name}
                      className="w-20 h-20 rounded-lg object-cover"
                    />
                    <div className="flex-1">
                      <h4 className="font-medium">{item.name || item.product_name || item.products?.name}</h4>
                      <p className="text-sm text-muted-foreground">x{item.quantity || 1}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-cta">¥{item.price || item.products?.price || 0}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>

            {/* 支付方式 */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="h-5 w-5" />
                  支付方式
                </CardTitle>
              </CardHeader>
              <CardContent>
                <RadioGroup value={paymentMethod} onValueChange={setPaymentMethod}>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="alipay" id="alipay" />
                    <Label htmlFor="alipay" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-4 w-4" />
                      支付宝
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="wechat" id="wechat" />
                    <Label htmlFor="wechat" className="flex items-center gap-2 cursor-pointer">
                      <Wallet className="h-4 w-4" />
                      微信支付
                    </Label>
                  </div>
                </RadioGroup>
              </CardContent>
            </Card>
          </div>

          {/* 订单总计 */}
          <div>
            <Card className="sticky top-4">
              <CardHeader>
                <CardTitle>订单总计</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">商品总额</span>
                    <span>¥{totalAmount.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">运费</span>
                    <span>免费</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between text-lg font-bold">
                    <span>实付金额</span>
                    <span className="text-cta">¥{totalAmount.toFixed(2)}</span>
                  </div>
                </div>
                <Button
                  className="w-full"
                  size="lg"
                  onClick={handlePlaceOrder}
                  disabled={loading || !selectedAddress}
                >
                  {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                  提交订单
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Checkout;