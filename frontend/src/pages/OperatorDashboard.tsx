import { useState } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import AnalyticsDashboard from "@/components/AnalyticsDashboard";
import ProductManagement from "@/pages/ProductManagement";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import InventoryAlerts from "@/components/InventoryAlerts";
import OrderExport from "@/components/OrderExport";
import { InventoryMonitor } from "@/components/InventoryMonitor";
import { CustomerService } from "@/components/CustomerService";
import { RefundManagement } from "@/components/RefundManagement";
import { OrderBatchOperations } from "@/components/OrderBatchOperations";
import { SKUManagement } from "@/components/SKUManagement";
import { DataVisualizationDashboard } from "@/components/DataVisualizationDashboard";
import { 
  TrendingUp, 
  ShoppingBag, 
  Users, 
  DollarSign,
  Sparkles,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";

const OperatorDashboard = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('overview');

  const stats = [
    {
      title: '总销售额',
      value: '¥128,456',
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'text-success',
    },
    {
      title: '订单数量',
      value: '1,234',
      change: '+8.2%',
      trend: 'up',
      icon: ShoppingBag,
      color: 'text-primary',
    },
    {
      title: '活跃用户',
      value: '856',
      change: '+15.3%',
      trend: 'up',
      icon: Users,
      color: 'text-accent',
    },
    {
      title: 'AI转化率',
      value: '32.8%',
      change: '-2.1%',
      trend: 'down',
      icon: Sparkles,
      color: 'text-cta',
    },
  ];

  const aiRecommendations = [
    {
      id: 1,
      product: '智能蓝牙耳机 Pro',
      potentialScore: 92,
      reason: '近7天搜索量增长180%，竞争度低，利润率高',
      category: '数码配件',
    },
    {
      id: 2,
      product: '无线充电器快充版',
      potentialScore: 88,
      reason: '市场需求稳定，客单价适中，复购率35%',
      category: '充电设备',
    },
    {
      id: 3,
      product: '运动智能手环',
      potentialScore: 85,
      reason: '季节性热销，评价优秀率94%，增长趋势明显',
      category: '智能穿戴',
    },
  ];

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="operator" />

      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">运营控制台</h1>
          <p className="text-muted-foreground">实时监控业务数据，把握市场动态</p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid grid-cols-4 lg:grid-cols-9">
            <TabsTrigger value="overview">概览</TabsTrigger>
            <TabsTrigger value="products">商品管理</TabsTrigger>
            <TabsTrigger value="sku">SKU管理</TabsTrigger>
            <TabsTrigger value="orders">订单管理</TabsTrigger>
            <TabsTrigger value="refunds">售后管理</TabsTrigger>
            <TabsTrigger value="inventory">库存预警</TabsTrigger>
            <TabsTrigger value="monitor">库存监控</TabsTrigger>
            <TabsTrigger value="service">客服管理</TabsTrigger>
            <TabsTrigger value="analytics">数据分析</TabsTrigger>
          </TabsList>

          <TabsContent value="analytics">
            <AnalyticsDashboard />
          </TabsContent>

          <TabsContent value="products" className="space-y-4">
            <ProductManagement />
          </TabsContent>

          <TabsContent value="inventory" className="space-y-4">
            <InventoryAlerts />
          </TabsContent>

          <TabsContent value="monitor" className="space-y-4">
            <InventoryMonitor />
          </TabsContent>

          <TabsContent value="service" className="space-y-4">
            <CustomerService userRole="operator" />
          </TabsContent>

          <TabsContent value="refunds" className="space-y-4">
            <RefundManagement />
          </TabsContent>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              {stats.map((stat, index) => {
                const Icon = stat.icon;
                return (
                  <Card key={index}>
                    <CardHeader className="flex flex-row items-center justify-between pb-2">
                      <CardTitle className="text-sm font-medium text-muted-foreground">
                        {stat.title}
                      </CardTitle>
                      <Icon className={`h-4 w-4 ${stat.color}`} />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{stat.value}</div>
                      <div className="flex items-center text-xs mt-2">
                        {stat.trend === 'up' ? (
                          <>
                            <ArrowUpRight className="h-4 w-4 text-success" />
                            <span className="text-success">{stat.change}</span>
                          </>
                        ) : (
                          <>
                            <ArrowDownRight className="h-4 w-4 text-destructive" />
                            <span className="text-destructive">{stat.change}</span>
                          </>
                        )}
                        <span className="text-muted-foreground ml-1">vs 上周</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className="h-10 w-10 rounded-lg bg-gradient-ai flex items-center justify-center">
                      <Sparkles className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle>AI选品推荐</CardTitle>
                      <p className="text-sm text-muted-foreground mt-1">
                        基于市场分析的高潜力商品
                      </p>
                    </div>
                  </div>
                  <Button 
                    onClick={() => navigate('/ai-product-selection')}
                    variant="outline"
                  >
                    查看更多
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {aiRecommendations.map((rec) => (
                    <div key={rec.id} className="flex items-start gap-4 p-4 border rounded-lg hover:shadow-md transition-shadow cursor-pointer"
                      onClick={() => navigate(`/ai-selection/${rec.id}`)}>
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <h4 className="font-semibold">{rec.product}</h4>
                          <div className="flex items-center gap-1 px-2 py-1 bg-gradient-ai/10 rounded">
                            <Sparkles className="h-3 w-3 text-primary" />
                            <span className="text-sm font-semibold text-primary">
                              潜力值 {rec.potentialScore}
                            </span>
                          </div>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2">{rec.reason}</p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="products">
            <Card>
              <CardContent className="p-6">
                <p className="text-muted-foreground">商品管理功能开发中...</p>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="orders">
            <OrderBatchOperations />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default OperatorDashboard;
