from rest_framework import serializers
from .models import Resume, Job, MatchScore


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = '__all__'


class JobSerializer(serializers.ModelSerializer):
    class Meta:
        model = Job
        fields = '__all__'


class MatchScoreSerializer(serializers.ModelSerializer):
    resume = ResumeSerializer(read_only=True)
    job = JobSerializer(read_only=True)

    class Meta:
        model = MatchScore
        fields = '__all__'


class MatchResponseSerializer(serializers.Serializer):
    """Serializer for match results response"""
    resume_id = serializers.IntegerField()
    resume_filename = serializers.CharField()
    resume_url = serializers.CharField(required=False, allow_null=True)
    score = serializers.FloatField()
    semantic_score = serializers.FloatField()
    keyword_score = serializers.FloatField()
    matched_keywords = serializers.ListField(child=serializers.CharField())
    missing_keywords = serializers.ListField(child=serializers.CharField())
    query_type = serializers.CharField()


class BatchUploadResultSerializer(serializers.Serializer):
    """Serializer for individual file upload result in batch"""
    filename = serializers.CharField()
    status = serializers.CharField()
    resume_id = serializers.IntegerField(required=False, allow_null=True)
    error = serializers.CharField(required=False, allow_null=True)
    text_length = serializers.IntegerField(required=False, allow_null=True)


class BatchUploadResponseSerializer(serializers.Serializer):
    """Serializer for batch upload response"""
    uploaded = BatchUploadResultSerializer(many=True)
    success_count = serializers.IntegerField()
    failed_count = serializers.IntegerField()
    total_count = serializers.IntegerField()