from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User, SeminarRequest, Notification

@admin.register(User)
class UserAdmin(BaseUserAdmin):
    list_display = ['username', 'email', 'first_name', 'last_name', 'role', 'university', 'is_staff']
    list_filter = ['role', 'is_staff', 'is_superuser']
    fieldsets = (
        (None, {'fields': ('username', 'password')}),
        ('Personal info', {'fields': ('first_name', 'last_name', 'email')}),
        ('Role & Institution', {'fields': ('role', 'university')}),
        ('Permissions', {'fields': ('is_active', 'is_staff', 'is_superuser', 'groups', 'user_permissions')}),
        ('Important dates', {'fields': ('last_login', 'date_joined')}),
    )
    add_fieldsets = (
        (None, {
            'classes': ('wide',),
            'fields': ('username', 'email', 'password1', 'password2', 'role', 'university', 'first_name', 'last_name', 'is_staff', 'is_superuser'),
        }),
    )

@admin.register(SeminarRequest)
class SeminarRequestAdmin(admin.ModelAdmin):
    list_display = ['id', 'university_name', 'coordinator_name', 'status', 'student_count', 'created_at']
    list_filter = ['status', 'created_at']
    search_fields = ['university_name', 'coordinator_name', 'location']
    readonly_fields = ['coordinator', 'coordinator_name', 'university_name', 'status_history', 'created_at']

@admin.register(Notification)
class NotificationAdmin(admin.ModelAdmin):
    list_display = ['id', 'to_user', 'title', 'read', 'created_at']
    list_filter = ['read', 'created_at']
    search_fields = ['title', 'message']
    readonly_fields = ['created_at']
