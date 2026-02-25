from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import CoordinatorInvite, CoordinatorPendingRegistration, User
from ..serializers import UserSerializer
from django.utils import timezone

class CoordinatorInviteViewSet(viewsets.ViewSet):
    def get_permissions(self):
        from rest_framework.permissions import AllowAny, IsAuthenticated
        if self.action in ('create_invite', 'list_pending', 'approve_pending', 'reject_pending'):
            return [IsAuthenticated()]
        return [AllowAny()]

    # ─── Admin: Generate Invite Link ───────────────────────────────────────────
    @action(detail=False, methods=['post'])
    def create_invite(self, request):
        if not request.user.is_authenticated or request.user.role != 'ADMIN':
            return Response({'message': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        email = request.data.get('email', '')
        invite = CoordinatorInvite.objects.create(
            created_by=request.user,
            whatsapp_number=email  # field reused to store coordinator email for pre-fill
        )
        return Response({'token': invite.id, 'email': invite.whatsapp_number})

    # ─── Public: Validate Token (Coordinator opens the link) ──────────────────
    @action(detail=False, methods=['get'])
    def validate_token(self, request):
        token = request.query_params.get('token')
        if not token:
            return Response({'valid': False, 'message': 'Token missing'}, status=status.HTTP_400_BAD_REQUEST)

        try:
            invite = CoordinatorInvite.objects.get(id=token)
            if invite.status != 'PENDING':
                return Response({'valid': False, 'message': 'This link has already been used.'}, status=status.HTTP_400_BAD_REQUEST)
            return Response({'valid': True, 'whatsapp_number': invite.whatsapp_number})
        except CoordinatorInvite.DoesNotExist:
            return Response({'valid': False, 'message': 'Invalid link.'}, status=status.HTTP_404_NOT_FOUND)

    # ─── Public: Coordinator Submits Form (Saves as Pending — no user created) ─
    @action(detail=False, methods=['post'])
    def register(self, request):
        token = request.data.get('token')

        try:
            invite = CoordinatorInvite.objects.get(id=token, status='PENDING')
        except CoordinatorInvite.DoesNotExist:
            return Response({'message': 'Invalid or expired invite link.'}, status=status.HTTP_400_BAD_REQUEST)

        # Check if already submitted
        if hasattr(invite, 'pending_registration'):
            return Response({'message': 'You have already submitted your details. Please wait for admin approval.'}, status=status.HTTP_400_BAD_REQUEST)

        data = request.data
        email = data.get('email', '').strip()

        if not email:
            return Response({'message': 'Email is required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'message': 'This email is already registered in the system.'}, status=status.HTTP_400_BAD_REQUEST)

        # Save as a pending registration — no user account created yet
        try:
            CoordinatorPendingRegistration.objects.create(
                invite=invite,
                full_name=data.get('name', ''),
                email=email,
                university=data.get('university', ''),
                faculty=data.get('faculty', ''),
                department=data.get('department', ''),
                designation=data.get('designation', ''),
                phone_number=data.get('phone_number', ''),
                whatsapp_number=data.get('whatsapp_number', invite.whatsapp_number or ''),
            )
            # Mark invite as submitted (but not fully USED yet — that happens on approval)
            invite.status = 'USED'
            invite.save()

            return Response(
                {'message': 'Your details have been submitted. The admin will review and send your login credentials via email.'},
                status=status.HTTP_201_CREATED
            )
        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ─── Admin: List Pending Coordinator Registrations ─────────────────────────
    @action(detail=False, methods=['get'])
    def list_pending(self, request):
        if not request.user.is_authenticated or request.user.role != 'ADMIN':
            return Response({'message': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        pending = CoordinatorPendingRegistration.objects.filter(status='PENDING').order_by('-submitted_at')
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
                'whatsapp_number': p.whatsapp_number,
                'submitted_at': p.submitted_at.isoformat(),
                'status': p.status,
            }
            for p in pending
        ]
        return Response(data)

    # ─── Admin: Approve → Create User Account ──────────────────────────────────
    @action(detail=True, methods=['post'])
    def approve_pending(self, request, pk=None):
        if not request.user.is_authenticated or request.user.role != 'ADMIN':
            return Response({'message': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            pending = CoordinatorPendingRegistration.objects.get(id=pk, status='PENDING')
        except CoordinatorPendingRegistration.DoesNotExist:
            return Response({'message': 'Pending registration not found.'}, status=status.HTTP_404_NOT_FOUND)

        username = request.data.get('username', '').strip()
        password = request.data.get('password', '').strip()

        if not username or not password:
            return Response({'message': 'Username and password are required.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(username=username).exists():
            return Response({'message': 'Username already taken. Please choose another.'}, status=status.HTTP_400_BAD_REQUEST)
        if User.objects.filter(email=pending.email).exists():
            return Response({'message': 'A user with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        # Split full name
        name_parts = pending.full_name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''

        try:
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
                phone_number=pending.phone_number,
                whatsapp_number=pending.whatsapp_number,
                is_staff=False,
                is_superuser=False
            )

            # Mark as approved
            pending.status = 'APPROVED'
            pending.reviewed_at = timezone.now()
            pending.save()

            return Response({
                'message': 'Coordinator approved and account created.',
                'user': UserSerializer(user).data,
                'username': username,
                'password': password,
                'whatsapp_number': pending.whatsapp_number,
                'full_name': pending.full_name,
            }, status=status.HTTP_201_CREATED)

        except Exception as e:
            return Response({'message': str(e)}, status=status.HTTP_400_BAD_REQUEST)

    # ─── Admin: Reject Pending Registration ────────────────────────────────────
    @action(detail=True, methods=['post'])
    def reject_pending(self, request, pk=None):
        if not request.user.is_authenticated or request.user.role != 'ADMIN':
            return Response({'message': 'Permission denied.'}, status=status.HTTP_403_FORBIDDEN)

        try:
            pending = CoordinatorPendingRegistration.objects.get(id=pk, status='PENDING')
        except CoordinatorPendingRegistration.DoesNotExist:
            return Response({'message': 'Pending registration not found.'}, status=status.HTTP_404_NOT_FOUND)

        note = request.data.get('note', '')
        pending.status = 'REJECTED'
        pending.admin_note = note
        pending.reviewed_at = timezone.now()
        pending.save()

        return Response({'message': 'Registration rejected.'})
