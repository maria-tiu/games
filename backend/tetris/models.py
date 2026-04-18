from django.db import models


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
