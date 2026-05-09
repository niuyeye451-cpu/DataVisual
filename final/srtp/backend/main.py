"""
FastAPI backend — 5 API endpoints serving the dashboard frontend.

Run:  uvicorn main:app --reload --host 0.0.0.0 --port 8000
"""
from fastapi import FastAPI, Query
from fastapi.middleware.cors import CORSMiddleware
from data_loader import get_all_data

app = FastAPI(title="电力负荷预测仪表盘 API", version="1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Load & cache all data at startup
@app.on_event("startup")
def startup():
    print("Loading data & training models (first request may be slow)...")
    get_all_data()
    print("Ready.")


def ok(data):
    return {"code": 200, "data": data, "message": "ok"}


# ---- API 1: Data Overview ----
@app.get("/api/overview")
def api_overview():
    return ok(get_all_data()["overview"])


# ---- API 2: Feature Exploration ----
@app.get("/api/eda")
def api_eda():
    return ok(get_all_data()["eda"])


# ---- API 3: Model Metrics & Predictions ----
@app.get("/api/models")
def api_models():
    return ok(get_all_data()["models"])


# ---- API 4: Feature Importance ----
@app.get("/api/features")
def api_features():
    return ok(get_all_data()["features"])


# ---- API 5: Error Analysis ----
@app.get("/api/errors")
def api_errors(model: str = Query("mlp_rf", description="Model key: mlp_rf | mlp | rf | dt")):
    return ok(get_all_data()["errors"])


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
