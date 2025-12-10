import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  ShoppingBag,
  Star,
  ChevronLeft,
  Sparkles,
  BarChart3,
  Package,
} from "lucide-react";

const AISelectionDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const handleExportReport = async (format: 'json' | 'csv' | 'excel') => {
    try {
      const API_BASE = (import.meta as any).env?.VITE_API_BASE || '';
      const url = `${API_BASE}/ai_select/export/?format=${format}${id ? `&product_id=${id}` : ''}`;
      
      const response = await fetch(url, {
        method: 'GET',
        credentials: 'include',
      });

      if (!response.ok) {
        throw new Error('导出失败');
      }

      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      
      const contentDisposition = response.headers.get('Content-Disposition');
      let filename = `ai_analysis_report_${new Date().getTime()}.${format}`;
      if (contentDisposition) {
        const filenameMatch = contentDisposition.match(/filename="(.+)"/);
        if (filenameMatch) {
          filename = filenameMatch[1];
        }
      }
      
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(downloadUrl);
      
      toast.success(`报告已导出为${format.toUpperCase()}格式`);
    } catch (error) {
      console.error('Export error:', error);
      toast.error('导出失败，请稍后重试');
    }
  };

  // Mock product analysis data
  const productAnalysis = {
    id: id || '1',
    name: '智能蓝牙耳机 Pro',
    category: '数码配件',
    potentialScore: 92,
    aiRecommendation: '高潜力商品，建议重点推广',
    image: 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=400&h=400&fit=crop',
    
    marketAnalysis: {
      searchVolume: 125000,
      searchGrowth: 180,
      marketSize: '52亿',
      seasonality: '全年稳定',
      trendScore: 88,
    },
    
    competitionAnalysis: {
      competitorCount: 234,
      competitionLevel: '中等',
      priceRange: { min: 199, max: 699 },
      avgPrice: 399,
      topCompetitors: [
        { name: '竞品A', price: 399, sales: 15000, rating: 4.7 },
        { name: '竞品B', price: 299, sales: 12000, rating: 4.5 },
        { name: '竞品C', price: 499, sales: 8000, rating: 4.8 },
      ],
    },
    
    profitAnalysis: {
      suggestedPrice: 299,
      costPrice: 150,
      profitMargin: 49.8,
      expectedRevenue: 890000,
      breakEvenPoint: 1200,
      monthlyTarget: 3000,
    },
    
    consumerInsights: {
      targetAudience: '18-35岁年轻人群',
      purchaseIntent: 85,
      priceAcceptance: 78,
      keyFeatures: [
        { name: '降噪功能', importance: 95 },
        { name: '续航时间', importance: 88 },
        { name: '音质表现', importance: 92 },
        { name: '佩戴舒适度', importance: 85 },
      ],
      concerns: ['价格偏高', '品牌知名度', '售后服务'],
    },
    
    recommendations: [
      {
        title: '定价策略',
        description: '建议定价299元，低于市场均价25%，提升性价比优势',
        priority: 'high',
      },
      {
        title: '推广渠道',
        description: '重点投放社交媒体和科技评测平台，目标人群精准',
        priority: 'high',
      },
      {
        title: '库存建议',
        description: '首批备货3000件，根据销售数据动态调整',
        priority: 'medium',
      },
      {
        title: '促销方案',
        description: '上市前2周9折优惠+晒单返现，加速口碑传播',
        priority: 'medium',
      },
    ],
  };

  const getScoreColor = (score: number) => {
    if (score >= 80) return 'text-success';
    if (score >= 60) return 'text-warning';
    return 'text-destructive';
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="operator" />

      <div className="container px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 mb-6">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => navigate('/operator/dashboard')}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            返回控制台
          </Button>
        </div>

        {/* Product Header */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Card className="lg:col-span-2">
            <CardContent className="p-6">
              <div className="flex gap-6">
                <img
                  src={productAnalysis.image}
                  alt={productAnalysis.name}
                  className="w-32 h-32 rounded-lg object-cover"
                />
                <div className="flex-1">
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h1 className="text-2xl font-bold mb-2">{productAnalysis.name}</h1>
                      <Badge variant="secondary">{productAnalysis.category}</Badge>
                    </div>
                  </div>
                  <p className="text-muted-foreground mt-4">
                    {productAnalysis.aiRecommendation}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="border-accent/20 bg-gradient-to-br from-accent/5 to-primary/5">
            <CardContent className="p-6">
              <div className="flex items-center gap-3 mb-4">
                <div className="h-12 w-12 rounded-lg bg-gradient-ai flex items-center justify-center">
                  <Sparkles className="h-6 w-6 text-white" />
                </div>
                <div>
                  <h3 className="font-semibold">AI潜力评分</h3>
                  <p className="text-xs text-muted-foreground">综合市场分析结果</p>
                </div>
              </div>
              <div className="text-center">
                <div className={`text-5xl font-bold ${getScoreColor(productAnalysis.potentialScore)}`}>
                  {productAnalysis.potentialScore}
                </div>
                <Progress value={productAnalysis.potentialScore} className="mt-4 h-2" />
                <p className="text-xs text-muted-foreground mt-2">
                  超过市场上 {productAnalysis.potentialScore}% 的商品
                </p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Analysis Tabs */}
        <Tabs defaultValue="market" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4">
            <TabsTrigger value="market">市场分析</TabsTrigger>
            <TabsTrigger value="competition">竞品对比</TabsTrigger>
            <TabsTrigger value="profit">利润分析</TabsTrigger>
            <TabsTrigger value="insights">消费洞察</TabsTrigger>
          </TabsList>

          {/* Market Analysis */}
          <TabsContent value="market" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <TrendingUp className="h-4 w-4" />
                    搜索量
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {productAnalysis.marketAnalysis.searchVolume.toLocaleString()}
                  </div>
                  <div className="flex items-center gap-1 text-sm text-success mt-1">
                    <TrendingUp className="h-3 w-3" />
                    +{productAnalysis.marketAnalysis.searchGrowth}%
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <DollarSign className="h-4 w-4" />
                    市场规模
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {productAnalysis.marketAnalysis.marketSize}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">年度市场容量</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <BarChart3 className="h-4 w-4" />
                    趋势评分
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {productAnalysis.marketAnalysis.trendScore}
                  </div>
                  <Progress value={productAnalysis.marketAnalysis.trendScore} className="mt-2 h-1.5" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-muted-foreground flex items-center gap-2">
                    <Package className="h-4 w-4" />
                    季节性
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-success">
                    {productAnalysis.marketAnalysis.seasonality}
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">无明显淡旺季</p>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Competition Analysis */}
          <TabsContent value="competition" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>竞争概况</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">竞品数量</span>
                    <span className="font-semibold">{productAnalysis.competitionAnalysis.competitorCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">竞争程度</span>
                    <Badge variant="secondary">{productAnalysis.competitionAnalysis.competitionLevel}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">价格区间</span>
                    <span className="font-semibold">
                      ¥{productAnalysis.competitionAnalysis.priceRange.min} - ¥{productAnalysis.competitionAnalysis.priceRange.max}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground">平均价格</span>
                    <span className="font-semibold">¥{productAnalysis.competitionAnalysis.avgPrice}</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>主要竞品</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {productAnalysis.competitionAnalysis.topCompetitors.map((competitor, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-muted/50 rounded-lg">
                        <div className="flex-1">
                          <h4 className="font-medium mb-1">{competitor.name}</h4>
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span>¥{competitor.price}</span>
                            <span>{competitor.sales.toLocaleString()} 销量</span>
                            <div className="flex items-center gap-1">
                              <Star className="h-3 w-3 fill-warning text-warning" />
                              {competitor.rating}
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          {/* Profit Analysis */}
          <TabsContent value="profit" className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-base">建议售价</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-cta">
                    ¥{productAnalysis.profitAnalysis.suggestedPrice}
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    成本价: ¥{productAnalysis.profitAnalysis.costPrice}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">利润率</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-success">
                    {productAnalysis.profitAnalysis.profitMargin}%
                  </div>
                  <Progress value={productAnalysis.profitAnalysis.profitMargin} className="mt-3" />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="text-base">预期月收入</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold">
                    ¥{(productAnalysis.profitAnalysis.expectedRevenue / 10000).toFixed(1)}万
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    目标销量: {productAnalysis.profitAnalysis.monthlyTarget} 件/月
                  </p>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>盈亏分析</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">盈亏平衡点</span>
                      <span className="font-semibold">{productAnalysis.profitAnalysis.breakEvenPoint} 件</span>
                    </div>
                    <Progress 
                      value={(productAnalysis.profitAnalysis.breakEvenPoint / productAnalysis.profitAnalysis.monthlyTarget) * 100} 
                      className="h-2"
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    达到月销售目标后，预计月利润: ¥
                    {((productAnalysis.profitAnalysis.suggestedPrice - productAnalysis.profitAnalysis.costPrice) * 
                      productAnalysis.profitAnalysis.monthlyTarget / 10000).toFixed(1)}万
                  </p>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Consumer Insights */}
          <TabsContent value="insights" className="space-y-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card>
                <CardHeader>
                  <CardTitle>目标受众</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">人群画像</span>
                      <span className="font-semibold">{productAnalysis.consumerInsights.targetAudience}</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">购买意愿</span>
                      <span className="font-semibold">{productAnalysis.consumerInsights.purchaseIntent}%</span>
                    </div>
                    <Progress value={productAnalysis.consumerInsights.purchaseIntent} />
                  </div>
                  <div>
                    <div className="flex justify-between mb-2">
                      <span className="text-muted-foreground">价格接受度</span>
                      <span className="font-semibold">{productAnalysis.consumerInsights.priceAcceptance}%</span>
                    </div>
                    <Progress value={productAnalysis.consumerInsights.priceAcceptance} />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>关键需求</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {productAnalysis.consumerInsights.keyFeatures.map((feature, index) => (
                      <div key={index}>
                        <div className="flex justify-between mb-1.5">
                          <span className="text-sm">{feature.name}</span>
                          <span className="text-sm font-medium">{feature.importance}%</span>
                        </div>
                        <Progress value={feature.importance} className="h-1.5" />
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>消费者顾虑</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex flex-wrap gap-2">
                  {productAnalysis.consumerInsights.concerns.map((concern, index) => (
                    <Badge key={index} variant="outline" className="text-warning">
                      {concern}
                    </Badge>
                  ))}
                </div>
                <p className="text-sm text-muted-foreground mt-4">
                  建议在营销中重点解决这些顾虑点，提升转化率
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>

        {/* AI Recommendations */}
        <Card className="mt-8 border-accent/20 bg-accent/5">
          <CardHeader>
            <div className="flex items-center gap-2">
              <div className="h-10 w-10 rounded-lg bg-gradient-ai flex items-center justify-center">
                <Sparkles className="h-5 w-5 text-white" />
              </div>
              <CardTitle>AI运营建议</CardTitle>
            </div>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {productAnalysis.recommendations.map((rec, index) => (
                <div
                  key={index}
                  className="p-4 bg-card rounded-lg border"
                >
                  <div className="flex items-start justify-between mb-2">
                    <h4 className="font-semibold">{rec.title}</h4>
                    <Badge
                      variant={rec.priority === 'high' ? 'default' : 'secondary'}
                      className={rec.priority === 'high' ? 'bg-cta' : ''}
                    >
                      {rec.priority === 'high' ? '高优先级' : '中优先级'}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground">{rec.description}</p>
                </div>
              ))}
            </div>

            <div className="mt-6 flex gap-3">
              <Button className="bg-gradient-ai hover:opacity-90">
                <Package className="mr-2 h-4 w-4" />
                添加到商品库
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleExportReport('json')}
              >
                导出JSON
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleExportReport('csv')}
              >
                导出CSV
              </Button>
              <Button 
                variant="outline"
                onClick={() => handleExportReport('excel')}
              >
                导出Excel
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AISelectionDetail;
