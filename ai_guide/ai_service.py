# ai_guide/ai_service.py

import json
import random
import os
import re
from core_ecommerce.models import Product, UserProfile
from django.contrib.auth.models import User
import requests 

class AIGuideService:
    """
    AI 导购核心逻辑服务。
    模拟结合 NLP 和用户画像提供商品咨询和个性化推荐。
    """

    def _get_user_profile_tags(self, user):
        """获取用户画像标签"""
        if user.is_authenticated:
            try:
                profile = user.userprofile
                return profile.tags
            except UserProfile.DoesNotExist:
                return ["新用户"]
        return ["访客"]

    def _extract_keywords(self, user_message):
        """从用户消息中提取关键词"""
        keywords = []
        categories = ['数码配件', '智能穿戴', '电脑外设', '智能家居', '生活用品']
        for cat in categories:
            if cat in user_message:
                keywords.append(cat)
        
        # 提取商品类型关键词
        product_types = ['耳机', '充电器', '手环', '键盘', '鼠标', '音箱', '灯泡', '摄像头']
        for pt in product_types:
            if pt in user_message:
                keywords.append(pt)
        
        return keywords

    def _simulate_llm_response(self, user_message, tags, recommended_products=None):
        """
        模拟大模型（如智谱GLM/讯飞星火）的意图识别和响应。
        """
        user_intent = "咨询"
        
        # 简化意图识别
        if any(keyword in user_message for keyword in ["推荐", "买什么", "挑选", "选品", "想要", "需要"]):
            user_intent = "推荐"
        elif any(keyword in user_message for keyword in ["价格", "优惠", "折扣", "促销", "便宜"]):
            user_intent = "优惠"
        elif any(keyword in user_message for keyword in ["功能", "特点", "参数", "规格"]):
            user_intent = "咨询"

        if user_intent == "推荐":
            if recommended_products:
                response_text = f"您好，我是您的AI导购助手。根据您的需求，我为您找到了以下推荐商品：\n\n"
                for i, p in enumerate(recommended_products, 1):
                    response_text += f"{i}. {p.name} - ¥{p.price}\n"
                    if p.selection_reason:
                        response_text += f"   推荐理由：{p.selection_reason}\n"
                response_text += "\n您可以点击下方商品卡片查看详情。如果还需要其他帮助，请告诉我！"
            else:
                response_text = "抱歉，暂时没有找到符合您需求的商品。您可以尝试描述更具体一些，比如商品类型、价格范围等。"
        
        elif user_intent == "优惠":
            response_text = "您好，当前平台正在进行限时优惠活动，部分商品享受折扣。您可以浏览商品列表查看优惠信息，或者告诉我您感兴趣的商品类型，我可以为您推荐性价比高的商品。"
            
        else:
            response_text = f"您好，我已收到您的咨询：{user_message}。请问您需要了解哪方面的信息？比如：\n1. 商品推荐\n2. 价格优惠\n3. 商品功能特点\n\n请告诉我您的具体需求，我会尽力帮助您！"

        return response_text

    def get_ai_response(self, user, message):
        """获取 AI 导购的响应（旧方法，保持兼容）"""
        tags = self._get_user_profile_tags(user)
        response = self._simulate_llm_response(message, tags)
        return response

    def get_ai_response_with_products(self, user, message, conversation_history=None):
        """
        获取 AI 导购的响应并推荐商品
        返回: (响应文本, 推荐商品列表)
        """
        tags = self._get_user_profile_tags(user)
        keywords = self._extract_keywords(message)
        
        # 根据关键词和用户消息搜索商品
        products = Product.objects.all()
        
        # 关键词过滤
        if keywords:
            from django.db.models import Q
            q_objects = Q()
            for keyword in keywords:
                q_objects |= Q(name__icontains=keyword) | Q(category__icontains=keyword) | Q(description__icontains=keyword)
            products = products.filter(q_objects)
        
        # 如果没有关键词，从消息中提取
        if not keywords and message:
            # 尝试从消息中提取商品类型
            message_lower = message.lower()
            if '耳机' in message or 'earphone' in message_lower:
                products = products.filter(Q(name__icontains='耳机') | Q(category='数码配件'))
            elif '充电' in message or 'charger' in message_lower:
                products = products.filter(Q(name__icontains='充电') | Q(category='数码配件'))
            elif '手环' in message or 'watch' in message_lower:
                products = products.filter(Q(name__icontains='手环') | Q(category='智能穿戴'))
            elif '键盘' in message or 'keyboard' in message_lower:
                products = products.filter(Q(name__icontains='键盘') | Q(category='电脑外设'))
            elif '鼠标' in message or 'mouse' in message_lower:
                products = products.filter(Q(name__icontains='鼠标') | Q(category='电脑外设'))
            elif '音箱' in message or 'speaker' in message_lower:
                products = products.filter(Q(name__icontains='音箱') | Q(category='智能家居'))
        
        # 按潜力评分和销量排序
        recommended_products = products.order_by('-potential_score', '-sales_count', '-rating')[:6]
        
        # 如果还是没有结果，推荐热门商品
        if not recommended_products:
            recommended_products = Product.objects.filter(stock__gt=0).order_by('-sales_count', '-rating')[:6]
        
        # 生成响应文本
        response_text = self._simulate_llm_response(message, tags, recommended_products)
        
        return response_text, list(recommended_products)

    def call_external_llm(self, user_message, conversation_history=None, user=None):
        """
        调用外部 LLM（lovable gateway）。
        失败时降级到本地模拟。
        返回: (ai_response_text, recommended_products_list)
        """
        api_key = os.environ.get('LOVABLE_API_KEY') or os.environ.get('LLM_API_KEY')
        
        if not api_key:
            # API key 未配置，使用本地模拟
            print("[AIGuideService] LLM API key not configured, using local simulation")
            return self.get_ai_response_with_products(user, user_message, conversation_history)
        
        try:
            # 从 DB 获取推荐商品（用于上下文）
            keywords = self._extract_keywords(user_message)
            products = Product.objects.all()
            
            if keywords:
                from django.db.models import Q
                q_objects = Q()
                for keyword in keywords:
                    q_objects |= Q(name__icontains=keyword) | Q(category__icontains=keyword)
                products = products.filter(q_objects)
            
            recommended_products = products.order_by('-potential_score', '-sales_count')[:6]
            if not recommended_products:
                recommended_products = Product.objects.filter(stock__gt=0).order_by('-sales_count')[:6]
            
            # 构建商品上下文
            products_context = "\n".join([
                f"商品: {p.name}, 价格: ¥{p.price}, 分类: {p.category}, 库存: {p.stock}"
                for p in recommended_products[:10]
            ])
            
            # 构建 system prompt
            system_prompt = f"""你是一个专业的 AI 导购助手。请根据用户的需求提供商品推荐和咨询。

当前可用商品：
{products_context}

请用自然的语言提供帮助，并在回复最后用 JSON 格式列出推荐的商品ID（如果有）。
格式：RECOMMENDED_PRODUCTS: ["id1", "id2"]
"""
            
            # 准备消息列表
            messages = [
                {"role": "user", "content": user_message}
            ]
            
            # 调用 lovable gateway
            url = 'https://ai.gateway.lovable.dev/v1/chat/completions'
            headers = {
                'Authorization': f'Bearer {api_key}',
                'Content-Type': 'application/json',
            }
            payload = {
                'model': 'google/gemini-2.5-flash',
                'messages': [{"role": "system", "content": system_prompt}] + messages,
                'temperature': 0.7,
                'max_tokens': 500,
            }
            
            response = requests.post(url, json=payload, headers=headers, timeout=15)
            response.raise_for_status()
            
            data = response.json()
            ai_message = data.get('choices', [{}])[0].get('message', {}).get('content', '')
            
            # 解析推荐的商品 ID
            recommended_products_data = []
            match = re.search(r'RECOMMENDED_PRODUCTS:\s*(\[.*?\])', ai_message)
            if match:
                try:
                    product_ids = json.loads(match.group(1))
                    recommended_products_data = [
                        p for p in recommended_products if str(p.id) in [str(pid) for pid in product_ids]
                    ][:6]
                except json.JSONDecodeError:
                    pass
            
            # 移除 JSON 标记
            clean_message = re.sub(r'RECOMMENDED_PRODUCTS:\s*\[.*?\]', '', ai_message).strip()
            
            return clean_message, recommended_products_data
        
        except requests.exceptions.RequestException as e:
            print(f"[AIGuideService] LLM API call failed: {e}, falling back to local simulation")
            return self.get_ai_response_with_products(user, user_message, conversation_history)
        except Exception as e:
            print(f"[AIGuideService] Unexpected error in call_external_llm: {e}")
            return self.get_ai_response_with_products(user, user_message, conversation_history)