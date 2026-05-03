from sqlalchemy import Column, Integer, String, Text, ForeignKey, LargeBinary, Float
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import relationship
from app.core.database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)

    resumes = relationship("Resume", back_populates="user")

class Resume(Base):
    __tablename__ = "resumes"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    
    # Store binary data directly as requested (BYTEA)
    file_data = Column(LargeBinary, nullable=False)
    file_name = Column(String, nullable=False)
    
    raw_text = Column(Text, nullable=True)
    structured_json = Column(JSONB, nullable=True)

    user = relationship("User", back_populates="resumes")
    analysis_result = relationship("AnalysisResult", back_populates="resume", uselist=False, cascade="all, delete-orphan")

class AnalysisResult(Base):
    __tablename__ = "analysis_results"

    id = Column(Integer, primary_key=True, index=True)
    resume_id = Column(Integer, ForeignKey("resumes.id"), nullable=False, unique=True)
    ats_score = Column(Float, nullable=True)
    feedback = Column(JSONB, nullable=True)  # Detailed feedback on formatting, skills, etc.

    resume = relationship("Resume", back_populates="analysis_result")

class JobDescription(Base):
    __tablename__ = "job_descriptions"

    id = Column(Integer, primary_key=True, index=True)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=False)
