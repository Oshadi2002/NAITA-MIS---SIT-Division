from rest_framework import serializers
from .models import User, SeminarRequest, Notification, FormLink, StudentSubmission, NovationRequest, DataEditRequest, AuditLog

class UserSerializer(serializers.ModelSerializer):
    name = serializers.SerializerMethodField()

    class Meta:
        model = User
        fields = ('id', 'username', 'email', 'name', 'role', 'university', 'faculty', 'department', 'designation', 'whatsapp_number', 'phone_number')
        extra_kwargs = {'password': {'write_only': True}}
        
    def get_name(self, obj):
        full_name = obj.get_full_name()
        return full_name if full_name else obj.username

    def create(self, validated_data):
        user = User.objects.create_user(**validated_data)
        return user

class SeminarRequestSerializer(serializers.ModelSerializer):
    coordinator_name = serializers.ReadOnlyField()
    assigned_inspector_name = serializers.ReadOnlyField()

    class Meta:
        model = SeminarRequest
        fields = '__all__'
        read_only_fields = ('coordinator', 'coordinator_name', 'created_at', 'status_history', 'assigned_inspector_name')

class NotificationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Notification
        fields = '__all__'

class FormLinkSerializer(serializers.ModelSerializer):
    class Meta:
        model = FormLink
        fields = '__all__'
        read_only_fields = ('id', 'created_by', 'created_at')

class StudentSubmissionSerializer(serializers.ModelSerializer):
    class Meta:
        model = StudentSubmission
        fields = '__all__'
        read_only_fields = ('form_link', 'submitted_at', 'university', 'subject', 'batch_year', 'district', 'checked_ok', 'admin_reg_number')

    def validate(self, data):
        # Additional validation can go here
        return data

class NovationRequestSerializer(serializers.ModelSerializer):
    student_details = StudentSubmissionSerializer(source='student', read_only=True)
    coordinator_name = serializers.ReadOnlyField(source='coordinator.get_full_name')

    class Meta:
        model = NovationRequest
        fields = '__all__'
        read_only_fields = ('coordinator', 'created_at', 'updated_at', 'status', 'admin_comment')

class DataEditRequestSerializer(serializers.ModelSerializer):
    requested_by_name = serializers.ReadOnlyField(source='requested_by.get_full_name')
    student_details = StudentSubmissionSerializer(source='student', read_only=True)

    class Meta:
        model = DataEditRequest
        fields = '__all__'
        read_only_fields = ('requested_by', 'status', 'admin_comment', 'created_at', 'updated_at')

class AuditLogSerializer(serializers.ModelSerializer):
    performed_by_name = serializers.ReadOnlyField(source='performed_by.get_full_name')

    class Meta:
        model = AuditLog
        fields = '__all__'
        read_only_fields = ('performed_by', 'timestamp')
