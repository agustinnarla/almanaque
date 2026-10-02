from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from routers import campaigns, methodology, metrics, patterns

app = FastAPI(title="API Métricas Call Center")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:3000",
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(metrics.router)
app.include_router(patterns.router)
app.include_router(campaigns.router)
app.include_router(methodology.router)
