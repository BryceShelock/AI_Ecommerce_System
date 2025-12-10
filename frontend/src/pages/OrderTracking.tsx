import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ChevronLeft, Package, Truck, CheckCircle, MapPin } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const OrderTracking = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const [order, setOrder] = useState<any>(null);
  const [logistics, setLogistics] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (orderId) {
      fetchOrderDetails();
    }
  }, [orderId]);

  const fetchOrderDetails = async () => {
    try {
      // 获取订单信息
      const { data: orderData, error: orderError } = await supabase
        .from('orders')
        .select('*, order_items(*, products(*))')
        .eq('id', orderId)
        .single();

      if (orderError) throw orderError;
      setOrder(orderData);

      // 获取物流信息
      const { data: logisticsData, error: logisticsError } = await supabase
        .from('order_logistics')
        .select('*')
        .eq('order_id', orderId)
        .single();

      if (logisticsError && logisticsError.code !== 'PGRST116') {
        console.error('Logistics fetch error:', logisticsError);
      }
      
      setLogistics(logisticsData);
    } catch (error: any) {
      toast.error("加载订单详情失败", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'processing':
        return <Package className="h-5 w-5" />;
      case 'shipped':
        return <Truck className="h-5 w-5" />;
      case 'delivered':
        return <CheckCircle className="h-5 w-5" />;
      default:
        return <Package className="h-5 w-5" />;
    }
  };

  const getStatusText = (status: string) => {
    const statusMap: { [key: string]: string } = {
      pending: '待支付',
      processing: '处理中',
      shipped: '已发货',
      delivered: '已送达',
      cancelled: '已取消',
    };
    return statusMap[status] || status;
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <Header userRole="customer" />
        <div className="container px-4 py-8">
          <p className="text-center text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen bg-background">
        <Header userRole="customer" />
        <div className="container px-4 py-8">
          <p className="text-center text-muted-foreground">订单不存在</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />

      <div className="container px-4 py-8 max-w-4xl">
        <Button
          variant="ghost"
          onClick={() => navigate('/orders')}
          className="mb-6"
        >
          <ChevronLeft className="mr-2 h-4 w-4" />
          返回订单列表
        </Button>

        {/* 订单状态 */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle>订单状态</CardTitle>
              <Badge variant={order.status === 'delivered' ? 'default' : 'secondary'}>
                {getStatusText(order.status)}
              </Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">订单号</span>
                <span className="font-mono">{order.order_no}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">下单时间</span>
                <span>{new Date(order.created_at).toLocaleString('zh-CN')}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="text-muted-foreground">订单金额</span>
                <span className="text-lg font-bold text-cta">¥{order.total_amount}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* 物流信息 */}
        {logistics && (
          <Card className="mb-6">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="h-5 w-5" />
                物流信息
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {logistics.carrier && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">承运公司</span>
                    <span>{logistics.carrier}</span>
                  </div>
                )}
                {logistics.tracking_number && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">运单号</span>
                    <span className="font-mono">{logistics.tracking_number}</span>
                  </div>
                )}
                {logistics.current_location && (
                  <div className="flex items-center gap-2 text-sm">
                    <MapPin className="h-4 w-4 text-muted-foreground" />
                    <span>{logistics.current_location}</span>
                  </div>
                )}
                {logistics.estimated_delivery && (
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">预计送达</span>
                    <span>{new Date(logistics.estimated_delivery).toLocaleString('zh-CN')}</span>
                  </div>
                )}

                <Separator />

                {/* 物流轨迹 */}
                {logistics.updates && Array.isArray(logistics.updates) && logistics.updates.length > 0 && (
                  <div className="space-y-4">
                    <h4 className="font-semibold text-sm">物流轨迹</h4>
                    <div className="space-y-3">
                      {logistics.updates.map((update: any, index: number) => (
                        <div key={index} className="flex gap-3">
                          <div className="flex flex-col items-center">
                            <div className={`w-2 h-2 rounded-full ${index === 0 ? 'bg-primary' : 'bg-muted'}`} />
                            {index !== logistics.updates.length - 1 && (
                              <div className="w-px h-full bg-border" />
                            )}
                          </div>
                          <div className="flex-1 pb-4">
                            <p className="text-sm">{update.message}</p>
                            <p className="text-xs text-muted-foreground mt-1">
                              {new Date(update.timestamp).toLocaleString('zh-CN')}
                            </p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        )}

        {/* 商品列表 */}
        <Card>
          <CardHeader>
            <CardTitle>商品信息</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {order.order_items?.map((item: any) => (
                <div key={item.id} className="flex gap-4">
                  <img
                    src={item.products.image_url}
                    alt={item.products.name}
                    className="w-20 h-20 object-cover rounded"
                  />
                  <div className="flex-1">
                    <h4 className="font-medium">{item.products.name}</h4>
                    <div className="flex items-center justify-between mt-2">
                      <span className="text-sm text-muted-foreground">
                        x{item.quantity}
                      </span>
                      <span className="text-cta font-semibold">
                        ¥{item.price}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default OrderTracking;
