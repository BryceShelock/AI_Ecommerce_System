import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Edit, Trash2, Package } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";

interface SKU {
  id: string;
  product_id: string;
  sku_code: string;
  color: string | null;
  size: string | null;
  price: number;
  stock: number;
  image_url: string | null;
}

interface Product {
  id: string;
  name: string;
  image_url: string;
}

export const SKUManagement = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<string>('');
  const [skus, setSkus] = useState<SKU[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    sku_code: '',
    color: '',
    size: '',
    price: '',
    stock: '',
    image_url: '',
  });
  const [editingId, setEditingId] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, []);

  useEffect(() => {
    if (selectedProduct) {
      fetchSKUs(selectedProduct);
    }
  }, [selectedProduct]);

  const fetchProducts = async () => {
    try {
      const { data, error } = await supabase
        .from('products')
        .select('id, name, image_url')
        .order('name');

      if (error) throw error;
      setProducts(data || []);
    } catch (error: any) {
      console.error('Failed to fetch products:', error);
      toast.error('加载商品失败');
    }
  };

  const fetchSKUs = async (productId: string) => {
    try {
      const { data, error } = await supabase
        .from('product_skus')
        .select('*')
        .eq('product_id', productId)
        .order('created_at');

      if (error) throw error;
      setSkus(data || []);
    } catch (error: any) {
      console.error('Failed to fetch SKUs:', error);
      toast.error('加载SKU失败');
    }
  };

  const handleSubmit = async () => {
    if (!selectedProduct || !formData.sku_code || !formData.price || !formData.stock) {
      toast.error('请填写必填项');
      return;
    }

    try {
      const skuData = {
        product_id: selectedProduct,
        sku_code: formData.sku_code,
        color: formData.color || null,
        size: formData.size || null,
        price: parseFloat(formData.price),
        stock: parseInt(formData.stock),
        image_url: formData.image_url || null,
      };

      if (editingId) {
        const { error } = await supabase
          .from('product_skus')
          .update(skuData)
          .eq('id', editingId);

        if (error) throw error;
        toast.success('SKU已更新');
      } else {
        const { error } = await supabase
          .from('product_skus')
          .insert(skuData);

        if (error) throw error;
        toast.success('SKU已添加');
      }

      setDialogOpen(false);
      resetForm();
      fetchSKUs(selectedProduct);
    } catch (error: any) {
      console.error('Failed to save SKU:', error);
      toast.error(error?.message || '保存失败');
    }
  };

  const handleEdit = (sku: SKU) => {
    setEditingId(sku.id);
    setFormData({
      sku_code: sku.sku_code,
      color: sku.color || '',
      size: sku.size || '',
      price: sku.price.toString(),
      stock: sku.stock.toString(),
      image_url: sku.image_url || '',
    });
    setDialogOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm('确定删除此SKU吗？')) return;

    try {
      const { error } = await supabase
        .from('product_skus')
        .delete()
        .eq('id', id);

      if (error) throw error;
      toast.success('SKU已删除');
      fetchSKUs(selectedProduct);
    } catch (error: any) {
      console.error('Failed to delete SKU:', error);
      toast.error('删除失败');
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      sku_code: '',
      color: '',
      size: '',
      price: '',
      stock: '',
      image_url: '',
    });
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Package className="h-5 w-5" />
            SKU 管理
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label>选择商品</Label>
            <Select value={selectedProduct} onValueChange={setSelectedProduct}>
              <SelectTrigger>
                <SelectValue placeholder="请选择商品" />
              </SelectTrigger>
              <SelectContent>
                {products.map((product) => (
                  <SelectItem key={product.id} value={product.id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedProduct && (
            <>
              <div className="flex justify-between items-center">
                <p className="text-sm text-muted-foreground">
                  共 {skus.length} 个规格
                </p>
                <Dialog open={dialogOpen} onOpenChange={(open) => {
                  setDialogOpen(open);
                  if (!open) resetForm();
                }}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="h-4 w-4 mr-2" />
                      添加规格
                    </Button>
                  </DialogTrigger>
                  <DialogContent>
                    <DialogHeader>
                      <DialogTitle>{editingId ? '编辑' : '添加'}SKU规格</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label>SKU编码 *</Label>
                        <Input
                          value={formData.sku_code}
                          onChange={(e) => setFormData({ ...formData, sku_code: e.target.value })}
                          placeholder="例: PROD-001-RED-L"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>颜色</Label>
                          <Input
                            value={formData.color}
                            onChange={(e) => setFormData({ ...formData, color: e.target.value })}
                            placeholder="例: 红色"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>尺寸</Label>
                          <Input
                            value={formData.size}
                            onChange={(e) => setFormData({ ...formData, size: e.target.value })}
                            placeholder="例: L"
                          />
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <Label>价格 *</Label>
                          <Input
                            type="number"
                            step="0.01"
                            value={formData.price}
                            onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                            placeholder="99.99"
                          />
                        </div>
                        <div className="space-y-2">
                          <Label>库存 *</Label>
                          <Input
                            type="number"
                            value={formData.stock}
                            onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                            placeholder="100"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>图片URL</Label>
                        <Input
                          value={formData.image_url}
                          onChange={(e) => setFormData({ ...formData, image_url: e.target.value })}
                          placeholder="https://..."
                        />
                      </div>
                    </div>
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setDialogOpen(false)}>
                        取消
                      </Button>
                      <Button onClick={handleSubmit}>
                        {editingId ? '更新' : '添加'}
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>

              <div className="space-y-2">
                {skus.length === 0 ? (
                  <p className="text-center text-muted-foreground py-8">
                    还没有添加规格
                  </p>
                ) : (
                  skus.map((sku) => (
                    <Card key={sku.id}>
                      <CardContent className="p-4">
                        <div className="flex items-start gap-4">
                          {sku.image_url && (
                            <img
                              src={sku.image_url}
                              alt={sku.sku_code}
                              className="w-16 h-16 object-cover rounded"
                            />
                          )}
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center justify-between">
                              <p className="font-semibold">{sku.sku_code}</p>
                              <Badge variant={sku.stock > 0 ? 'default' : 'destructive'}>
                                库存: {sku.stock}
                              </Badge>
                            </div>
                            <div className="flex gap-4 text-sm text-muted-foreground">
                              {sku.color && <span>颜色: {sku.color}</span>}
                              {sku.size && <span>尺寸: {sku.size}</span>}
                              <span className="text-cta font-semibold">¥{sku.price}</span>
                            </div>
                          </div>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleEdit(sku)}
                            >
                              <Edit className="h-4 w-4" />
                            </Button>
                            <Button
                              variant="outline"
                              size="icon"
                              onClick={() => handleDelete(sku.id)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))
                )}
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
};
