from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers.api import router as api_router

app = FastAPI(title=settings.app_name, version="1.0.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def safe_error_handler(request: Request, exc: Exception):
    # Never leak internals in API errors.
    return JSONResponse(status_code=500, content={"error": "Internal server error"})


@app.get("/health")
async def health():
    return {"status": "ok", "demo_mode": settings.demo_mode}


app.include_router(api_router)
