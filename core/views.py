import json
import logging
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from .models import Resume, Job, MatchScore
from .serializers import JobSerializer
from .matching import rank_candidates
from .utils import extract_text_from_pdf
from .preprocessing import clean_resume_text

from django.contrib.auth.models import User
from django.contrib.auth import authenticate

from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken

from drf_spectacular.utils import extend_schema, OpenApiParameter, OpenApiResponse

from rest_framework.pagination import PageNumberPagination


class StandardResultsPagination(PageNumberPagination):
    page_size = 25
    page_size_query_param = 'page_size'
    max_page_size = 100
    page_query_param = 'page'



# Configure logger
logger = logging.getLogger('qollab')


# 🔐 Register
@extend_schema(
    tags=['Authentication'],
    description='Register a new user account',
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'username': {'type': 'string', 'example': 'recruiter123'},
                'password': {'type': 'string', 'example': 'securepass123'}
            }
        }
    },
    responses={
        201: OpenApiResponse(description='User created successfully'),
        400: OpenApiResponse(description='Missing username/password or user exists'),
    }
)
class RegisterView(APIView):
    """
    Register a new user account.
    Creates a new user with username and password for API authentication.
    All users start with recruiter-level access.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        if not username or not password:
            logger.warning(f"Registration failed: Missing username or password")
            return Response(
                {"error": "Username and password required"},
                status=status.HTTP_400_BAD_REQUEST
            )

        if User.objects.filter(username=username).exists():
            logger.warning(f"Registration failed: Username '{username}' already exists")
            return Response(
                {"error": "User already exists"},
                status=status.HTTP_400_BAD_REQUEST
            )

        User.objects.create_user(username=username, password=password)
        logger.info(f"New user registered: {username}")

        return Response(
            {"message": "User created successfully"},
            status=status.HTTP_201_CREATED
        )


# 🔐 Login
@extend_schema(
    tags=['Authentication'],
    description='Login and receive JWT tokens',
    request={
        'application/json': {
            'type': 'object',
            'properties': {
                'username': {'type': 'string', 'example': 'recruiter123'},
                'password': {'type': 'string', 'example': 'securepass123'}
            }
        }
    },
    responses={
        200: OpenApiResponse(description='Login successful', response={
            'type': 'object',
            'properties': {
                'access': {'type': 'string', 'example': 'eyJhbGciOiJIUzI1NiIs...'},
                'refresh': {'type': 'string', 'example': 'eyJhbGciOiJIUzI1NiIs...'}
            }
        }),
        401: OpenApiResponse(description='Invalid credentials'),
    }
)
class LoginView(APIView):
    """
    Authenticate user and return JWT tokens.
    Validates credentials and returns access and refresh tokens for API authentication.
    """
    permission_classes = [AllowAny]

    def post(self, request):
        username = request.data.get("username")
        password = request.data.get("password")

        user = authenticate(username=username, password=password)

        if user is None:
            logger.warning(f"Login failed for username: {username}")
            return Response(
                {"error": "Invalid credentials"},
                status=status.HTTP_401_UNAUTHORIZED
            )

        refresh = RefreshToken.for_user(user)
        logger.info(f"User logged in: {username}")

        return Response({
            "access": str(refresh.access_token),
            "refresh": str(refresh)
        })


# 🧾 Create Job
@extend_schema(
    tags=['Jobs'],
    description='Create a new job posting',
    request=JobSerializer,
    responses={
        201: JobSerializer,
        400: OpenApiResponse(description='Invalid input data'),
    }
)
class JobListCreateView(APIView):
    """
    Create a new job posting.
    Creates a job with title and description that will be used for matching
    with candidate resumes.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request):
        """Get all jobs"""
        jobs = Job.objects.all().order_by('-created_at')
        serializer = JobSerializer(jobs, many=True)
        return Response(serializer.data)

    def post(self, request):
        logger.info(f"Job creation attempt by user: {request.user.username}")
        serializer = JobSerializer(data=request.data)

        if serializer.is_valid():
            job = serializer.save()
            logger.info(f"Job created: {job.title} (ID: {job.id}) by {request.user.username}")
            return Response(serializer.data, status=status.HTTP_201_CREATED)

        logger.warning(f"Job creation failed for user {request.user.username}: {serializer.errors}")
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


# 📄 Upload Single Resume
@extend_schema(
    tags=['Resumes'],
    description='Upload a candidate resume (PDF file or manual text)',
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'file': {'type': 'string', 'format': 'binary', 'description': 'PDF file containing resume'},
                'resume_text': {'type': 'string', 'description': 'Manual resume text input'},
            }
        }
    },
    responses={
        201: OpenApiResponse(description='Resume uploaded successfully', response={
            'type': 'object',
            'properties': {
                'message': {'type': 'string'},
                'resume_id': {'type': 'integer'},
                'filename': {'type': 'string'},
                'text_length': {'type': 'integer'}
            }
        }),
        400: OpenApiResponse(description='Missing required data or invalid file'),
    }
)
class ResumeCreateView(APIView):
    """
    Upload a candidate resume.
    Accepts PDF files or manual text input.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        logger.info(f"Resume upload attempt by user: {request.user.username}")
        
        file = request.FILES.get("file")
        manual_text = request.data.get("resume_text", "")

        if not file and not manual_text:
            logger.warning(f"Resume upload failed: no file or text provided")
            return Response(
                {"error": "Provide resume file or text"},
                status=status.HTTP_400_BAD_REQUEST
            )

        resume_text = ""
        original_filename = None

        # Extract from PDF and clean
        if file:
            try:
                resume_text = extract_text_from_pdf(file)
                original_filename = file.name
                logger.debug(f"Extracted {len(resume_text)} chars from PDF")
            except Exception as e:
                logger.error(f"PDF extraction failed: {str(e)}", exc_info=True)
                return Response(
                    {"error": "Invalid PDF file"},
                    status=status.HTTP_400_BAD_REQUEST
                )

        # Use manual text (also clean it)
        if manual_text:
            resume_text = clean_resume_text(manual_text)
            logger.debug(f"Manual text cleaned: {len(resume_text)} chars")

        # Create resume 
        try:
            resume = Resume.objects.create(
                resume_text=resume_text,
                file=file,
                original_filename=original_filename
            )
            logger.info(f"Resume uploaded: {resume.id} - {original_filename} by {request.user.username}")
        except Exception as e:
            logger.error(f"Failed to save resume: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to save resume"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        return Response(
            {
                "message": "Resume uploaded successfully",
                "resume_id": resume.id,
                "filename": original_filename or "Manual text",
                "text_length": len(resume_text)
            },
            status=status.HTTP_201_CREATED
        )


# 📄 Upload Multiple Resumes (Batch)
@extend_schema(
    tags=['Resumes'],
    description='Upload multiple resumes at once (batch upload). Supports PDF files only.',
    request={
        'multipart/form-data': {
            'type': 'object',
            'properties': {
                'files': {
                    'type': 'array',
                    'items': {'type': 'string', 'format': 'binary'},
                    'description': 'List of PDF files to upload'
                },
            }
        }
    },
    responses={
        200: OpenApiResponse(description='Batch upload completed with results'),
        400: OpenApiResponse(description='No files provided'),
    }
)
class BatchResumeUploadView(APIView):
    """
    Upload multiple resumes in a single request.
    
    Accepts multiple PDF files and processes each one, returning detailed results
    including successes and failures. This is more efficient than uploading
    resumes one by one.
    """
    permission_classes = [IsAuthenticated]

    def post(self, request):
        files = request.FILES.getlist('files')
        
        if not files:
            logger.warning(f"Batch upload attempt with no files by user: {request.user.username}")
            return Response(
                {"error": "No files provided. Please upload at least one file."},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        logger.info(f"Batch upload started by {request.user.username}: {len(files)} files")
        
        results = []
        success_count = 0
        failed_count = 0
        
        for file in files:
            filename = file.name
            
            # Check file extension
            if not filename.lower().endswith('.pdf'):
                failed_count += 1
                results.append({
                    "filename": filename,
                    "status": "failed",
                    "error": "Only PDF files are supported"
                })
                logger.warning(f"Batch upload: Skipped {filename} - not a PDF")
                continue
            
            try:
                # Extract text from PDF
                extracted_text = extract_text_from_pdf(file)
                
                if not extracted_text:
                    failed_count += 1
                    results.append({
                        "filename": filename,
                        "status": "failed",
                        "error": "No text could be extracted from PDF"
                    })
                    logger.warning(f"Batch upload: No text extracted from {filename}")
                    continue
                
                # Clean the resume text
                cleaned_text = clean_resume_text(extracted_text)
                
                # Create resume directly
                resume = Resume.objects.create(
                    resume_text=cleaned_text,
                    file=file,
                    original_filename=filename
                )
                
                success_count += 1
                results.append({
                    "filename": filename,
                    "status": "success",
                    "resume_id": resume.id,
                    "text_length": len(cleaned_text)
                })
                
                logger.debug(f"Batch upload: Successfully processed {filename}")
                
            except Exception as e:
                failed_count += 1
                results.append({
                    "filename": filename,
                    "status": "failed",
                    "error": str(e)
                })
                logger.error(f"Batch upload: Failed to process {filename}: {str(e)}", exc_info=True)
        
        logger.info(f"Batch upload completed: {success_count} succeeded, {failed_count} failed")
        
        return Response({
            "uploaded": results,
            "success_count": success_count,
            "failed_count": failed_count,
            "total_count": len(files)
        }, status=status.HTTP_200_OK)


# 🤖 Match Candidates
@extend_schema(
    tags=['Matching'],
    description='Rank resumes for a specific job using AI/NLP',
    parameters=[
        OpenApiParameter(name='job_id', description='Job ID to match against', required=True, type=int, location=OpenApiParameter.PATH),
    ],
    responses={
        200: OpenApiResponse(description='Ranked list of resumes', response={
            'type': 'array',
            'items': {
                'type': 'object',
                'properties': {
                    'resume_id': {'type': 'integer'},
                    'resume_filename': {'type': 'string'},
                    'resume_url': {'type': 'string'},
                    'score': {'type': 'number', 'format': 'float'},
                    'semantic_score': {'type': 'number'},
                    'keyword_score': {'type': 'number'},
                    'matched_keywords': {'type': 'array', 'items': {'type': 'string'}},
                    'missing_keywords': {'type': 'array', 'items': {'type': 'string'}},
                    'query_type': {'type': 'string'}
                }
            }
        }),
        404: OpenApiResponse(description='Job not found'),
    }
)
class MatchCandidatesView(APIView):
    """
    Match resumes against a job posting.
    Uses AI/NLP to rank resumes based on relevance to job description.
    Returns ranked list with similarity scores and keyword breakdown.
    """
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        logger.info(f"Matching resumes for job {job_id} by user: {request.user.username}")
        
        # 🔹 1. Get Job
        try:
            job = Job.objects.get(id=job_id)
            logger.debug(f"Found job: {job.title} (ID: {job.id})")
        except Job.DoesNotExist:
            logger.warning(f"Job {job_id} not found")
            return Response(
                {"error": "Job not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # 🔹 2. Get all resumes
        try:
            resumes = Resume.objects.all()
            logger.debug(f"Found {resumes.count()} resumes in system")
        except Exception as e:
            logger.error(f"Failed to fetch resumes: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to retrieve resumes"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        if not resumes:
            logger.info(f"No resumes found for matching job {job_id}")
            return Response(
                {"message": "No resumes found"},
                status=status.HTTP_200_OK
            )

        # 🔹 3. Prepare data for ranking (resume_id, resume_text)
        resume_data = [
            (res.id, res.resume_text)
            for res in resumes
        ]

        # 🔹 4. AI ranking
        try:
            logger.info(f"Running ranking algorithm for job {job_id}")
            ranked = rank_candidates(job.description, resume_data)
            logger.debug(f"Ranking completed: {len(ranked)} resumes scored")
            if ranked:
                logger.debug(f"Query type detected: {ranked[0]['query_type']}")
        except Exception as e:
            logger.error(f"Ranking algorithm failed: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to rank resumes"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )

        # 🔹 5. Save match scores to database
        try:
            deleted_count = MatchScore.objects.filter(job=job).delete()[0]
            if deleted_count > 0:
                logger.debug(f"Deleted {deleted_count} existing scores for job {job_id}")
            
            saved_count = 0
            for item in ranked:
                try:
                    resume = Resume.objects.get(id=item["candidate_id"])
                    MatchScore.objects.create(
                        resume=resume,
                        job=job,
                        score=item["score"],
                        keyword_match_score=item["keyword_score"],
                        matched_keywords=json.dumps(item["matched_keywords"]),
                        missing_keywords=json.dumps(item["missing_keywords"]),
                        query_type=item["query_type"]
                    )
                    saved_count += 1
                except Resume.DoesNotExist:
                    logger.warning(f"Resume {item['candidate_id']} not found, skipping")
                    continue
            
            logger.info(f"Saved {saved_count} match scores for job {job_id}")
        except Exception as e:
            logger.error(f"Failed to save match scores: {str(e)}", exc_info=True)

        # 🔹 6. Build results list
        results = []
        for item in ranked:
            try:
                resume = Resume.objects.get(id=item["candidate_id"])
                results.append({
                    "resume_id": resume.id,
                    "resume_filename": resume.original_filename or f"Resume_{resume.id}.pdf",
                    "resume_url": resume.file.url if resume.file else None,
                    "score": round(item["score"], 3),
                    "semantic_score": round(item["semantic_score"], 3),
                    "keyword_score": round(item["keyword_score"], 3),
                    "matched_keywords": item["matched_keywords"][:15],
                    "missing_keywords": item["missing_keywords"][:15],
                    "query_type": item["query_type"]
                })
            except Resume.DoesNotExist:
                logger.warning(f"Resume {item['candidate_id']} not found in database")
                continue

        # 🔹 7. Apply pagination
        paginator = StandardResultsPagination()
        page = paginator.paginate_queryset(results, request)
        
        if page is not None:
            return paginator.get_paginated_response(page)
        
        logger.info(f"Match completed for job {job_id}: {len(results)} resumes ranked")
        return Response(results, status=status.HTTP_200_OK)


# 🔍 Job Detail View
@extend_schema(tags=['Jobs'])
class JobDetailView(APIView):
    """Get job details by ID"""
    permission_classes = [IsAuthenticated]

    def get(self, request, job_id):
        try:
            job = Job.objects.get(id=job_id)
            serializer = JobSerializer(job)
            return Response(serializer.data)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)

    def delete(self, request, job_id):
        """Delete a job"""
        try:
            job = Job.objects.get(id=job_id)
            job.delete()
            logger.info(f"Job {job_id} deleted by {request.user.username}")
            return Response({"message": "Job deleted successfully"}, status=status.HTTP_200_OK)
        except Job.DoesNotExist:
            return Response({"error": "Job not found"}, status=status.HTTP_404_NOT_FOUND)


# 🗑️ Resume Detail View (Delete only)
@extend_schema(tags=['Resumes'])
class ResumeDetailView(APIView):
    """Delete a resume by ID"""
    permission_classes = [IsAuthenticated]

    def delete(self, request, resume_id):
        """Delete a resume"""
        try:
            resume = Resume.objects.get(id=resume_id)
            filename = resume.original_filename or f"Resume_{resume.id}"
            resume.delete()
            logger.info(f"Resume {resume_id} ({filename}) deleted by {request.user.username}")
            return Response({"message": "Resume deleted successfully"}, status=status.HTTP_200_OK)
        except Resume.DoesNotExist:
            return Response({"error": "Resume not found"}, status=status.HTTP_404_NOT_FOUND)
        

        
@extend_schema(tags=['Resumes'])
class ResumeCountView(APIView):
    """Get count of resumes in the system"""
    permission_classes = [IsAuthenticated]

    def get(self, request):
        count = Resume.objects.count()
        return Response({"count": count}, status=status.HTTP_200_OK)



@extend_schema(tags=['Resumes'])
class ClearAllResumesView(APIView):
    """Delete all resumes from the system"""
    permission_classes = [IsAuthenticated]

    def delete(self, request):
        try:
            count = Resume.objects.count()
            Resume.objects.all().delete()
            logger.info(f"All {count} resumes deleted by {request.user.username}")
            return Response({
                "message": f"Successfully deleted {count} resumes",
                "deleted_count": count
            }, status=status.HTTP_200_OK)
        except Exception as e:
            logger.error(f"Failed to delete all resumes: {str(e)}", exc_info=True)
            return Response(
                {"error": "Failed to delete resumes"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )


