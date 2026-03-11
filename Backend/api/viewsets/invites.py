from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from ..models import CoordinatorInvite, CoordinatorPendingRegistration, User
from ..serializers import UserSerializer
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from .base import CsrfExemptSessionAuthentication
import logging

logger = logging.getLogger(__name__)

class CoordinatorInviteViewSet(viewsets.ViewSet):
    authentication_classes = (CsrfExemptSessionAuthentication,)
    
    def get_permissions(self):
        """
        Dynamically set permissions based on action
        """
        if self.action in ['create_invite', 'list_pending', 'approve_pending', 'reject_pending']:
            return [IsAuthenticated()]
        return [AllowAny()]

    # ─── Admin: Generate Invite Link ───────────────────────────────────────────
    @action(detail=False, methods=['post'], permission_classes=[IsAuthenticated])
    def create_invite(self, request):
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Permission denied. Only admins can create invites.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            # Create invite
            email = request.data.get('email', '').strip()
            invite = CoordinatorInvite.objects.create(
                created_by=request.user,
                email=email,
                status='PENDING'
            )

            domain = getattr(settings, 'FRONTEND_URL', 'http://localhost:5000')
            registration_link = f"{domain}/register/{invite.id}"

            # Send Email Notification
            email_sent = False
            if email:
                try:
                    subject = "Invitation to Register as University Coordinator"
                    message = f"You have been invited to register as a University Coordinator. Use this link: {registration_link}"
                    send_mail(
                        subject,
                        message,
                        settings.EMAIL_HOST_USER,
                        [email],
                        fail_silently=False,
                    )
                    email_sent = True
                except Exception as e:
                    logger.error(f"Failed to send invite email: {str(e)}")

            return Response({
                'token': str(invite.id),
                'link': registration_link,
                'email_sent': email_sent
            }, status=status.HTTP_201_CREATED)
            
        except Exception as e:
            logger.error(f"Error creating invite: {str(e)}")
            return Response(
                {'message': 'Failed to create invite. Please try again.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Public: Validate Token ───────────────────────────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[AllowAny])
    def validate_token(self, request):
        token = request.query_params.get('token')
        
        if not token:
            return Response(
                {'valid': False, 'message': 'Token is required'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            invite = CoordinatorInvite.objects.get(id=token)
            
            if invite.status != 'PENDING':
                return Response(
                    {'valid': False, 'message': 'This invitation link has already been used or is expired.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            # Check if already registered
            if hasattr(invite, 'pending_registration'):
                return Response(
                    {'valid': False, 'message': 'You have already submitted your details. Please wait for admin approval.'},
                    status=status.HTTP_400_BAD_REQUEST
                )
                
            return Response({'valid': True, 'message': 'Token is valid'})
            
        except CoordinatorInvite.DoesNotExist:
            return Response(
                {'valid': False, 'message': 'Invalid invitation link.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error validating token: {str(e)}")
            return Response(
                {'valid': False, 'message': 'Error validating token.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Public: Coordinator Submits Form ─────────────────────────────────────
    @action(detail=False, methods=['post'], permission_classes=[AllowAny])
    def register(self, request):
        token = request.data.get('token')

        if not token:
            return Response(
                {'message': 'Token is required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        try:
            invite = CoordinatorInvite.objects.get(id=token)
            
            if invite.status != 'PENDING':
                return Response(
                    {'message': 'This invitation link is no longer valid.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if already submitted
            if hasattr(invite, 'pending_registration'):
                return Response(
                    {'message': 'You have already submitted your details. Please wait for admin approval.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            data = request.data
            email = data.get('email', '').strip()

            # Validate required fields
            required_fields = ['name', 'email', 'university']
            missing_fields = [field for field in required_fields if not data.get(field)]
            
            if missing_fields:
                return Response(
                    {'message': f'Missing required fields: {", ".join(missing_fields)}'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if email already exists
            if User.objects.filter(email=email).exists():
                return Response(
                    {'message': 'This email is already registered in the system.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Check if username already exists (if provided)
            username = data.get('username', '').strip()
            if username and User.objects.filter(username=username).exists():
                return Response(
                    {'message': 'This username is already taken.'}, 
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Save as a pending registration
            pending = CoordinatorPendingRegistration.objects.create(
                invite=invite,
                full_name=data.get('name', '').strip(),
                email=email,
                university=data.get('university', '').strip(),
                faculty=data.get('faculty', '').strip(),
                department=data.get('department', '').strip(),
                designation=data.get('designation', '').strip(),
                phone_number=data.get('phone_number', '').strip(),
                status='PENDING'
            )
            
            # Update invite status
            invite.status = 'USED'
            invite.save()

            return Response(
                {
                    'message': 'Your details have been submitted successfully. The admin will review and send your login credentials via email.',
                    'id': pending.id
                },
                status=status.HTTP_201_CREATED
            )
            
        except CoordinatorInvite.DoesNotExist:
            return Response(
                {'message': 'Invalid or expired invite link.'}, 
                status=status.HTTP_404_NOT_FOUND
            )
        except Exception as e:
            logger.error(f"Error in registration: {str(e)}")
            return Response(
                {'message': 'An error occurred during registration. Please try again.'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Admin: List Pending Coordinator Registrations ─────────────────────────
    @action(detail=False, methods=['get'], permission_classes=[IsAuthenticated])
    def list_pending(self, request):
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Permission denied. Only admins can view pending registrations.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            pending = CoordinatorPendingRegistration.objects.filter(
                status='PENDING'
            ).select_related('invite').order_by('-submitted_at')
            
            data = [
                {
                    'id': p.id,
                    'full_name': p.full_name,
                    'email': p.email,
                    'university': p.university,
                    'faculty': p.faculty,
                    'department': p.department,
                    'designation': p.designation,
                    'phone_number': p.phone_number,
                    'submitted_at': p.submitted_at.isoformat(),
                    'status': p.status,
                    'invite_id': str(p.invite.id) if p.invite else None
                }
                for p in pending
            ]
            
            return Response(data)
            
        except Exception as e:
            logger.error(f"Error listing pending registrations: {str(e)}")
            return Response(
                {'message': 'Error fetching pending registrations.'},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Admin: Approve → Create User Account + Email ─────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def approve_pending(self, request, pk=None):
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Permission denied. Only admins can approve registrations.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            pending = CoordinatorPendingRegistration.objects.get(id=pk, status='PENDING')
        except CoordinatorPendingRegistration.DoesNotExist:
            return Response(
                {'message': 'Pending registration not found or already processed.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        # Validate input
        if not username or not password:
            return Response(
                {'message': 'Username and password are required.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Check for duplicates
        if User.objects.filter(username=username).exists():
            return Response(
                {'message': 'Username already taken. Please choose another.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )
            
        if User.objects.filter(email=pending.email).exists():
            return Response(
                {'message': 'A user with this email already exists.'}, 
                status=status.HTTP_400_BAD_REQUEST
            )

        # Split name
        name_parts = pending.full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        try:
            # Create user
            user = User.objects.create_user(
                username=username,
                email=pending.email,
                password=password,
                role='UNIVERSITY_COORDINATOR',
                first_name=first_name,
                last_name=last_name,
                university=pending.university,
                faculty=pending.faculty,
                department=pending.department,
                designation=pending.designation,
                phone_number=pending.phone_number
            )

            # Send Email
            domain = getattr(settings, 'FRONTEND_URL', 'http://localhost:5000')
            login_url = f"{domain}/login"
            
            email_sent = False
            try:
                send_mail(
                    subject="Your University Coordinator Account is Ready",
                    message=f"""
Hello {pending.full_name},

Your coordinator account has been approved!

Login Credentials:
Username: {username}
Password: {password}

Login here: {login_url}

Please change your password after first login for security.

Thank you.
                    """,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[pending.email],
                    fail_silently=False,
                )
                email_sent = True
            except Exception as e:
                logger.error(f"Failed to send email to {pending.email}: {str(e)}")
                # Don't fail the approval if email fails

            # Mark as approved
            pending.status = 'APPROVED'
            pending.reviewed_at = timezone.now()
            pending.reviewed_by = request.user
            pending.save()

            return Response({
                'message': 'Coordinator approved and account created successfully.' + 
                          ('' if email_sent else ' (Email delivery failed)'),
                'user': UserSerializer(user).data,
                'email_sent': email_sent
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            logger.error(f"Error approving registration {pk}: {str(e)}")
            return Response(
                {'message': f'Error creating user account: {str(e)}'}, 
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

    # ─── Admin: Reject Pending Registration ────────────────────────────────────
    @action(detail=True, methods=['post'], permission_classes=[IsAuthenticated])
    def reject_pending(self, request, pk=None):
        # Check if user is admin
        if request.user.role != 'ADMIN':
            return Response(
                {'message': 'Permission denied. Only admins can reject registrations.'}, 
                status=status.HTTP_403_FORBIDDEN
            )

        try:
            pending = CoordinatorPendingRegistration.objects.get(id=pk, status='PENDING')
        except CoordinatorPendingRegistration.DoesNotExist:
            return Response(
                {'message': 'Pending registration not found or already processed.'}, 
                status=status.HTTP_404_NOT_FOUND
            )

        note = request.data.get('note', '').strip()

        # Update pending registration
        pending.status = 'REJECTED'
        pending.admin_note = note
        pending.reviewed_at = timezone.now()
        pending.reviewed_by = request.user
        pending.save()

        # Optional: Send rejection email
        if note and pending.email:
            try:
                domain = request.build_absolute_uri('/')[:-1]
                send_mail(
                    subject="Update on Your Coordinator Registration",
                    message=f"""
Hello {pending.full_name},

Thank you for your interest in becoming a University Coordinator.

After reviewing your application, we regret to inform you that we are unable to approve your registration at this time.

Reason: {note}

If you have any questions, please contact the administrator.

Thank you for your understanding.
                    """,
                    from_email=settings.DEFAULT_FROM_EMAIL,
                    recipient_list=[pending.email],
                    fail_silently=True,
                )
            except Exception as e:
                logger.error(f"Failed to send rejection email: {str(e)}")

        return Response({
            'message': 'Registration rejected successfully.',
            'id': pending.id
        }, status=status.HTTP_200_OK)