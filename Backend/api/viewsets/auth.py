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
            username = request.data.get('username')
            password = request.data.get('password')
            print(f"DEBUG: Login attempt - username: {username}")
            
            user = authenticate(username=username, password=password)
            if not user:
                try:
                    user_obj = User.objects.get(email=username)
                    user = authenticate(username=user_obj.username, password=password)
                except User.DoesNotExist:
                    pass

            if user:
                print(f"DEBUG: Authentication successful - user: {user.username}")
                auth_login(request, user)
                return Response(UserSerializer(user).data)
            
            return Response({'message': 'Incorrect Email or Password! Try again.'}, status=status.HTTP_401_UNAUTHORIZED)
        except Exception as e:
            import traceback
            traceback.print_exc()
            return Response({'message': 'Internal Server Error'}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

    @action(detail=False, methods=['post'])
    def logout(self, request):
        auth_logout(request)
        return Response(status=status.HTTP_200_OK)

    @action(detail=False, methods=['get'], permission_classes=[permissions.IsAuthenticated])
    def user(self, request):
        return Response(UserSerializer(request.user).data)
