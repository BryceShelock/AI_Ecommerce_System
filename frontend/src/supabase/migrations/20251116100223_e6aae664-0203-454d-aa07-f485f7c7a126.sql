-- 创建订单物流信息表
CREATE TABLE IF NOT EXISTS public.order_logistics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  order_id UUID NOT NULL,
  status TEXT NOT NULL DEFAULT 'processing',
  carrier TEXT,
  tracking_number TEXT,
  estimated_delivery TIMESTAMP WITH TIME ZONE,
  actual_delivery TIMESTAMP WITH TIME ZONE,
  current_location TEXT,
  updates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT now(),
  FOREIGN KEY (order_id) REFERENCES public.orders(id) ON DELETE CASCADE
);

-- 启用 RLS
ALTER TABLE public.order_logistics ENABLE ROW LEVEL SECURITY;

-- 用户可以查看自己订单的物流信息
CREATE POLICY "Users can view logistics for their orders"
ON public.order_logistics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.orders
    WHERE orders.id = order_logistics.order_id
    AND orders.user_id = auth.uid()
  )
);

-- 管理员和运营人员可以查看所有物流信息
CREATE POLICY "Admins and operators can view all logistics"
ON public.order_logistics
FOR SELECT
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- 管理员和运营人员可以插入物流信息
CREATE POLICY "Admins and operators can insert logistics"
ON public.order_logistics
FOR INSERT
WITH CHECK (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- 管理员和运营人员可以更新物流信息
CREATE POLICY "Admins and operators can update logistics"
ON public.order_logistics
FOR UPDATE
USING (has_role(auth.uid(), 'admin'::app_role) OR has_role(auth.uid(), 'operator'::app_role));

-- 创建更新时间触发器
CREATE TRIGGER update_order_logistics_updated_at
BEFORE UPDATE ON public.order_logistics
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();
