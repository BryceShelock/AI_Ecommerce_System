import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileSpreadsheet, BarChart3 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884d8'];

const OrderExport = () => {
  const [dateRange, setDateRange] = useState('7');
  const [exporting, setExporting] = useState(false);
  const [chartData, setChartData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  const handleExport = async () => {
    setExporting(true);
    try {
      const daysAgo = parseInt(dateRange);
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - daysAgo);

      const { data: orders, error } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, category)
          ),
          addresses (*)
        `)
        .gte('created_at', startDate.toISOString())
        .order('created_at', { ascending: false });

      if (error) throw error;

      if (!orders || orders.length === 0) {
        toast.info('所选时间范围内没有订单数据');
        return;
      }

      // 转换为CSV格式
      const csvRows = [];
      csvRows.push([
        '订单号',
        '创建时间',
        '订单状态',
        '总金额',
        '支付方式',
        '商品数量',
        '收货人',
        '收货地址',
        '联系电话'
      ].join(','));

      orders.forEach(order => {
        const address = order.addresses as any || {};
        const itemCount = order.order_items?.length || 0;
        
        csvRows.push([
          order.order_no,
          new Date(order.created_at).toLocaleString(),
          order.status,
          order.total_amount,
          order.payment_method || '',
          itemCount,
          address.receiver_name || '',
          `${address.province || ''}${address.city || ''}${address.district || ''}${address.detail || ''}`,
          address.phone || ''
        ].join(','));
      });

      const csvContent = csvRows.join('\n');
      const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
      const link = document.createElement('a');
      link.href = URL.createObjectURL(blob);
      link.download = `orders_export_${new Date().toISOString().split('T')[0]}.csv`;
      link.click();

      toast.success(`成功导出 ${orders.length} 条订单数据`);

      // 生成图表数据
      generateChartData(orders);
    } catch (error: any) {
      console.error('Export error:', error);
      toast.error('导出失败');
    } finally {
      setExporting(false);
    }
  };

  const generateChartData = (orders: any[]) => {
    // 按日期统计订单数和金额
    const dateMap = new Map();
    const statusMap = new Map();

    orders.forEach(order => {
      const date = new Date(order.created_at).toLocaleDateString();
      
      if (!dateMap.has(date)) {
        dateMap.set(date, { date, count: 0, amount: 0 });
      }
      
      const entry = dateMap.get(date);
      entry.count += 1;
      entry.amount += Number(order.total_amount);

      // 统计状态
      const status = order.status;
      if (!statusMap.has(status)) {
        statusMap.set(status, { name: status, value: 0 });
      }
      statusMap.get(status).value += 1;
    });

    setChartData(Array.from(dateMap.values()));
    setStatusData(Array.from(statusMap.values()));
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>订单数据导出</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-4">
            <Select value={dateRange} onValueChange={setDateRange}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7">最近7天</SelectItem>
                <SelectItem value="30">最近30天</SelectItem>
                <SelectItem value="90">最近90天</SelectItem>
                <SelectItem value="365">最近一年</SelectItem>
              </SelectContent>
            </Select>

            <Button 
              onClick={handleExport}
              disabled={exporting}
            >
              {exporting ? (
                <>导出中...</>
              ) : (
                <>
                  <Download className="mr-2 h-4 w-4" />
                  导出为Excel
                </>
              )}
            </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <FileSpreadsheet className="h-8 w-8 text-primary" />
                <div>
                  <p className="text-sm text-muted-foreground">支持格式</p>
                  <p className="font-semibold">CSV / Excel</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <BarChart3 className="h-8 w-8 text-accent" />
                <div>
                  <p className="text-sm text-muted-foreground">数据分析</p>
                  <p className="font-semibold">图表可视化</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-4 flex items-center gap-3">
                <Download className="h-8 w-8 text-success" />
                <div>
                  <p className="text-sm text-muted-foreground">批量导出</p>
                  <p className="font-semibold">支持大量数据</p>
                </div>
              </CardContent>
            </Card>
          </div>
        </CardContent>
      </Card>

      {chartData.length > 0 && (
        <>
          <Card>
            <CardHeader>
              <CardTitle>订单趋势分析</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis yAxisId="left" />
                  <YAxis yAxisId="right" orientation="right" />
                  <Tooltip />
                  <Legend />
                  <Line 
                    yAxisId="left" 
                    type="monotone" 
                    dataKey="count" 
                    stroke="#8884d8" 
                    name="订单数量" 
                  />
                  <Line 
                    yAxisId="right" 
                    type="monotone" 
                    dataKey="amount" 
                    stroke="#82ca9d" 
                    name="订单金额" 
                  />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>订单状态分布</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
};

export default OrderExport;