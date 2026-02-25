from django.core.management.base import BaseCommand
from api.services.google_sheets import sync_sheet_data

class Command(BaseCommand):
    help = 'Sync data from Google Sheet to StudentSubmission'

    def add_arguments(self, parser):
        parser.add_argument('sheet_url', type=str, help='URL of the Google Sheet')
        parser.add_argument('form_link_id', type=str, help='ID of the FormLink')

    def handle(self, *args, **kwargs):
        sheet_url = kwargs['sheet_url']
        link_id = kwargs['form_link_id']
        
        self.stdout.write(f"Starting sync for link {link_id}...")
        
        result = sync_sheet_data(sheet_url, link_id)
        
        if 'error' in result:
             self.stdout.write(self.style.ERROR(f"Sync failed: {result['error']}"))
        else:
             self.stdout.write(self.style.SUCCESS(f"Sync completed: {result}"))
