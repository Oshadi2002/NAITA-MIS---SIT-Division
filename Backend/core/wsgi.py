"""
WSGI config for core project.

It exposes the WSGI callable as a module-level variable named ``application``.

For more information on this file, see
https://docs.djangoproject.com/en/6.0/howto/deployment/wsgi/
"""

import os
from django.core.wsgi import get_wsgi_application

os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')

application = get_wsgi_application()

# Run migrations and seed default data automatically on deployment startup
try:
    from django.core.management import call_command
    call_command('migrate', interactive=False)
    call_command('seed_data', interactive=False)
except Exception as e:
    print("Startup migration/seed error:", e)

app = application


