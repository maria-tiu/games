from rest_framework import serializers
from django.contrib.auth.models import User
from django.contrib.auth.password_validation import validate_password
from .models import Score, UserGame


class ScoreSerializer(serializers.ModelSerializer):
    # Enforce sensible bounds to prevent garbage or malicious data injection
    # (OWASP API3:2023 – Broken Object Property Level Authorization).
    score = serializers.IntegerField(min_value=0, max_value=10_000_000)
    lines_cleared = serializers.IntegerField(min_value=0, max_value=10_000)
    level = serializers.IntegerField(min_value=1, max_value=1_000)

    class Meta:
        model = Score
        fields = ['id', 'game_id', 'player_name', 'score', 'lines_cleared', 'level', 'created_at']
        read_only_fields = ['id', 'created_at']


class RegisterSerializer(serializers.Serializer):
    username = serializers.CharField(max_length=150)
    email = serializers.EmailField()
    password = serializers.CharField(write_only=True)
    password2 = serializers.CharField(write_only=True)

    def validate_username(self, value):
        if User.objects.filter(username=value).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        if User.objects.filter(email=value).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

    def validate(self, data):
        if data['password'] != data['password2']:
            raise serializers.ValidationError({'password2': 'Passwords do not match.'})
        validate_password(data['password'])
        return data

    def save(self):
        user = User.objects.create_user(
            username=self.validated_data['username'],
            email=self.validated_data['email'],
            password=self.validated_data['password'],
        )
        return user


class PasswordResetSerializer(serializers.Serializer):
    email = serializers.EmailField()


class PasswordResetConfirmSerializer(serializers.Serializer):
    reset_token = serializers.CharField()
    new_password = serializers.CharField(write_only=True)
    new_password2 = serializers.CharField(write_only=True)

    def validate(self, data):
        if data['new_password'] != data['new_password2']:
            raise serializers.ValidationError({'new_password2': 'Passwords do not match.'})
        validate_password(data['new_password'])
        return data


class UserGameSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserGame
        fields = ['id', 'game_id', 'game_name', 'added_at']
        read_only_fields = ['id', 'added_at']


class UserProfileSerializer(serializers.ModelSerializer):
    class Meta:
        model = User
        fields = ['username', 'email']

    def validate_username(self, value):
        user = self.instance
        if User.objects.filter(username=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('Username already taken.')
        return value

    def validate_email(self, value):
        user = self.instance
        if User.objects.filter(email=value).exclude(pk=user.pk).exists():
            raise serializers.ValidationError('Email already registered.')
        return value

