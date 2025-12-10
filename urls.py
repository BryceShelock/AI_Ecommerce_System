# ecommerce_ai_system/urls.py

from django.contrib import admin
from django.urls import path, include
from core_ecommerce.views import homepage

urlpatterns = [
    path('admin/', admin.site.urls),
    path('', homepage, name='homepage'), # 首页
    path('products/', include('core_ecommerce.urls')), # 电商核心路由
    path('ai_select/', include('ai_selector.urls')), # AI 选品路由
    path('ai_guide/', include('ai_guide.urls')),     # AI 导购路由
]