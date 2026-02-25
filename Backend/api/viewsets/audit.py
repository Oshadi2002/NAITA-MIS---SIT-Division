from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import DataEditRequest, AuditLog, StudentSubmission
from ..serializers import DataEditRequestSerializer, AuditLogSerializer
from django.utils import timezone

class DataEditRequestViewSet(viewsets.ModelViewSet):
    serializer_class = DataEditRequestSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return DataEditRequest.objects.all().order_by('-created_at')
        elif user.role == 'UNIVERSITY_COORDINATOR':
            # See requests they made OR requests for their university's students
            return DataEditRequest.objects.filter(requested_by=user).order_by('-created_at')
        return DataEditRequest.objects.none()

    def perform_create(self, serializer):
        serializer.save(requested_by=self.request.user, status='PENDING')

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Only Admins can approve requests.'}, status=status.HTTP_403_FORBIDDEN)
            
        edit_request = self.get_object()
        if edit_request.status != 'PENDING':
             return Response({'detail': 'Request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)

        # Apply changes
        student = edit_request.student
        changes = edit_request.changes
        
        # Log before applying
        old_data_snapshot = {k: getattr(student, k) for k in changes.keys() if hasattr(student, k)}
        
        for field, change_data in changes.items():
            # change_data is expected to be {'old': ..., 'new': ...} or just 'new' value depending on frontend
            # Let's assume frontend sends { "field": { "old": "...", "new": "..." } } matches our model doc
            # But actual apply needs new value.
            new_val = change_data.get('new')
            if hasattr(student, field):
                setattr(student, field, new_val)
        
        student.save()
        
        edit_request.status = 'APPROVED'
        edit_request.admin_comment = request.data.get('admin_comment', '')
        edit_request.save()

        # Create Audit Log
        AuditLog.objects.create(
            target_model='StudentSubmission',
            target_object_id=str(student.id),
            action='APPROVE_EDIT',
            performed_by=request.user,
            details={
                'edit_request_id': edit_request.id,
                'changes': changes,
                'original_values': old_data_snapshot
            }
        )

        return Response({'status': 'approved'})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({'detail': 'Only Admins can reject requests.'}, status=status.HTTP_403_FORBIDDEN)
            
        edit_request = self.get_object()
        if edit_request.status != 'PENDING':
             return Response({'detail': 'Request is not pending.'}, status=status.HTTP_400_BAD_REQUEST)
             
        edit_request.status = 'REJECTED'
        edit_request.admin_comment = request.data.get('admin_comment', '')
        edit_request.save()
        
        return Response({'status': 'rejected'})

class AuditLogViewSet(viewsets.ReadOnlyModelViewSet):
    serializer_class = AuditLogSerializer
    permission_classes = [permissions.IsAuthenticated]

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ADMIN':
            return AuditLog.objects.all().order_by('-timestamp')
        return AuditLog.objects.none()
