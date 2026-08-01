from rest_framework import viewsets, status, permissions
from rest_framework.response import Response
from rest_framework.decorators import action
from api.models import NovationRequest, StudentSubmission
from api.serializers import NovationRequestSerializer
from .base import CsrfExemptSessionAuthentication

class NovationRequestViewSet(viewsets.ModelViewSet):
    serializer_class = NovationRequestSerializer
    authentication_classes = (CsrfExemptSessionAuthentication,)
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
    def mark_as_read(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Admin can mark as read"}, status=status.HTTP_403_FORBIDDEN)
        
        novation = self.get_object()
        novation.is_read_by_admin = True
        novation.save()
        return Response({"status": "marked as read"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def approve(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Admin can approve requests"}, status=status.HTTP_403_FORBIDDEN)
        
        novation = self.get_object()
        novation.status = 'APPROVED'
        
        # Admin can provide a comment or upload the form during approval
        comment = request.data.get('admin_comment')
        if comment:
            novation.admin_comment = comment
            
        if 'admin_novation_form' in request.FILES:
            novation.admin_novation_form = request.FILES['admin_novation_form']
            
        novation.save()
        
        # Update StudentSubmission with second training details
        student = novation.student
        
        if novation.training_phase == 'PHASE_1':
            student.has_second_placement = True
            student.second_training_establishment = novation.requested_work_site
            student.second_training_address = novation.new_training_address
            student.second_training_district = novation.new_training_district
            student.second_divisional_secretariat = novation.new_divisional_secretariat
            student.second_officer_in_charge = novation.new_officer_in_charge
            student.second_officer_in_charge_contact = novation.new_officer_in_charge_contact
            student.second_training_start_date = novation.new_training_start_date
            student.second_training_end_date = novation.new_training_end_date
            student.second_training_duration = novation.new_training_duration
            student.second_field_of_training = novation.new_field_of_training
            if novation.admin_novation_form:
                student.second_placement_form = novation.admin_novation_form
        else:
            student.has_phase2_second_placement = True
            student.phase2_second_training_establishment = novation.requested_work_site
            student.phase2_second_training_address = novation.new_training_address
            student.phase2_second_training_district = novation.new_training_district
            student.phase2_second_divisional_secretariat = novation.new_divisional_secretariat
            student.phase2_second_officer_in_charge = novation.new_officer_in_charge
            student.phase2_second_officer_in_charge_contact = novation.new_officer_in_charge_contact
            student.phase2_second_training_start_date = novation.new_training_start_date
            student.phase2_second_training_end_date = novation.new_training_end_date
            student.phase2_second_training_duration = novation.new_training_duration
            student.phase2_second_field_of_training = novation.new_field_of_training
            if novation.admin_novation_form:
                student.phase2_second_placement_form = novation.admin_novation_form
            
        student.save()
        
        return Response({"status": "approved"})

    @action(detail=True, methods=['post'], permission_classes=[permissions.IsAuthenticated])
    def reject(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response({"error": "Only Admin can reject requests"}, status=status.HTTP_403_FORBIDDEN)
        
        novation = self.get_object()
        novation.status = 'REJECTED'
        
        comment = request.data.get('admin_comment')
        if comment:
            novation.admin_comment = comment
            
        novation.save()
        
        return Response({"status": "rejected"})
