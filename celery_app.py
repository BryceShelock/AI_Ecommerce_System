import os
from celery import Celery

# Set default Django settings module for the 'celery' program.
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'settings')

app = Celery('ecommerce_ai_system')

# Using a string here means the worker doesn't have to serialize
# the configuration object to child processes.
app.config_from_object('django.conf:settings', namespace='CELERY')

# Load task modules from all registered Django app configs.
app.autodiscover_tasks()

# Simple beat schedule: run AI selection periodically (every 15 minutes)
app.conf.beat_schedule = {
    'run-ai-selection-every-15-min': {
        'task': 'ai_selector.tasks.run_ai_selection',
        'schedule': 60 * 15,
    },
}


@app.task(bind=True)
def debug_task(self):
    print(f'Request: {self.request!r}')
