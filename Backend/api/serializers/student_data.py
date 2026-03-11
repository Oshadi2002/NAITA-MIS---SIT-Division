from rest_framework import serializers
from ..models import FormLink, StudentSubmission
from django.http import FileResponse
from django.conf import settings
import os
from api.utils.pdf_generator import generate_placement_letter

class FormLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormLink
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at')

class StudentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubmission
        fields = '__all__'
        read_only_fields = ('form_link', 'submitted_at')

    def validate(self, data):
        # Additional validation can go here
        return data


@action(detail=True, methods=['get'])
def generate_letter(self, request, pk=None):
    student = self.get_object()

    file_name = f"placement_letter_{student.id}.pdf"
    file_path = os.path.join(settings.BASE_DIR, file_name)

    generate_placement_letter(student, file_path)

    return FileResponse(open(file_path, 'rb'), as_attachment=True, filename=file_name)
