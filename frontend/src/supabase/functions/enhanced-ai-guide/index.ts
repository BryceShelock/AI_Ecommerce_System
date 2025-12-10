import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.3';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, sessionId, userId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取用户画像
    let userProfile = { tags: ['新用户'], purchase_history: [] };
    if (userId) {
      const { data: profile } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('user_id', userId)
        .single();
      
      if (profile) {
        userProfile = profile;
      }
    }

    // 获取用户购买历史
    let purchaseHistory = [];
    if (userId) {
      const { data: orders } = await supabase
        .from('orders')
        .select(`
          *,
          order_items (
            *,
            products (name, category)
          )
        `)
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(5);
      
      if (orders) {
        purchaseHistory = orders;
      }
    }

    // 获取商品数据
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('ai_score', { ascending: false });

    if (productsError) {
      console.error('Products fetch error:', productsError);
    }

    const productsContext = products ? products.map(p => 
      `商品: ${p.name}, 价格: ¥${p.price}, 分类: ${p.category}, 描述: ${p.description}, AI评分: ${p.ai_score}, 库存: ${p.stock}`
    ).join('\n') : '';

    // 构建用户画像上下文
    const userContext = `
用户画像标签: ${userProfile.tags.join(', ')}
用户购买历史: ${purchaseHistory.length > 0 ? 
  purchaseHistory.map((order: any) => 
    order.order_items?.map((item: any) => 
      `${item.products?.name} (${item.products?.category})`
    ).join(', ')
  ).join('; ') : '无购买记录'}
`;

    const systemPrompt = `你是一个专业的AI导购助手。你需要根据用户的需求、画像和购买历史推荐最合适的商品。

${userContext}

当前商品库存：
${productsContext}

请根据用户的需求分析并推荐商品。

CRITICAL: 你的回复必须使用纯文本格式，绝对不要使用任何格式化符号。包括但不限于：
- 不要使用星号 * 或 **
- 不要使用井号 #
- 不要使用破折号 -
- 不要使用下划线 _
- 不要使用引号强调
使用换行和空格来组织内容。

回复格式：
第一步，理解用户需求和意图（推荐、咨询、优惠等）
第二步，结合用户画像标签和购买历史，推荐2到3个最合适的商品
第三步，说明推荐理由，结合用户的历史偏好
第四步，在回复最后用JSON格式列出推荐的商品ID
格式：RECOMMENDED_PRODUCTS: ["商品ID1", "商品ID2"]

意图识别规则：
如果用户询问推荐、买什么、挑选、选品，意图是推荐
如果用户询问价格、优惠、折扣、促销，意图是优惠
其他情况，意图是咨询

注意：一定要基于上述商品库存进行推荐，不要推荐不存在的商品。要考虑用户的画像标签和购买历史。输出时绝对不要使用任何符号标记。`;

    const LOVABLE_API_KEY = Deno.env.get('LOVABLE_API_KEY');
    if (!LOVABLE_API_KEY) {
      throw new Error('LOVABLE_API_KEY is not configured');
    }

    const response = await fetch('https://ai.gateway.lovable.dev/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${LOVABLE_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'google/gemini-2.5-flash',
        messages: [
          { role: 'system', content: systemPrompt },
          ...messages,
        ],
      }),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error('AI API error:', response.status, errorText);
      throw new Error(`AI API error: ${response.status}`);
    }

    const data = await response.json();
    const aiMessage = data.choices[0].message.content;

    // 提取推荐的商品ID
    const recommendedMatch = aiMessage.match(/RECOMMENDED_PRODUCTS:\s*(\[.*?\])/);
    let recommendedProducts: any[] = [];
    
    if (recommendedMatch && products) {
      try {
        const productIds = JSON.parse(recommendedMatch[1]);
        recommendedProducts = products
          .filter((p: any) => productIds.includes(p.id))
          .map((p: any) => ({
            id: p.id,
            name: p.name,
            price: p.price,
            image: p.image_url,
            rating: p.rating,
            sales: p.sales_count,
          }));
      } catch (e) {
        console.error('Failed to parse recommended products:', e);
      }
    }

    // 更新用户画像（基于对话内容）
    if (userId && messages.length > 0) {
      const userMessage = messages[messages.length - 1].content.toLowerCase();
      const newTags = [...userProfile.tags];
      
      // 根据用户询问的内容更新标签
      if (userMessage.includes('婴儿') || userMessage.includes('宝宝')) {
        if (!newTags.includes('母婴')) newTags.push('母婴');
      }
      if (userMessage.includes('家居') || userMessage.includes('装修')) {
        if (!newTags.includes('家居')) newTags.push('家居');
      }
      if (userMessage.includes('数码') || userMessage.includes('电子')) {
        if (!newTags.includes('数码')) newTags.push('数码');
      }

      if (newTags.length !== userProfile.tags.length) {
        await supabase
          .from('user_profiles')
          .upsert({ 
            user_id: userId, 
            tags: newTags 
          });
      }
    }

    // 移除回复中的商品ID标记
    const cleanedMessage = aiMessage.replace(/RECOMMENDED_PRODUCTS:\s*\[.*?\]/g, '').trim();

    return new Response(
      JSON.stringify({ 
        message: cleanedMessage,
        recommendedProducts: recommendedProducts.length > 0 ? recommendedProducts : undefined
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in enhanced-ai-guide:', error);
    return new Response(
      JSON.stringify({ 
        error: error instanceof Error ? error.message : 'Unknown error',
        message: '抱歉，AI助手暂时无法响应，请稍后重试'
      }),
      { 
        status: 500,
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  }
});