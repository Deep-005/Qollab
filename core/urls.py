from django.urls import path
from . import views
from rest_framework_simplejwt.views import TokenRefreshView


urlpatterns = [
    # Authentication
    path('register/', views.RegisterView.as_view()),
    path('login/', views.LoginView.as_view()),
    path('refresh/', TokenRefreshView.as_view(), name='token_refresh'),
    
    # Jobs
    path('jobs/', views.JobListCreateView.as_view()),
    path('jobs/<int:job_id>/', views.JobDetailView.as_view()),
    path('jobs/<int:job_id>/match/', views.MatchCandidatesView.as_view()),
    
    # Resumes (no candidate endpoints)
    path('resumes/', views.ResumeCreateView.as_view()),
    path('resumes/batch/', views.BatchResumeUploadView.as_view()),
    path('resumes/count/', views.ResumeCountView.as_view()), 
    path('resumes/clear-all/', views.ClearAllResumesView.as_view()),
    path('resumes/<int:resume_id>/', views.ResumeDetailView.as_view()),
]