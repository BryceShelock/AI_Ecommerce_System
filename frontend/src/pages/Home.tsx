import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import AIGuideButton from "@/components/AIGuideButton";
import { Button } from "@/components/ui/button";
import { Sparkles, TrendingUp, Award, Zap } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Home = () => {
  const navigate = useNavigate();
  const [aiGuideOpen, setAiGuideOpen] = useState(false);
  const [featuredProducts, setFeaturedProducts] = useState<any[]>([]);
  useEffect(() => {
    fetchFeaturedProducts();
  }, []);

  const fetchFeaturedProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('ai_score', { ascending: false })
        .limit(6);

      if (error) throw error;
      
      setFeaturedProducts((data || []).map(p => ({
        id: p.id,
        name: p.name,
        price: p.price,
        originalPrice: p.original_price,
        image: p.image_url,
        rating: p.rating,
        sales: p.sales_count,
        tags: p.ai_score >= 85 ? ['AI推荐'] : []
      })));
    } catch (error: any) {
      console.error("Failed to fetch products:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />

      {/* Hero Section */}
      <section className="relative overflow-hidden bg-gradient-hero text-white">
        <div className="container px-4 py-20 md:py-32">
          <div className="max-w-2xl">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/10 backdrop-blur-sm mb-6">
              <Sparkles className="h-4 w-4" />
              <span className="text-sm font-medium">AI驱动的智能购物体验</span>
            </div>
            
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              发现你想要的<br />一切商品
            </h1>
            
            <p className="text-lg md:text-xl text-white/90 mb-8">
              使用AI智能导购，让购物更简单、更精准、更高效
            </p>
            
            <div className="flex flex-wrap gap-4">
              <Button 
                size="lg" 
                className="bg-cta hover:bg-cta-hover text-cta-foreground"
                onClick={() => setAiGuideOpen(true)}
              >
                <Sparkles className="mr-2 h-5 w-5" />
                体验AI导购
              </Button>
              <Button 
                size="lg" 
                variant="outline" 
                className="border-white/30 text-white hover:bg-white/10"
                onClick={() => navigate('/products')}
              >
                浏览商品
              </Button>
            </div>
          </div>
        </div>

        {/* Decorative Elements */}
        <div className="absolute -top-24 -right-24 w-96 h-96 bg-accent/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-96 h-96 bg-primary-light/20 rounded-full blur-3xl"></div>
      </section>

      {/* Features */}
      <section className="py-12 border-b">
        <div className="container px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-accent/10">
                <Sparkles className="h-6 w-6 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">AI智能推荐</h3>
                <p className="text-sm text-muted-foreground">
                  基于您的需求，精准推荐最适合的商品
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-success/10">
                <TrendingUp className="h-6 w-6 text-success" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">市场趋势分析</h3>
                <p className="text-sm text-muted-foreground">
                  实时追踪热门商品，把握购物最佳时机
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-lg bg-cta/10">
                <Award className="h-6 w-6 text-cta" />
              </div>
              <div>
                <h3 className="font-semibold mb-1">品质保证</h3>
                <p className="text-sm text-muted-foreground">
                  严选优质商品，让每一次购物都放心
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-16">
        <div className="container px-4">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h2 className="text-3xl font-bold mb-2">精选好物</h2>
              <p className="text-muted-foreground">AI为您推荐的热门商品</p>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate('/products')}
            >
              查看全部
            </Button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredProducts.map((product) => (
              <ProductCard key={product.id} {...product} />
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-muted">
        <div className="container px-4 text-center">
          <div className="max-w-2xl mx-auto">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-ai mb-6">
              <Zap className="h-8 w-8 text-white" />
            </div>
            
            <h2 className="text-3xl font-bold mb-4">
              试试AI智能导购
            </h2>
            
            <p className="text-lg text-muted-foreground mb-8">
              告诉我们您的需求，AI助手会帮您找到最合适的商品
            </p>
            
            <Button 
              size="lg" 
              className="bg-gradient-ai hover:opacity-90"
              onClick={() => setAiGuideOpen(true)}
            >
              <Sparkles className="mr-2 h-5 w-5" />
              开始对话
            </Button>
          </div>
        </div>
      </section>

      {/* AI Guide Floating Button */}
      <AIGuideButton open={aiGuideOpen} onOpenChange={setAiGuideOpen} />
    </div>
  );
};

export default Home;
