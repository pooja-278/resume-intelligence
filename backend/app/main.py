from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.api import auth, resumes, health
from app.core.database import engine, Base

app = FastAPI(title="Resume Intelligence Platform API")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # Adjust for production
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(health.router, prefix="/api")
app.include_router(auth.router, prefix="/api")
app.include_router(resumes.router, prefix="/api")

@app.on_event("startup")
async def startup_event():
    # Create database tables if they don't exist
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)

@app.get("/")
def read_root():
    return {"message": "Welcome to Resume Intelligence Platform API"}
