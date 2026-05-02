from app.schemas.schemas import ResumeUpdateRequest
from fastapi import Body,APIRouter, Depends, HTTPException, UploadFile, File, BackgroundTasks, status
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.future import select
from typing import List

from app.core.database import get_db
from app.models.models import User, Resume, AnalysisResult
from app.schemas.schemas import ResumeResponse, AnalysisResultResponse
from app.services.auth import get_current_user
from app.services.parser import extract_text_from_pdf_bytes
from app.services.ai_service import parse_resume_text, calculate_ats_score

router = APIRouter(prefix="/resumes", tags=["resumes"])

async def process_resume_background(resume_id: int, file_bytes: bytes, db: AsyncSession):
    """Background task to parse the resume, query AI, and calculate ATS score."""
    try:
        # Extract Text
        raw_text = extract_text_from_pdf_bytes(file_bytes)
        
        # Parse Structured JSON
        structured_json = await parse_resume_text(raw_text)
        
        # Calculate ATS
        ats_result = await calculate_ats_score(structured_json)
        
        # Update Database
        result = await db.execute(select(Resume).where(Resume.id == resume_id))
        resume = result.scalars().first()
        if resume:
            resume.raw_text = raw_text
            resume.structured_json = structured_json
            
            # Save Analysis Result
            # analysis = AnalysisResult(
            #     resume_id=resume.id,
            #     ats_score=ats_result.get("ats_score", 0),
            #     feedback=ats_result.get("feedback", {})
            # )
            # db.add(analysis)
            # await db.commit()
            existing = await db.execute(
                select(AnalysisResult).where(AnalysisResult.resume_id == resume.id)
            )
            analysis = existing.scalars().first()

            if analysis:
                # Update existing row
                analysis.ats_score = ats_result.get("ats_score", 0)
                analysis.feedback = ats_result.get("feedback", {})
            else:
                # Create new row
                analysis = AnalysisResult(
                    resume_id=resume.id,
                    ats_score=ats_result.get("ats_score", 0),
                    feedback=ats_result.get("feedback", {})
                )
                db.add(analysis)

            await db.commit()
                        
    except Exception as e:
        print(f"Error processing resume {resume_id} in background: {e}")
        # In a real app we might want to record the error state in the DB

@router.post("/upload", response_model=ResumeResponse, status_code=status.HTTP_202_ACCEPTED)
async def upload_resume(
    background_tasks: BackgroundTasks,
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    if not file.filename.endswith(('.pdf', '.docx')):
        raise HTTPException(status_code=400, detail="Only PDF and DOCX files are supported")
        
    # Read bytes
    file_bytes = await file.read()
    
    if len(file_bytes) > 5 * 1024 * 1024:  # 5MB limit
        raise HTTPException(status_code=400, detail="File too large. Max 5MB")

    # Create Resume record with raw bytes
    new_resume = Resume(
        user_id=current_user.id,
        file_data=file_bytes,
        file_name=file.filename
    )
    db.add(new_resume)
    await db.commit()
    await db.refresh(new_resume)

    # Trigger background parsing
    background_tasks.add_task(process_resume_background, new_resume.id, file_bytes, db)

    return new_resume

@router.get("/", response_model=List[ResumeResponse])
async def list_resumes(
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(select(Resume).where(Resume.user_id == current_user.id))
    return result.scalars().all()

@router.get("/{resume_id}", response_model=ResumeResponse)
async def get_resume(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
    return resume

@router.get("/{resume_id}/analysis", response_model=AnalysisResultResponse)
async def get_resume_analysis(
    resume_id: int,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db)
):
    # Check if user owns resume
    result = await db.execute(
        select(Resume).where(Resume.id == resume_id, Resume.user_id == current_user.id)
    )
    resume = result.scalars().first()
    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")
        
    analysis_result = await db.execute(select(AnalysisResult).where(AnalysisResult.resume_id == resume_id))
    analysis = analysis_result.scalars().first()
    
    if not analysis:
        # Processing might not be done yet
        raise HTTPException(status_code=404, detail="Analysis result not yet available")
        
    return analysis

@router.put("/{resume_id}", response_model=ResumeResponse)
async def update_resume(
    resume_id: int,
    payload: ResumeUpdateRequest,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Fetch resume
    result = await db.execute(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        )
    )
    resume = result.scalars().first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    # 2. Update content
    resume.raw_text = payload.raw_text

    # (Optional) Clear old structured data
    resume.structured_json = None

    # 3. Commit changes
    await db.commit()
    await db.refresh(resume)

    return resume

@router.post("/{resume_id}/analyze", status_code=202)
async def reanalyze_resume(
    resume_id: int,
    background_tasks: BackgroundTasks,
    current_user: User = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    # 1. Validate ownership
    result = await db.execute(
        select(Resume).where(
            Resume.id == resume_id,
            Resume.user_id == current_user.id
        )
    )
    resume = result.scalars().first()

    if not resume:
        raise HTTPException(status_code=404, detail="Resume not found")

    if not resume.raw_text:
        raise HTTPException(status_code=400, detail="Resume has no content")

    # 2. Trigger background analysis (NO file needed now)
    background_tasks.add_task(
        reprocess_resume_from_text,
        resume.id,
        resume.raw_text,
        db
    )

    return {"message": "Re-analysis started"}

async def reprocess_resume_from_text(resume_id: int, raw_text: str, db: AsyncSession):
    try:
        structured_json = await parse_resume_text(raw_text)
        ats_result = await calculate_ats_score(structured_json)

        result = await db.execute(select(Resume).where(Resume.id == resume_id))
        resume = result.scalars().first()

        if resume:
            resume.structured_json = structured_json

            # analysis = AnalysisResult(
            #     resume_id=resume.id,
            #     ats_score=ats_result.get("ats_score", 0),
            #     feedback=ats_result.get("feedback", {})
            # )

            # db.add(analysis)
            # await db.commit()
            existing = await db.execute(
                select(AnalysisResult).where(AnalysisResult.resume_id == resume.id)
            )
            analysis = existing.scalars().first()

            if analysis:
                # Update existing row
                analysis.ats_score = ats_result.get("ats_score", 0)
                analysis.feedback = ats_result.get("feedback", {})
            else:
                # Create new row
                analysis = AnalysisResult(
                    resume_id=resume.id,
                    ats_score=ats_result.get("ats_score", 0),
                    feedback=ats_result.get("feedback", {})
                )
                db.add(analysis)

            await db.commit()

    except Exception as e:
        print(f"Re-analysis failed: {e}")