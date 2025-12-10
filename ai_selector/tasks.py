from celery import shared_task
from .selector_service import AISelectionService


@shared_task
def run_ai_selection():
    """Run the AI selection service and return number of recommended products."""
    service = AISelectionService()
    recommended = service.generate_selection_recommendations()
    # Optionally, return ids or count
    try:
        return {'count': len(list(recommended))}
    except Exception:
        return {'count': 0}
