from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from api.models import NovationRequest, StudentSubmission
from api.serializers import NovationRequestSerializer

class NovationRequestViewSet(viewsets.ModelViewSet):
    serializer_class = NovationRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return NovationRequest.objects.all().order_by('-created_at')
        elif user.role == 'UNIVERSITY_COORDINATOR':
            return NovationRequest.objects.filter(coordinator=user).order_by('-created_at')
        return NovationRequest.objects.none()

    def perform_create(self, serializer):
        # Ensure student belongs to coordinator (via logic or just trust for now, better to validate)
        # For now, just save with current user as coordinator
        serializer.save(coordinator=self.request.user)

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Admin can approve requests"}, status=status.HTTP_403_FORBIDDEN)
        
        novation = self.get_object()
        novation.status = 'APPROVED'
        novation.save()
        
        # TODO: Update the StudentSubmission with new details?
        # The requirement didn't specify auto-update, just "Admin should be able to review and approve/reject".
        # Assuming manual update or handled elsewhere for now.
        
        return Response({"status": "approved"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Admin can reject requests"}, status=status.HTTP_403_FORBIDDEN)
        
        novation = self.get_object()
        novation.status = 'REJECTED'
        novation.save()
        
        return Response({"status": "rejected"})
