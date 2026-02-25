from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import User, SeminarRequest, Notification
from ..serializers import SeminarRequestSerializer, NotificationSerializer
from .base import CsrfExemptSessionAuthentication
from django.utils import timezone

class SeminarRequestViewSet(viewsets.ModelViewSet):
    serializer_class = SeminarRequestSerializer
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return SeminarRequest.objects.all()
        elif user.role == 'INSPECTOR':
            return SeminarRequest.objects.filter(assigned_inspector=user)
        return SeminarRequest.objects.filter(coordinator=user)

    def perform_create(self, serializer):
        user = self.request.user
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        history = [{
            'status': 'PENDING',
            'date': timezone.now().isoformat(),
            'by': full_name
        }]
        serializer.save(
            coordinator=user,
            coordinator_name=user.username,
            university_name=user.university or 'Unknown University',
            status_history=history
        )

    @action(detail=True, methods=['patch'])
    def status(self, request, pk=None):
        instance = self.get_object()
        new_status = request.data.get('status')
        note = request.data.get('note')
        
        user = request.user
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        
        history = instance.status_history
        history.append({
            'status': new_status,
            'date': timezone.now().isoformat(),
            'by': full_name,
            'note': note
        })
        
        instance.status = new_status
        instance.status_history = history
        instance.save()
        
        if new_status in ['APPROVED', 'NEED_CHANGES']:
            Notification.objects.create(
                to_user=instance.coordinator,
                title='Request Approved' if new_status == 'APPROVED' else 'Action Required',
                message='Your seminar request has been approved.' if new_status == 'APPROVED' else f'Your request needs changes: {note}'
            )

        return Response(SeminarRequestSerializer(instance).data)

    @action(detail=True, methods=['post'])
    def assign(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        inspector_id = request.data.get('inspectorId')
        inspector = User.objects.get(id=inspector_id)
        
        instance.assigned_inspector = inspector
        instance.assigned_inspector_name = inspector.username
        instance.save()
        
        Notification.objects.create(
            to_user=inspector,
            title='New Assignment',
            message='You have been assigned to a seminar.'
        )
        
        return Response(SeminarRequestSerializer(instance).data)

    @action(detail=True, methods=['patch'])
    def date(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        instance.final_date = request.data.get('date')
        instance.save()
        return Response(SeminarRequestSerializer(instance).data)

    @action(detail=True, methods=['post'])
    def complete(self, request, pk=None):
        if request.user.role != 'INSPECTOR':
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        instance = self.get_object()
        message = request.data.get('message')
        
        user = request.user
        full_name = f"{user.first_name} {user.last_name}".strip() or user.username
        
        history = instance.status_history
        history.append({
            'status': 'COMPLETED',
            'date': timezone.now().isoformat(),
            'by': full_name,
            'note': 'Seminar completed.'
        })
        
        instance.status = 'COMPLETED'
        instance.status_history = history
        instance.inspector_report = {
            'message': message,
            'completedAt': timezone.now().isoformat()
        }
        instance.save()
        
        Notification.objects.create(
            to_user=instance.coordinator,
            title='Seminar Completed',
            message='The seminar has been marked as completed.'
        )
        
        return Response(SeminarRequestSerializer(instance).data)

    @action(detail=False, methods=['post'], url_path='send-google-form')
    def send_google_form(self, request):
        from django.core.mail import send_mail
        from django.conf import settings

        user = request.user
        coordinator_email = getattr(settings, 'UNIVERSITY_COORDINATOR_EMAIL', None)
        google_form_url = getattr(settings, 'GOOGLE_FORM_URL', None)

        if not coordinator_email or not google_form_url:
            return Response(
                {'error': 'System configuration error. Missing coordinator email or form URL.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        subject = f"Google Form Link Request from {user.username}"
        message = f"""
        User {user.username} ({user.email}) has requested to submit via Google Form.
        
        Please find the Google Form link below:
        {google_form_url}
        
        You may forward this link to the student or use it as required.
        """
        
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'noreply@example.com',
                [coordinator_email],
                fail_silently=False,
            )
            return Response({'message': 'Email sent successfully to the coordinator.'})
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
