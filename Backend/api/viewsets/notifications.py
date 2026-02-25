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
        return Notification.objects.filter(to_user=self.request.user)

    @action(detail=True, methods=['post'])
    def read(self, request, pk=None):
        instance = self.get_object()
        instance.read = True
        instance.save()
        return Response(status=status.HTTP_200_OK)
