from rest_framework import serializers
from ..models import FormLink, StudentSubmission

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
