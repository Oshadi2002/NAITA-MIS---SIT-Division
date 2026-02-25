
import os
import django
import sys
import csv
from io import StringIO

# Setup Django Environment
sys.path.append('e:\\07 - Copy (2)\\SIT\\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User
from django.test import RequestFactory
from api.viewsets.student_data import StudentSubmissionViewSet

def test_csv_export():
    # Ensure we have an admin user
    admin_user = User.objects.filter(role='ADMIN').first()
    if not admin_user:
        print("No Admin user found to test with.")
        return

    print(f"Testing CSV Export with Admin: {admin_user.username}")
    
    factory = RequestFactory()
    request = factory.get('/api/student-submissions/export_csv/')
    request.user = admin_user
    
    view = StudentSubmissionViewSet()
    view.request = request
    view.format_kwarg = None
    
    response = view.export_csv(request)
    
    if response.status_code == 200:
        print("Export CSV Call Successful (200 OK)")
        content = response.content.decode('utf-8')
        lines = content.splitlines()
        print(f"Total Rows (including header): {len(lines)}")
        if len(lines) > 0:
            print(f"Header: {lines[0]}")
            if len(lines) > 1:
                print(f"First Row: {lines[1][:100]}...") # truncate for display
    else:
        print(f"Export Failed: {response.status_code}")

if __name__ == "__main__":
    test_csv_export()
