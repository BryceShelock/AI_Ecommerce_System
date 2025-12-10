# core_ecommerce/views.py

from django.shortcuts import render, get_object_or_404
from .models import Product, Order
from django.db.models import Count, Sum
from django.contrib.auth.decorators import login_required
from django.http import HttpResponse

def homepage(request):
    """电商首页/系统登录页"""
    return render(request, 'core_ecommerce/homepage.html', {})

def product_list(request):
    """商品列表（运营基础管理）"""
    products = Product.objects.all().order_by('-potential_score', '-stock')
    return render(request, 'core_ecommerce/product_list.html', {'products': products})

def product_detail(request, product_id):
    """商品详情页（消费者端）"""
    product = get_object_or_404(Product, id=product_id)
    # 此处应集成 AI 推荐（例如：推荐相似度高的商品）
    return render(request, 'core_ecommerce/product_detail.html', {'product': product})

@login_required
def order_list(request):
    """订单管理列表（运营人员）"""
    # 简化：仅展示所有订单
    orders = Order.objects.all().order_by('-created_at')
    return render(request, 'core_ecommerce/order_list.html', {'orders': orders})