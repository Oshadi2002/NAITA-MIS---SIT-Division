from django.core.management.base import BaseCommand
from api.models import User, SeminarRequest
import datetime

class Command(BaseCommand):
    help = 'Seeds initial data'

    def handle(self, *args, **kwargs):
        if User.objects.count() == 0:
            admin = User.objects.create_superuser(
                username='admin@system.com',
                email='admin@system.com',
                password='password',
                role='ADMIN',
                first_name='Admin',
                last_name='User'
            )
            
            john = User.objects.create_user(
                username='john@inspector.com',
                email='john@inspector.com',
                password='password',
                role='INSPECTOR',
                first_name='John',
                last_name='Inspector'
            )
            
            sarah = User.objects.create_user(
                username='sarah@inspector.com',
                email='sarah@inspector.com',
                password='password',
                role='INSPECTOR',
                first_name='Sarah',
                last_name='Inspector'
            )
            
            colombo = User.objects.create_user(
                username='colombo@uni.com',
                email='colombo@uni.com',
                password='password',
                role='UNIVERSITY_COORDINATOR',
                university='Colombo University',
                first_name='Colombo',
                last_name='University Coord'
            )
            
            kandy = User.objects.create_user(
                username='kandy@uni.com',
                email='kandy@uni.com',
                password='password',
                role='UNIVERSITY_COORDINATOR',
                university='Kandy University',
                first_name='Kandy',
                last_name='University Coord'
            )

            # Seed requests
            SeminarRequest.objects.create(
                coordinator=colombo,
                coordinator_name=colombo.username,
                university_name='Colombo University',
                student_count=150,
                preferred_dates=['2025-06-15T10:00:00Z', '2025-06-20T14:00:00Z'],
                location='Main Auditorium, Colombo',
                notes='We need a projector setup.',
                status='PENDING',
                status_history=[{
                    'status': 'PENDING',
                    'date': datetime.datetime.now().isoformat(),
                    'by': colombo.username
                }]
            )

            SeminarRequest.objects.create(
                coordinator=colombo,
                coordinator_name=colombo.username,
                university_name='Colombo University',
                student_count=80,
                preferred_dates=['2025-07-01T09:00:00Z'],
                location='Science Hall B',
                status='APPROVED',
                final_date=datetime.datetime(2025, 7, 1, 9, 0),
                assigned_inspector=john,
                assigned_inspector_name=john.username,
                status_history=[
                    {'status': 'PENDING', 'date': '2025-05-01T10:00:00Z', 'by': colombo.username},
                    {'status': 'APPROVED', 'date': '2025-05-02T11:00:00Z', 'by': admin.username, 'note': 'Date confirmed.'}
                ]
            )

            self.stdout.write(self.style.SUCCESS('Successfully seeded data'))
        else:
            self.stdout.write('Data already exists')
