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
    const { messages, sessionId } = await req.json();
    
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取商品数据
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('*')
      .order('ai_score', { ascending: false });

    if (productsError) {
      console.error('Products fetch error:', productsError);
    }

    const productsContext = products ? products.map(p => 
      `商品: ${p.name}, 价格: ¥${p.price}, 分类: ${p.category}, 描述: ${p.description}, AI评分: ${p.ai_score}`
    ).join('\n') : '';

    const systemPrompt = `你是一个专业的AI导购助手。你需要根据用户的需求推荐最合适的商品。

当前商品库存：
${productsContext}

请根据用户的需求分析并推荐商品。回复格式：
1. 先理解用户需求
2. 推荐最合适的商品（2-3个）
3. 说明推荐理由
4. 在回复最后用JSON格式列出推荐的商品ID，格式如下：
RECOMMENDED_PRODUCTS: ["商品ID1", "商品ID2"]

注意：一定要基于上述商品库存进行推荐，不要推荐不存在的商品。`;

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
    console.error('Error in ai-shopping-guide:', error);
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
