<h1># 📄 Qollab - AI Resume Matcher</h1>

An intelligent API that matches candidate resumes to job descriptions using AI/NLP, providing recruiters with ranked candidate suggestions.
<br>View project live at: 

<h2>## 🎯 Project Overview</h2>

Qollab is a comprehensive resume matching system that leverages Natural Language Processing (NLP) and Machine Learning algorithms to help recruiters find the best candidates for their job openings. Recruiters can upload multiple resumes (PDF format), create job postings, and receive AI-powered ranked recommendations based on resume relevance.
The system uses a hybrid scoring approach combining **TF-IDF vectorization**, **cosine similarity**, and **keyword matching** to provide accurate and explainable results. It also features smart query detection that can handle both detailed job descriptions and quick keyword searches.

<h2>## ✨ Features</h2>

- 🔐 **JWT Authentication** - Secure login/register for recruiters and admins
- 📄 **Resume Management** - Single or batch PDF upload with text extraction
- 💼 **Job Posting** - Create, edit, and reuse job descriptions
- 🤖 **AI-Powered Matching** - Hybrid scoring (semantic + keyword) with explainable results
- 🎯 **Smart Query Detection** - Auto-detects keyword searches vs full descriptions
- 📊 **Keyword Breakdown** - Shows matched and missing keywords for each candidate
- 📱 **Responsive UI** - Modern interface that works on desktop and mobile
- 🚀 **RESTful API** - Complete API with Swagger documentation
- 🗄️ **Admin Panel** - Built-in Django admin for data management
- 📝 **Pagination** - Efficient handling of large result sets

<h2>## 🛠️ Tech Stack</h2>

| Category | Technologies |
|----------|-------------|
| **Backend** | Django, Django REST Framework |
| **AI/ML** | scikit-learn (TF-IDF, Cosine Similarity) |
| **Database** | SQLite (dev) / PostgreSQL (production) |
| **Authentication** | JWT (SimpleJWT) |
| **Frontend** | HTML5, CSS3, JavaScript, Tailwind CSS |
| **File Processing** | PyPDF2 |
| **API Documentation** | drf-spectacular (Swagger/ReDoc) |
| **Deployment** | Render / PythonAnywhere |

<h2>## 📋 Prerequisites</h2>

- Python 3.10+
- Django 4.0+
- pip package manager
- Git

<h2>## 🚀 Installation</h2>

### 1. Clone the repository<br>

git clone https://github.com/Deep-005/Qollab.git<br>
cd Qollab<br><br>

### 2. Create virtual environment<br>
Open termminal or bash(windows)<br>
python -m venv venv<br>
venv\Scripts\activate<br><br>

### 3. Install dependencies<br>
Open terminal<br>
pip install -r requirements.txt<br><br>

### 4. Configure environment variables<br>
Create a .env file in the project root and add the following:<br><br>

SECRET_KEY=your-secret-key-here<br>
DEBUG=True<br>
ALLOWED_HOSTS=localhost,127.0.0.1<br><br>

### 5. Run migrations<br>
Within terminal and run<br>
python manage.py migrate<br><br>

### 6. Create superuser (admin)<br>
Open terminal and run<br>
python manage.py createsuperuser<br><br>

### 7. Run development server<br>
Open terminal and run<br>
python manage.py runserver<br><br>

### 8. Access the application<br>

Frontend: http://127.0.0.1:8000/<br>
Admin Panel: http://127.0.0.1:8000/admin/<br>
API Docs: http://127.0.0.1:8000/api/docs/<br><br>

<h2>📡 API Endpoints</h2>
Method	Endpoint	Description	Auth Required<br><br>
POST	/api/register/	User registration	<br>
POST	/api/login/	JWT login	<br>
POST	/api/refresh/	Refresh JWT token	<br>
POST	/api/jobs/	Create job posting	<br>
GET	/api/jobs/	List all jobs	<br>
GET	/api/jobs/{id}/	Get job details	<br>
GET	/api/jobs/{id}/match/	Get ranked candidates	<br>
POST	/api/resumes/batch/	Batch upload resumes	<br>
GET	/api/resumes/count/	Get resume count	<br>
DELETE	/api/resumes/clear-all/	Delete all resumes	<br>
DELETE	/api/resumes/{id}/	Delete single resume	<br>


<h2>🎨 Screenshots</h2>
Login Page
<img width="2880" height="1564" alt="Screenshot (138)" src="https://github.com/user-attachments/assets/4e75310b-631c-48c2-b655-853c0a9e9497" />

Register Page
<img width="2880" height="1561" alt="Screenshot (139)" src="https://github.com/user-attachments/assets/17c3de54-e3c1-4355-8bc9-132d251e39f3" />

Create Job Page
<img width="2880" height="1567" alt="Screenshot (140)" src="https://github.com/user-attachments/assets/29d6f514-c869-42d5-a3e0-2ed1499dce31" />

Upload Resumes Page
<img width="2880" height="1558" alt="Screenshot (142)" src="https://github.com/user-attachments/assets/9705cc5e-c9af-48ec-bb52-cf4795fb8fc7" />

Results Page with Keyword Breakdown
<img width="2880" height="1561" alt="Screenshot (143)" src="https://github.com/user-attachments/assets/7324bf4a-51e9-45b0-94b3-fad04da39ec0" />

Admin Panel
<img width="2880" height="1570" alt="Screenshot (144)" src="https://github.com/user-attachments/assets/26bfe9b5-0860-4069-a4a2-c60fdcad4d31" />

API Documentation (Swagger)
<img width="2880" height="1573" alt="Screenshot (145)" src="https://github.com/user-attachments/assets/7a55caf5-e753-465a-a682-fb543a4e990f" />
<img width="2880" height="1573" alt="Screenshot (146)" src="https://github.com/user-attachments/assets/3d668bc0-36e9-4918-8f86-1c8b403496f4" />
