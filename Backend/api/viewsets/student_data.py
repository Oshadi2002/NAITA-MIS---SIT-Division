from rest_framework import viewsets, status, permissions, serializers
from rest_framework.decorators import action
from rest_framework.response import Response
from django.http import FileResponse
from django.conf import settings
import os
from ..models import FormLink, StudentSubmission
from ..serializers import FormLinkSerializer, StudentSubmissionSerializer
from .base import CsrfExemptSessionAuthentication
from django.utils import timezone
from django.db import IntegrityError
from api.utils.pdf_generator import generate_placement_letter

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
        
        # Headers exactly matching requirements
        headers = [
            'Timestamp',
            'Email Address',
            '1. Name of the University / Institute with location ( EX - Advanced Technological Institute Gampaha)',
            '2. Degree / NVQ 5 / NVQ 6 (Selection)',
            '3. Degree or Diploma name',
            '4. District of the Training Work Site - (Ex - Kandy)',
            '5. Divisional Secretariat of the Training Work Site - (Ex - Kundasale)',
            '6.  University Registration Number',
            '7. Initials with Name (Ex:  A.S.N. Bulegoda  ) - Use for your NAITA Registration & NAITA Certificate',
            '8.  Full Name - BLOCK LETTERS ONLY (Ex: ARACHCHIGE SHASHINI NADUNYA BULEGODA) Use for your NAITA Registration & NAITA Certificate"',
            '9.  Gender(M/F)',
            '10. National ID Number (Ex: 888562273V)',
            '11.  Contact Number of Student (07x-xxxxxxx)',
            '12.  Permanent Address (Undergraduate) Ex: - ""Nayana""No,02/01, Galle Rd, Kaluthara."',
            '13. Designation of the Authorized officer Training Establishment - Head Office (Ex- HR Manager,)',
            '14. Name of the Training Establishment - Head Office (Ex- Central Engineering Service (Pvt) Ltd,)',
            '15. Address of the Training Establishment - Head Office (Ex-No 415, Bauddhaloka Mawatha, Colombo-07)',
            '16.  E -mail Address of the Training Establishment (Head Office)',
            '17.  Telephone Number of the Training Establishment (Head Office)',
            '18.  Name of the Training Work Site (Ex- Central Engineering Service (Pvt) Ltd,)',
            '19.  Address of the Training Work Site (Ex- No 132/A, Digana Road, Kundasale.)',
            '20.  Designation & Name of the Officer In-charge Work Site',
            '21.  Phone Number of the Officer In-charge Work Site',
            '22.  University / Institute Batch (Year)',
            '23. Field of Training',
            '24.  Training Duration (no of months or weeks)',
            '25.  Date of Commencement of Industrial Training',
            '26.  Date of Completion of Industrial Training',
            '27.  NIC Copy',
            '28. NAITA Training Contract Form PDF (After sign by the Training Establishment)',
            '29.  NAITA Training Work site Form PDF (After sign by the Training Establishment)',
            '30. NAITA Placement Letter (PDF)',
            'Checked ok',
            'Register number',
            'Column 1'
        ]
        writer.writerow(headers)

        # Data
        queryset = self.filter_queryset(self.get_queryset())
        
        def build_url(file_field):
            if file_field and hasattr(file_field, 'url'):
                return request.build_absolute_uri(file_field.url)
            return ''

        for s in queryset:
            writer.writerow([
                s.submitted_at.strftime("%Y-%m-%d %H:%M:%S") if s.submitted_at else '',
                s.email,
                s.university,
                s.degree_nvq_level,
                s.degree_diploma_name,
                s.training_district,
                s.divisional_secretariat,
                s.student_reg_no,
                s.initials_name,
                s.full_name,
                s.gender,
                s.nic,
                s.contact_number,
                s.permanent_address,
                s.head_office_designation or '',
                s.head_office_name or '',
                s.head_office_address or '',
                s.head_office_email or '',
                s.head_office_phone or '',
                s.training_establishment,
                s.training_address,
                s.officer_in_charge,
                s.officer_in_charge_contact or '',
                s.batch_year,
                s.field_of_training,
                s.training_duration,
                s.training_start_date.strftime("%Y-%m-%d") if s.training_start_date else '',
                s.training_end_date.strftime("%Y-%m-%d") if s.training_end_date else '',
                build_url(s.nic_copy),
                build_url(s.agreement_form),
                build_url(s.work_site_form),
                build_url(s.placement_letter),
                'Yes' if s.checked_ok else 'No',
                s.admin_reg_number or '',
                s.column_1 or ''
            ])

        return response

    # ✅ ADD THIS ACTION - Generate Placement Letter PDF
    @action(detail=True, methods=['get'], url_path='generate-letter')
    def generate_letter(self, request, pk=None):
        """
        Generate placement letter PDF for a student
        Only accessible by ADMIN and UNIVERSITY_COORDINATOR
        """
        # Check permission
        if request.user.role not in ['ADMIN', 'UNIVERSITY_COORDINATOR']:
            return Response(
                {"detail": "Only administrators or coordinators can generate placement letters."},
                status=status.HTTP_403_FORBIDDEN
            )
        
        try:
            # Get the student
            student = self.get_object()
            
            # Create file name with student details
            safe_name = student.full_name.replace(' ', '_')[:30]
            file_name = f"placement_letter_{safe_name}_{student.student_reg_no}_{student.id}.pdf"
            
            # Create file path in media/placement_letters directory
            file_path = os.path.join(settings.MEDIA_ROOT, 'placement_letters', file_name)
            
            # Generate PDF and save to file
            generate_placement_letter(student, file_path)
            
            # Return file response
            response = FileResponse(
                open(file_path, 'rb'), 
                as_attachment=True, 
                filename=file_name
            )
            
            return response
            
        except StudentSubmission.DoesNotExist:
            return Response(
                {"detail": "Student not found."},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response(
                {"detail": f"Error generating PDF: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )