import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Package, Truck, Download, CheckSquare, Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Order {
  id: string;
  order_no: string;
  status: string;
  total_amount: number;
  created_at: string;
  user_id: string;
}

export const OrderBatchOperations = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrders, setSelectedOrders] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(false);
  const [filterStatus, setFilterStatus] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    fetchOrders();
  }, [filterStatus]);

  const fetchOrders = async () => {
    try {
      let query = supabase
        .from('orders')
        .select('*')
        .order('created_at', { ascending: false });

      if (filterStatus !== 'all') {
        query = query.eq('status', filterStatus);
      }

      const { data, error } = await query;
      if (error) throw error;
      setOrders(data || []);
    } catch (error) {
      console.error('Failed to fetch orders:', error);
    }
  };

  const toggleSelect = (orderId: string) => {
    setSelectedOrders(prev => {
      const newSet = new Set(prev);
      if (newSet.has(orderId)) {
        newSet.delete(orderId);
      } else {
        newSet.add(orderId);
      }
      return newSet;
    });
  };

  const selectAll = () => {
    if (selectedOrders.size === filteredOrders.length) {
      setSelectedOrders(new Set());
    } else {
      setSelectedOrders(new Set(filteredOrders.map(o => o.id)));
    }
  };

  const handleBatchStatusUpdate = async (newStatus: string) => {
    if (selectedOrders.size === 0) {
      toast.error('请先选择订单');
      return;
    }

    try {
      setLoading(true);
      const { error } = await supabase
        .from('orders')
        .update({ status: newStatus, updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedOrders));

      if (error) throw error;

      toast.success(`已批量更新 ${selectedOrders.size} 个订单状态`);
      setSelectedOrders(new Set());
      fetchOrders();
    } catch (error) {
      console.error('Batch update failed:', error);
      toast.error('批量更新失败');
    } finally {
      setLoading(false);
    }
  };

  const handleBatchShip = async () => {
    if (selectedOrders.size === 0) {
      toast.error('请先选择订单');
      return;
    }

    try {
      setLoading(true);
      
      // Update order status
      await supabase
        .from('orders')
        .update({ status: 'shipped', updated_at: new Date().toISOString() })
        .in('id', Array.from(selectedOrders));

      // Create logistics records
      const logisticsRecords = Array.from(selectedOrders).map(orderId => ({
        order_id: orderId,
        status: 'shipped',
        carrier: '顺丰速运',
        tracking_number: `SF${Date.now()}${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        estimated_delivery: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString(),
      }));

      await supabase.from('order_logistics').insert(logisticsRecords);

      toast.success(`已批量发货 ${selectedOrders.size} 个订单`);
      setSelectedOrders(new Set());
      fetchOrders();
    } catch (error) {
      console.error('Batch ship failed:', error);
      toast.error('批量发货失败');
    } finally {
      setLoading(false);
    }
  };

  const handleExport = () => {
    if (selectedOrders.size === 0) {
      toast.error('请先选择要导出的订单');
      return;
    }

    const exportData = orders
      .filter(o => selectedOrders.has(o.id))
      .map(o => ({
        订单号: o.order_no,
        状态: getStatusLabel(o.status),
        金额: o.total_amount,
        下单时间: new Date(o.created_at).toLocaleString('zh-CN'),
      }));

    const csv = [
      Object.keys(exportData[0]).join(','),
      ...exportData.map(row => Object.values(row).join(','))
    ].join('\n');

    const blob = new Blob(['\ufeff' + csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `orders_${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);

    toast.success(`已导出 ${selectedOrders.size} 个订单`);
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      pending: '待付款',
      paid: '已付款',
      shipped: '已发货',
      delivered: '已送达',
      completed: '已完成',
      cancelled: '已取消',
    };
    return labels[status] || status;
  };

  const getStatusBadgeVariant = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: 'secondary',
      paid: 'default',
      shipped: 'default',
      delivered: 'default',
      completed: 'default',
      cancelled: 'destructive',
    };
    return variants[status] || 'secondary';
  };

  const filteredOrders = orders.filter(order =>
    order.order_no.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Package className="h-5 w-5" />
          订单批量操作
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Filters and Search */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索订单号..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-[180px]">
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待付款</SelectItem>
              <SelectItem value="paid">已付款</SelectItem>
              <SelectItem value="shipped">已发货</SelectItem>
              <SelectItem value="delivered">已送达</SelectItem>
              <SelectItem value="completed">已完成</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Batch Actions */}
        <div className="flex flex-wrap gap-2 p-4 bg-muted/30 rounded-lg">
          <Button
            variant="outline"
            size="sm"
            onClick={selectAll}
          >
            <CheckSquare className="h-4 w-4 mr-1" />
            {selectedOrders.size === filteredOrders.length ? '取消全选' : '全选'}
          </Button>
          <Select onValueChange={handleBatchStatusUpdate} disabled={loading}>
            <SelectTrigger className="w-[140px]">
              <SelectValue placeholder="批量改状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="paid">设为已付款</SelectItem>
              <SelectItem value="shipped">设为已发货</SelectItem>
              <SelectItem value="delivered">设为已送达</SelectItem>
              <SelectItem value="completed">设为已完成</SelectItem>
            </SelectContent>
          </Select>
          <Button
            variant="outline"
            size="sm"
            onClick={handleBatchShip}
            disabled={loading}
          >
            <Truck className="h-4 w-4 mr-1" />
            批量发货
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleExport}
          >
            <Download className="h-4 w-4 mr-1" />
            导出选中
          </Button>
          <span className="text-sm text-muted-foreground self-center ml-auto">
            已选择 {selectedOrders.size} 个订单
          </span>
        </div>

        {/* Orders List */}
        <ScrollArea className="h-[400px]">
          <div className="space-y-2">
            {filteredOrders.map((order) => (
              <div
                key={order.id}
                className={`flex items-center gap-4 p-4 border rounded-lg hover:bg-muted/30 transition-colors ${
                  selectedOrders.has(order.id) ? 'bg-muted/50 border-primary' : ''
                }`}
              >
                <Checkbox
                  checked={selectedOrders.has(order.id)}
                  onCheckedChange={() => toggleSelect(order.id)}
                />
                <div className="flex-1 grid grid-cols-4 gap-4 items-center">
                  <div>
                    <p className="font-medium">{order.order_no}</p>
                    <p className="text-sm text-muted-foreground">
                      {new Date(order.created_at).toLocaleDateString('zh-CN')}
                    </p>
                  </div>
                  <Badge variant={getStatusBadgeVariant(order.status)}>
                    {getStatusLabel(order.status)}
                  </Badge>
                  <p className="font-semibold text-cta">¥{order.total_amount}</p>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
