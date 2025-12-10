import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { AlertTriangle, Bell, BellOff, Plus, Trash2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

interface Alert {
  id: string;
  product_id: string;
  threshold: number;
  is_active: boolean;
  last_alerted_at: string | null;
  products: {
    id: string;
    name: string;
    stock: number;
  };
}

const InventoryAlerts = () => {
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [lowStockAlerts, setLowStockAlerts] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState('');
  const [threshold, setThreshold] = useState('10');
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    fetchAlerts();
    fetchProducts();
    checkAlerts();
  }, []);

  const fetchAlerts = async () => {
    try {
      const { data, error } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          products (id, name, stock)
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setAlerts(data || []);
    } catch (error: any) {
      console.error('Error fetching alerts:', error);
      toast.error('获取预警规则失败');
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Error fetching products:', error);
    }
  };

  const checkAlerts = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('check-inventory-alerts');
      
      if (error) throw error;
      
      if (data?.low_stock_products && data.low_stock_products.length > 0) {
        setLowStockAlerts(data.low_stock_products);
        toast.warning(`发现 ${data.low_stock_count} 个商品库存不足！`);
      }
    } catch (error: any) {
      console.error('Error checking alerts:', error);
    }
  };

  const handleAddAlert = async () => {
    if (!selectedProduct || !threshold) {
      toast.error('请填写完整信息');
      return;
    }

    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .insert({
          product_id: selectedProduct,
          threshold: parseInt(threshold),
          is_active: true
        });

      if (error) throw error;

      toast.success('预警规则已添加');
      setDialogOpen(false);
      setSelectedProduct('');
      setThreshold('10');
      fetchAlerts();
    } catch (error: any) {
      console.error('Error adding alert:', error);
      toast.error(error?.message || '添加预警规则失败');
    }
  };

  const handleToggleAlert = async (alertId: string, isActive: boolean) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .update({ is_active: !isActive })
        .eq('id', alertId);

      if (error) throw error;

      toast.success(isActive ? '预警已关闭' : '预警已开启');
      fetchAlerts();
    } catch (error: any) {
      console.error('Error toggling alert:', error);
      toast.error('操作失败');
    }
  };

  const handleDeleteAlert = async (alertId: string) => {
    try {
      const { error } = await supabase
        .from('inventory_alerts')
        .delete()
        .eq('id', alertId);

      if (error) throw error;

      toast.success('预警规则已删除');
      fetchAlerts();
    } catch (error: any) {
      console.error('Error deleting alert:', error);
      toast.error('删除失败');
    }
  };

  return (
    <div className="space-y-6">
      {/* 低库存警报 */}
      {lowStockAlerts.length > 0 && (
        <Card className="border-warning">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-warning">
              <AlertTriangle className="h-5 w-5" />
              库存预警
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {lowStockAlerts.map((alert) => (
                <div key={alert.product_id} className="flex items-center justify-between p-3 bg-warning/10 rounded-lg">
                  <div>
                    <p className="font-semibold">{alert.product_name}</p>
                    <p className="text-sm text-muted-foreground">
                      当前库存: {alert.current_stock} / 预警阈值: {alert.threshold}
                    </p>
                  </div>
                  <Badge variant="destructive">库存不足</Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* 预警规则管理 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>预警规则</CardTitle>
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  添加规则
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>添加库存预警规则</DialogTitle>
                  <DialogDescription>
                    设置商品的库存预警阈值，当库存低于该值时将自动通知
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label>选择商品</Label>
                    <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                      <SelectTrigger>
                        <SelectValue placeholder="选择一个商品" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((product) => (
                          <SelectItem key={product.id} value={product.id}>
                            {product.name} (当前库存: {product.stock})
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label>预警阈值</Label>
                    <Input
                      type="number"
                      value={threshold}
                      onChange={(e) => setThreshold(e.target.value)}
                      placeholder="输入库存预警阈值"
                    />
                  </div>
                  <Button onClick={handleAddAlert} className="w-full">
                    添加规则
                  </Button>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-center text-muted-foreground">加载中...</p>
          ) : alerts.length === 0 ? (
            <p className="text-center text-muted-foreground">还没有预警规则</p>
          ) : (
            <div className="space-y-4">
              {alerts.map((alert) => (
                <div key={alert.id} className="flex items-center justify-between p-4 border rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-semibold">{alert.products.name}</p>
                      <Badge variant={alert.products.stock <= alert.threshold ? 'destructive' : 'secondary'}>
                        库存: {alert.products.stock}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      预警阈值: {alert.threshold}
                      {alert.last_alerted_at && ` • 最后通知: ${new Date(alert.last_alerted_at).toLocaleString()}`}
                    </p>
                  </div>
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleToggleAlert(alert.id, alert.is_active)}
                    >
                      {alert.is_active ? (
                        <Bell className="h-4 w-4" />
                      ) : (
                        <BellOff className="h-4 w-4" />
                      )}
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      onClick={() => handleDeleteAlert(alert.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default InventoryAlerts;