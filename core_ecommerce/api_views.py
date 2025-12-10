from rest_framework import generics
from rest_framework.pagination import PageNumberPagination
from rest_framework.permissions import IsAdminUser, AllowAny
from rest_framework.parsers import MultiPartParser, FormParser
from .models import Product, ProductReview, Order, OrderItem, Cart, CartItem, ShippingAddress, InventoryAlert, RestockSuggestion, UserBehavior
from .serializers import ProductSerializer
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from django.contrib.auth.models import User
from django.utils import timezone
import csv
import io
from django.db.models import Q, Count, Avg


class ImportProductsAPI(APIView):
    """Upload a CSV file to bulk create/update products.

    Expected CSV headers: name,sku,price,stock,category
    """
    permission_classes = [IsAdminUser]
    parser_classes = [MultiPartParser, FormParser]

    def post(self, request, format=None):
        file = request.FILES.get('file')
        if not file:
            return Response({'error': 'No file uploaded'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            decoded = file.read().decode('utf-8')
            reader = csv.DictReader(io.StringIO(decoded))
            created = 0
            updated = 0
            for row in reader:
                sku = row.get('sku')
                if not sku:
                    continue
                product, exists = Product.objects.get_or_create(sku=sku, defaults={
                    'name': row.get('name', '')[:200],
                    'price': row.get('price') or 0,
                    'stock': int(row.get('stock') or 0),
                    'category': row.get('category') or 'Uncategorized',
                })
                if exists:
                    created += 1
                else:
                    # update fields
                    product.name = row.get('name', product.name)
                    try:
                        product.price = float(row.get('price') or product.price)
                    except Exception:
                        pass
                    try:
                        product.stock = int(row.get('stock') or product.stock)
                    except Exception:
                        pass
                    product.category = row.get('category') or product.category
                    product.save()
                    updated += 1

            return Response({'created': created, 'updated': updated})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class ProductListAPI(generics.ListCreateAPIView):
    serializer_class = ProductSerializer
    # enable server-side pagination
    class StandardResultsSetPagination(PageNumberPagination):
        page_size = 9
        page_size_query_param = 'page_size'
        max_page_size = 100

    pagination_class = StandardResultsSetPagination

    def get_queryset(self):
        qs = Product.objects.all()
        params = self.request.query_params
        q = params.get('q') or params.get('search')
        if q:
            qs = qs.filter(Q(name__icontains=q) | Q(sku__icontains=q) | Q(category__icontains=q))

        category = params.get('category')
        if category:
            qs = qs.filter(category__iexact=category)

        min_price = params.get('min_price')
        max_price = params.get('max_price')
        try:
            if min_price is not None:
                qs = qs.filter(price__gte=float(min_price))
            if max_price is not None:
                qs = qs.filter(price__lte=float(max_price))
        except Exception:
            pass

        ordering = params.get('ordering')
        allowed = ['price', '-price', 'potential_score', '-potential_score']
        if ordering in allowed:
            qs = qs.order_by(ordering)
        else:
            qs = qs.order_by('-potential_score')

        return qs


class ProductDetailAPI(generics.RetrieveAPIView):
    queryset = Product.objects.all()
    serializer_class = ProductSerializer


class ProductReviewListAPI(generics.ListCreateAPIView):
    """商品评价列表和创建"""
    permission_classes = [AllowAny]
    
    def get_queryset(self):
        product_id = self.kwargs.get('product_id')
        return ProductReview.objects.filter(product_id=product_id).select_related('user').order_by('-created_at')
    
    def get_serializer_class(self):
        from .serializers import ProductReviewSerializer
        return ProductReviewSerializer
    
    def perform_create(self, serializer):
        # 这里应该从认证用户获取，暂时允许匿名或使用提供的user_id
        user_id = self.request.data.get('user_id')
        if user_id:
            try:
                user = User.objects.get(id=user_id)
                serializer.save(user=user)
            except (User.DoesNotExist, ValueError):
                # 如果用户不存在，创建一个匿名用户或使用默认用户
                try:
                    user = User.objects.get(username='anonymous')
                except User.DoesNotExist:
                    user = User.objects.create_user(
                        username=f'anonymous_{user_id}',
                        email=f'anonymous_{user_id}@example.com',
                        password=''
                    )
                serializer.save(user=user)
        else:
            # 如果没有提供user_id，使用默认匿名用户
            try:
                user = User.objects.get(username='anonymous')
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username='anonymous',
                    email='anonymous@example.com',
                    password=''
                )
            serializer.save(user=user)


class ProductReviewHelpfulAPI(APIView):
    """评价有用性投票"""
    permission_classes = [AllowAny]
    
    def post(self, request, review_id):
        try:
            review = ProductReview.objects.get(id=review_id)
            review.helpful_count += 1
            review.save()
            return Response({'helpful_count': review.helpful_count})
        except ProductReview.DoesNotExist:
            return Response({'error': 'Review not found'}, status=status.HTTP_404_NOT_FOUND)


class CartAPI(APIView):
    """购物车API"""
    permission_classes = [AllowAny]
    
    def get_cart(self, request):
        """获取或创建购物车"""
        user = request.user if request.user.is_authenticated else None
        session_key = request.session.session_key or request.META.get('HTTP_X_SESSION_KEY', '')
        
        if user:
            cart, _ = Cart.objects.get_or_create(user=user)
        else:
            if not session_key:
                request.session.create()
                session_key = request.session.session_key
            cart, _ = Cart.objects.get_or_create(session_key=session_key, user=None)
        
        return cart
    
    def get(self, request):
        """获取购物车"""
        cart = self.get_cart(request)
        items = CartItem.objects.filter(cart=cart).select_related('product')
        
        cart_data = {
            'id': cart.id,
            'items': [
                {
                    'id': item.id,
                    'product_id': item.product.id,
                    'product_name': item.product.name,
                    'price': float(item.product.price),
                    'original_price': float(item.product.original_price) if item.product.original_price else None,
                    'image': item.product.image_url or 'https://images.unsplash.com/photo-1603789955942-64ca8f2d7c54?w=200',
                    'quantity': item.quantity,
                    'stock': item.product.stock,
                }
                for item in items
            ],
            'total': sum(float(item.product.price) * item.quantity for item in items),
        }
        return Response(cart_data)
    
    def post(self, request):
        """添加商品到购物车"""
        cart = self.get_cart(request)
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            product = Product.objects.get(id=product_id)
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)
        
        cart_item, created = CartItem.objects.get_or_create(
            cart=cart,
            product=product,
            defaults={'quantity': quantity}
        )
        
        if not created:
            cart_item.quantity += quantity
            cart_item.quantity = min(cart_item.quantity, product.stock)
            cart_item.save()
        
        return Response({'message': 'Added to cart', 'cart_item_id': cart_item.id})
    
    def put(self, request):
        """更新购物车商品数量"""
        item_id = request.data.get('item_id')
        quantity = int(request.data.get('quantity', 1))
        
        try:
            cart_item = CartItem.objects.get(id=item_id)
            cart_item.quantity = max(1, min(quantity, cart_item.product.stock))
            cart_item.save()
            return Response({'message': 'Updated'})
        except CartItem.DoesNotExist:
            return Response({'error': 'Item not found'}, status=status.HTTP_404_NOT_FOUND)
    
    def delete(self, request):
        """从购物车删除商品"""
        item_id = request.data.get('item_id')
        
        try:
            CartItem.objects.filter(id=item_id).delete()
            return Response({'message': 'Deleted'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class OrderAPI(APIView):
    """订单API"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """获取用户订单列表"""
        user = request.user if request.user.is_authenticated else None
        user_id = request.GET.get('user_id')
        
        if not user and user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                pass
        
        if not user:
            return Response({'error': 'User required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        orders = Order.objects.filter(user=user).prefetch_related('items__product').order_by('-created_at')
        
        orders_data = []
        for order in orders:
            orders_data.append({
                'id': order.id,
                'order_no': f'OD{order.id:08d}',
                'status': order.status,
                'total_amount': float(order.total_amount),
                'created_at': order.created_at.isoformat(),
                'items': [
                    {
                        'id': item.id,
                        'product_id': item.product.id if item.product else None,
                        'product_name': item.product.name if item.product else '已删除商品',
                        'quantity': item.quantity,
                        'price': float(item.price),
                        'image': item.product.image_url if item.product else '',
                    }
                    for item in order.items.all()
                ],
            })
        
        return Response({'orders': orders_data})
    
    def post(self, request):
        """创建订单"""
        user = request.user if request.user.is_authenticated else None
        user_id = request.data.get('user_id')
        
        if not user and user_id:
            try:
                user = User.objects.get(id=user_id)
            except User.DoesNotExist:
                user = User.objects.create_user(
                    username=f'user_{user_id}',
                    email=f'user_{user_id}@example.com',
                    password=''
                )
        
        if not user:
            return Response({'error': 'User required'}, status=status.HTTP_401_UNAUTHORIZED)
        
        items = request.data.get('items', [])
        shipping_address = request.data.get('shipping_address', '')
        source = request.data.get('source', '')
        
        if not items:
            return Response({'error': 'No items'}, status=status.HTTP_400_BAD_REQUEST)
        
        # 计算总金额
        total_amount = 0
        order_items_data = []
        
        for item in items:
            try:
                product = Product.objects.get(id=item['product_id'])
                quantity = int(item['quantity'])
                price = float(product.price)
                total_amount += price * quantity
                order_items_data.append({
                    'product': product,
                    'quantity': quantity,
                    'price': price,
                })
            except Product.DoesNotExist:
                return Response({'error': f'Product {item.get("product_id")} not found'}, status=status.HTTP_404_NOT_FOUND)
        
        # 创建订单
        order = Order.objects.create(
            user=user,
            total_amount=total_amount,
            shipping_address=shipping_address,
            source=source,
            status='PENDING',
        )
        
        # 创建订单项
        for item_data in order_items_data:
            OrderItem.objects.create(
                order=order,
                product=item_data['product'],
                quantity=item_data['quantity'],
                price=item_data['price'],
            )
            # 减少库存
            item_data['product'].stock -= item_data['quantity']
            item_data['product'].save()
        
        return Response({
            'order_id': order.id,
            'order_no': f'OD{order.id:08d}',
            'total_amount': float(total_amount),
            'message': 'Order created',
        })


class ShippingAddressAPI(APIView):
    """收货地址API"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """获取用户地址列表"""
        user_id = request.GET.get('user_id')
        if not user_id:
            return Response({'error': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
        
        addresses = ShippingAddress.objects.filter(user=user).order_by('-is_default', '-created_at')
        addresses_data = [
            {
                'id': addr.id,
                'receiver_name': addr.receiver_name,
                'phone': addr.phone,
                'province': addr.province,
                'city': addr.city,
                'district': addr.district,
                'detail': addr.detail,
                'is_default': addr.is_default,
            }
            for addr in addresses
        ]
        return Response({'addresses': addresses_data})
    
    def post(self, request):
        """创建收货地址"""
        user_id = request.data.get('user_id')
        if not user_id:
            return Response({'error': 'User ID required'}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            user = User.objects.get(id=user_id)
        except User.DoesNotExist:
            user = User.objects.create_user(
                username=f'user_{user_id}',
                email=f'user_{user_id}@example.com',
                password=''
            )
        
        # 如果设置为默认地址，取消其他默认地址
        is_default = request.data.get('is_default', False)
        if is_default:
            ShippingAddress.objects.filter(user=user, is_default=True).update(is_default=False)
        
        address = ShippingAddress.objects.create(
            user=user,
            receiver_name=request.data.get('receiver_name'),
            phone=request.data.get('phone'),
            province=request.data.get('province'),
            city=request.data.get('city'),
            district=request.data.get('district'),
            detail=request.data.get('detail'),
            is_default=is_default,
        )
        
        return Response({
            'id': address.id,
            'message': 'Address created',
        })


class AnalyticsDashboardAPI(APIView):
    """数据可视化看板API"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """获取运营数据统计"""
        from django.db.models import Sum, Count, Avg
        from datetime import datetime, timedelta
        
        # 计算时间范围
        now = timezone.now()
        today_start = now.replace(hour=0, minute=0, second=0, microsecond=0)
        week_start = today_start - timedelta(days=7)
        month_start = today_start - timedelta(days=30)
        
        # 总销售额
        total_sales = Order.objects.filter(status__in=['PAID', 'SHIPPED', 'COMPLETED']).aggregate(
            total=Sum('total_amount')
        )['total'] or 0
        
        # 今日销售额
        today_sales = Order.objects.filter(
            status__in=['PAID', 'SHIPPED', 'COMPLETED'],
            created_at__gte=today_start
        ).aggregate(total=Sum('total_amount'))['total'] or 0
        
        # 订单数量
        total_orders = Order.objects.count()
        today_orders = Order.objects.filter(created_at__gte=today_start).count()
        
        # 活跃用户（有订单的用户）
        active_users = User.objects.filter(order__isnull=False).distinct().count()
        
        # 商品统计
        total_products = Product.objects.count()
        low_stock_products = Product.objects.filter(stock__lt=10).count()
        
        # 销售趋势（最近7天）
        sales_trend = []
        for i in range(6, -1, -1):
            date = today_start - timedelta(days=i)
            day_sales = Order.objects.filter(
                status__in=['PAID', 'SHIPPED', 'COMPLETED'],
                created_at__date=date.date()
            ).aggregate(total=Sum('total_amount'))['total'] or 0
            sales_trend.append({
                'date': date.strftime('%Y-%m-%d'),
                'sales': float(day_sales),
            })
        
        # 热门商品（按销量）
        top_products = Product.objects.order_by('-sales_count')[:10].values(
            'id', 'name', 'sales_count', 'price', 'rating'
        )
        
        # 分类统计
        category_stats = Product.objects.values('category').annotate(
            count=Count('id'),
            total_sales=Sum('sales_count'),
        ).order_by('-total_sales')[:10]
        
        return Response({
            'stats': {
                'total_sales': float(total_sales),
                'today_sales': float(today_sales),
                'total_orders': total_orders,
                'today_orders': today_orders,
                'active_users': active_users,
                'total_products': total_products,
                'low_stock_products': low_stock_products,
            },
            'sales_trend': sales_trend,
            'top_products': list(top_products),
            'category_stats': list(category_stats),
        })


class InventoryMonitorAPI(APIView):
    """实时库存监控API"""
    permission_classes = [AllowAny]
    
    def get(self, request):
        """获取库存监控数据"""
        from datetime import datetime, timedelta
        
        # 低库存商品
        low_stock_threshold = int(request.GET.get('threshold', 10))
        low_stock_products = Product.objects.filter(stock__lt=low_stock_threshold).order_by('stock')[:20]
        
        # 库存预警趋势（最近7天）
        trend_data = []
        now = timezone.now()
        for i in range(6, -1, -1):
            date = (now - timedelta(days=i)).date()
            # 统计当天的低库存商品数量
            count = Product.objects.filter(
                stock__lt=low_stock_threshold
            ).count()  # 简化：使用当前库存数
            trend_data.append({
                'date': date.strftime('%m-%d'),
                'alerts': count,
                'restocked': 0,  # 可以从补货记录中统计
            })
        
        # 补货建议（基于库存和销量）
        suggestions = []
        for product in Product.objects.filter(stock__lt=20).order_by('stock')[:10]:
            # 计算建议补货数量（基于平均销量）
            avg_daily_sales = product.sales_count / 30 if product.sales_count > 0 else 1
            suggested_qty = max(50, int(avg_daily_sales * 30))  # 建议补货30天销量
            
            priority = 10 if product.stock < 5 else (8 if product.stock < 10 else 5)
            
            suggestions.append({
                'id': product.id,
                'product_id': product.id,
                'product_name': product.name,
                'current_stock': product.stock,
                'suggested_quantity': suggested_qty,
                'priority': priority,
                'reason': f'当前库存{product.stock}件，建议补货{suggested_qty}件以维持正常销售',
            })
        
        return Response({
            'low_stock_products': [
                {
                    'id': p.id,
                    'name': p.name,
                    'stock': p.stock,
                    'category': p.category,
                    'sales_count': p.sales_count,
                }
                for p in low_stock_products
            ],
            'trend_data': trend_data,
            'suggestions': suggestions,
        })
    
    def post(self, request):
        """生成采购单"""
        product_id = request.data.get('product_id')
        quantity = int(request.data.get('quantity', 50))
        
        try:
            product = Product.objects.get(id=product_id)
            # 创建补货建议记录
            suggestion = RestockSuggestion.objects.create(
                product=product,
                suggested_quantity=quantity,
                priority=10,
                reason='手动生成采购单',
                status='ORDERED',
            )
            return Response({
                'message': '采购单已生成',
                'suggestion_id': suggestion.id,
            })
        except Product.DoesNotExist:
            return Response({'error': 'Product not found'}, status=status.HTTP_404_NOT_FOUND)


class UserBehaviorAPI(APIView):
    """用户行为数据 API（简化实现）"""
    permission_classes = [AllowAny]

    def get(self, request):
        # 返回最近的用户行为记录（如果模型可用）
        try:
            behaviors = UserBehavior.objects.all().order_by('-id')[:20]
            data = []
            for b in behaviors:
                data.append({
                    'id': getattr(b, 'id', None),
                    'user_id': getattr(b, 'user_id', None),
                    'event': getattr(b, 'event', None),
                    'meta': getattr(b, 'meta', None),
                    'timestamp': getattr(b, 'timestamp', None).isoformat() if getattr(b, 'timestamp', None) else None,
                })
            return Response({'behaviors': data})
        except Exception:
            return Response({'behaviors': []})


class RecommendationAPI(APIView):
    """简易推荐 API：返回按销量排序的商品列表"""
    permission_classes = [AllowAny]

    def get(self, request):
        try:
            qs = Product.objects.order_by('-sales_count')[:10]
            serializer = ProductSerializer(qs, many=True)
            return Response({'recommendations': serializer.data})
        except Exception:
            return Response({'recommendations': []})
