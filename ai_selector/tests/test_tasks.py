from django.test import TestCase
from core_ecommerce.models import Product
from ai_selector.tasks import run_ai_selection

class AISelectionTaskTest(TestCase):
    def setUp(self):
        # create some products
        Product.objects.create(name='P1', sku='P1', price=10.0, stock=10, category='母婴玩具')
        Product.objects.create(name='P2', sku='P2', price=20.0, stock=5, category='电子产品')

    def test_run_ai_selection_updates_scores(self):
        result = run_ai_selection()
        # result should be a dict with count key
        self.assertIsInstance(result, dict)
        self.assertIn('count', result)
        self.assertGreaterEqual(result['count'], 0)
        # check that products have potential_score set
        p1 = Product.objects.get(sku='P1')
        self.assertIsNotNone(p1.potential_score)
