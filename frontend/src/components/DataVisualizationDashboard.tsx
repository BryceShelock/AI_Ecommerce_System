import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell, 
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  ScatterChart, Scatter, AreaChart, Area
} from "recharts";
import { TrendingUp, Users, ShoppingCart, Package, DollarSign } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface SalesData {
  date: string;
  sales: number;
  orders: number;
}

interface CategoryData {
  name: string;
  value: number;
  color: string;
}

interface ProductHeatmap {
  product_name: string;
  views: number;
  purchases: number;
}

export const DataVisualizationDashboard = () => {
  const [salesData, setSalesData] = useState<SalesData[]>([]);
  const [categoryData, setCategoryData] = useState<CategoryData[]>([]);
  const [productHeatmap, setProductHeatmap] = useState<ProductHeatmap[]>([]);
  const [userBehaviorData, setUserBehaviorData] = useState<any[]>([]);
  const [kpis, setKpis] = useState({
    totalSales: 0,
    totalOrders: 0,
    totalUsers: 0,
    totalProducts: 0,
    avgOrderValue: 0,
  });

  useEffect(() => {
    fetchDashboardData();
  }, []);

  const fetchDashboardData = async () => {
    try {
      // Fetch orders for sales trends
      const { data: orders } = await supabase
        .from('orders')
        .select('created_at, total_amount, status')
        .order('created_at', { ascending: true });

      // Process sales data by date
      if (orders) {
        const salesByDate = orders.reduce((acc: any, order) => {
          const date = new Date(order.created_at).toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' });
          if (!acc[date]) {
            acc[date] = { date, sales: 0, orders: 0 };
          }
          acc[date].sales += Number(order.total_amount);
          acc[date].orders += 1;
          return acc;
        }, {});

        const last7Days = Object.values(salesByDate).slice(-7) as SalesData[];
        setSalesData(last7Days);

        // Calculate KPIs
        const totalSales = orders.reduce((sum, o) => sum + Number(o.total_amount), 0);
        const totalOrders = orders.length;
        setKpis(prev => ({
          ...prev,
          totalSales,
          totalOrders,
          avgOrderValue: totalOrders > 0 ? totalSales / totalOrders : 0,
        }));
      }

      // Fetch products for category distribution
      const { data: products } = await supabase
        .from('products')
        .select('category, price');

      if (products) {
        const categoryCounts = products.reduce((acc: any, product) => {
          const cat = product.category || '其他';
          acc[cat] = (acc[cat] || 0) + 1;
          return acc;
        }, {});

        const colors = ['hsl(var(--primary))', 'hsl(var(--accent))', 'hsl(var(--cta))', 'hsl(var(--muted))'];
        const categoryChartData = Object.entries(categoryCounts).map(([name, value], index) => ({
          name,
          value: value as number,
          color: colors[index % colors.length],
        }));
        setCategoryData(categoryChartData);
        setKpis(prev => ({ ...prev, totalProducts: products.length }));
      }

      // Fetch user behavior data
      const { data: behaviors } = await supabase
        .from('user_behaviors')
        .select(`
          action_type,
          created_at,
          products (name)
        `)
        .order('created_at', { ascending: false })
        .limit(100);

      if (behaviors) {
        // Process for heatmap
        const productStats = behaviors.reduce((acc: any, b: any) => {
          if (!b.products?.name) return acc;
          const name = b.products.name;
          if (!acc[name]) {
            acc[name] = { product_name: name, views: 0, purchases: 0 };
          }
          if (b.action_type === 'view') acc[name].views += 1;
          if (b.action_type === 'purchase') acc[name].purchases += 1;
          return acc;
        }, {});

        setProductHeatmap(Object.values(productStats).slice(0, 10) as ProductHeatmap[]);

        // User behavior timeline
        const behaviorTimeline = behaviors.slice(0, 20).map((b: any, i) => ({
          time: new Date(b.created_at).toLocaleTimeString('zh-CN'),
          action: b.action_type,
          index: i,
        }));
        setUserBehaviorData(behaviorTimeline);
      }

      // Fetch users count
      const { count: userCount } = await supabase
        .from('profiles')
        .select('*', { count: 'exact', head: true });

      setKpis(prev => ({ ...prev, totalUsers: userCount || 0 }));

    } catch (error) {
      console.error('Failed to fetch dashboard data:', error);
    }
  };

  return (
    <div className="space-y-6">
      {/* KPI Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">总销售额</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-cta">¥{kpis.totalSales.toFixed(2)}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">订单数量</CardTitle>
            <ShoppingCart className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalOrders}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">用户总数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalUsers}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">商品总数</CardTitle>
            <Package className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{kpis.totalProducts}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2">
            <CardTitle className="text-sm font-medium">平均订单额</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">¥{kpis.avgOrderValue.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="sales" className="space-y-4">
        <TabsList>
          <TabsTrigger value="sales">销售趋势</TabsTrigger>
          <TabsTrigger value="behavior">用户行为</TabsTrigger>
          <TabsTrigger value="products">商品热力</TabsTrigger>
          <TabsTrigger value="categories">品类分布</TabsTrigger>
        </TabsList>

        <TabsContent value="sales" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>近7天销售趋势</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="salesGradient" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="hsl(var(--primary))" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="date" stroke="hsl(var(--muted-foreground))" />
                  <YAxis stroke="hsl(var(--muted-foreground))" />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "hsl(var(--card))",
                      border: "1px solid hsl(var(--border))",
                      borderRadius: "8px",
                    }}
                  />
                  <Legend />
                  <Area
                    type="monotone"
                    dataKey="sales"
                    stroke="hsl(var(--primary))"
                    fillOpacity={1}
                    fill="url(#salesGradient)"
                    name="销售额 (¥)"
                  />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="behavior">
          <Card>
            <CardHeader>
              <CardTitle>用户行为时间线</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <ScatterChart>
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis dataKey="index" stroke="hsl(var(--muted-foreground))" name="序号" />
                  <YAxis dataKey="time" stroke="hsl(var(--muted-foreground))" name="时间" />
                  <Tooltip cursor={{ strokeDasharray: '3 3' }} />
                  <Legend />
                  <Scatter name="用户行为" data={userBehaviorData} fill="hsl(var(--accent))" />
                </ScatterChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="products">
          <Card>
            <CardHeader>
              <CardTitle>商品热力图 - Top 10</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <BarChart data={productHeatmap} layout="vertical">
                  <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" />
                  <XAxis type="number" stroke="hsl(var(--muted-foreground))" />
                  <YAxis dataKey="product_name" type="category" width={150} stroke="hsl(var(--muted-foreground))" />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="views" fill="hsl(var(--primary))" name="浏览量" radius={[0, 8, 8, 0]} />
                  <Bar dataKey="purchases" fill="hsl(var(--cta))" name="购买量" radius={[0, 8, 8, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="categories">
          <Card>
            <CardHeader>
              <CardTitle>品类分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={350}>
                <PieChart>
                  <Pie
                    data={categoryData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ name, value }) => `${name}: ${value}`}
                    outerRadius={120}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {categoryData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};
