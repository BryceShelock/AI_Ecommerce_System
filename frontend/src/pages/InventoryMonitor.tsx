import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  TrendingDown, 
  TrendingUp, 
  AlertTriangle,
  Package,
  ShoppingCart,
  CheckCircle,
  Clock
} from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar
} from "recharts";

export const InventoryMonitor = () => {
  const [alerts, setAlerts] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const [trendData, setTrendData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    try {
      setLoading(true);
      
      // 获取库存预警
      const { data: alertsData } = await supabase
        .from('inventory_alerts')
        .select(`
          *,
          products (*)
        `)
        .eq('is_active', true)
        .order('last_alerted_at', { ascending: false });

      // 获取补货建议
      const { data: suggestionsData } = await supabase
        .from('restock_suggestions')
        .select(`
          *,
          products (*)
        `)
        .order('priority', { ascending: false })
        .limit(10);

      // 生成趋势数据（模拟）
      const trend = Array.from({ length: 7 }, (_, i) => ({
        date: new Date(Date.now() - (6 - i) * 24 * 60 * 60 * 1000).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' }),
        alerts: Math.floor(Math.random() * 10) + 5,
        restocked: Math.floor(Math.random() * 8) + 2
      }));

      setAlerts(alertsData || []);
      setSuggestions(suggestionsData || []);
      setTrendData(trend);
    } catch (error) {
      console.error('Failed to fetch inventory data:', error);
      toast.error('加载库存数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleGeneratePurchaseOrder = async (suggestion: any) => {
    try {
      // 更新补货建议状态
      await supabase
        .from('restock_suggestions')
        .update({ status: 'ordered' })
        .eq('id', suggestion.id);

      toast.success('采购单已生成', {
        description: `已为 ${suggestion.products?.name} 创建采购单`
      });
      
      fetchData();
    } catch (error) {
      console.error('Failed to generate purchase order:', error);
      toast.error('生成采购单失败');
    }
  };

  const handleApproveSuggestion = async (suggestion: any) => {
    try {
      await supabase
        .from('restock_suggestions')
        .update({ status: 'approved' })
        .eq('id', suggestion.id);

      toast.success('补货建议已批准');
      fetchData();
    } catch (error) {
      console.error('Failed to approve suggestion:', error);
      toast.error('批准补货建议失败');
    }
  };

  const getPriorityBadge = (priority: string) => {
    const configs = {
      high: { label: '高', variant: 'destructive' as const },
      medium: { label: '中', variant: 'default' as const },
      low: { label: '低', variant: 'secondary' as const }
    };
    const config = configs[priority as keyof typeof configs] || configs.medium;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  const getStatusBadge = (status: string) => {
    const configs = {
      pending: { label: '待处理', icon: Clock, variant: 'outline' as const },
      approved: { label: '已批准', icon: CheckCircle, variant: 'default' as const },
      ordered: { label: '已下单', icon: ShoppingCart, variant: 'secondary' as const },
      completed: { label: '已完成', icon: CheckCircle, variant: 'default' as const }
    };
    const config = configs[status as keyof typeof configs] || configs.pending;
    const Icon = config.icon;
    return (
      <Badge variant={config.variant} className="gap-1">
        <Icon className="h-3 w-3" />
        {config.label}
      </Badge>
    );
  };

  if (loading) {
    return <div className="flex items-center justify-center p-8">加载中...</div>;
  }

  return (
    <div className="space-y-6">
      {/* 概览卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">活跃预警</p>
                <p className="text-2xl font-bold">{alerts.length}</p>
              </div>
              <div className="h-12 w-12 rounded-full bg-destructive/10 flex items-center justify-center">
                <AlertTriangle className="h-6 w-6 text-destructive" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">待处理建议</p>
                <p className="text-2xl font-bold">
                  {suggestions.filter(s => s.status === 'pending').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-warning/10 flex items-center justify-center">
                <Package className="h-6 w-6 text-warning" />
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">已下单</p>
                <p className="text-2xl font-bold">
                  {suggestions.filter(s => s.status === 'ordered').length}
                </p>
              </div>
              <div className="h-12 w-12 rounded-full bg-success/10 flex items-center justify-center">
                <ShoppingCart className="h-6 w-6 text-success" />
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 趋势图表 */}
      <Card>
        <CardHeader>
          <CardTitle>库存预警趋势</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={trendData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Line 
                type="monotone" 
                dataKey="alerts" 
                stroke="hsl(var(--destructive))" 
                name="预警数量"
                strokeWidth={2}
              />
              <Line 
                type="monotone" 
                dataKey="restocked" 
                stroke="hsl(var(--success))" 
                name="补货完成"
                strokeWidth={2}
              />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* 补货建议和采购单 */}
      <Tabs defaultValue="suggestions" className="space-y-4">
        <TabsList>
          <TabsTrigger value="suggestions">补货建议</TabsTrigger>
          <TabsTrigger value="alerts">库存预警</TabsTrigger>
        </TabsList>

        <TabsContent value="suggestions" className="space-y-4">
          {suggestions.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无补货建议
              </CardContent>
            </Card>
          ) : (
            suggestions.map((suggestion) => (
              <Card key={suggestion.id}>
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <h3 className="font-semibold">{suggestion.products?.name}</h3>
                        {getPriorityBadge(suggestion.priority)}
                        {getStatusBadge(suggestion.status)}
                      </div>
                      <div className="space-y-1 text-sm text-muted-foreground">
                        <p>当前库存: {suggestion.current_stock}</p>
                        <p>建议补货数量: {suggestion.suggested_quantity}</p>
                        <p>原因: {suggestion.reason}</p>
                      </div>
                    </div>
                    <div className="flex gap-2">
                      {suggestion.status === 'pending' && (
                        <Button
                          size="sm"
                          onClick={() => handleApproveSuggestion(suggestion)}
                        >
                          批准
                        </Button>
                      )}
                      {suggestion.status === 'approved' && (
                        <Button
                          size="sm"
                          onClick={() => handleGeneratePurchaseOrder(suggestion)}
                        >
                          生成采购单
                        </Button>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>

        <TabsContent value="alerts" className="space-y-4">
          {alerts.length === 0 ? (
            <Card>
              <CardContent className="py-8 text-center text-muted-foreground">
                暂无库存预警
              </CardContent>
            </Card>
          ) : (
            alerts.map((alert) => (
              <Card key={alert.id}>
                <CardContent className="pt-6">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <AlertTriangle className="h-5 w-5 text-destructive" />
                      <div>
                        <h3 className="font-semibold">{alert.products?.name}</h3>
                        <p className="text-sm text-muted-foreground">
                          当前库存: {alert.products?.stock} | 预警阈值: {alert.threshold}
                        </p>
                      </div>
                    </div>
                    {alert.last_alerted_at && (
                      <p className="text-sm text-muted-foreground">
                        {new Date(alert.last_alerted_at).toLocaleString('zh-CN')}
                      </p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};
