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
    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // 获取所有激活的库存预警规则
    const { data: alerts, error: alertsError } = await supabase
      .from('inventory_alerts')
      .select(`
        *,
        products (*)
      `)
      .eq('is_active', true);

    if (alertsError) {
      throw alertsError;
    }

    const lowStockProducts = [];
    const now = new Date();

    for (const alert of alerts || []) {
      const product = alert.products;
      
      if (product && product.stock <= alert.threshold) {
        // 检查是否需要发送警报（避免频繁通知）
        const lastAlerted = alert.last_alerted_at ? new Date(alert.last_alerted_at) : null;
        const hoursSinceLastAlert = lastAlerted ? 
          (now.getTime() - lastAlerted.getTime()) / (1000 * 60 * 60) : 999;

        // 如果超过24小时未通知，或从未通知过，则记录
        if (hoursSinceLastAlert > 24) {
          lowStockProducts.push({
            product_id: product.id,
            product_name: product.name,
            current_stock: product.stock,
            threshold: alert.threshold,
            alert_id: alert.id
          });

          // 更新最后警报时间
          await supabase
            .from('inventory_alerts')
            .update({ last_alerted_at: now.toISOString() })
            .eq('id', alert.id);
        }
      }
    }

    return new Response(
      JSON.stringify({ 
        success: true,
        low_stock_count: lowStockProducts.length,
        low_stock_products: lowStockProducts
      }),
      { 
        headers: { 
          ...corsHeaders, 
          'Content-Type': 'application/json' 
        } 
      }
    );
  } catch (error) {
    console.error('Error in check-inventory-alerts:', error);
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
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