import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import Header from "@/components/Header";
import ProductCard from "@/components/ProductCard";
import { SearchHistory } from "@/components/SearchHistory";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Search, SlidersHorizontal } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

const Products = () => {
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [showSearchHistory, setShowSearchHistory] = useState(false);

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleSearch = async (keyword: string) => {
    setSearchQuery(keyword);
    setShowSearchHistory(false);
    
    // Save search history
    const { data: { user } } = await supabase.auth.getUser();
    if (user && keyword.trim()) {
      // Update user search history
      const { data: existing } = await supabase
        .from('search_history')
        .select('*')
        .eq('user_id', user.id)
        .eq('keyword', keyword.trim())
        .single();

      if (existing) {
        await supabase
          .from('search_history')
          .update({ 
            search_count: existing.search_count + 1,
            last_searched_at: new Date().toISOString()
          })
          .eq('id', existing.id);
      } else {
        await supabase
          .from('search_history')
          .insert({ user_id: user.id, keyword: keyword.trim() });
      }

      // Update hot search terms
      const { data: hotExisting } = await supabase
        .from('hot_search_terms')
        .select('*')
        .eq('keyword', keyword.trim())
        .single();

      if (hotExisting) {
        await supabase
          .from('hot_search_terms')
          .update({ 
            search_count: hotExisting.search_count + 1,
            updated_at: new Date().toISOString()
          })
          .eq('id', hotExisting.id);
      } else {
        await supabase
          .from('hot_search_terms')
          .insert({ keyword: keyword.trim() });
      }
    }
  };

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('*')
        .order('sales_count', { ascending: false });

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      toast.error("加载商品失败", { description: error.message });
    } finally {
      setLoading(false);
    }
  };

  const categories = [
    { value: "all", label: "全部商品" },
    { value: "数码配件", label: "数码配件" },
    { value: "智能穿戴", label: "智能穿戴" },
    { value: "电脑外设", label: "电脑外设" },
    { value: "智能家居", label: "智能家居" },
  ];

  const filteredProducts = products.filter((product) => {
    const matchesSearch = product.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      product.description?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || product.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  return (
    <div className="min-h-screen bg-background">
      <Header userRole="customer" />

      <div className="container px-4 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">商品列表</h1>
          <p className="text-muted-foreground">发现您想要的一切</p>
        </div>

        {/* Search and Filter */}
        <div className="flex flex-col md:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="搜索商品..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onFocus={() => setShowSearchHistory(true)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  handleSearch(searchQuery);
                }
              }}
              className="pl-10"
            />
          </div>
          <Button variant="outline" size="icon">
            <SlidersHorizontal className="h-4 w-4" />
          </Button>
        </div>

        {/* Search History */}
        {showSearchHistory && (
          <div className="mb-6">
            <SearchHistory onSearch={handleSearch} />
          </div>
        )}

        {/* Categories */}
        <Tabs value={selectedCategory} onValueChange={setSelectedCategory} className="mb-6">
          <TabsList>
            {categories.map((cat) => (
              <TabsTrigger key={cat.value} value={cat.value}>
                {cat.label}
              </TabsTrigger>
            ))}
          </TabsList>
        </Tabs>

        {/* Products Grid */}
        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">加载中...</p>
          </div>
        ) : filteredProducts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">暂无商品</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filteredProducts.map((product) => (
              <ProductCard
                key={product.id}
                id={product.id}
                name={product.name}
                price={product.price}
                originalPrice={product.original_price}
                image={product.image_url}
                rating={product.rating}
                sales={product.sales_count}
                tags={product.ai_score >= 85 ? ['AI推荐'] : []}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Products;
