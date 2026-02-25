from django.db import models
from django.contrib.auth.models import AbstractUser

class User(AbstractUser):
    ROLE_CHOICES = [
        ('ADMIN', 'Admin'),
        ('INSPECTOR', 'Inspector'),
        ('UNIVERSITY_COORDINATOR', 'University Coordinator'),
    ]
    role = models.CharField(max_length=50, choices=ROLE_CHOICES)
    university = models.CharField(max_length=255, null=True, blank=True)
    faculty = models.CharField(max_length=255, null=True, blank=True)
    department = models.CharField(max_length=255, null=True, blank=True)
    designation = models.CharField(max_length=255, null=True, blank=True)
    whatsapp_number = models.CharField(max_length=20, null=True, blank=True)
    phone_number = models.CharField(max_length=20, null=True, blank=True)
    email = models.EmailField(unique=True)

    REQUIRED_FIELDS = ['email', 'role']

class SeminarRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
        ('NEED_CHANGES', 'Need Changes'),
        ('INSPECTOR_CONFIRMED', 'Inspector Confirmed'),
        ('COMPLETED', 'Completed'),
    ]
    coordinator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requests')
    coordinator_name = models.CharField(max_length=255)
    university_name = models.CharField(max_length=255)
    student_count = models.IntegerField()
    preferred_dates = models.JSONField() # Array of ISO strings
    final_date = models.DateTimeField(null=True, blank=True)
    location = models.CharField(max_length=255)
    notes = models.TextField(null=True, blank=True)
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    status_history = models.JSONField(default=list) # List of {status, date, note, by}
    assigned_inspector = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_seminars')
    assigned_inspector_name = models.CharField(max_length=255, null=True, blank=True)
    inspector_report = models.JSONField(null=True, blank=True) # {message, completedAt}
    created_at = models.DateTimeField(auto_now_add=True)

class Notification(models.Model):
    to_user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='notifications')
    title = models.CharField(max_length=255)
    message = models.TextField()
    read = models.BooleanField(default=False)
    created_at = models.DateTimeField(auto_now_add=True)

import uuid

class FormLink(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    university = models.CharField(max_length=255)
    subject = models.CharField(max_length=255)
    batch_year = models.CharField(max_length=50) # e.g. "2024/2025"
    district = models.CharField(max_length=100, default="Colombo") # Default for migration safety
    created_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, related_name='created_links')
    assigned_coordinator = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True, related_name='assigned_links')
    google_form_url = models.URLField(null=True, blank=True, help_text="Optional external Google Form URL")
    created_at = models.DateTimeField(auto_now_add=True)
    is_active = models.BooleanField(default=True)

    def __str__(self):
        return f"{self.university} - {self.subject} ({self.batch_year})"

class StudentSubmission(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('CHECKED', 'Checked OK'),
        ('REJECTED', 'Rejected'),
    ]

    # Link Context
    form_link = models.ForeignKey(FormLink, on_delete=models.SET_NULL, null=True, blank=True, related_name='submissions')
    university = models.CharField(max_length=255) # Copied from link for redundancy/search
    subject = models.CharField(max_length=255)
    batch_year = models.CharField(max_length=50)
    district = models.CharField(max_length=100, default="Colombo") # Copied from link

    # Personal Info
    full_name = models.CharField(max_length=255) # Block Letters
    initials_name = models.CharField(max_length=255)
    gender = models.CharField(max_length=20)
    nic = models.CharField(max_length=20) # Unique within batch? Or globally?
    email = models.EmailField()
    contact_number = models.CharField(max_length=20)
    permanent_address = models.TextField()
    
    # Academic Info
    student_reg_no = models.CharField(max_length=50)
    degree_nvq_level = models.CharField(max_length=100)
    degree_diploma_name = models.CharField(max_length=255)
    
    # Training Info
    training_district = models.CharField(max_length=100)
    divisional_secretariat = models.CharField(max_length=100)
    training_establishment = models.CharField(max_length=255)
    training_address = models.TextField()
    officer_in_charge = models.CharField(max_length=255)
    training_start_date = models.DateField()
    training_end_date = models.DateField()
    training_duration = models.CharField(max_length=50)
    field_of_training = models.CharField(max_length=255)

    # Files (Storing paths)
    nic_copy = models.FileField(upload_to='student_docs/nic/')
    agreement_form = models.FileField(upload_to='student_docs/agreement/')
    work_site_form = models.FileField(upload_to='student_docs/worksite/')
    placement_letter = models.FileField(upload_to='student_docs/placement/')

    # Admin Fields
    submitted_at = models.DateTimeField(auto_now_add=True)
    checked_ok = models.BooleanField(default=False) # "Checked OK" column
    marked_status = models.BooleanField(default=False, help_text="Marked by Admin")
    admin_reg_number = models.CharField(max_length=50, null=True, blank=True) # "Register Number" (Admin Assigned)

    class Meta:
        unique_together = ('nic', 'form_link') # Prevent duplicates for same link? Or global? User said "Duplicate submissions must be prevented"

    def __str__(self):
        return f"{self.initials_name} - {self.student_reg_no}"

class NovationRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]
    
    student = models.ForeignKey(StudentSubmission, on_delete=models.CASCADE, related_name='novation_requests')
    coordinator = models.ForeignKey(User, on_delete=models.CASCADE, related_name='submitted_novations')
    
    # New placement details
    # New placement details
    requested_work_site = models.CharField(max_length=255, default="Not Specified") # Default to avoid null issues on migration, or allow null temporarily
    reason = models.TextField()
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    admin_comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Novation: {self.student.full_name} -> {self.requested_work_site}"

class DataEditRequest(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    student = models.ForeignKey(StudentSubmission, on_delete=models.CASCADE, related_name='edit_requests')
    requested_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='requested_edits')
    
    # We store the changes as a JSON object: { "field_name": { "old": "val", "new": "val" }, ... }
    # Or just a list of changes. Let's stick to a simple structure.
    changes = models.JSONField(help_text="JSON object describing the changes, e.g., {'full_name': {'old': 'A', 'new': 'B'}}")
    
    status = models.CharField(max_length=50, choices=STATUS_CHOICES, default='PENDING')
    admin_comment = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    def __str__(self):
        return f"Edit Request for {self.student.student_reg_no} by {self.requested_by.username}"

class AuditLog(models.Model):
    ACTION_CHOICES = [
        ('CREATE', 'Create'),
        ('UPDATE', 'Update'),
        ('DELETE', 'Delete'),
        ('APPROVE_EDIT', 'Approve Edit'),
        ('REJECT_EDIT', 'Reject Edit'),
        ('SYNC', 'Sync'),
    ]

    target_model = models.CharField(max_length=100, help_text="Model name, e.g., 'StudentSubmission'")
    target_object_id = models.CharField(max_length=100) # Store as Char to be flexible, though usually Int
    action = models.CharField(max_length=50, choices=ACTION_CHOICES)
    performed_by = models.ForeignKey(User, on_delete=models.SET_NULL, null=True, blank=True)
    timestamp = models.DateTimeField(auto_now_add=True)
    details = models.JSONField(null=True, blank=True, help_text="Snapshot of changes or relevant data")

    def __str__(self):
        return f"{self.action} on {self.target_model} ({self.target_object_id}) by {self.performed_by}"

class CoordinatorInvite(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_invites')
    status = models.CharField(max_length=20, default='PENDING', choices=[('PENDING', 'Pending'), ('USED', 'Used')])
    whatsapp_number = models.CharField(max_length=20, null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    def __str__(self):
        return f"Invite {self.id} ({self.status})"


class CoordinatorPendingRegistration(models.Model):
    STATUS_CHOICES = [
        ('PENDING', 'Pending'),
        ('APPROVED', 'Approved'),
        ('REJECTED', 'Rejected'),
    ]

    invite = models.OneToOneField(CoordinatorInvite, on_delete=models.CASCADE, related_name='pending_registration')

    # Coordinator Details
    full_name = models.CharField(max_length=255)
    email = models.EmailField()
    university = models.CharField(max_length=255)
    faculty = models.CharField(max_length=255, blank=True, default='')
    department = models.CharField(max_length=255, blank=True, default='')
    designation = models.CharField(max_length=255, blank=True, default='')
    phone_number = models.CharField(max_length=20, blank=True, default='')
    whatsapp_number = models.CharField(max_length=20, blank=True, default='')

    status = models.CharField(max_length=20, choices=STATUS_CHOICES, default='PENDING')
    admin_note = models.TextField(blank=True, default='')

    submitted_at = models.DateTimeField(auto_now_add=True)
    reviewed_at = models.DateTimeField(null=True, blank=True)

    def __str__(self):
        return f"Pending: {self.full_name} ({self.status})"
