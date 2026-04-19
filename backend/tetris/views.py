from rest_framework import generics
from rest_framework.response import Response
from rest_framework import status
from .models import Score
from .serializers import ScoreSerializer


class ScoreListCreateView(generics.ListCreateAPIView):
    serializer_class = ScoreSerializer

    def get_queryset(self):
        return Score.objects.all()[:10]
