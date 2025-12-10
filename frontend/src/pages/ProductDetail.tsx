import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  ShoppingCart, 
  Heart, 
  Star, 
  Truck, 
  Shield, 
  RotateCcw,
  ChevronLeft,
  Sparkles
} from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";
import { useUserBehavior } from "@/hooks/useUserBehavior";
import { ProductReviews } from "@/components/ProductReviews";

const ProductDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { trackBehavior } = useUserBehavior();
  const [quantity, setQuantity] = useState(1);
  const [selectedImage, setSelectedImage] = useState(0);
  const [isLiked, setIsLiked] = useState(false);
  const [likeCount, setLikeCount] = useState(0);

  useEffect(() => {
    if (id) {
      trackBehavior('view', id);
      checkIfLiked();
      fetchLikeCount();
    }
  }, [id]);

  const checkIfLiked = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !id) return;

      const { data } = await supabase
        .from('product_likes')
        .select('id')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      setIsLiked(!!data);
    } catch (error) {
      console.error('Failed to check like status:', error);
    }
  };

  const fetchLikeCount = async () => {
    try {
      if (!id) return;

      const { count } = await supabase
        .from('product_likes')
        .select('*', { count: 'exact', head: true })
        .eq('product_id', id);

      setLikeCount(count || 0);
    } catch (error) {
      console.error('Failed to fetch like count:', error);
    }
  };

  const handleLike = async () => {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('请先登录');
        return;
      }

      if (!id) return;

      if (isLiked) {
        await supabase
          .from('product_likes')
          .delete()
          .eq('user_id', user.id)
          .eq('product_id', id);
        
        setIsLiked(false);
        setLikeCount(prev => prev - 1);
        toast.success('已取消收藏');
      } else {
        await supabase
          .from('product_likes')
          .insert({
            user_id: user.id,
            product_id: id
          });
        
        setIsLiked(true);
        setLikeCount(prev => prev + 1);
        toast.success('已收藏');
      }
    } catch (error) {
      console.error('Failed to toggle like:', error);
      toast.error('操作失败');
    }
  };

  // Mock product data
  const product = {
    id: id || '1',
    name: '智能蓝牙耳机 Pro - 降噪版',
    price: 299,
    originalPrice: 499,
    rating: 4.8,
    reviews: 1256,
    sales: 12580,
    stock: 156,
    images: [
      'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800&h=800&fit=crop',
      'https://images.unsplash.com/photo-1484704849700-f032a568e944?w=800&h=800&fit=crop',
    ],
    tags: ['热销', 'AI推荐'],
    specs: [
      { label: '品牌', value: 'TechPro' },
      { label: '型号', value: 'TP-BT500' },
      { label: '连接方式', value: '蓝牙5.0' },
      { label: '续航时间', value: '30小时' },
      { label: '充电时间', value: '2小时' },
      { label: '防水等级', value: 'IPX5' },
    ],
    features: [
      '主动降噪技术，降噪深度达40dB',
      '蓝牙5.0连接，传输稳定低延迟',
      '30小时超长续航，满足一周使用',
      'IPX5防水等级，运动无忧',
      '人体工学设计，佩戴舒适',
      '智能触控操作，便捷易用',
    ],
    aiRecommendation: {
      score: 92,
      reason: '根据您的浏览记录和偏好，这款耳机非常适合您。它在降噪性能、续航能力和性价比方面都表现出色。',
      similarProducts: ['运动耳机', '游戏耳机', '头戴式耳机'],
    },
  };

  const handleAddToCart = () => {
    if (id) {
      trackBehavior('add_to_cart', id, { quantity });
    }
    toast.success('已添加到购物车', {
      description: `${product.name} x ${quantity}`,
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />

      <div className="container px-4 py-8">
        {/* Breadcrumb */}
        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-6">
          <Button 
            variant="ghost" 
            size="sm" 
            onClick={() => navigate('/')}
            className="gap-1"
          >
            <ChevronLeft className="h-4 w-4" />
            返回首页
          </Button>
        </div>

        {/* Product Main Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          {/* Images */}
          <div>
            <div className="aspect-square rounded-lg overflow-hidden bg-muted mb-4">
              <img
                src={product.images[selectedImage]}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {product.images.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedImage(index)}
                  className={`aspect-square rounded-lg overflow-hidden border-2 transition-colors ${
                    selectedImage === index
                      ? 'border-primary'
                      : 'border-transparent hover:border-muted-foreground'
                  }`}
                >
                  <img src={image} alt="" className="w-full h-full object-cover" />
                </button>
              ))}
            </div>
          </div>

          {/* Product Info */}
          <div>
            <div className="flex gap-2 mb-3">
              {product.tags.map((tag, index) => (
                <Badge key={index} className="bg-cta text-cta-foreground">
                  {tag}
                </Badge>
              ))}
            </div>

            <h1 className="text-3xl font-bold mb-4">{product.name}</h1>

            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center gap-1">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className={`h-5 w-5 ${
                      i < Math.floor(product.rating)
                        ? 'fill-warning text-warning'
                        : 'text-muted'
                    }`}
                  />
                ))}
                <span className="ml-2 font-medium">{product.rating}</span>
              </div>
              <span className="text-muted-foreground">
                {product.reviews} 条评价
              </span>
              <span className="text-muted-foreground">
                {product.sales}+ 人购买
              </span>
            </div>

            <div className="bg-muted/50 rounded-lg p-6 mb-6">
              <div className="flex items-baseline gap-3 mb-2">
                <span className="text-4xl font-bold text-cta">¥{product.price}</span>
                {product.originalPrice && (
                  <span className="text-xl text-muted-foreground line-through">
                    ¥{product.originalPrice}
                  </span>
                )}
                <Badge variant="secondary" className="bg-destructive/10 text-destructive">
                  省 ¥{product.originalPrice - product.price}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">
                库存：{product.stock} 件
              </p>
            </div>

            {/* AI Recommendation */}
            <Card className="mb-6 border-accent/20 bg-accent/5">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <div className="h-10 w-10 rounded-lg bg-gradient-ai flex items-center justify-center shrink-0">
                    <Sparkles className="h-5 w-5 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <h3 className="font-semibold">AI推荐指数</h3>
                      <Badge className="bg-gradient-ai text-white">
                        {product.aiRecommendation.score}分
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {product.aiRecommendation.reason}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quantity & Actions */}
            <div className="flex items-center gap-4 mb-6">
              <div className="flex items-center border rounded-lg">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.max(1, quantity - 1))}
                >
                  -
                </Button>
                <span className="px-6 font-medium">{quantity}</span>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
                >
                  +
                </Button>
              </div>

              <Button 
                className="flex-1 bg-gradient-cta hover:opacity-90" 
                size="lg"
                onClick={handleAddToCart}
              >
                <ShoppingCart className="mr-2 h-5 w-5" />
                加入购物车
              </Button>

              <Button 
                variant="outline" 
                size="lg"
                onClick={handleLike}
                className={isLiked ? 'border-destructive text-destructive' : ''}
              >
                <Heart className={`h-5 w-5 ${isLiked ? 'fill-current' : ''}`} />
                {likeCount > 0 && <span className="ml-1 text-sm">{likeCount}</span>}
              </Button>
            </div>

            {/* Services */}
            <div className="grid grid-cols-3 gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Truck className="h-5 w-5 text-success" />
                <span>包邮</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <Shield className="h-5 w-5 text-primary" />
                <span>正品保证</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <RotateCcw className="h-5 w-5 text-accent" />
                <span>7天退换</span>
              </div>
            </div>
          </div>
        </div>

        {/* Product Details Tabs */}
        <Tabs defaultValue="details" className="mb-12">
          <TabsList className="grid w-full max-w-md grid-cols-3">
            <TabsTrigger value="details">商品详情</TabsTrigger>
            <TabsTrigger value="specs">规格参数</TabsTrigger>
            <TabsTrigger value="reviews">用户评价</TabsTrigger>
          </TabsList>

          <TabsContent value="details" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">产品特点</h3>
                <ul className="space-y-3">
                  {product.features.map((feature, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <div className="h-1.5 w-1.5 rounded-full bg-primary mt-2" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="specs" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-4">规格参数</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {product.specs.map((spec, index) => (
                    <div
                      key={index}
                      className="flex justify-between items-center py-3 border-b last:border-0"
                    >
                      <span className="text-muted-foreground">{spec.label}</span>
                      <span className="font-medium">{spec.value}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="reviews" className="mt-6">
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-xl font-semibold">用户评价</h3>
                  <div className="flex items-center gap-2">
                    <span className="text-3xl font-bold">{product.rating}</span>
                    <div>
                      <div className="flex gap-0.5">
                        {[...Array(5)].map((_, i) => (
                          <Star
                            key={i}
                            className={`h-4 w-4 ${
                              i < Math.floor(product.rating)
                                ? 'fill-warning text-warning'
                                : 'text-muted'
                            }`}
                          />
                        ))}
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {product.reviews} 条评价
                      </p>
                    </div>
                  </div>
                </div>

                <div className="space-y-4">
                  {[1, 2, 3].map((_, index) => (
                    <div key={index} className="border-b pb-4 last:border-0">
                      <div className="flex items-center gap-2 mb-2">
                        <div className="flex gap-0.5">
                          {[...Array(5)].map((_, i) => (
                            <Star
                              key={i}
                              className="h-3 w-3 fill-warning text-warning"
                            />
                          ))}
                        </div>
                        <span className="text-sm font-medium">用户{index + 1}</span>
                        <span className="text-xs text-muted-foreground">
                          2024-01-{15 + index}
                        </span>
                      </div>
                      <p className="text-sm">
                        音质非常好，降噪效果明显，续航也很给力。性价比很高，推荐购买！
                      </p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default ProductDetail;
