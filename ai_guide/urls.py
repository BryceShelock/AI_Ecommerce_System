# ai_guide/urls.py

from django.urls import path
from . import views

urlpatterns = [
    path('chat/', views.ai_chat_api, name='ai_chat_api'), # AI 导购聊天 API
]