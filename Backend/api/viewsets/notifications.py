from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import Notification
from ..serializers import NotificationSerializer
from .base import CsrfExemptSessionAuthentication

class NotificationViewSet(viewsets.ModelViewSet):
    serializer_class = NotificationSerializer
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_queryset(self):
        user = getattr(self.request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return Notification.objects.all().order_by('-created_at')
        return Notification.objects.filter(to_user=user).order_by('-created_at')

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        instance = self.get_object()
        instance.read = True
        instance.save()
        return Response(status=status.HTTP_200_OK)
