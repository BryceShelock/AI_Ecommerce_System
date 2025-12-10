# ai_selector/selector_service.py

import datetime
import random
from core_ecommerce.models import Product

class AISelectionService:
    """
    AI 选品核心逻辑服务。
    模拟市场趋势分析、竞品对比、生成商品潜力评分。
    """
    
    def __init__(self):
        # 模拟市场趋势数据（从爬虫/数据源获取的）
        self.market_trends = {
            "母婴玩具": {"growth": 0.15, "competition": 0.4},
            "日式家居": {"growth": 0.08, "competition": 0.6},
            "电子产品": {"growth": 0.20, "competition": 0.8},
        }

    def _get_score_reason(self, product_name, category):
        """根据趋势模拟生成潜力评分和理由"""
        trend = self.market_trends.get(category, {"growth": 0.05, "competition": 0.7})
        
        # 潜力评分 = 增长率 * 0.6 + (1 - 竞争度) * 0.4 + 随机波动
        score = (trend["growth"] * 0.6) + ((1 - trend["competition"]) * 0.4) + (random.random() * 0.1)
        score = round(score, 2)
        
        reason = f"基于市场分析，该商品所属【{category}】品类增长率达 {trend['growth']*100:.1f}%，竞争度相对较低。AI 预测潜力高，建议重点采购。"
        
        if score < 0.3:
            reason = f"【{category}】市场竞争过于激烈，虽然有增长，但利润空间受限，建议谨慎。"
            
        return score, reason

    def generate_selection_recommendations(self):
        """
        生成选品推荐清单。
        定期输出商品潜力评分，生成推荐清单。
        """
        products = Product.objects.all()
        
        for product in products:
            # 更新潜力评分和理由
            score, reason = self._get_score_reason(product.name, product.category)
            product.potential_score = score
            product.selection_reason = reason
            product.save()
            
        # 返回评分最高的 TOP 10 作为推荐
        recommended_products = Product.objects.all().order_by('-potential_score')[:10]
        
        return recommended_products

    def get_market_trend_report(self):
        """查看市场趋势数据和可视化报告"""
        # 模拟报表数据
        report_data = {
            "title": "最新市场趋势报告",
            "date": datetime.date.today().strftime("%Y-%m-%d"),
            "growth_category": ["母婴玩具", "电子产品", "户外用品"],
            "top_kpi": {
                "转化率": "2.5% (+0.2%)",
                "客单价": "¥350.00 (-¥10.50)",
            },
            "trends": [
                {"category": k, "growth": v['growth'], "competition": v['competition']}
                for k, v in self.market_trends.items()
            ]
        }
        return report_data

# 确保在运行 Demo 前，数据库中有一些初始商品数据
def initialize_products():
    """初始化商品数据"""
    if Product.objects.count() == 0:
        print("初始化商品数据...")
        Product.objects.bulk_create([
            Product(name="日式木质婴儿玩具", sku="TOY-JP-001", price=199.99, stock=500, category="母婴玩具"),
            Product(name="高颜值智能手环", sku="ELEC-SM-001", price=399.00, stock=100, category="电子产品"),
            Product(name="简约风陶瓷杯套装", sku="HOME-CN-001", price=49.90, stock=1200, category="日式家居"),
            Product(name="户外露营折叠椅", sku="OUT-GEAR-001", price=150.00, stock=30, category="户外用品"),
        ])
        print("商品数据初始化完成。")