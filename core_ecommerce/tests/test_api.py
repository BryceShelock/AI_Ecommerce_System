from django.test import TestCase, Client
from django.urls import reverse
from django.contrib.auth.models import User
from core_ecommerce.models import Product
from django.core.files.uploadedfile import SimpleUploadedFile

class ProductImportAPITest(TestCase):
    def setUp(self):
        self.client = Client()
        # create a staff user and login
        self.user = User.objects.create_user(username='admin', password='pass')
        self.user.is_staff = True
        self.user.save()
        self.client.login(username='admin', password='pass')

    def test_import_csv_creates_products(self):
        csv_content = 'name,sku,price,stock,category\nTest Product,SKU-001,12.50,10,TestCat\n'
        upload = SimpleUploadedFile('products.csv', csv_content.encode('utf-8'), content_type='text/csv')
        resp = self.client.post(reverse('api_product_import'), {'file': upload})
        self.assertEqual(resp.status_code, 200)
        data = resp.json()
        # created or updated counts should be present
        self.assertIn('created', data)
        # product exists
        self.assertTrue(Product.objects.filter(sku='SKU-001').exists())
