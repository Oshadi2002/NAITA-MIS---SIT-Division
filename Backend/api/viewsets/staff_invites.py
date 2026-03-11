from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from ..models import StaffInvite, StaffPendingRegistration, User
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .base import CsrfExemptSessionAuthentication
import logging
import secrets
import string

logger = logging.getLogger(__name__)


def generate_password(length=12):
    """Generate a secure random password."""
    alphabet = string.ascii_letters + string.digits + "!@#$%"
    return ''.join(secrets.choice(alphabet) for _ in range(length))


def generate_username(full_name, role_prefix):
    """Generate a unique username from full name + role prefix."""
    base = full_name.lower().split()[0] if full_name else 'user'
    # Remove non-alphanumeric characters
    base = ''.join(c for c in base if c.isalnum())
    prefix = role_prefix.lower()[:3]  # e.g. "ass" or "ins"
    candidate = f"{prefix}_{base}"
    # If taken, append a number
    counter = 1
    username = candidate
    while User.objects.filter(username=username).exists():
        username = f"{candidate}_{counter}"
        counter += 1
    return username


class StaffInviteViewSet(viewsets.ViewSet):
    authentication_classes = (CsrfExemptSessionAuthentication,)

    def get_permissions(self):
        if self.action in ['create_invite', 'list_pending', 'approve_pending', 'reject_pending']:
            return [IsAuthenticated()]
        return [AllowAny()]

    # ─── Admin: Create Invite ──────────────────────────────────────────────────
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_invite(self, request):
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        invite_type = request.data.get('invite_type', '').upper().strip()
        email = request.data.get('email', '').strip()

        if invite_type not in ['ASSESSOR', 'INSPECTOR']:
            return Response(
                {'message': 'invite_type must be ASSESSOR or INSPECTOR.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        if not email:
            return Response(
                {'message': 'Email is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            invite = StaffInvite.objects.create(
                created_by=request.user,
                invite_type=invite_type,
                email=email,
                status='PENDING'
            )

            domain = getattr(settings, 'FRONTEND_URL', 'http://localhost:5000')
            registration_link = f"{domain}/staff-register/{invite.id}"

            role_label = 'Assessor' if invite_type == 'ASSESSOR' else 'Inspector'

            email_sent = False
            try:
                send_mail(
                    subject=f"Invitation to Register as {role_label} — NAITA",
                    message=(
                        f"Dear {role_label},\n\n"
                        f"You have been invited to register as a {role_label} in the NAITA system.\n\n"
                        f"Please use the link below to complete your registration:\n{registration_link}\n\n"
                        f"Once you submit your details, your login credentials will be emailed to you.\n\n"
                        f"Thank you."
                    ),
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as e:
                logger.error(f"Failed to send staff invite email: {str(e)}")

            return Response({
                'token': str(invite.id),
                'link': registration_link,
                'email_sent': email_sent,
                'invite_type': invite_type,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error creating staff invite: {str(e)}")
            return Response(
                {'message': 'Failed to create invite. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Public: Validate Token ────────────────────────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def validate_token(self, request):
        token = request.query_params.get('token')

        if not token:
            return Response(
                {'valid': False, 'message': 'Token is required'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            invite = StaffInvite.objects.get(id=token)

            if invite.status != 'PENDING':
                return Response(
                    {'valid': False, 'message': 'This invitation link has already been used or is expired.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if hasattr(invite, 'pending_registration'):
                return Response(
                    {'valid': False, 'message': 'You have already submitted your details.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            return Response({
                'valid': True,
                'invite_type': invite.invite_type,
                'message': 'Token is valid',
            })

        except StaffInvite.DoesNotExist:
            return Response(
                {'valid': False, 'message': 'Invalid invitation link.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error validating staff token: {str(e)}")
            return Response(
                {'valid': False, 'message': 'Error validating token.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Public: Submit Registration Form → Auto-create account ───────────────
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        token = request.data.get('token')

        if not token:
            return Response(
                {'message': 'Token is required.'},
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            invite = StaffInvite.objects.get(id=token)

            if invite.status != 'PENDING':
                return Response(
                    {'message': 'This invitation link is no longer valid.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if hasattr(invite, 'pending_registration'):
                return Response(
                    {'message': 'You have already submitted your details.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            data = request.data
            email = data.get('email', '').strip()
            full_name = data.get('full_name', '').strip()

            # Validate required fields
            if not full_name or not email:
                return Response(
                    {'message': 'Full Name and Email are required.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            if User.objects.filter(email=email).exists():
                return Response(
                    {'message': 'This email is already registered in the system.'},
                    status=status.HTTP_400_BAD_REQUEST
                )

            invite_type = invite.invite_type

            # Build pending registration
            is_also_assessor = bool(data.get('is_also_assessor', False))
            assessor_data = data.get('assessor_data', None) if is_also_assessor else None

            pending = StaffPendingRegistration.objects.create(
                invite=invite,
                invite_type=invite_type,
                full_name=full_name,
                initials_name=data.get('initials_name', '').strip(),
                permanent_address=data.get('permanent_address', '').strip(),
                phone_number=data.get('phone_number', '').strip(),
                email=email,
                province=data.get('province', '').strip(),
                district=data.get('district', '').strip(),
                qualification=data.get('qualification', '').strip(),
                payment_details=data.get('payment_details', None),
                assessment_fields=data.get('assessment_fields', None),
                is_also_assessor=is_also_assessor,
                assessor_data=assessor_data,
                status='PENDING',
            )

            # Mark invite as used
            invite.status = 'USED'
            invite.save()

            # Auto-create user account
            role_map = {'ASSESSOR': 'ASSESSOR', 'INSPECTOR': 'INSPECTOR'}
            role = role_map.get(invite_type, 'INSPECTOR')

            username = generate_username(full_name, invite_type)
            password = generate_password()

            name_parts = full_name.split(' ', 1)
            first_name = name_parts[0]
            last_name = name_parts[1] if len(name_parts) > 1 else ''

            user = User.objects.create_user(
                username=username,
                email=email,
                password=password,
                role=role,
                first_name=first_name,
                last_name=last_name,
                phone_number=data.get('phone_number', '').strip(),
            )

            # Update pending registration with created user
            pending.created_user = user
            pending.status = 'APPROVED'
            pending.reviewed_at = timezone.now()
            pending.save()

            # Send credentials email
            role_label = 'Assessor' if invite_type == 'ASSESSOR' else 'Inspector'
            domain = getattr(settings, 'FRONTEND_URL', 'http://localhost:5000')
            login_url = f"{domain}/login"

            email_sent = False
            try:
                send_mail(
                    subject=f"Your {role_label} Account — NAITA",
                    message=(
                        f"Hello {full_name},\n\n"
                        f"Your {role_label} account has been created successfully.\n\n"
                        f"Login Credentials:\n"
                        f"  Username: {username}\n"
                        f"  Password: {password}\n\n"
                        f"Login here: {login_url}\n\n"
                        f"Please change your password after your first login.\n\n"
                        f"Thank you.\nNAITA Team"
                    ),
                    from_email=settings.EMAIL_HOST_USER,
                    recipient_list=[email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as e:
                logger.error(f"Failed to send credentials email to {email}: {str(e)}")

            return Response({
                'message': (
                    'Registration successful! Your login credentials have been sent to your email.'
                    if email_sent else
                    'Registration successful! Your account has been created. Please contact the admin for your credentials.'
                ),
                'email_sent': email_sent,
            }, status=status.HTTP_201_CREATED)

        except StaffInvite.DoesNotExist:
            return Response(
                {'message': 'Invalid or expired invite link.'},
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in staff registration: {str(e)}")
            return Response(
                {'message': f'An error occurred during registration: {str(e)}'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Admin: List Pending Staff Registrations ───────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def list_pending(self, request):
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            pending = StaffPendingRegistration.objects.filter(
                status='PENDING'
            ).select_related('invite', 'created_user').order_by('-submitted_at')

            data = [
                {
                    'id': p.id,
                    'invite_type': p.invite_type,
                    'full_name': p.full_name,
                    'initials_name': p.initials_name,
                    'email': p.email,
                    'phone_number': p.phone_number,
                    'province': p.province,
                    'district': p.district,
                    'qualification': p.qualification,
                    'payment_details': p.payment_details,
                    'assessment_fields': p.assessment_fields,
                    'is_also_assessor': p.is_also_assessor,
                    'assessor_data': p.assessor_data,
                    'submitted_at': p.submitted_at.isoformat(),
                    'status': p.status,
                    'invite_id': str(p.invite.id) if p.invite else None,
                }
                for p in pending
            ]

            return Response(data)

        except Exception as e:
            logger.error(f"Error listing pending staff registrations: {str(e)}")
            return Response(
                {'message': 'Error fetching pending registrations.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Admin: Reject Pending Registration ────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject_pending(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Permission denied.'},
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            pending = StaffPendingRegistration.objects.get(id=pk, status='PENDING')
        except StaffPendingRegistration.DoesNotExist:
            return Response(
                {'message': 'Pending registration not found or already processed.'},
                status=status.HTTP_404_NOT_FOUND
            )

        note = request.data.get('note', '').strip()
        pending.status = 'REJECTED'
        pending.admin_note = note
        pending.reviewed_at = timezone.now()
        pending.save()

        # Also delete the user if it was auto-created
        if pending.created_user:
            try:
                pending.created_user.delete()
                pending.created_user = None
                pending.save()
            except Exception as e:
                logger.error(f"Failed to delete auto-created user: {str(e)}")

        # Optionally re-open the invite so admin can resend
        if pending.invite:
            pending.invite.status = 'PENDING'
            pending.invite.save()

        return Response({
            'message': 'Staff registration rejected.',
            'id': pending.id,
        }, status=status.HTTP_200_OK)
