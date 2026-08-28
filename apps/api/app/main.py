import re
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.core.config import settings
from app.routers.api import router as api_router

app = FastAPI(title=settings.app_name, version="1.0.0")

raw_origins = settings.cors_origins
exact_origins = []
regex_patterns = []
allow_all = False

for origin in raw_origins:
    o = str(origin).strip()
    if not o:
        continue
    if o == "*" or o == ".*":
        allow_all = True
        break
    if "*" in o:
        pattern = "^" + re.escape(o).replace(r"\*", r".*") + "$"
        regex_patterns.append(pattern)
    else:
        exact_origins.append(o)

if allow_all:
    allow_origins = []
    allow_origin_regex = ".*"
    allow_credentials = True
else:
    allow_origins = exact_origins
    allow_origin_regex = "|".join(regex_patterns) if regex_patterns else None
    allow_credentials = True

app.add_middleware(
    CORSMiddleware,
    allow_origins=allow_origins,
    allow_origin_regex=allow_origin_regex,
    allow_credentials=allow_credentials,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.exception_handler(Exception)
async def safe_error_handler(request: Request, exc: Exception):
    # Never leak internals in API errors, while preserving CORS headers.
    origin = request.headers.get("origin")
    headers = {}
    if origin:
        headers["Access-Control-Allow-Origin"] = origin
        headers["Access-Control-Allow-Credentials"] = "true"
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error"},
        headers=headers,
    )


@app.get("/")
async def root():
    return {
        "status": "online",
        "service": settings.app_name,
        "docs": "/docs",
        "health": "/health",
        "demo_mode": settings.demo_mode,
    }


@app.get("/health")
async def health():
    return {"status": "ok", "demo_mode": settings.demo_mode}


app.include_router(api_router)

