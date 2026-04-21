from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from rest_framework.views import APIView
from rest_framework.authtoken.models import Token
from rest_framework.permissions import AllowAny, IsAuthenticated
from django.conf import settings
from django.contrib.auth import authenticate
from django.contrib.auth.models import User
from django.contrib.auth.tokens import default_token_generator
from django.utils.http import urlsafe_base64_encode, urlsafe_base64_decode
from django.utils.encoding import force_bytes, force_str
from .models import Score, UserGame
from .serializers import (
    ScoreSerializer,
    RegisterSerializer,
    PasswordResetSerializer,
    PasswordResetConfirmSerializer,
    UserGameSerializer,
    UserProfileSerializer,
)


class ScoreListCreateView(generics.ListCreateAPIView):
    serializer_class = ScoreSerializer
    permission_classes = [AllowAny]

    def get_queryset(self):
        game_id = self.request.query_params.get('game_id')
        qs = Score.objects.all()
        if game_id:
            qs = qs.filter(game_id=game_id)
        return qs[:10]

    def perform_create(self, serializer):
        user = self.request.user if self.request.user.is_authenticated else None
        serializer.save(user=user)


class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)
        if serializer.is_valid():
            user = serializer.save()
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'username': user.username}, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class LoginView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get('username', '').strip()
        password = request.data.get('password', '')
        if not User.objects.filter(username=username).exists():
            return Response({'detail': 'Username not found.'}, status=status.HTTP_401_UNAUTHORIZED)
        user = authenticate(username=username, password=password)
        if user:
            token, _ = Token.objects.get_or_create(user=user)
            return Response({'token': token.key, 'username': user.username})
        return Response({'detail': 'Incorrect password.'}, status=status.HTTP_401_UNAUTHORIZED)


class LogoutView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        request.user.auth_token.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class PasswordResetRequestView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetSerializer(data=request.data)
        if serializer.is_valid():
            email = serializer.validated_data['email']
            try:
                user = User.objects.get(email=email)
                uid = urlsafe_base64_encode(force_bytes(user.pk))
                token = default_token_generator.make_token(user)
                reset_token = f"{uid}.{token}"
                response_data: dict[str, str] = {'detail': 'Password reset link sent.'}
                # In production, send the reset_token via email only.
                # Expose it in the response body only in DEBUG mode for development convenience.
                if settings.DEBUG:
                    response_data['reset_token'] = reset_token
                return Response(response_data)
            except User.DoesNotExist:
                # Return success even if user not found to prevent email enumeration
                return Response({'detail': 'Password reset link sent.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class PasswordResetConfirmView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = PasswordResetConfirmSerializer(data=request.data)
        if serializer.is_valid():
            reset_token = serializer.validated_data['reset_token']
            new_password = serializer.validated_data['new_password']
            try:
                uid_b64, token = reset_token.rsplit('.', 1)
                uid = force_str(urlsafe_base64_decode(uid_b64))
                user = User.objects.get(pk=uid)
            except (ValueError, User.DoesNotExist):
                return Response({'detail': 'Invalid reset token.'}, status=status.HTTP_400_BAD_REQUEST)
            if not default_token_generator.check_token(user, token):
                return Response({'detail': 'Invalid or expired reset token.'}, status=status.HTTP_400_BAD_REQUEST)
            user.set_password(new_password)
            user.save()
            return Response({'detail': 'Password has been reset.'})
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserProfileView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        serializer = UserProfileSerializer(request.user)
        return Response(serializer.data)

    def patch(self, request):
        serializer = UserProfileSerializer(request.user, data=request.data, partial=True)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


class UserGameListView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        games = UserGame.objects.filter(user=request.user)
        serializer = UserGameSerializer(games, many=True)
        return Response(serializer.data)

    def post(self, request):
        game_id = request.data.get('game_id', '').strip()
        game_name = request.data.get('game_name', '').strip()
        if not game_id or not game_name:
            return Response(
                {'detail': 'game_id and game_name are required.'},
                status=status.HTTP_400_BAD_REQUEST,
            )
        user_game, created = UserGame.objects.get_or_create(
            user=request.user,
            game_id=game_id,
            defaults={'game_name': game_name},
        )
        serializer = UserGameSerializer(user_game)
        return Response(serializer.data, status=status.HTTP_201_CREATED if created else status.HTTP_200_OK)


class UserGameDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def delete(self, request, pk):
        try:
            user_game = UserGame.objects.get(pk=pk, user=request.user)
        except UserGame.DoesNotExist:
            return Response({'detail': 'Not found.'}, status=status.HTTP_404_NOT_FOUND)
        user_game.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)


class UserScoreView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Return the most-recent score per game for the authenticated user."""
        from django.db.models import Subquery, OuterRef
        latest_id_per_game = (
            Score.objects.filter(user=request.user, game_id=OuterRef('game_id'))
            .order_by('-created_at')
            .values('id')[:1]
        )
        scores = Score.objects.filter(
            user=request.user, id=Subquery(latest_id_per_game)
        ).order_by('game_id')
        serializer = ScoreSerializer(scores, many=True)
        return Response(serializer.data)

