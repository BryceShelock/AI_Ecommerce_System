# ai_selector/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('', views.ai_selection_dashboard, name='ai_selection_dashboard'), # AI 选品主看板
    path('export/', views.export_analysis_report, name='export_analysis_report'), # 导出分析报告
]