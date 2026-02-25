
import gspread
from oauth2client.service_account import ServiceAccountCredentials
from django.conf import settings
from api.models import StudentSubmission, FormLink
import os

def get_gspread_client():
    scope = ['https://spreadsheets.google.com/feeds', 'https://www.googleapis.com/auth/drive']
    creds_path = os.path.join(settings.BASE_DIR, 'credentials.json')
    
    if not os.path.exists(creds_path):
        # Fallback or error
        raise Exception(f"Credentials file not found at {creds_path}")
        
    creds = ServiceAccountCredentials.from_json_keyfile_name(creds_path, scope)
    client = gspread.authorize(creds)
    return client

def sync_sheet_data(sheet_url, form_link_id):
    try:
        client = get_gspread_client()
        sheet = client.open_by_url(sheet_url)
        worksheet = sheet.get_worksheet(0)
        records = worksheet.get_all_records()
        
        link = FormLink.objects.get(id=form_link_id)
        
        synced_count = 0
        updated_count = 0
        
        for record in records:
            nic = record.get('NIC') or record.get('nic')
            email = record.get('Email Address') or record.get('Email')
            
            if not nic:
                continue

            # Basic mapping - adjust keys as per actual Google Form headers
            student_data = {
                'full_name': record.get('Full Name', ''),
                'initials_name': record.get('Name with Initials', ''),
                'gender': record.get('Gender', ''),
                'email': email,
                'contact_number': record.get('Contact Number', ''),
                'permanent_address': record.get('Permanent Address', ''),
                'student_reg_no': record.get('Student Registration Number', '') or record.get('Reg No', ''),
                'degree_nvq_level': record.get('Degree/NVQ Level', ''),
                'degree_diploma_name': record.get('Degree/Diploma Name', ''),
                'training_establishment': record.get('Training Establishment', ''),
                'training_address': record.get('Training Address', ''),
                'officer_in_charge': record.get('Officer in Charge', ''),
                'training_duration': record.get('Training Duration', ''),
                'field_of_training': record.get('Field of Training', ''),
                'training_district': record.get('Training District', '')
            }
            
            # TODO: robust date parsing if needed
            
            obj, created = StudentSubmission.objects.update_or_create(
                nic=nic,
                defaults={
                    **student_data,
                    'form_link': link,
                    'university': link.university,
                    'subject': link.subject,
                    'batch_year': link.batch_year,
                    'district': link.district
                }
            )
            
            if created:
                synced_count += 1
            else:
                updated_count += 1
                
        return {'synced': synced_count, 'updated': updated_count}
        
    except Exception as e:
        return {'error': str(e)}
