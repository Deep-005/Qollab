from django.contrib import admin
from .models import Resume, Job, MatchScore


@admin.register(Resume)
class ResumeAdmin(admin.ModelAdmin):
    """Admin interface for Resume model"""
    list_display = ('original_filename', 'uploaded_at', 'has_file', 'id')
    list_filter = ('uploaded_at',)
    search_fields = ('original_filename', 'resume_text')
    
    def has_file(self, obj):
        """Display whether a file exists"""
        return bool(obj.file)
    has_file.boolean = True
    has_file.short_description = 'Has File'


@admin.register(Job)
class JobAdmin(admin.ModelAdmin):
    """Admin interface for Job model"""
    list_display = ('title', 'created_at', 'description_preview', 'id')
    list_filter = ('created_at',)
    search_fields = ('title', 'description')
    
    def description_preview(self, obj):
        """Show first 100 characters of description"""
        if obj.description:
            preview = obj.description[:100]
            if len(obj.description) > 100:
                preview += '...'
            return preview
        return '-'
    description_preview.short_description = 'Description'


@admin.register(MatchScore)
class MatchScoreAdmin(admin.ModelAdmin):
    """Admin interface for MatchScore model"""
    list_display = ('resume_name', 'job_title', 'score_percentage', 'id')
    list_filter = ('score', 'query_type')
    search_fields = ('resume__original_filename', 'resume__resume_text', 'job__title')
    
    def resume_name(self, obj):
        """Display resume filename"""
        return obj.resume.original_filename or f"Resume {obj.resume.id}"
    resume_name.short_description = 'Resume'
    resume_name.admin_order_field = 'resume__original_filename'
    
    def job_title(self, obj):
        """Display job title"""
        return obj.job.title
    job_title.short_description = 'Job'
    job_title.admin_order_field = 'job__title'
    
    def score_percentage(self, obj):
        """Display score as percentage with color coding"""
        percentage = obj.score * 100
        if obj.score >= 0.8:
            color = '#28a745'  # Green
        elif obj.score >= 0.6:
            color = '#ffc107'  # Yellow
        elif obj.score >= 0.4:
            color = '#fd7e14'  # Orange
        else:
            color = '#dc3545'  # Red
        from django.utils.html import format_html
        return format_html('<span style="color: {}; font-weight: bold;">{:.1f}%</span>', color, percentage)
    score_percentage.short_description = 'Score'
    score_percentage.admin_order_field = 'score'