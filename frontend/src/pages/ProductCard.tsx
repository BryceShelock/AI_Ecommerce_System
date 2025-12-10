import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ShoppingCart, Star } from "lucide-react";
import { Card, CardContent, CardFooter } from "@/components/ui/card";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface ProductCardProps {
  id: string;
  name: string;
  price: number;
  originalPrice?: number;
  image: string;
  rating: number;
  sales: number;
  tags?: string[];
}

const ProductCard = ({
  id,
  name,
  price,
  originalPrice,
  image,
  rating,
  sales,
  tags = [],
}: ProductCardProps) => {
  const navigate = useNavigate();

  const handleAddToCart = async (e: React.MouseEvent) => {
    e.stopPropagation();
    
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('请先登录');
        navigate('/auth');
        return;
      }

      // Check if item already in cart
      const { data: existingItem } = await supabase
        .from('cart_items')
        .select('*')
        .eq('user_id', user.id)
        .eq('product_id', id)
        .single();

      if (existingItem) {
        // Update quantity
        const { error } = await supabase
          .from('cart_items')
          .update({ quantity: existingItem.quantity + 1 })
          .eq('id', existingItem.id);
        
        if (error) throw error;
      } else {
        // Insert new item
        const { error } = await supabase
          .from('cart_items')
          .insert({
            user_id: user.id,
            product_id: id,
            quantity: 1,
          });
        
        if (error) throw error;
      }

      toast.success('已添加到购物车', {
        description: name,
      });
    } catch (error: any) {
      console.error('Add to cart error:', error);
      toast.error(error?.message || '添加失败，请稍后重试');
    }
  };

  return (
    <Card className="group overflow-hidden hover:shadow-lg transition-all duration-300 cursor-pointer">
      <CardContent className="p-0" onClick={() => navigate(`/product/${id}`)}>
        <div className="relative overflow-hidden aspect-square">
          <img
            src={image}
            alt={name}
            className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-500"
          />
          {tags.length > 0 && (
            <div className="absolute top-2 left-2 flex flex-wrap gap-1">
              {tags.map((tag, index) => (
                <Badge
                  key={index}
                  variant="secondary"
                  className="bg-cta text-cta-foreground text-xs"
                >
                  {tag}
                </Badge>
              ))}
            </div>
          )}
        </div>
      </CardContent>

      <CardFooter className="flex flex-col items-start gap-3 p-4">
        <h3 className="font-medium text-sm line-clamp-2 min-h-[2.5rem]">
          {name}
        </h3>

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <div className="flex items-center gap-0.5">
            <Star className="h-3 w-3 fill-warning text-warning" />
            <span>{rating}</span>
          </div>
          <span>·</span>
          <span>{sales}+人购买</span>
        </div>

        <div className="flex items-end gap-2 w-full">
          <div className="flex-1">
            <div className="flex items-baseline gap-1">
              <span className="text-cta font-bold text-lg">¥{price}</span>
              {originalPrice && (
                <span className="text-muted-foreground text-xs line-through">
                  ¥{originalPrice}
                </span>
              )}
            </div>
          </div>
          
          <Button size="sm" className="bg-gradient-cta hover:opacity-90" onClick={handleAddToCart}>
            <ShoppingCart className="h-4 w-4" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
};

export default ProductCard;
