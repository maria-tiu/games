from django.urls import path
from .views import ScoreListCreateView

urlpatterns = [
    path('scores/', ScoreListCreateView.as_view(), name='score-list-create'),
]
