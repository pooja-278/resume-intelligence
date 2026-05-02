from pydantic import BaseModel, EmailStr
from typing import Optional, Dict, Any

class UserBase(BaseModel):
    email: EmailStr

class UserCreate(UserBase):
    password: str

class UserResponse(UserBase):
    id: int

    class Config:
        from_attributes = True

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    email: Optional[str] = None

class ResumeResponse(BaseModel):
    id: int
    user_id: int
    file_name: str
    raw_text: Optional[str] = None
    structured_json: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class AnalysisResultResponse(BaseModel):
    id: int
    resume_id: int
    ats_score: Optional[float] = None
    feedback: Optional[Dict[str, Any]] = None

    class Config:
        from_attributes = True

class ResumeUpdateRequest(BaseModel):
    raw_text: str