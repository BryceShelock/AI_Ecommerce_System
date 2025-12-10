# core_ecommerce/urls.py

from django.urls import path
from . import views
from . import api_views

urlpatterns = [
    path('', views.product_list, name='product_list'), # 商品管理
    path('order/', views.order_list, name='order_list'), # 订单管理
    path('<int:product_id>/', views.product_detail, name='product_detail'), # 商品详情

    # API endpoints (DRF)
    path('api/products/', api_views.ProductListAPI.as_view(), name='api_product_list'),
    path('api/products/<int:pk>/', api_views.ProductDetailAPI.as_view(), name='api_product_detail'),
    path('api/products/import/', api_views.ImportProductsAPI.as_view(), name='api_product_import'),
    path('api/products/<int:product_id>/reviews/', api_views.ProductReviewListAPI.as_view(), name='api_product_reviews'),
    path('api/reviews/<int:review_id>/helpful/', api_views.ProductReviewHelpfulAPI.as_view(), name='api_review_helpful'),
    path('api/cart/', api_views.CartAPI.as_view(), name='api_cart'),
    path('api/orders/', api_views.OrderAPI.as_view(), name='api_orders'),
    path('api/addresses/', api_views.ShippingAddressAPI.as_view(), name='api_addresses'),
    path('api/analytics/', api_views.AnalyticsDashboardAPI.as_view(), name='api_analytics'),
    path('api/inventory/monitor/', api_views.InventoryMonitorAPI.as_view(), name='api_inventory_monitor'),
    path('api/behavior/', api_views.UserBehaviorAPI.as_view(), name='api_user_behavior'),
    path('api/recommendations/', api_views.RecommendationAPI.as_view(), name='api_recommendations'),
]