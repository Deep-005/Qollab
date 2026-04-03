# utils.py
import PyPDF2
from .preprocessing import clean_resume_text

def extract_text_from_pdf(file):
    text = ""
    reader = PyPDF2.PdfReader(file)
    
    for page in reader.pages:
        page_text = page.extract_text() or ""
        text += page_text + " "
    
    # Clean the extracted text
    cleaned_text = clean_resume_text(text)
    
    return cleaned_text