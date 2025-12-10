# core_ecommerce/models.py

from django.db import models
from django.contrib.auth.models import User
import json

class UserProfile(models.Model):
    """用户画像（用于 AI 导购精准推荐） [cite: 1196, 1230]"""
    user = models.OneToOneField(User, on_delete=models.CASCADE)
    # 基于用户行为数据（浏览、购买、评价）构建的标签化用户模型 [cite: 1150]
    tags = models.JSONField(default=list, help_text="用户画像标签，如: ['母婴', '日式', '高预算']")
    preferences = models.JSONField(default=dict, help_text="用户偏好设置，如: {'category': 'toy', 'min_price': 100}")

    def __str__(self):
        return f"Profile of {self.user.username}"

class Product(models.Model):
    """商品管理（包含 AI 选品结果字段） [cite: 1197]"""
    name = models.CharField(max_length=200, verbose_name="商品名称")
    sku = models.CharField(max_length=50, unique=True, verbose_name="SKU")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="定价")
    original_price = models.DecimalField(max_digits=10, decimal_places=2, null=True, blank=True, verbose_name="原价")
    stock = models.IntegerField(default=0, verbose_name="库存")
    category = models.CharField(max_length=100, default='Uncategorized', verbose_name="分类")
    description = models.TextField(blank=True, verbose_name="商品描述")
    image_url = models.URLField(max_length=500, blank=True, verbose_name="商品图片URL")
    
    # 前端展示字段
    rating = models.FloatField(default=4.5, verbose_name="评分")
    sales_count = models.IntegerField(default=0, verbose_name="销量")
    
    # AI 选品模块输出：商品潜力评分 [cite: 1221]
    potential_score = models.FloatField(default=0.0, verbose_name="AI潜力评分")
    selection_reason = models.TextField(blank=True, verbose_name="AI选品推荐理由")

    def __str__(self):
        return self.name
    
    class Meta:
        verbose_name = "商品"
        verbose_name_plural = "商品管理"

class Order(models.Model):
    """订单管理 [cite: 1197]"""
    STATUS_CHOICES = [
        ('PENDING', '待付款'),
        ('PAID', '已付款'),
        ('SHIPPED', '已发货'),
        ('COMPLETED', '已完成'),
        ('CANCELLED', '已取消'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, verbose_name="用户")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="订单状态")
    total_amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="总金额")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    shipping_address = models.TextField(blank=True, verbose_name="收货地址")
    tracking_number = models.CharField(max_length=100, blank=True, verbose_name="物流单号")
    
    # 记录导购/推荐来源，用于效果追踪
    source = models.CharField(max_length=50, blank=True, null=True, verbose_name="来源") 

    def __str__(self):
        return f"Order {self.id} ({self.status})"


class OrderItem(models.Model):
    """订单商品项"""
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='items', verbose_name="订单")
    product = models.ForeignKey(Product, on_delete=models.SET_NULL, null=True, verbose_name="商品")
    quantity = models.IntegerField(default=1, verbose_name="数量")
    price = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="单价")
    
    def __str__(self):
        return f"{self.order.id} - {self.product.name if self.product else 'Deleted Product'}"


class Refund(models.Model):
    """退款申请"""
    STATUS_CHOICES = [
        ('PENDING', '待审核'),
        ('APPROVED', '已同意'),
        ('REJECTED', '已拒绝'),
        ('PROCESSING', '处理中'),
        ('COMPLETED', '已完成'),
        ('CANCELLED', '已取消'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='refunds', verbose_name="订单")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="用户")
    amount = models.DecimalField(max_digits=10, decimal_places=2, verbose_name="退款金额")
    reason = models.TextField(verbose_name="退款原因")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="状态")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="申请时间")
    processed_at = models.DateTimeField(null=True, blank=True, verbose_name="处理时间")
    reject_reason = models.TextField(blank=True, verbose_name="拒绝原因")
    
    def __str__(self):
        return f"Refund {self.id} - Order {self.order.id}"


class AfterSaleService(models.Model):
    """售后服务"""
    TYPE_CHOICES = [
        ('RETURN', '退货'),
        ('EXCHANGE', '换货'),
        ('REPAIR', '维修'),
        ('OTHER', '其他'),
    ]
    
    STATUS_CHOICES = [
        ('PENDING', '待处理'),
        ('APPROVED', '已同意'),
        ('REJECTED', '已拒绝'),
        ('PROCESSING', '处理中'),
        ('SHIPPED', '已寄回'),
        ('COMPLETED', '已完成'),
        ('CANCELLED', '已取消'),
    ]
    
    order = models.ForeignKey(Order, on_delete=models.CASCADE, related_name='after_sales', verbose_name="订单")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="用户")
    service_type = models.CharField(max_length=20, choices=TYPE_CHOICES, verbose_name="服务类型")
    description = models.TextField(verbose_name="问题描述")
    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING', verbose_name="状态")
    return_tracking = models.CharField(max_length=100, blank=True, verbose_name="退货物流单号")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="申请时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    def __str__(self):
        return f"AfterSale {self.id} - {self.get_service_type_display()}"


class ProductReview(models.Model):
    """商品评价"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='reviews', verbose_name="商品")
    user = models.ForeignKey(User, on_delete=models.CASCADE, verbose_name="用户")
    order = models.ForeignKey(Order, on_delete=models.SET_NULL, null=True, verbose_name="订单")
    rating = models.IntegerField(choices=[(i, i) for i in range(1, 6)], verbose_name="评分")
    content = models.TextField(blank=True, verbose_name="评价内容")
    images = models.JSONField(default=list, blank=True, verbose_name="评价图片")
    helpful_count = models.IntegerField(default=0, verbose_name="有用数")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="评价时间")
    
    class Meta:
        verbose_name = "商品评价"
        verbose_name_plural = "商品评价"
    
    def __str__(self):
        return f"{self.product.name} - {self.user.username} - {self.rating}星"


class Cart(models.Model):
    """购物车"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='carts', verbose_name="用户")
    session_key = models.CharField(max_length=40, blank=True, null=True, verbose_name="会话键（未登录用户）")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "购物车"
        verbose_name_plural = "购物车"
        unique_together = [['user', 'session_key']]
    
    def __str__(self):
        return f"Cart for {self.user.username if self.user else 'Anonymous'}"


class CartItem(models.Model):
    """购物车商品项"""
    cart = models.ForeignKey(Cart, on_delete=models.CASCADE, related_name='items', verbose_name="购物车")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, verbose_name="商品")
    quantity = models.IntegerField(default=1, verbose_name="数量")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="添加时间")
    updated_at = models.DateTimeField(auto_now=True, verbose_name="更新时间")
    
    class Meta:
        verbose_name = "购物车商品"
        verbose_name_plural = "购物车商品"
        unique_together = [['cart', 'product']]
    
    def __str__(self):
        return f"{self.cart} - {self.product.name} x{self.quantity}"


class ShippingAddress(models.Model):
    """收货地址"""
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='addresses', verbose_name="用户")
    receiver_name = models.CharField(max_length=50, verbose_name="收货人姓名")
    phone = models.CharField(max_length=20, verbose_name="联系电话")
    province = models.CharField(max_length=50, verbose_name="省份")
    city = models.CharField(max_length=50, verbose_name="城市")
    district = models.CharField(max_length=50, verbose_name="区县")
    detail = models.CharField(max_length=200, verbose_name="详细地址")
    is_default = models.BooleanField(default=False, verbose_name="默认地址")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    
    class Meta:
        verbose_name = "收货地址"
        verbose_name_plural = "收货地址"
    
    def __str__(self):
        return f"{self.receiver_name} - {self.province}{self.city}{self.district}{self.detail}"


class InventoryAlert(models.Model):
    """库存预警规则"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='alerts', verbose_name="商品")
    threshold = models.IntegerField(default=10, verbose_name="预警阈值")
    is_active = models.BooleanField(default=True, verbose_name="是否启用")
    last_alerted_at = models.DateTimeField(null=True, blank=True, verbose_name="最后预警时间")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    
    class Meta:
        verbose_name = "库存预警"
        verbose_name_plural = "库存预警"
    
    def __str__(self):
        return f"{self.product.name} - 阈值: {self.threshold}"


class RestockSuggestion(models.Model):
    """补货建议"""
    product = models.ForeignKey(Product, on_delete=models.CASCADE, related_name='restock_suggestions', verbose_name="商品")
    suggested_quantity = models.IntegerField(verbose_name="建议补货数量")
    priority = models.IntegerField(default=5, verbose_name="优先级(1-10)")
    reason = models.TextField(verbose_name="补货理由")
    status = models.CharField(max_length=20, default='PENDING', verbose_name="状态")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="创建时间")
    
    class Meta:
        verbose_name = "补货建议"
        verbose_name_plural = "补货建议"
    
    def __str__(self):
        return f"{self.product.name} - 建议补货 {self.suggested_quantity} 件"


class UserBehavior(models.Model):
    """用户行为追踪"""
    BEHAVIOR_TYPES = [
        ('view', '浏览'),
        ('click', '点击'),
        ('add_to_cart', '加入购物车'),
        ('purchase', '购买'),
        ('like', '点赞/收藏'),
        ('review', '评价'),
    ]
    
    user = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, verbose_name="用户")
    session_id = models.CharField(max_length=100, blank=True, verbose_name="会话ID")
    product = models.ForeignKey(Product, on_delete=models.CASCADE, null=True, blank=True, verbose_name="商品")
    behavior_type = models.CharField(max_length=20, choices=BEHAVIOR_TYPES, verbose_name="行为类型")
    metadata = models.JSONField(default=dict, blank=True, verbose_name="元数据")
    created_at = models.DateTimeField(auto_now_add=True, verbose_name="行为时间")
    
    class Meta:
        verbose_name = "用户行为"
        verbose_name_plural = "用户行为"
        indexes = [
            models.Index(fields=['user', 'behavior_type']),
            models.Index(fields=['product', 'behavior_type']),
            models.Index(fields=['created_at']),
        ]
    
    def __str__(self):
        return f"{self.user or 'Anonymous'} - {self.get_behavior_type_display()} - {self.product}"

# 注册到 Admin
from django.contrib import admin

admin.site.register(UserProfile)
admin.site.register(Product)
admin.site.register(Order)
admin.site.register(OrderItem)
admin.site.register(Refund)
admin.site.register(AfterSaleService)
admin.site.register(ProductReview)
admin.site.register(Cart)
admin.site.register(CartItem)
admin.site.register(ShippingAddress)
admin.site.register(InventoryAlert)
admin.site.register(RestockSuggestion)
admin.site.register(UserBehavior)