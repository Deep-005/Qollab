from django.urls import path
from . import views

urlpatterns = [
    # Authentication
    path('', views.login_page, name='login'),
    path('register/', views.register_page, name='register'),
    
    # Job Management
    path('jobs/create/', views.create_job_page, name='create_job'),
    path('jobs/<int:job_id>/upload/', views.upload_resume_page, name='upload_resume'),
    path('jobs/<int:job_id>/results/', views.results_page, name='results'),
    
]