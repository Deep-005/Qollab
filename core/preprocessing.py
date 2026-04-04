import re
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS

def clean_resume_text(text):
    """
    Clean and normalize resume text before storage
    """
    if not text:
        return ""
    
    # Convert to lowercase
    text = text.lower()
    
    # Remove special characters but keep spaces
    text = re.sub(r'[^\w\s]', ' ', text)
    
    # Remove extra whitespace
    text = re.sub(r'\s+', ' ', text)
    
    # Remove numbers (optional - sometimes useful for dates)
    # text = re.sub(r'\d+', '', text)
    
    # Remove common filler words but keep important terms
    # This is lighter than full stopword removal
    
    # Trim leading/trailing spaces
    text = text.strip()
    
    return text
