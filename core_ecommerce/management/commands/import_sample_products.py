"""
Django管理命令：导入示例商品数据
使用方法: python manage.py import_sample_products
"""
from django.core.management.base import BaseCommand
from core_ecommerce.models import Product
import random


class Command(BaseCommand):
    help = '导入示例商品数据到数据库'

    def generate_products(self):
        """生成100条商品数据"""
        categories = {
            '数码配件': [
                ('智能蓝牙耳机', 150, 500, 'https://images.unsplash.com/photo-1590658268037-6bf12165a8df?w=800'),
                ('无线充电器', 80, 300, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800'),
                ('手机保护壳', 30, 150, 'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=800'),
                ('数据线', 25, 100, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800'),
                ('移动电源', 100, 400, 'https://images.unsplash.com/photo-1609091839311-d5365f9ff1c7?w=800'),
                ('手机支架', 20, 80, 'https://images.unsplash.com/photo-1601972602237-8c79241e468b?w=800'),
                ('车载充电器', 50, 200, 'https://images.unsplash.com/photo-1601784551446-20c9e07cdbdb?w=800'),
                ('蓝牙适配器', 60, 180, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800'),
            ],
            '智能穿戴': [
                ('智能手环', 150, 400, 'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=800'),
                ('智能手表', 500, 2000, 'https://images.unsplash.com/photo-1523275335684-37898b6baf30?w=800'),
                ('运动耳机', 200, 600, 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=800'),
                ('智能眼镜', 800, 2500, 'https://images.unsplash.com/photo-1572635196237-14b3f281503f?w=800'),
                ('健康监测器', 300, 800, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800'),
                ('运动手环', 120, 350, 'https://images.unsplash.com/photo-1557438159-51eec7a6c9e8?w=800'),
            ],
            '电脑外设': [
                ('机械键盘', 300, 800, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800'),
                ('无线鼠标', 80, 300, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800'),
                ('游戏鼠标', 200, 600, 'https://images.unsplash.com/photo-1527814050087-3793815479db?w=800'),
                ('显示器', 800, 3000, 'https://images.unsplash.com/photo-1527443224154-c4a3942d3acf?w=800'),
                ('键盘鼠标套装', 150, 500, 'https://images.unsplash.com/photo-1595225476474-87563907a212?w=800'),
                ('USB扩展坞', 100, 400, 'https://images.unsplash.com/photo-1587825140708-dfaf72ae4b04?w=800'),
                ('摄像头', 200, 800, 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800'),
                ('麦克风', 150, 600, 'https://images.unsplash.com/photo-1590602847861-f357a9332bbc?w=800'),
                ('音响', 300, 1200, 'https://images.unsplash.com/photo-1608043152269-423dbba4e7e1?w=800'),
                ('游戏手柄', 200, 500, 'https://images.unsplash.com/photo-1606144042614-b2417e99c4e3?w=800'),
            ],
            '智能家居': [
                ('智能音箱', 200, 600, 'https://images.unsplash.com/photo-1589492477829-5e65395b66cc?w=800'),
                ('智能灯泡', 50, 200, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
                ('智能插座', 60, 250, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
                ('智能门锁', 500, 1500, 'https://images.unsplash.com/photo-1600063296531-28d2c8e8e0a0?w=800'),
                ('智能摄像头', 200, 800, 'https://images.unsplash.com/photo-1606983340126-99ab4feaa64a?w=800'),
                ('空气净化器', 400, 1500, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'),
                ('智能窗帘', 300, 1000, 'https://images.unsplash.com/photo-1586023492125-27b2c045efd7?w=800'),
                ('智能开关', 80, 300, 'https://images.unsplash.com/photo-1558618666-fcd25c85cd64?w=800'),
            ],
            '生活用品': [
                ('保温杯', 50, 200, 'https://images.unsplash.com/photo-1602143407151-7111542de6e8?w=800'),
                ('电动牙刷', 100, 400, 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=800'),
                ('加湿器', 150, 500, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'),
                ('台灯', 80, 300, 'https://images.unsplash.com/photo-1507473885765-e6ed057f782c?w=800'),
                ('电风扇', 100, 400, 'https://images.unsplash.com/photo-1585771724684-38269d6639fd?w=800'),
                ('体重秤', 80, 300, 'https://images.unsplash.com/photo-1559757148-5c350d0d3c56?w=800'),
            ],
        }
        
        products = []
        product_num = 1
        
        for category, items in categories.items():
            for name_template, min_price, max_price, image_url in items:
                for variant in range(1, 4):  # 每个商品生成3个变体
                    price = random.randint(min_price, max_price)
                    original_price = price + random.randint(50, 200) if random.random() > 0.3 else None
                    rating = round(random.uniform(4.0, 5.0), 1)
                    sales = random.randint(1000, 20000)
                    stock = random.randint(50, 500)
                    potential_score = round(random.uniform(75.0, 95.0), 1)
                    
                    name = f'{name_template}'
                    if variant > 1:
                        variants = ['Pro版', '标准版', '青春版', '旗舰版', '经典版']
                        name = f'{name_template} {variants[variant-1]}'
                    
                    products.append({
                        'name': name,
                        'sku': f'PROD-{product_num:03d}',
                        'price': float(price),
                        'original_price': float(original_price) if original_price else None,
                        'stock': stock,
                        'category': category,
                        'description': f'高品质{name}，性能卓越，值得信赖。',
                        'image_url': image_url,
                        'rating': rating,
                        'sales_count': sales,
                        'potential_score': potential_score,
                        'selection_reason': f'AI推荐：{category}类产品，评分{rating}分，销量{sales}件',
                    })
                    product_num += 1
                    
                    if product_num > 100:
                        break
                if product_num > 100:
                    break
            if product_num > 100:
                break
        
        return products[:100]

    def handle(self, *args, **options):
        sample_products = self.generate_products()

        created_count = 0
        updated_count = 0

        for product_data in sample_products:
            sku = product_data.pop('sku')
            product, created = Product.objects.update_or_create(
                sku=sku,
                defaults=product_data
            )
            if created:
                created_count += 1
                self.stdout.write(
                    self.style.SUCCESS(f'✓ 创建商品: {product.name}')
                )
            else:
                updated_count += 1
                self.stdout.write(
                    self.style.WARNING(f'↻ 更新商品: {product.name}')
                )

        self.stdout.write(
            self.style.SUCCESS(
                f'\n完成！创建 {created_count} 个商品，更新 {updated_count} 个商品'
            )
        )

