from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ("training", "0005_quizattempt"),
    ]

    operations = [
        migrations.AddField(
            model_name="quizattempt",
            name="submission_status",
            field=models.CharField(
                choices=[("graded", "Graded"), ("pending_review", "Pending Review")],
                default="graded",
                max_length=20,
            ),
        ),
        migrations.AddField(
            model_name="quizattempt",
            name="responses",
            field=models.JSONField(blank=True, default=dict),
        ),
        migrations.AddField(
            model_name="quizattempt",
            name="short_answer_scores",
            field=models.JSONField(blank=True, default=dict),
        ),
    ]
