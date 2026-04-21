from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('tetris', '0002_usergame'),
    ]

    operations = [
        migrations.AddField(
            model_name='score',
            name='game_id',
            field=models.CharField(default='tetris', max_length=50),
        ),
    ]
