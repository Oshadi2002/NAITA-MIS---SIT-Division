from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import FormLink, StudentSubmission
from ..serializers import FormLinkSerializer, StudentSubmissionSerializer
from .base import CsrfExemptSessionAuthentication
from django.utils import timezone
from django.db import IntegrityError

class FormLinkViewSet(viewsets.ModelViewSet):
    # queryset = FormLink.objects.all() # Replaced by get_queryset
    serializer_class = FormLinkSerializer
    authentication_classes = (CsrfExemptSessionAuthentication,)
    permission_classes = [permissions.IsAuthenticatedOrReadOnly]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            # Public/Anon users shouldn't list links, only validate specific ones
            return FormLink.objects.none()
            
        if user.role == 'ADMIN':
            return FormLink.objects.all().order_by('-created_at')
        elif user.role == 'UNIVERSITY_COORDINATOR':
            return FormLink.objects.filter(assigned_coordinator=user).order_by('-created_at')
        return FormLink.objects.none()

    def perform_create(self, serializer):
        serializer.save(created_by=self.request.user)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def validate(self, request):
        hash_id = request.query_params.get('hash')
        if not hash_id:
            return Response({'valid': False}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            link = FormLink.objects.get(id=hash_id, is_active=True)
            return Response({
                'valid': True, 
                'university': link.university,
                'subject': link.subject,
                'batch_year': link.batch_year
            })
        except FormLink.objects.DoesNotExist:
            return Response({'valid': False}, status=status.HTTP_404_NOT_FOUND)

class StudentSubmissionViewSet(viewsets.ModelViewSet):
    queryset = StudentSubmission.objects.all()
    serializer_class = StudentSubmissionSerializer
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_permissions(self):
        if self.action in ['create']:
            return [permissions.AllowAny()]
        return [permissions.IsAuthenticated()]

    def get_queryset(self):
        user = self.request.user
        if not user.is_authenticated:
            return StudentSubmission.objects.none()
            
        queryset = StudentSubmission.objects.none()

        if user.role == 'ADMIN':
            queryset = StudentSubmission.objects.all()
        elif user.role == 'UNIVERSITY_COORDINATOR':
            from django.db.models import Q
            queryset = StudentSubmission.objects.filter(
                Q(university=user.university) | 
                Q(form_link__assigned_coordinator=user)
            )

        # Filters
        marked_status = self.request.query_params.get('marked_status')
        if marked_status is not None:
            is_marked = marked_status.lower() in ['true', '1']
            queryset = queryset.filter(marked_status=is_marked)
            
        university = self.request.query_params.get('university')
        if university:
            queryset = queryset.filter(university__icontains=university)

        return queryset.order_by('-submitted_at')

    def create(self, request, *args, **kwargs):
        # We override create to handle the "Update if Approved Novation Exists" logic
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)

        hash_id = request.data.get('form_link_id')
        nic = request.data.get('nic')
        
        try:
            link = FormLink.objects.get(id=hash_id, is_active=True)
            
            # Check for existing submission
            existing_submission = StudentSubmission.objects.filter(nic=nic, form_link=link).first()
            
            if existing_submission:
                # Check for APPROVED Novation Request
                has_approved_novation = existing_submission.novation_requests.filter(status='APPROVED').exists()
                
                if has_approved_novation:
                    # Allow Update: We perform an update on the existing instance
                    # We need to manually update the instance with validated data
                    # serializer.save() would try to create a new one and fail unique constraint
                    
                    # Update serializer to use the instance
                    update_serializer = self.get_serializer(existing_submission, data=request.data, partial=True)
                    update_serializer.is_valid(raise_exception=True)
                    
                    # Save with context fields
                    update_serializer.save(
                         form_link=link,
                         university=link.university,
                         subject=link.subject,
                         batch_year=link.batch_year,
                         district=link.district,
                         checked_ok=False, # Reset verification status
                         received_approval_for_resubmission=True # Optional: if we want to track this
                    )
                    return Response(update_serializer.data, status=status.HTTP_200_OK)
                else:
                     return Response(
                         {"detail": "Submission already exists for this NIC. Contact your coordinator if you need to change details."}, 
                         status=status.HTTP_400_BAD_REQUEST
                     )

            # Normal Create
            self.perform_create(serializer)
            headers = self.get_success_headers(serializer.data)
            return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        except FormLink.DoesNotExist:
             # If Admin, allow proceed without link if data is provided manually
             if request.user.role == 'ADMIN' and not hash_id:
                  # Manual create path
                  # But we check unique constraints manually if needed, or rely on serializer
                  # Serializer unique validator might fail if we don't handle it
                  pass
             else:
                  return Response({"detail": "Invalid Link"}, status=status.HTTP_400_BAD_REQUEST)

        # Proceed to create (for Admin manual or valid link)
        # We need to catch serializer save if we want custom behavior, but perform_create is called by mixin
        # super().create() calls perform_create. 
        # But here we are IN create().
        
        # If we are here, either we have a link (Normal) or we are Admin without link (Manual)
        
        if not hash_id and request.user.role == 'ADMIN':
             # Validate that context fields are present in request.data since no link to pull from
             required = ['university', 'subject', 'batch_year', 'district']
             missing = [f for f in required if not request.data.get(f)]
             if missing:
                  return Response({"detail": f"Missing required fields for manual creation: {', '.join(missing)}"}, status=status.HTTP_400_BAD_REQUEST)
             
             self.perform_create(serializer)
             headers = self.get_success_headers(serializer.data)
             return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

        # Normal Create with Link (Fallthrough if hash_id exists)
        self.perform_create(serializer)
        headers = self.get_success_headers(serializer.data)
        return Response(serializer.data, status=status.HTTP_201_CREATED, headers=headers)

    def perform_create(self, serializer):
        hash_id = self.request.data.get('form_link_id')
        if hash_id:
            link = FormLink.objects.get(id=hash_id)
            serializer.save(
                form_link=link,
                university=link.university,
                subject=link.subject,
                batch_year=link.batch_year,
                district=link.district
            )
        else:
            # Manual creation (Admin)
            # Data should already be in validated_data from request
            # But we might need to ensure they are set if not in model default (they are CharFields)
            serializer.save()

    @action(detail=False, methods=['get'])
    def export_csv(self, request):
        import csv
        from django.http import HttpResponse

        response = HttpResponse(content_type='text/csv')
        response['Content-Disposition'] = 'attachment; filename="student_submissions.csv"'

        writer = csv.writer(response)
        
        # Headers
        headers = [
            'ID', 'Full Name', 'Initials Name', 'NIC', 'Gender', 'Email', 'Contact', 
            'University', 'Subject', 'Batch', 'District', 'Reg No', 'Created At',
            'Training Establishment', 'Training Address', 'Training District', 
            'Start Date', 'End Date', 'Duration', 'OIC'
        ]
        writer.writerow(headers)

        # Data
        queryset = self.filter_queryset(self.get_queryset())
        for s in queryset:
            writer.writerow([
                s.id, s.full_name, s.initials_name, s.nic, s.gender, s.email, s.contact_number,
                s.university, s.subject, s.batch_year, s.district, s.student_reg_no, s.submitted_at,
                s.training_establishment, s.training_address, s.training_district,
                s.training_start_date, s.training_end_date, s.training_duration, s.officer_in_charge
            ])

        return response
