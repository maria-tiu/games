from django.db import models
from django.contrib.auth.models import User


class Score(models.Model):
    player_name = models.CharField(max_length=50)
    score = models.IntegerField()
    lines_cleared = models.IntegerField(default=0)
    level = models.IntegerField(default=1)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-score']

    def __str__(self):
        return f"{self.player_name}: {self.score}"


class UserGame(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='user_games')
    game_id = models.CharField(max_length=50)
    game_name = models.CharField(max_length=100)
    added_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        unique_together = ('user', 'game_id')
        ordering = ['added_at']

    def __str__(self):
        return f"{self.user.username}: {self.game_name}"
