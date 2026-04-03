from django.shortcuts import render
from django.contrib.auth.decorators import login_required
from django.views.decorators.csrf import ensure_csrf_cookie


@ensure_csrf_cookie
def login_page(request):
    """Serve login page with CSRF token"""
    return render(request, 'login.html')

def register_page(request):
    """Serve registration page with CSRF token"""
    return render(request, 'register.html')

@ensure_csrf_cookie
def create_job_page(request):
    """Step 1: Create a new job posting"""
    return render(request, 'create_job.html')

@login_required
@ensure_csrf_cookie
def upload_resume_page(request, job_id):
    """Step 2: Upload resumes for a specific job"""
    context = {
        'job_id': job_id,
    }
    return render(request, 'upload_resume.html', context)

@login_required
@ensure_csrf_cookie
def results_page(request, job_id):
    """Step 3: View matching results"""
    context = {
        'job_id': job_id,
    }
    return render(request, 'results.html', context)

