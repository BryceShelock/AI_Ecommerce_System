import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Package,
  Truck,
  CheckCircle,
  XCircle,
  RotateCcw,
  MessageSquare,
  ChevronRight,
  X,
} from "lucide-react";
import { ReviewDialog } from "@/components/ReviewDialog";
import { RefundDialog } from "@/components/RefundDialog";
import { CustomerService } from "@/components/CustomerService";
import { toast } from "sonner";

interface Order {
  id: string;
  orderNo: string;
  status: 'pending' | 'paid' | 'shipped' | 'completed' | 'cancelled';
  createTime: string;
  totalAmount: number;
  items: Array<{
    id: string;
    productId: string;
    name: string;
    image: string;
    price: number;
    quantity: number;
  }>;
}

const Orders = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('all');
  const [reviewDialog, setReviewDialog] = useState<{
    open: boolean;
    orderId: string;
    productId: string;
    productName: string;
  }>({
    open: false,
    orderId: '',
    productId: '',
    productName: '',
  });
  const [refundDialog, setRefundDialog] = useState<{
    open: boolean;
    orderId: string;
    orderAmount: number;
  }>({
    open: false,
    orderId: '',
    orderAmount: 0,
  });
  const [showCustomerService, setShowCustomerService] = useState(false);

  const orders: Order[] = [
    {
      id: '1',
      orderNo: 'OD20250114001',
      status: 'shipped',
      createTime: '2025-01-14 10:30:00',
      totalAmount: 617,
      items: [
        {
          id: '1',
          productId: '1',
          name: '智能蓝牙耳机 Pro - 降噪版',
          image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=200&h=200&fit=crop',
          price: 299,
          quantity: 1,
        },
        {
          id: '2',
          productId: '2',
          name: '无线充电器 快充版',
          image: 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=200&h=200&fit=crop',
          price: 159,
          quantity: 2,
        },
      ],
    },
    {
      id: '2',
      orderNo: 'OD20250113001',
      status: 'completed',
      createTime: '2025-01-13 15:20:00',
      totalAmount: 199,
      items: [
        {
          id: '3',
          productId: '3',
          name: '智能手环 运动健康监测',
          image: 'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=200&h=200&fit=crop',
          price: 199,
          quantity: 1,
        },
      ],
    },
    {
      id: '3',
      orderNo: 'OD20250112001',
      status: 'paid',
      createTime: '2025-01-12 09:15:00',
      totalAmount: 399,
      items: [
        {
          id: '4',
          productId: '4',
          name: '机械键盘 RGB背光 青轴',
          image: 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=200&h=200&fit=crop',
          price: 399,
          quantity: 1,
        },
      ],
    },
  ];

  const getStatusConfig = (status: Order['status']) => {
    const configs = {
      pending: { label: '待付款', icon: Package, color: 'text-warning', bg: 'bg-warning/10' },
      paid: { label: '待发货', icon: Package, color: 'text-primary', bg: 'bg-primary/10' },
      shipped: { label: '已发货', icon: Truck, color: 'text-accent', bg: 'bg-accent/10' },
      completed: { label: '已完成', icon: CheckCircle, color: 'text-success', bg: 'bg-success/10' },
      cancelled: { label: '已取消', icon: XCircle, color: 'text-destructive', bg: 'bg-destructive/10' },
    };
    return configs[status];
  };

  const filterOrders = (status: string) => {
    if (status === 'all') return orders;
    return orders.filter(order => order.status === status);
  };

  const renderOrderCard = (order: Order) => {
    const statusConfig = getStatusConfig(order.status);
    const StatusIcon = statusConfig.icon;

    return (
      <Card key={order.id} className="hover:shadow-lg transition-shadow">
        <CardContent className="p-6">
          {/* Order Header */}
          <div className="flex items-center justify-between pb-4 border-b">
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">订单号: {order.orderNo}</span>
              <span className="text-sm text-muted-foreground">{order.createTime}</span>
            </div>
            <Badge className={`${statusConfig.bg} ${statusConfig.color}`}>
              <StatusIcon className="h-3 w-3 mr-1" />
              {statusConfig.label}
            </Badge>
          </div>

          {/* Order Items */}
          <div className="py-4 space-y-4">
            {order.items.map(item => (
              <div key={item.id} className="flex gap-4">
                <img
                  src={item.image}
                  alt={item.name}
                  className="w-20 h-20 rounded-lg object-cover cursor-pointer"
                  onClick={() => navigate(`/product/${item.productId}`)}
                />
                <div className="flex-1 min-w-0">
                  <h4 
                    className="font-medium mb-1 line-clamp-2 cursor-pointer hover:text-primary"
                    onClick={() => navigate(`/product/${item.productId}`)}
                  >
                    {item.name}
                  </h4>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-muted-foreground">x{item.quantity}</span>
                    <span className="font-semibold text-cta">¥{item.price}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Order Footer */}
          <div className="flex items-center justify-between pt-4 border-t">
          <div className="flex gap-2">
              {order.status === 'pending' && (
                <>
                  <Button variant="outline" size="sm">
                    立即付款
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => {
                      // 取消订单逻辑
                      toast.info('订单已取消');
                    }}
                  >
                    取消订单
                  </Button>
                </>
              )}
              {order.status === 'shipped' && (
                <Button variant="outline" size="sm">
                  <Truck className="h-4 w-4 mr-1" />
                  查看物流
                </Button>
              )}
              {order.status === 'completed' && (
                <>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setReviewDialog({
                      open: true,
                      orderId: order.id,
                      productId: order.items[0].productId,
                      productName: order.items[0].name,
                    })}
                  >
                    <MessageSquare className="h-4 w-4 mr-1" />
                    评价
                  </Button>
                  <Button 
                    variant="outline" 
                    size="sm"
                    onClick={() => setRefundDialog({
                      open: true,
                      orderId: order.id,
                      orderAmount: order.totalAmount,
                    })}
                  >
                    <RotateCcw className="h-4 w-4 mr-1" />
                    申请退款
                  </Button>
                </>
              )}
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setShowCustomerService(true)}
              >
                <MessageSquare className="h-4 w-4 mr-1" />
                联系客服
              </Button>
            </div>
            
            <div className="flex items-center gap-3">
              <div className="text-right">
                <span className="text-sm text-muted-foreground mr-2">实付：</span>
                <span className="text-xl font-bold text-cta">¥{order.totalAmount}</span>
              </div>
              <Button variant="ghost" size="sm">
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />

      <div className="container px-4 py-8">
        <h1 className="text-3xl font-bold mb-8">我的订单</h1>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="grid w-full grid-cols-6 mb-8">
            <TabsTrigger value="all">全部</TabsTrigger>
            <TabsTrigger value="pending">待付款</TabsTrigger>
            <TabsTrigger value="paid">待发货</TabsTrigger>
            <TabsTrigger value="shipped">待收货</TabsTrigger>
            <TabsTrigger value="completed">已完成</TabsTrigger>
            <TabsTrigger value="cancelled">已取消</TabsTrigger>
          </TabsList>

          {['all', 'pending', 'paid', 'shipped', 'completed', 'cancelled'].map(status => (
            <TabsContent key={status} value={status} className="space-y-4">
              {filterOrders(status).length === 0 ? (
                <Card className="py-20">
                  <CardContent className="text-center">
                    <Package className="h-16 w-16 mx-auto mb-4 text-muted-foreground" />
                    <h3 className="text-xl font-semibold mb-2">暂无订单</h3>
                    <p className="text-muted-foreground mb-6">快去挑选心仪的商品吧</p>
                    <Button onClick={() => navigate('/')}>去逛逛</Button>
                  </CardContent>
                </Card>
              ) : (
                filterOrders(status).map(order => renderOrderCard(order))
              )}
            </TabsContent>
          ))}
        </Tabs>
      </div>

      {/* 评价对话框 */}
      <ReviewDialog
        open={reviewDialog.open}
        onOpenChange={(open) => setReviewDialog({ ...reviewDialog, open })}
        orderId={reviewDialog.orderId}
        productId={reviewDialog.productId}
        productName={reviewDialog.productName}
      />

      {/* 退款对话框 */}
      <RefundDialog
        open={refundDialog.open}
        onOpenChange={(open) => setRefundDialog({ ...refundDialog, open })}
        orderId={refundDialog.orderId}
        orderAmount={refundDialog.orderAmount}
      />

      {/* 客服对话 */}
      {showCustomerService && (
        <div className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="w-full max-w-6xl bg-background rounded-lg shadow-2xl">
            <div className="flex items-center justify-between p-4 border-b">
              <h2 className="text-lg font-semibold">联系客服</h2>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setShowCustomerService(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <CustomerService userRole="customer" />
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
