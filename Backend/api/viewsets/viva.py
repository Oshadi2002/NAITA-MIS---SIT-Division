from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import VivaPanel, VivaAssignment, StudentSubmission, AssessmentMark, AssessorDailyReport
from ..serializers import VivaPanelSerializer, VivaAssignmentSerializer, AssessmentMarkSerializer, AssessorDailyReportSerializer
from ..utils.emails import send_assessor_panel_notification
from django.db.models import Q
from django.utils import timezone
from .base import CsrfExemptSessionAuthentication

class VivaPanelViewSet(viewsets.ModelViewSet):
    queryset = VivaPanel.objects.all()
    serializer_class = VivaPanelSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'UNIVERSITY_COORDINATOR':
            return VivaPanel.objects.all()
        elif user.role == 'ASSESSOR':
            return VivaPanel.objects.filter(assessor=user)
        return VivaPanel.objects.all()

    def perform_create(self, serializer):
        panel = serializer.save()
        if panel.assessor and panel.assessor.email:
            send_assessor_panel_notification(panel.assessor.email, panel.name, panel.dates)

    @action(detail=False, methods=['post'])
    def bulk_assign(self, request):
        """
        Assign multiple students to a panel.
        Expected data: { "panel_id": 1, "student_ids": [1, 2, 3] }
        """
        panel_id = request.data.get('panel_id')
        student_ids = request.data.get('student_ids')
        
        if not panel_id or not student_ids:
            return Response({"error": "panel_id and student_ids are required"}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            panel = VivaPanel.objects.get(id=panel_id)
        except VivaPanel.DoesNotExist:
            return Response({"error": "Panel not found"}, status=status.HTTP_404_NOT_FOUND)
        
        assignments = []
        errors = []
        
        current_count = panel.assignments.count()
        
        for i, student_id in enumerate(student_ids):
            try:
                student = StudentSubmission.objects.get(id=student_id)
                # Check if already assigned
                if VivaAssignment.objects.filter(student=student).exists():
                    errors.append(f"Student {student.initials_name} is already assigned to a panel.")
                    continue
                
                assignment = VivaAssignment.objects.create(
                    panel=panel,
                    student=student,
                    slot_number=current_count + i + 1
                )
                assignments.append(VivaAssignmentSerializer(assignment).data)
            except StudentSubmission.DoesNotExist:
                errors.append(f"Student ID {student_id} not found.")
                
        return Response({
            "message": f"Successfully assigned {len(assignments)} students.",
            "assignments": assignments,
            "errors": errors
        }, status=status.HTTP_201_CREATED if assignments else status.HTTP_400_BAD_REQUEST)

class VivaAssignmentViewSet(viewsets.ModelViewSet):
    queryset = VivaAssignment.objects.all()
    serializer_class = VivaAssignmentSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'UNIVERSITY_COORDINATOR':
            return VivaAssignment.objects.filter(student__university=user.university)
        elif user.role == 'ASSESSOR':
            return VivaAssignment.objects.filter(panel__assessor=user)
        return VivaAssignment.objects.all()

class AssessmentMarkViewSet(viewsets.ModelViewSet):
    queryset = AssessmentMark.objects.all()
    serializer_class = AssessmentMarkSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ASSESSOR':
            return AssessmentMark.objects.filter(assessor=user)
        return AssessmentMark.objects.all()

    def perform_create(self, serializer):
        data = self.request.data
        try:
            marks_data = data.get('marks_data', {})
            total = sum(float(value) for value in marks_data.values() if value)
            condition = data.get('evaluation_condition', 'NORMAL')
            
            # Status Logic
            if condition == 'NORMAL' and total >= 50:
                status_val = 'PASS'
            else:
                status_val = 'SPECIAL_STATUS'
                
            serializer.save(
                assessor=self.request.user, 
                total_mark=total, 
                status=status_val,
                marks_data=marks_data,
                evaluation_condition=condition,
                assessor_remarks=data.get('assessor_remarks', '')
            )
        except (ValueError, TypeError):
            serializer.save(
                assessor=self.request.user, 
                total_mark=0, 
                status='SPECIAL_STATUS',
                marks_data=data.get('marks_data', {}),
                evaluation_condition=data.get('evaluation_condition', 'NORMAL')
            )

    def perform_update(self, serializer):
        data = self.request.data
        try:
            marks_data = data.get('marks_data', {})
            total = sum(float(value) for value in marks_data.values() if value)
            condition = data.get('evaluation_condition', 'NORMAL')
            
            # Status Logic
            if condition == 'NORMAL' and total >= 50:
                status_val = 'PASS'
            else:
                status_val = 'SPECIAL_STATUS'
                
            serializer.save(
                total_mark=total, 
                status=status_val,
                marks_data=marks_data,
                evaluation_condition=condition,
                assessor_remarks=data.get('assessor_remarks', '')
            )
        except (ValueError, TypeError):
            serializer.save(
                total_mark=0, 
                status='SPECIAL_STATUS',
                marks_data=data.get('marks_data', {}),
                evaluation_condition=data.get('evaluation_condition', 'NORMAL')
            )

class AssessorDailyReportViewSet(viewsets.ModelViewSet):
    queryset = AssessorDailyReport.objects.all()
    serializer_class = AssessorDailyReportSerializer
    permission_classes = [permissions.IsAuthenticated]
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_queryset(self):
        user = self.request.user
        if user.role == 'ASSESSOR':
            return AssessorDailyReport.objects.filter(assessor=user)
        return AssessorDailyReport.objects.all()

    def perform_create(self, serializer):
        serializer.save(assessor=self.request.user)
