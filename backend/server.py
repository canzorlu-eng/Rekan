import logging

from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware

import os

from routers import ai, businesses, demo, insights, runs, taskcards

logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
)
logger = logging.getLogger(__name__)

app = FastAPI(title="Rekan API")


@app.get("/api")
async def health():
    return {"status": "ok", "app": "rekan"}


app.include_router(businesses.router)
app.include_router(taskcards.router)
app.include_router(runs.router)
app.include_router(insights.router)
app.include_router(ai.router)
app.include_router(demo.router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get("CORS_ORIGINS", "*").split(","),
    allow_methods=["*"],
    allow_headers=["*"],
)
