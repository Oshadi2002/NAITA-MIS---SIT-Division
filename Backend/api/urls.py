from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .viewsets import AuthViewSet, SeminarRequestViewSet, NotificationViewSet, ManagementViewSet
from .viewsets.student_data import FormLinkViewSet, StudentSubmissionViewSet
from .viewsets.novation import NovationRequestViewSet
from .viewsets.audit import DataEditRequestViewSet, AuditLogViewSet
from .viewsets.invites import CoordinatorInviteViewSet

router = DefaultRouter()
router.register(r'auth', AuthViewSet, basename='auth')
router.register(r'requests', SeminarRequestViewSet, basename='requests')
router.register(r'notifications', NotificationViewSet, basename='notifications')
router.register(r'management', ManagementViewSet, basename='management')
router.register(r'student-links', FormLinkViewSet, basename='student-links')
router.register(r'student-submissions', StudentSubmissionViewSet, basename='student-submissions')
router.register(r'novation-requests', NovationRequestViewSet, basename='novation-requests')
router.register(r'data-edit-requests', DataEditRequestViewSet, basename='data-edit-requests')
router.register(r'audit-logs', AuditLogViewSet, basename='audit-logs')
router.register(r'coordinator-invites', CoordinatorInviteViewSet, basename='coordinator-invites')

urlpatterns = [
    path('', include(router.urls)),
]
