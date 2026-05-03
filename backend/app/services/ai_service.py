import json
import logging
import google.auth
from google.cloud import aiplatform
from vertexai.generative_models import GenerativeModel, Part, SafetySetting, HarmCategory, HarmBlockThreshold
import vertexai

from app.core.config import settings

logger = logging.getLogger(__name__)

# Initialize Vertex AI
try:
    vertexai.init(project=settings.GCP_PROJECT_ID, location=settings.GCP_REGION)
    # 2.5 Flash for fast parsing
    flash_model = GenerativeModel("gemini-2.5-flash")
    # 2.5 Pro for complex ATS scoring
    pro_model = GenerativeModel("gemini-2.5-pro")
    AI_INITIALIZED = True
except Exception as e:
    logger.error(f"Failed to initialize Vertex AI: {e}")
    AI_INITIALIZED = False


async def parse_resume_text(raw_text: str) -> dict:
    """Parse raw resume text into structured JSON using Gemini 1.5 Flash."""
    if not AI_INITIALIZED:
        logger.warning("Vertex AI not initialized. Returning dummy data.")
        return {"error": "AI not initialized", "name": "Unknown", "skills": []}

    prompt = f"""
    You are an expert resume parser. Extract the following information from the provided resume text into a structured JSON format.
    Do not include any markdown formatting, just return raw valid JSON.
    
    Format required:
    {{
      "name": "Full Name",
      "email": "Email Address",
      "phone": "Phone Number",
      "summary": "Professional Summary",
      "skills": ["Skill 1", "Skill 2"],
      "experience": [
        {{
          "company": "Company Name",
          "title": "Job Title",
          "dates": "Start - End",
          "description": "Role description"
        }}
      ],
      "education": [
        {{
          "institution": "School Name",
          "degree": "Degree",
          "year": "Graduation Year"
        }}
      ]
    }}
    
    Resume Text:
    {raw_text}
    """

    try:
        response = await flash_model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Error parsing resume with Gemini: {e}")
        return {"error": str(e)}


async def calculate_ats_score(structured_json: dict, job_description: str = None) -> dict:
    """Calculate ATS score using Gemini 1.5 Pro."""
    if not AI_INITIALIZED:
         return {"ats_score": 0, "feedback": {"error": "AI not initialized"}}

    prompt = f"""
    You are an expert ATS (Applicant Tracking System) and Career Coach. Analyze the following resume data.
    Calculate an ATS score from 0-100 based on Formatting (10%), Skills (20%), Experience (30%), and Keyword Match (40%).
    
    Provide detailed, categorized feedback for the user to improve their resume.
    Categories required:
    1. to_change: Specific things that are wrong or counter-productive.
    2. to_rephrase: Content that is good but could be worded more professionally or impactfully.
    3. to_add: Missing sections, metrics, or details that would strengthen the resume.
    4. to_learn: Specific technical skills or certifications the candidate should acquire based on current market trends for their role.
    
    Return the result as pure JSON.
    Format required:
    {{
      "ats_score": 85,
      "feedback": {{
        "formatting_score": 90,
        "skills_score": 80,
        "experience_score": 85,
        "keyword_match": 85,
        "to_change": ["Remove objective statement", "Fix font consistency"],
        "to_rephrase": ["Use active verbs in experience section", "Quantify achievements"],
        "to_add": ["Add a Projects section", "Include LinkedIn profile link"],
        "to_learn": ["Docker", "Kubernetes", "Advanced System Design"]
      }}
    }}
    
    Job Description:
    {job_description or "General Best Practices for Software Engineering/Tech roles"}
    
    Resume JSON:
    {json.dumps(structured_json, indent=2)}
    """

    try:
        response = await pro_model.generate_content_async(
            prompt,
            generation_config={"response_mime_type": "application/json"}
        )
        return json.loads(response.text)
    except Exception as e:
        logger.error(f"Error calculating ATS score with Gemini: {e}")
        return {"ats_score": 0, "feedback": {"error": str(e)}}
