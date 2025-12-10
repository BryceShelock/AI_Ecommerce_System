import { useState } from "react";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Search, 
  Download, 
  Sparkles, 
  TrendingUp,
  ShoppingBag,
  Video,
  Image as ImageIcon,
  FileText,
  Loader2
} from "lucide-react";
import { toast } from "sonner";

interface ScrapedData {
  id: string;
  platform: string;
  title: string;
  url: string;
  metadata: any;
  ai_analysis?: any;
  created_at: string;
}

const AIProductSelection = () => {
  const [activeTab, setActiveTab] = useState('search');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [platforms, setPlatforms] = useState({
    amazon: true,
    shopee: true,
    bilibili: false,
    youtube: false,
  });
  const [isScraping, setIsScraping] = useState(false);
  const [scrapedData, setScrapedData] = useState<ScrapedData[]>([]);
  const [progress, setProgress] = useState(0);

  const handleSearch = async () => {
    if (!searchKeyword.trim()) {
      toast.error('请输入搜索关键词');
      return;
    }

    const selectedPlatforms = Object.entries(platforms)
      .filter(([_, enabled]) => enabled)
      .map(([platform, _]) => platform);

    if (selectedPlatforms.length === 0) {
      toast.error('请至少选择一个平台');
      return;
    }

    setIsScraping(true);
    setProgress(0);

    try {
      toast.info(`开始爬取 ${selectedPlatforms.length} 个平台的数据...`);
      
      // 模拟爬取进度
      const interval = setInterval(() => {
        setProgress(prev => {
          if (prev >= 90) {
            clearInterval(interval);
            return prev;
          }
          return prev + 10;
        });
      }, 500);

      // 这里应该调用实际的爬虫边缘函数
      // 由于这是一个复杂的功能，我们先创建UI框架
      // 实际爬虫功能需要在服务器端用Python实现，或者用Node.js重写

      setTimeout(() => {
        clearInterval(interval);
        setProgress(100);
        toast.success('数据爬取完成！');
        
        // 模拟爬取结果
        const mockData: ScrapedData[] = [
          {
            id: '1',
            platform: 'amazon',
            title: '智能蓝牙耳机 - 降噪版',
            url: 'https://amazon.com/...',
            metadata: { price: '$89.99', rating: 4.5, reviews: 1250 },
            created_at: new Date().toISOString()
          },
          {
            id: '2',
            platform: 'shopee',
            title: '无线充电器 快充版',
            url: 'https://shopee.com/...',
            metadata: { price: '$29.99', sales: 5000 },
            created_at: new Date().toISOString()
          }
        ];
        
        setScrapedData(mockData);
        setIsScraping(false);
      }, 3000);

    } catch (error) {
      console.error('Scraping error:', error);
      toast.error('数据爬取失败');
      setIsScraping(false);
    }
  };

  const handleExport = () => {
    if (scrapedData.length === 0) {
      toast.error('没有可导出的数据');
      return;
    }

    // 转换为CSV格式，包含AI分析数据
    const headers = ['平台', '标题', 'URL', '创建时间', 'AI评分', '市场趋势', '竞争水平'];
    const rows = scrapedData.map(item => [
      item.platform,
      `"${item.title}"`,
      item.url,
      new Date(item.created_at).toLocaleString('zh-CN'),
      item.ai_analysis?.potential_score || 'N/A',
      item.ai_analysis?.market_trend || 'N/A',
      item.ai_analysis?.competition_level || 'N/A'
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');

    // 添加BOM以支持中文
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `ai_analysis_report_${Date.now()}.csv`;
    link.click();

    toast.success('AI分析报告已导出');
  };

  const handleAIAnalysis = async () => {
    if (scrapedData.length === 0) {
      toast.error('没有可分析的数据');
      return;
    }

    toast.info('开始AI分析...');
    
    // 这里应该调用AI分析边缘函数
    setTimeout(() => {
      toast.success('AI分析完成！');
      
      // 模拟添加AI分析结果
      setScrapedData(prev => prev.map(item => ({
        ...item,
        ai_analysis: {
          potential_score: Math.floor(Math.random() * 40) + 60,
          market_trend: ['rising', 'stable', 'falling'][Math.floor(Math.random() * 3)],
          competition_level: ['low', 'medium', 'high'][Math.floor(Math.random() * 3)]
        }
      })));
    }, 2000);
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="operator" />

      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">AI选品助手</h1>
          <p className="text-muted-foreground">
            搜索各大平台商品，一键爬取数据，AI智能分析
          </p>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList>
            <TabsTrigger value="search">数据爬取</TabsTrigger>
            <TabsTrigger value="analysis">AI分析</TabsTrigger>
            <TabsTrigger value="results">爬取结果</TabsTrigger>
          </TabsList>

          <TabsContent value="search" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>搜索配置</CardTitle>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="space-y-2">
                  <label className="text-sm font-medium">搜索关键词</label>
                  <div className="flex gap-2">
                    <Input
                      placeholder="输入要搜索的商品关键词"
                      value={searchKeyword}
                      onChange={(e) => setSearchKeyword(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                    />
                    <Button 
                      onClick={handleSearch}
                      disabled={isScraping}
                    >
                      {isScraping ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          爬取中...
                        </>
                      ) : (
                        <>
                          <Search className="mr-2 h-4 w-4" />
                          开始爬取
                        </>
                      )}
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">选择平台</label>
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {Object.entries(platforms).map(([platform, enabled]) => (
                      <Card
                        key={platform}
                        className={`cursor-pointer transition-colors ${
                          enabled ? 'border-primary' : ''
                        }`}
                        onClick={() => setPlatforms(prev => ({ 
                          ...prev, 
                          [platform]: !prev[platform as keyof typeof prev] 
                        }))}
                      >
                        <CardContent className="p-4">
                          <div className="flex items-center gap-2">
                            {platform === 'amazon' && <ShoppingBag className="h-5 w-5" />}
                            {platform === 'shopee' && <ShoppingBag className="h-5 w-5" />}
                            {platform === 'bilibili' && <Video className="h-5 w-5" />}
                            {platform === 'youtube' && <Video className="h-5 w-5" />}
                            <span className="font-medium capitalize">{platform}</span>
                          </div>
                          {enabled && <Badge className="mt-2">已选择</Badge>}
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                </div>

                {isScraping && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>爬取进度</span>
                      <span>{progress}%</span>
                    </div>
                    <Progress value={progress} />
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="analysis" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>AI数据分析</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <p className="text-sm text-muted-foreground">
                  使用AI分析爬取的数据，包括图片识别、视频片段分析、市场趋势预测等
                </p>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <ImageIcon className="h-8 w-8 text-primary" />
                      <div>
                        <p className="font-semibold">图片分析</p>
                        <p className="text-xs text-muted-foreground">识别商品特征</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <Video className="h-8 w-8 text-accent" />
                      <div>
                        <p className="font-semibold">视频分析</p>
                        <p className="text-xs text-muted-foreground">提取关键片段</p>
                      </div>
                    </CardContent>
                  </Card>

                  <Card>
                    <CardContent className="p-4 flex items-center gap-3">
                      <TrendingUp className="h-8 w-8 text-success" />
                      <div>
                        <p className="font-semibold">趋势预测</p>
                        <p className="text-xs text-muted-foreground">市场潜力评估</p>
                      </div>
                    </CardContent>
                  </Card>
                </div>

                <Button 
                  onClick={handleAIAnalysis}
                  className="w-full"
                  disabled={scrapedData.length === 0}
                >
                  <Sparkles className="mr-2 h-4 w-4" />
                  开始AI分析
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="results" className="space-y-6">
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>爬取结果 ({scrapedData.length})</CardTitle>
                  <Button 
                    variant="outline" 
                    onClick={handleExport}
                    disabled={scrapedData.length === 0}
                  >
                    <Download className="mr-2 h-4 w-4" />
                    导出数据
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                {scrapedData.length === 0 ? (
                  <div className="text-center py-12 text-muted-foreground">
                    <FileText className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>还没有爬取的数据</p>
                    <p className="text-sm">前往"数据爬取"标签开始搜索</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {scrapedData.map((item) => (
                      <Card key={item.id}>
                        <CardContent className="p-4">
                          <div className="flex items-start justify-between">
                            <div className="flex-1">
                              <div className="flex items-center gap-2 mb-2">
                                <Badge variant="outline">{item.platform}</Badge>
                                {item.ai_analysis && (
                                  <Badge 
                                    className="bg-gradient-ai"
                                    variant="secondary"
                                  >
                                    <Sparkles className="h-3 w-3 mr-1" />
                                    潜力值: {item.ai_analysis.potential_score}
                                  </Badge>
                                )}
                              </div>
                              <h3 className="font-semibold mb-1">{item.title}</h3>
                              <p className="text-sm text-muted-foreground truncate">
                                {item.url}
                              </p>
                              {item.ai_analysis && (
                                <div className="mt-2 flex gap-2">
                                  <Badge variant="secondary">
                                    趋势: {item.ai_analysis.market_trend}
                                  </Badge>
                                  <Badge variant="secondary">
                                    竞争: {item.ai_analysis.competition_level}
                                  </Badge>
                                </div>
                              )}
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AIProductSelection;