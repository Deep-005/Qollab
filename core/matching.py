from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics.pairwise import cosine_similarity
import re
from sklearn.feature_extraction.text import ENGLISH_STOP_WORDS


def extract_keywords(text):
    """Extract meaningful keywords from text"""
    text = text.lower()
    # remove special characters
    text = re.sub(r'[^a-zA-Z0-9\s]', '', text)
    words = text.split()
    
    # remove stopwords & short words
    keywords = [
        word for word in words
        if word not in ENGLISH_STOP_WORDS and len(word) > 2
    ]
    
    return set(keywords)


def keyword_match_details(job_keywords, resume_keywords):
    """
    Return detailed keyword match information
    
    Returns:
        dict: {
            'matched': list of matched keywords,
            'missing': list of missing keywords,
            'percentage': float (0-1)
        }
    """
    if not job_keywords:
        return {
            'matched': [],
            'missing': [],
            'percentage': 0
        }
    
    matched = list(job_keywords & resume_keywords)
    missing = list(job_keywords - resume_keywords)
    percentage = len(matched) / len(job_keywords)
    
    return {
        'matched': matched,
        'missing': missing,
        'percentage': percentage
    }


def detect_query_type(text):
    """
    Detect if query is a keyword list or full description
    
    Returns:
        str: 'keyword_query' or 'full_description'
    """
    words = text.split()
    
    # Check if text has proper sentences (periods)
    has_sentences = '.' in text
    
    # Check for years of experience patterns
    has_years = bool(re.search(r'\d+\s*years?', text.lower()))
    
    # Check for common job description indicators
    has_job_indicators = any(word in text.lower() for word in [
        'responsibilities', 'requirements', 'qualifications', 
        'experience', 'skills', 'about', 'role', 'position'
    ])
    
    # Short text without proper sentences = keyword query
    if len(words) < 15 and not has_sentences and not has_years and not has_job_indicators:
        return 'keyword_query'
    
    return 'full_description'


def keyword_score(job_desc, resume_text):
    """Calculate simple keyword match percentage (backward compatibility)"""
    job_keywords = extract_keywords(job_desc)
    resume_keywords = extract_keywords(resume_text)
    
    if not job_keywords:
        return 0
    
    return len(job_keywords & resume_keywords) / len(job_keywords)


def rank_candidates(job_description, resumes):
    """
    Enhanced ranking with keyword breakdown and smart query detection
    
    Args:
        job_description (str): The job description or keyword query
        resumes (list): List of tuples [(candidate_id, resume_text), ...]
    
    Returns:
        list: Ranked candidates with detailed scores and keyword info
    """
    # Detect query type (keyword search or full description)
    query_type = detect_query_type(job_description)
    
    # Extract keywords from job for matching
    job_keywords = extract_keywords(job_description)
    
    # Prepare texts for TF-IDF vectorization
    texts = [job_description] + [res[1] for res in resumes]
    
    vectorizer = TfidfVectorizer(stop_words='english')
    vectors = vectorizer.fit_transform(texts)
    
    job_vector = vectors[0]
    resume_vectors = vectors[1:]
    
    # Calculate cosine similarity
    similarities = cosine_similarity(job_vector, resume_vectors)[0]
    
    results = []
    
    for i, sim_score in enumerate(similarities):
        candidate_id = resumes[i][0]
        resume_text = resumes[i][1]
        
        # Extract keywords from resume
        resume_keywords = extract_keywords(resume_text)
        
        # Get detailed keyword match information
        keyword_details = keyword_match_details(job_keywords, resume_keywords)
        
        # Adjust weights based on query type
        if query_type == 'keyword_query':
            # Keyword search: 80% keyword matching, 20% semantic
            final_score = (0.2 * sim_score) + (0.8 * keyword_details['percentage'])
        else:
            # Full description: 70% semantic, 30% keyword matching
            final_score = (0.7 * sim_score) + (0.3 * keyword_details['percentage'])
        
        # Prepare result with all details
        results.append({
            "candidate_id": candidate_id,
            "score": float(final_score),
            "semantic_score": float(sim_score),
            "keyword_score": float(keyword_details['percentage']),
            "matched_keywords": keyword_details['matched'],
            "missing_keywords": keyword_details['missing'],
            "query_type": query_type,
            "total_keywords_considered": len(job_keywords)
        })
    
    # Sort by final score (highest first)
    results.sort(key=lambda x: x["score"], reverse=True)
    
    return results