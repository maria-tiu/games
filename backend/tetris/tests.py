from django.test import TestCase, override_settings
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APIClient
from django.contrib.auth.models import User
from rest_framework.authtoken.models import Token
from .models import Score


class ScoreModelTest(TestCase):
    def test_create_score(self):
        score = Score.objects.create(
            player_name='Alice',
            score=500,
            lines_cleared=5,
            level=2,
        )
        self.assertEqual(str(score), 'Alice: 500')

    def test_score_ordering(self):
        Score.objects.create(player_name='Alice', score=100, lines_cleared=1, level=1)
        Score.objects.create(player_name='Bob', score=500, lines_cleared=5, level=2)
        scores = Score.objects.all()
        self.assertEqual(scores[0].player_name, 'Bob')


class ScoreAPITest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.url = reverse('score-list-create')

    def test_list_scores_empty(self):
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])

    def test_create_score(self):
        data = {
            'player_name': 'Alice',
            'score': 300,
            'lines_cleared': 3,
            'level': 1,
        }
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['player_name'], 'Alice')
        self.assertEqual(response.data['score'], 300)

    def test_list_scores_returns_top_10(self):
        for i in range(15):
            Score.objects.create(
                player_name=f'Player{i}',
                score=i * 100,
                lines_cleared=i,
                level=1,
            )
        response = self.client.get(self.url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 10)

    def test_create_score_missing_field(self):
        data = {'player_name': 'Alice'}
        response = self.client.post(self.url, data, format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)


class UserScoreHistoryTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='testuser', password='testpass')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_requires_authentication(self):
        self.client.credentials()
        url = reverse('user-score-history', kwargs={'game_id': 'tetris'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    def test_returns_last_10_for_game(self):
        for i in range(15):
            Score.objects.create(
                user=self.user,
                player_name='testuser',
                game_id='tetris',
                score=i * 100,
                lines_cleared=i,
                level=1,
            )
        url = reverse('user-score-history', kwargs={'game_id': 'tetris'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 10)

    def test_ordered_newest_first(self):
        Score.objects.create(user=self.user, player_name='testuser', game_id='tetris', score=100, lines_cleared=1, level=1)
        Score.objects.create(user=self.user, player_name='testuser', game_id='tetris', score=200, lines_cleared=2, level=1)
        url = reverse('user-score-history', kwargs={'game_id': 'tetris'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data[0]['score'], 200)
        self.assertEqual(response.data[1]['score'], 100)

    def test_only_returns_scores_for_specified_game(self):
        Score.objects.create(user=self.user, player_name='testuser', game_id='tetris', score=100, lines_cleared=1, level=1)
        Score.objects.create(user=self.user, player_name='testuser', game_id='2048', score=500, lines_cleared=0, level=1)
        url = reverse('user-score-history', kwargs={'game_id': 'tetris'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertEqual(response.data[0]['game_id'], 'tetris')

    def test_returns_empty_for_no_scores(self):
        url = reverse('user-score-history', kwargs={'game_id': 'tetris'})
        response = self.client.get(url)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data, [])


class LoginSecurityTest(TestCase):
    """API2:2023 – Broken Authentication: username enumeration & generic errors."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('auth-login')
        self.user = User.objects.create_user(
            username='secuser', email='sec@example.com', password='StrongPass1!'
        )

    def test_login_success_returns_token(self):
        response = self.client.post(
            self.url, {'username': 'secuser', 'password': 'StrongPass1!'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn('token', response.data)

    def test_login_wrong_password_returns_generic_error(self):
        response = self.client.post(
            self.url, {'username': 'secuser', 'password': 'WrongPass!'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # Must NOT reveal that the username exists (OWASP API2:2023)
        self.assertNotIn('Username not found', response.data.get('detail', ''))
        self.assertNotIn('Incorrect password', response.data.get('detail', ''))
        self.assertEqual(response.data['detail'], 'Invalid credentials.')

    def test_login_nonexistent_user_returns_same_generic_error(self):
        response = self.client.post(
            self.url, {'username': 'ghost', 'password': 'any'}, format='json'
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # Exact same message as wrong-password – no enumeration possible
        self.assertEqual(response.data['detail'], 'Invalid credentials.')


class ScoreValidationTest(TestCase):
    """API3:2023 – Broken Object Property Level Authorization: reject invalid score values."""

    def setUp(self):
        self.client = APIClient()
        self.url = reverse('score-list-create')

    def _valid_payload(self, **overrides):
        base = {'player_name': 'Tester', 'score': 100, 'lines_cleared': 5, 'level': 1}
        base.update(overrides)
        return base

    def test_negative_score_rejected(self):
        response = self.client.post(self.url, self._valid_payload(score=-1), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_score_above_max_rejected(self):
        response = self.client.post(self.url, self._valid_payload(score=10_000_001), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_negative_lines_cleared_rejected(self):
        response = self.client.post(self.url, self._valid_payload(lines_cleared=-1), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_lines_cleared_above_max_rejected(self):
        response = self.client.post(self.url, self._valid_payload(lines_cleared=10_001), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_level_zero_rejected(self):
        response = self.client.post(self.url, self._valid_payload(level=0), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_level_above_max_rejected(self):
        response = self.client.post(self.url, self._valid_payload(level=1_001), format='json')
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)

    def test_valid_boundary_values_accepted(self):
        response = self.client.post(
            self.url,
            self._valid_payload(score=10_000_000, lines_cleared=10_000, level=1_000),
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)


class AuthenticationApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_register_and_login(self):
        register_response = self.client.post(
            reverse('auth-register'),
            {
                'username': 'newuser',
                'email': 'newuser@example.com',
                'password': 'StrongPass123!',
                'password2': 'StrongPass123!',
            },
            format='json',
        )
        self.assertEqual(register_response.status_code, status.HTTP_201_CREATED)
        self.assertIn('token', register_response.data)

        login_response = self.client.post(
            reverse('auth-login'),
            {'username': 'newuser', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)
        self.assertEqual(login_response.data['username'], 'newuser')
        self.assertIn('token', login_response.data)

    def test_login_unknown_username(self):
        response = self.client.post(
            reverse('auth-login'),
            {'username': 'missing-user', 'password': 'StrongPass123!'},
            format='json',
        )
        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)
        # Updated to match the generic error message introduced to prevent
        # username enumeration (OWASP API2:2023).
        self.assertEqual(response.data['detail'], 'Invalid credentials.')


class PasswordResetApiTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(
            username='reset-user',
            email='reset@example.com',
            password='InitialPass123!',
        )

    @override_settings(DEBUG=True)
    def test_password_reset_flow(self):
        request_response = self.client.post(
            reverse('auth-password-reset'),
            {'email': self.user.email},
            format='json',
        )
        self.assertEqual(request_response.status_code, status.HTTP_200_OK)
        self.assertIn('reset_token', request_response.data)

        confirm_response = self.client.post(
            reverse('auth-password-reset-confirm'),
            {
                'reset_token': request_response.data['reset_token'],
                'new_password': 'UpdatedPass123!',
                'new_password2': 'UpdatedPass123!',
            },
            format='json',
        )
        self.assertEqual(confirm_response.status_code, status.HTTP_200_OK)

        login_response = self.client.post(
            reverse('auth-login'),
            {'username': self.user.username, 'password': 'UpdatedPass123!'},
            format='json',
        )
        self.assertEqual(login_response.status_code, status.HTTP_200_OK)


class UserScoreViewTest(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username='scoreuser', password='scorepass')
        self.token, _ = Token.objects.get_or_create(user=self.user)
        self.client.credentials(HTTP_AUTHORIZATION=f'Token {self.token.key}')

    def test_returns_latest_score_per_game_for_user_and_legacy_scores(self):
        Score.objects.create(
            user=self.user,
            player_name=self.user.username,
            game_id='tetris',
            score=100,
            lines_cleared=1,
            level=1,
        )
        Score.objects.create(
            user=self.user,
            player_name=self.user.username,
            game_id='tetris',
            score=200,
            lines_cleared=2,
            level=1,
        )
        Score.objects.create(
            player_name=self.user.username,
            game_id='2048',
            score=500,
            lines_cleared=0,
            level=1,
        )

        response = self.client.get(reverse('user-scores'))
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 2)
        self.assertEqual(response.data[0]['game_id'], '2048')
        self.assertEqual(response.data[1]['game_id'], 'tetris')
        self.assertEqual(response.data[1]['score'], 200)
