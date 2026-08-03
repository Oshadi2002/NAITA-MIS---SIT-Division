from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.contrib.auth import login as auth_login, logout as auth_logout, authenticate
from ..models import User
from ..serializers import UserSerializer
from .base import CsrfExemptSessionAuthentication

class AuthViewSet(viewsets.ViewSet):
    permission_classes = [permissions.AllowAny]
    authentication_classes = (CsrfExemptSessionAuthentication,)

    @action(detail=False, methods=['post'])
    def login(self, request):
        try:
            # Ensure DB is migrated and seeded on Vercel lambda
            try:
                from django.core.management import call_command
                call_command('migrate', interactive=False)
                if User.objects.count() < 3:
                    call_command('seed_data', interactive=False)
            except Exception as se:
                print(f"Auto-seed error: {se}")

            username = request.data.get('username')
            password = request.data.get('password')
            requested_role = request.data.get('role')
            print(f"DEBUG: Login attempt - username: {username}, role: {requested_role}")
            
            # 1. Try standard Django authenticate
            user = authenticate(username=username, password=password)
            
            # 2. Try direct email / username match with check_password
            if not user and username and password:
                user_obj = User.objects.filter(email__iexact=username).first() or User.objects.filter(username__iexact=username).first()
                if user_obj and user_obj.check_password(password):
                    user = user_obj

            # 3. Fallback provision for requested default accounts if needed
            if not user and username and password:
                DEFAULT_USERS = {
                    'yasirunimsara23@gmail.com': ('rathna2002', 'ADMIN'),
                    'shalanka@gmail.com': ('Chabby02', 'UNIVERSITY_COORDINATOR'),
                    'iresha@gmail.com': ('12345', 'INSPECTOR'),
                }
                lower_user = username.lower().strip()
                if lower_user in DEFAULT_USERS:
                    req_pass, req_role = DEFAULT_USERS[lower_user]
                    if password == req_pass:
                        u_obj = User.objects.filter(email__iexact=lower_user).first() or User.objects.filter(username__iexact=lower_user).first()
                        if not u_obj:
                            u_obj = User(username=lower_user, email=lower_user, role=req_role)
                        u_obj.role = req_role
                        u_obj.is_active = True
                        if req_role == 'ADMIN':
                            u_obj.is_superuser = True
                            u_obj.is_staff = True
                        u_obj.set_password(req_pass)
                        u_obj.save()
                        user = u_obj

            if user:
                if requested_role and user.role != requested_role:
                    print(f"DEBUG: Role mismatch - expected: {requested_role}, got: {user.role}")
                    return Response({'message': 'Please select the correct login tab for your role!'}, status=status.HTTP_403_FORBIDDEN)
                
                print(f"DEBUG: Authentication successful - user: {user.username}")
                auth_login(request, user)
                return Response(UserSerializer(user).data)
            
            return Response({'message': 'Incorrect Email or Password! Try again.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            print(f"LOGIN ERROR: {e}")
            return Response({'message': f'Internal Server Error: {str(e)}'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        auth_logout(request)
        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def user(self, request):
        user = getattr(request, 'user', None)
        if not user or not getattr(user, 'is_authenticated', False):
            return Response(None, status=status.HTTP_200_OK)
        return Response(UserSerializer(user).data)

    @action(detail=False, methods=['get'], permission_classes=[permissions.AllowAny])
    def assessors(self, request):
        assessors = User.objects.filter(role='ASSESSOR')
        return Response(UserSerializer(assessors, many=True).data)
