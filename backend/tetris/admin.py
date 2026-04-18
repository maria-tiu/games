from django.contrib import admin
from .models import Score


@admin.register(Score)
class ScoreAdmin(admin.ModelAdmin):
    list_display = ['player_name', 'score', 'lines_cleared', 'level', 'created_at']
    list_filter = ['level']
    search_fields = ['player_name']
    ordering = ['-score']
