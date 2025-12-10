# ecommerce_ai_system/settings.py

import os
from pathlib import Path
from os import getenv
from dotenv import load_dotenv  # 如果使用 python-dotenv

# 加载 .env 文件（如果存在）
load_dotenv(dotenv_path=Path(__file__).resolve().parent / '.env')

SECRET_KEY = getenv('SECRET_KEY', 'django-insecure-your-secret-key-for-demo-purposes')

DEBUG = getenv('DEBUG', 'True').lower() == 'true'

ALLOWED_HOSTS = []

# 添加核心应用和 AI 模块
INSTALLED_APPS = [
    'django.contrib.admin',
    'django.contrib.auth',
    'django.contrib.contenttypes',
    'django.contrib.sessions',
    'django.contrib.messages',
    'django.contrib.staticfiles',
    'corsheaders',
    'rest_framework',
    'core_ecommerce', # 电商核心模块
    'ai_selector',    # AI 选品模块
    'ai_guide',       # AI 导购模块
]

MIDDLEWARE = [
    'corsheaders.middleware.CorsMiddleware',
    # Note: CorsMiddleware should be placed as high as possible
    'django.middleware.security.SecurityMiddleware',
    'django.contrib.sessions.middleware.SessionMiddleware',
    'django.middleware.common.CommonMiddleware',
    'django.middleware.csrf.CsrfViewMiddleware',
    'django.contrib.auth.middleware.AuthenticationMiddleware',
    'django.contrib.messages.middleware.MessageMiddleware',
    'django.middleware.clickjacking.XFrameOptionsMiddleware',
]

ROOT_URLCONF = 'urls'

TEMPLATES = [
    {
        'BACKEND': 'django.template.backends.django.DjangoTemplates',
        'DIRS': [os.path.join(BASE_DIR, 'templates')], # 全局模板目录
        'APP_DIRS': True,
        'OPTIONS': {
            'context_processors': [
                'django.template.context_processors.debug',
                'django.template.context_processors.request',
                'django.contrib.auth.context_processors.auth',
                'django.contrib.messages.context_processors.messages',
            ],
        },
    },
]

WSGI_APPLICATION = 'wsgi.application'

# 数据库配置（使用默认 SQLite 即可用于 Demo）
DATABASES = {
    'default': {
        'ENGINE': 'django.db.backends.sqlite3',
        'NAME': BASE_DIR / 'db.sqlite3',
    }
}

# 国际化/多语言配置
LANGUAGE_CODE = 'zh-Hans' # 中文
TIME_ZONE = 'Asia/Shanghai' 
USE_I18N = True
USE_TZ = True

STATIC_URL = 'static/'

DEFAULT_AUTO_FIELD = 'django.db.models.BigAutoField'

# CORS (开发环境) - 允许前端本地开发时跨域访问 API，生产环境请配置为受限域名
CORS_ALLOW_ALL_ORIGINS = True

# Django REST Framework 配置
REST_FRAMEWORK = {
    'DEFAULT_PAGINATION_CLASS': 'rest_framework.pagination.PageNumberPagination',
    'PAGE_SIZE': 20,
    'DEFAULT_PERMISSION_CLASSES': [
        'rest_framework.permissions.AllowAny',  # 开发环境允许所有访问
    ],
    'DEFAULT_RENDERER_CLASSES': [
        'rest_framework.renderers.JSONRenderer',
    ],
}

# AI 模块配置（此处使用占位符，实际应配置您的智谱/讯飞或其他大模型 API Key）
# AI_CONFIG = {
#     "ZHIPU_API_KEY": "你的智谱API密钥", 
#     "SPARK_AI_APP_ID": "你的讯飞APP_ID",
#     # ... 其他配置
# }

# Celery (默认使用本地 Redis，若需要改为其他 Broker，请在环境变量 CELERY_BROKER_URL 中设置)
CELERY_BROKER_URL = os.environ.get('CELERY_BROKER_URL', 'redis://localhost:6379/0')
CELERY_RESULT_BACKEND = os.environ.get('CELERY_RESULT_BACKEND', CELERY_BROKER_URL)