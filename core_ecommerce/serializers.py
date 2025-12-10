from rest_framework import serializers
from .models import Product, ProductReview
from django.contrib.auth.models import User


class ProductSerializer(serializers.ModelSerializer):
    # 为了兼容前端，添加一些计算字段
    image = serializers.SerializerMethodField()
    sales = serializers.IntegerField(source='sales_count', read_only=True)
    
    class Meta:
        model = Product
        fields = [
            'id', 'name', 'sku', 'price', 'original_price', 'stock', 'category', 
            'description', 'image_url', 'image', 'rating', 'sales_count', 'sales',
            'potential_score', 'selection_reason', 'created_at', 'updated_at'
        ]
        read_only_fields = ['created_at', 'updated_at']
    
    def get_image(self, obj):
        """返回图片URL，优先使用image_url，如果没有则返回默认图片"""
        return obj.image_url or 'https://images.unsplash.com/photo-1603789955942-64ca8f2d7c54?w=800&h=800&fit=crop'


class ProductReviewSerializer(serializers.ModelSerializer):
    user_name = serializers.CharField(source='user.username', read_only=True)
    user_full_name = serializers.SerializerMethodField()
    
    class Meta:
        model = ProductReview
        fields = [
            'id', 'product', 'user', 'user_name', 'user_full_name', 'order',
            'rating', 'content', 'images', 'helpful_count', 'created_at'
        ]
        read_only_fields = ['user', 'helpful_count', 'created_at']
    
    def get_user_full_name(self, obj):
        # 如果有用户全名字段，返回它，否则返回用户名
        return obj.user.get_full_name() or obj.user.username
