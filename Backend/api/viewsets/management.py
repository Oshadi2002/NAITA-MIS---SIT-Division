from rest_framework import viewsets, status
from rest_framework.decorators import action
from rest_framework.response import Response
from ..models import User
from ..serializers import UserSerializer
from .base import CsrfExemptSessionAuthentication
from django.core.mail import send_mail
from django.conf import settings

class ManagementViewSet(viewsets.ViewSet):
    authentication_classes = (CsrfExemptSessionAuthentication,)
    
    @action(detail=False, methods=['get'])
    def inspectors(self, request):
        if request.user.role != 'ADMIN':
            return Response(status=status.HTTP_403_FORBIDDEN)
        inspectors = User.objects.filter(role='INSPECTOR')
        return Response(UserSerializer(inspectors, many=True).data)

    @action(detail=False, methods=['get'])
    def users(self, request):
        if request.user.role != 'ADMIN':
            return Response(status=status.HTTP_403_FORBIDDEN)
        users = User.objects.all()
        return Response(UserSerializer(users, many=True).data)

    @action(detail=False, methods=['post'])
    def create_user(self, request):
        if request.user.role != 'ADMIN':
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        name = request.data.get('name', '')
        username = request.data.get('username')
        email = request.data.get('email')
        role = request.data.get('role')
        university = request.data.get('university')
        faculty = request.data.get('faculty')
        department = request.data.get('department')
        designation = request.data.get('designation')
        phone_number = request.data.get('phone_number')
        whatsapp_number = request.data.get('whatsapp_number')
        password = request.data.get('password')
        
        if not email or not role or not password or not username:
            return Response({'message': 'Username, Email, role and password are required.'}, status=status.HTTP_400_BAD_REQUEST)
            
        if User.objects.filter(username=username).exists():
            return Response({'message': 'User with this username already exists.'}, status=status.HTTP_400_BAD_REQUEST)

        if User.objects.filter(email=email).exists():
            return Response({'message': 'User with this email already exists.'}, status=status.HTTP_400_BAD_REQUEST)
            
        name_parts = name.split(' ', 1)
        first_name = name_parts[0]
        last_name = name_parts[1] if len(name_parts) > 1 else ''
        
        user = User.objects.create_user(
            username=username,
            email=email,
            password=password,
            role=role,
            first_name=first_name,
            last_name=last_name,
            university=university,
            faculty=faculty,
            department=department,
            designation=designation,
            phone_number=phone_number,
            whatsapp_number=whatsapp_number,
            is_staff=(role == 'ADMIN'),
            is_superuser=(role == 'ADMIN')
        )
        
        # Send email with credentials
        subject = 'Your Account Credentials'
        message = f'Welcome, {name}!\n\nYour account has been created.\nEmail: {email}\nPassword: {password}\n\nPlease log in to the portal.'
        try:
            send_mail(
                subject,
                message,
                settings.DEFAULT_FROM_EMAIL if hasattr(settings, 'DEFAULT_FROM_EMAIL') else 'admin@system.com',
                [email],
                fail_silently=False,
            )
        except Exception as e:
            print(f"DEBUG: Failed to send email: {str(e)}")
        
        return Response(UserSerializer(user).data, status=status.HTTP_201_CREATED)

    @action(detail=True, methods=['post'])
    def reset_password(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=pk)
            new_password = request.data.get('password')
            if not new_password:
                return Response({'message': 'Password is required.'}, status=status.HTTP_400_BAD_REQUEST)
            
            user.set_password(new_password)
            user.save()
            return Response({'message': 'Password reset successful.'})
        except User.DoesNotExist:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=True, methods=['delete'])
    def delete_user(self, request, pk=None):
        if request.user.role != 'ADMIN':
            return Response(status=status.HTTP_403_FORBIDDEN)
        
        try:
            user = User.objects.get(id=pk)
            if user.role == 'ADMIN':
                return Response({'message': 'Cannot delete admin users.'}, status=status.HTTP_400_BAD_REQUEST)
            user.delete()
            return Response(status=status.HTTP_204_NO_CONTENT)
        except User.DoesNotExist:
            return Response({'message': 'User not found.'}, status=status.HTTP_404_NOT_FOUND)

    @action(detail=False, methods=['put'])
    def update_profile(self, request):
        user = request.user
        if not user or not user.is_authenticated:
            return Response(status=status.HTTP_401_UNAUTHORIZED)
        
        # Allowed fields to update
        allowed_fields = ['name', 'phone_number', 'whatsapp_number', 'designation', 'university', 'faculty', 'department']
        
        for field in allowed_fields:
            if field in request.data:
                setattr(user, field, request.data[field])
        
        user.save()
        return Response(UserSerializer(user).data)
