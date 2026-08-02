from django.core.management.base import BaseCommand
from api.models import User, SeminarRequest
import datetime

class Command(BaseCommand):
    help = 'Seeds initial data'

    def handle(self, *args, **kwargs):
        users_data = [
            {
                'username': 'yasirunimsara23@gmail.com',
                'email': 'yasirunimsara23@gmail.com',
                'password': 'rathna2002',
                'role': 'ADMIN',
                'first_name': 'Yasiru',
                'last_name': 'Nimsara',
                'is_superuser': True,
                'is_staff': True,
            },
            {
                'username': 'shalanka@gmail.com',
                'email': 'shalanka@gmail.com',
                'password': 'Chabby02',
                'role': 'UNIVERSITY_COORDINATOR',
                'university': 'Colombo University',
                'first_name': 'Shalanka',
                'last_name': 'Coordinator',
            },
            {
                'username': 'iresha@gmail.com',
                'email': 'iresha@gmail.com',
                'password': '12345',
                'role': 'INSPECTOR',
                'first_name': 'Iresha',
                'last_name': 'Inspector',
            },
        ]

        for u_info in users_data:
            username = u_info['username']
            email = u_info['email']
            password = u_info['password']
            role = u_info['role']

            user = User.objects.filter(username=username).first()
            if not user:
                user = User.objects.filter(email=email).first()

            if not user:
                user = User(username=username, email=email, role=role)

            user.role = role
            user.first_name = u_info.get('first_name', '')
            user.last_name = u_info.get('last_name', '')
            user.university = u_info.get('university', '')
            if u_info.get('is_superuser'):
                user.is_superuser = True
                user.is_staff = True
            user.set_password(password)
            user.save()
            self.stdout.write(self.style.SUCCESS(f"Configured user: {user.username} ({user.role})"))

        # Seed initial request if none exist
        coord = User.objects.filter(role='UNIVERSITY_COORDINATOR').first()

        if SeminarRequest.objects.count() == 0 and coord:
            SeminarRequest.objects.create(
                coordinator=coord,
                coordinator_name=coord.username,
                university_name=getattr(coord, 'university', 'Colombo University'),
                student_count=150,
                preferred_dates=['2025-06-15T10:00:00Z', '2025-06-20T14:00:00Z'],
                location='Main Auditorium, Colombo',
                notes='We need a projector setup.',
                status='PENDING',
                status_history=[{
                    'status': 'PENDING',
                    'date': datetime.datetime.now().isoformat(),
                    'by': coord.username
                }]
            )

        self.stdout.write(self.style.SUCCESS('Successfully seeded requested users and data!'))
