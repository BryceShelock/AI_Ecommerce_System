# ai_guide/views.py

from django.http import JsonResponse
from django.views.decorators.http import require_POST, require_http_methods
from django.contrib.auth.models import AnonymousUser
from django.views.decorators.csrf import csrf_exempt
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
import simplejson as json
from .ai_service import AIGuideService
from core_ecommerce.models import Product

@csrf_exempt
@api_view(['POST'])
@permission_classes([AllowAny])
def ai_chat_api(request):
    """
    AI 导购对话 API 接口。
    支持自然语言对话，理解买家意图并推荐商品。
    """
    try:
        data = request.data if hasattr(request, 'data') else json.loads(request.body)
        messages = data.get('messages', [])
        session_id = data.get('sessionId', '')
        
        if not messages:
            return Response({'error': 'No messages provided'}, status=400)
        
        # 获取最后一条用户消息
        user_message = messages[-1].get('content', '').strip() if messages else ''
        
        if not user_message:
            return Response({'error': '请输入您的问题。'}, status=400)
        
        # 使用当前登录用户，如果未登录则使用匿名用户
        user = request.user if hasattr(request, 'user') and request.user.is_authenticated else None
        
        service = AIGuideService()
        
        # 分析用户意图并推荐商品
        ai_response_text, recommended_products = service.get_ai_response_with_products(
            user, user_message, messages
        )
        
        # 格式化推荐商品数据
        recommended_products_data = []
        for product in recommended_products[:6]:  # 最多推荐6个
            recommended_products_data.append({
                'id': product.id,
                'name': product.name,
                'price': float(product.price),
                'image': product.image_url or 'https://images.unsplash.com/photo-1603789955942-64ca8f2d7c54?w=200',
                'rating': product.rating,
                'sales': product.sales_count,
            })
        
        return Response({
            'message': ai_response_text,
            'recommendedProducts': recommended_products_data,
        })

    except json.JSONDecodeError:
        return Response({'error': 'Invalid JSON format'}, status=400)
    except Exception as e:
        import traceback
        traceback.print_exc()
        return Response({'error': f'服务器内部错误: {str(e)}'}, status=500)