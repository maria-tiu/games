from django.urls import path
from .views import (
    ScoreListCreateView,
    RegisterView,
    LoginView,
    LogoutView,
    PasswordResetRequestView,
    PasswordResetConfirmView,
    UserProfileView,
    UserGameListView,
    UserGameDetailView,
    UserScoreView,
    UserScoreHistoryView,
)

urlpatterns = [
    path('scores/', ScoreListCreateView.as_view(), name='score-list-create'),
    path('auth/register/', RegisterView.as_view(), name='auth-register'),
    path('auth/login/', LoginView.as_view(), name='auth-login'),
    path('auth/logout/', LogoutView.as_view(), name='auth-logout'),
    path('auth/password-reset/', PasswordResetRequestView.as_view(), name='auth-password-reset'),
    path('auth/password-reset-confirm/', PasswordResetConfirmView.as_view(), name='auth-password-reset-confirm'),
    path('auth/profile/', UserProfileView.as_view(), name='auth-profile'),
    path('auth/games/', UserGameListView.as_view(), name='user-games-list'),
    path('auth/games/<int:pk>/', UserGameDetailView.as_view(), name='user-game-detail'),
    path('auth/my-scores/', UserScoreView.as_view(), name='user-scores'),
    path('auth/my-scores/<str:game_id>/', UserScoreHistoryView.as_view(), name='user-score-history'),
]

