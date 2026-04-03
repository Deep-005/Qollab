from django.db import models


class Resume(models.Model):
    resume_text = models.TextField(blank=True)
    file = models.FileField(upload_to='resumes/', null=True, blank=True)
    original_filename = models.CharField(max_length=500, blank=True, null=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.original_filename or f"Resume {self.id}"


class Job(models.Model):
    title = models.CharField(max_length=200)
    description = models.TextField()
    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return self.title


class MatchScore(models.Model):
    resume = models.ForeignKey(Resume, on_delete=models.CASCADE)
    job = models.ForeignKey(Job, on_delete=models.CASCADE)
    score = models.FloatField()
    keyword_match_score = models.FloatField(null=True, blank=True)
    matched_keywords = models.TextField(blank=True, null=True)  
    missing_keywords = models.TextField(blank=True, null=True)  
    query_type = models.CharField(max_length=20, default='full_description')

    def __str__(self):
        resume_name = self.resume.original_filename or f"Resume {self.resume.id}"
        return f"{resume_name} - {self.job.title} ({self.score})"