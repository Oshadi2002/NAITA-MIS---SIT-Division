
import os
import django
import sys

# Setup Django Environment
sys.path.append('e:\\07 - Copy (2)\\SIT\\Backend')
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'core.settings')
django.setup()

from api.models import User, StudentSubmission

def test_manual_creation():
    # Ensure we have an admin user
    admin_user = User.objects.filter(role='ADMIN').first()
    if not admin_user:
        print("No Admin user found to test with.")
        return

    print(f"Testing with Admin user: {admin_user.username}")

    # Mock request data
    data = {
        'full_name': 'TEST ADMIN CREATED STUDENT',
        'initials_name': 'T.A.C. Student',
        'nic': '999999999V',
        'email': 'testadminstudent@example.com',
        'contact_number': '0771234567',
        'permanent_address': '123 Admin Lane',
        'university': 'Test University',
        'subject': 'Test Subject',
        'batch_year': '2024',
        'district': 'Colombo',
        'student_reg_no': 'ADM/001',
        'degree_nvq_level': 'Degree',
        'degree_diploma_name': 'BSc Test',
        'training_establishment': 'Test Corp',
        'training_address': '456 Corp Rd',
        'training_district': 'Colombo',
        'divisional_secretariat': 'Colombo',
        'officer_in_charge': 'Mr. Manager',
        'field_of_training': 'IT',
        'training_start_date': '2024-01-01',
        'training_end_date': '2024-06-30',
        'training_duration': '6 Months'
    }

    # Simulate what the ViewSet does manually since we are in script
    # Ideally we'd test via APIClient but this is quick model check
    
    try:
        submission = StudentSubmission.objects.create(
            form_link=None, # Explicitly None
            **data
        )
        print(f"Successfully created submission ID: {submission.id}")
        print(f"Form Link: {submission.form_link}")
        
        # Clean up
        submission.delete()
        print("Test submission deleted.")
        
    except Exception as e:
        print(f"Creation failed: {e}")

if __name__ == "__main__":
    test_manual_creation()
