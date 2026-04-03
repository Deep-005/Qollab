from django.shortcuts import render
from django.views.decorators.csrf import ensure_csrf_cookie

@ensure_csrf_cookie
def create_job_page(request):
    """Step 1: Create a new job posting"""
    return render(request, 'create_job.html')

@ensure_csrf_cookie
def upload_resume_page(request, job_id):
    """Step 2: Upload resumes for a specific job"""
    context = {
        'job_id': job_id,
    }
    return render(request, 'upload_resume.html', context)

@ensure_csrf_cookie
def results_page(request, job_id):
    """Step 3: View matching results"""
    context = {
        'job_id': job_id,
    }
    return render(request, 'results.html', context)


def login_page(request):
    return render(request, 'login.html')

def register_page(request):
    return render(request, 'register.html')