# ai_selector/views.py

from django.shortcuts import render
from django.http import HttpResponse, JsonResponse
from django.views.decorators.http import require_http_methods
from .selector_service import AISelectionService, initialize_products
import json
import csv
from datetime import datetime
from core_ecommerce.models import Product


def ai_selection_dashboard(request):
    """
    AI 选品模块主界面（运营人员）。
    展示 KPI 仪表盘和 AI 推荐清单。
    """
    # 确保有初始数据
    initialize_products() 
    
    service = AISelectionService()
    
    # 1. 运行 AI 选品逻辑，更新评分并获取推荐清单
    recommended_products = service.generate_selection_recommendations()
    
    # 2. 获取市场趋势报表
    report = service.get_market_trend_report()
    
    context = {
        'recommended_products': recommended_products,
        'report': report,
        'page_title': 'AI 选品核心看板'
    }
    return render(request, 'ai_selector/dashboard.html', context)


@require_http_methods(["GET", "POST"])
def export_analysis_report(request):
    """
    导出AI分析报告
    支持格式: JSON, CSV, Excel
    """
    format_type = request.GET.get('format', 'json')  # json, csv, excel
    product_id = request.GET.get('product_id')
    
    service = AISelectionService()
    
    if product_id:
        # 导出单个商品的分析报告
        try:
            product = Product.objects.get(id=product_id)
            data = {
                'product_id': product.id,
                'product_name': product.name,
                'sku': product.sku,
                'category': product.category,
                'price': float(product.price),
                'potential_score': product.potential_score,
                'selection_reason': product.selection_reason,
                'rating': product.rating,
                'sales_count': product.sales_count,
                'stock': product.stock,
                'export_time': datetime.now().isoformat(),
            }
        except Product.DoesNotExist:
            return JsonResponse({'error': 'Product not found'}, status=404)
    else:
        # 导出所有推荐商品
        recommended_products = service.generate_selection_recommendations()
        report = service.get_market_trend_report()
        
        data = {
            'export_time': datetime.now().isoformat(),
            'total_products': len(recommended_products),
            'recommended_products': [
                {
                    'id': p.id,
                    'name': p.name,
                    'sku': p.sku,
                    'category': p.category,
                    'price': float(p.price),
                    'potential_score': p.potential_score,
                    'selection_reason': p.selection_reason,
                    'rating': p.rating,
                    'sales_count': p.sales_count,
                }
                for p in recommended_products[:50]  # 限制最多50个
            ],
            'market_trend': report,
        }
    
    if format_type == 'json':
        response = HttpResponse(
            json.dumps(data, ensure_ascii=False, indent=2),
            content_type='application/json; charset=utf-8'
        )
        filename = f'ai_analysis_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.json'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        return response
    
    elif format_type == 'csv':
        response = HttpResponse(content_type='text/csv; charset=utf-8-sig')
        filename = f'ai_analysis_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.csv'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        
        writer = csv.writer(response)
        if product_id:
            writer.writerow(['字段', '值'])
            for key, value in data.items():
                writer.writerow([key, value])
        else:
            writer.writerow(['ID', '商品名称', 'SKU', '分类', '价格', '潜力评分', '推荐理由', '评分', '销量'])
            for p in data['recommended_products']:
                writer.writerow([
                    p['id'], p['name'], p['sku'], p['category'],
                    p['price'], p['potential_score'], p['selection_reason'],
                    p['rating'], p['sales_count']
                ])
        return response
    
    elif format_type == 'excel':
        try:
            import openpyxl
            from openpyxl.styles import Font, Alignment
        except ImportError:
            return JsonResponse({'error': 'openpyxl not installed. Install with: pip install openpyxl'}, status=500)
        
        wb = openpyxl.Workbook()
        ws = wb.active
        ws.title = "AI分析报告"
        
        if product_id:
            ws.append(['字段', '值'])
            for key, value in data.items():
                ws.append([key, value])
        else:
            headers = ['ID', '商品名称', 'SKU', '分类', '价格', '潜力评分', '推荐理由', '评分', '销量']
            ws.append(headers)
            
            # 设置表头样式
            for cell in ws[1]:
                cell.font = Font(bold=True)
                cell.alignment = Alignment(horizontal='center')
            
            for p in data['recommended_products']:
                ws.append([
                    p['id'], p['name'], p['sku'], p['category'],
                    p['price'], p['potential_score'], p['selection_reason'],
                    p['rating'], p['sales_count']
                ])
        
        response = HttpResponse(
            content_type='application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
        )
        filename = f'ai_analysis_report_{datetime.now().strftime("%Y%m%d_%H%M%S")}.xlsx'
        response['Content-Disposition'] = f'attachment; filename="{filename}"'
        wb.save(response)
        return response
    
    return JsonResponse({'error': 'Unsupported format'}, status=400)