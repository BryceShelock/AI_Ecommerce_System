-- 创建商品点赞表
CREATE TABLE public.product_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, product_id)
);

-- 创建订单评价表
CREATE TABLE public.order_reviews (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  order_id UUID NOT NULL REFERENCES public.orders(id) ON DELETE CASCADE,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
  content TEXT,
  images JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, order_id, product_id)
);

-- 创建客服对话表
CREATE TABLE public.customer_service_chats (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  customer_id UUID NOT NULL,
  operator_id UUID,
  status TEXT NOT NULL DEFAULT 'pending', -- pending, active, closed
  subject TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  closed_at TIMESTAMP WITH TIME ZONE
);

-- 创建客服消息表
CREATE TABLE public.customer_service_messages (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  chat_id UUID NOT NULL REFERENCES public.customer_service_chats(id) ON DELETE CASCADE,
  sender_id UUID NOT NULL,
  sender_role TEXT NOT NULL, -- customer, operator
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建用户行为追踪表
CREATE TABLE public.user_behaviors (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  action_type TEXT NOT NULL, -- view, click, search, add_to_cart, purchase
  product_id UUID REFERENCES public.products(id) ON DELETE SET NULL,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 创建库存补货建议表
CREATE TABLE public.restock_suggestions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  product_id UUID NOT NULL REFERENCES public.products(id) ON DELETE CASCADE,
  current_stock INTEGER NOT NULL,
  suggested_quantity INTEGER NOT NULL,
  reason TEXT,
  priority TEXT NOT NULL DEFAULT 'medium', -- low, medium, high
  status TEXT NOT NULL DEFAULT 'pending', -- pending, approved, ordered, completed
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- 启用RLS
ALTER TABLE public.product_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.order_reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_chats ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.customer_service_messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.user_behaviors ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.restock_suggestions ENABLE ROW LEVEL SECURITY;

-- 商品点赞RLS策略
CREATE POLICY "Users can view all likes"
  ON public.product_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can manage their own likes"
  ON public.product_likes FOR ALL
  USING (auth.uid() = user_id);

-- 订单评价RLS策略
CREATE POLICY "Users can view all reviews"
  ON public.order_reviews FOR SELECT
  USING (true);

CREATE POLICY "Users can create reviews for their orders"
  ON public.order_reviews FOR INSERT
  WITH CHECK (
    auth.uid() = user_id AND
    EXISTS (SELECT 1 FROM orders WHERE orders.id = order_id AND orders.user_id = auth.uid())
  );

CREATE POLICY "Users can update their own reviews"
  ON public.order_reviews FOR UPDATE
  USING (auth.uid() = user_id);

-- 客服对话RLS策略
CREATE POLICY "Customers can view their own chats"
  ON public.customer_service_chats FOR SELECT
  USING (auth.uid() = customer_id OR has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Customers can create chats"
  ON public.customer_service_chats FOR INSERT
  WITH CHECK (auth.uid() = customer_id);

CREATE POLICY "Operators can update chats"
  ON public.customer_service_chats FOR UPDATE
  USING (has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 客服消息RLS策略
CREATE POLICY "Users can view messages in their chats"
  ON public.customer_service_messages FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM customer_service_chats 
      WHERE customer_service_chats.id = chat_id 
      AND (customer_service_chats.customer_id = auth.uid() 
           OR customer_service_chats.operator_id = auth.uid()
           OR has_role(auth.uid(), 'operator'::app_role)
           OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

CREATE POLICY "Users can send messages in their chats"
  ON public.customer_service_messages FOR INSERT
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM customer_service_chats 
      WHERE customer_service_chats.id = chat_id 
      AND (customer_service_chats.customer_id = auth.uid() 
           OR customer_service_chats.operator_id = auth.uid()
           OR has_role(auth.uid(), 'operator'::app_role)
           OR has_role(auth.uid(), 'admin'::app_role))
    )
  );

-- 用户行为追踪RLS策略
CREATE POLICY "Users can insert their own behaviors"
  ON public.user_behaviors FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Operators can view all behaviors"
  ON public.user_behaviors FOR SELECT
  USING (has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 库存补货建议RLS策略
CREATE POLICY "Operators can manage restock suggestions"
  ON public.restock_suggestions FOR ALL
  USING (has_role(auth.uid(), 'operator'::app_role) OR has_role(auth.uid(), 'admin'::app_role));

-- 创建触发器更新客服对话updated_at
CREATE TRIGGER update_customer_service_chats_updated_at
  BEFORE UPDATE ON public.customer_service_chats
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_restock_suggestions_updated_at
  BEFORE UPDATE ON public.restock_suggestions
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();

-- 为realtime启用表
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_service_chats;
ALTER PUBLICATION supabase_realtime ADD TABLE public.customer_service_messages;