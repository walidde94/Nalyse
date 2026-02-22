from fastapi import FastAPI, HTTPException, UploadFile, File, Form, Depends
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Dict, Optional, Any
import pandas as pd
import io
from .models.anomaly import AnomalyDetector
import logging

# Setup Logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Nalyse ML Engine",
    description="Microservice for Anomaly Detection (Isolation Forest, Autoencoders)",
    version="1.0.0"
)

# CORS (Allow Frontend/Backend access)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict to gateway
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

class AnalysisRequest(BaseModel):
    file_path: Optional[str] = None
    data: Optional[List[Dict[str, Any]]] = None

class DetectionResult(BaseModel):
    anomaly_indices: List[int]
    anomaly_count: int
    explanations: List[Dict[str, Any]]
    processing_time: float

@app.get("/health")
def health_check():
    return {"status": "online", "model": "IsolationForest v1.0"}

@app.post("/detect", response_model=DetectionResult)
async def detect_anomalies(request: AnalysisRequest):
    """
    Detect anomalies in provided data or file path.
    """
    import time
    start_time = time.time()
    
    try:
        df = None
        
        # Method 1: Load from local path (Backend Integration)
        if request.file_path:
            logger.info(f"Loading file from path: {request.file_path}")
            if request.file_path.endswith('.csv'):
                df = pd.read_csv(request.file_path)
            elif request.file_path.endswith('.json'):
                df = pd.read_json(request.file_path)
            elif request.file_path.endswith('.parquet'):
                df = pd.read_parquet(request.file_path)
            else:
                raise HTTPException(status_code=400, detail="Unsupported file format")

        # Method 2: Load from direct JSON payload
        elif request.data:
            logger.info("Loading data from JSON payload")
            df = pd.DataFrame(request.data)
            
        else:
            raise HTTPException(status_code=400, detail="No data provided (file_path or data required)")

        if df.empty:
            raise HTTPException(status_code=400, detail="Dataset is empty")
            
        # Initialize Detector
        detector = AnomalyDetector(contamination=0.05)
        
        # Run Detection
        logger.info(f"Running detection on {len(df)} rows")
        result = detector.detect(df)
        
        # Run Explanation (only for anomalies)
        indices = result.get('anomaly_indices', [])
        explanations = detector.explain(df, indices)
        
        return {
            "anomaly_indices": indices,
            "anomaly_count": len(indices),
            "explanations": explanations,
            "processing_time": time.time() - start_time
        }

    except Exception as e:
        logger.error(f"Detection error: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/detect/upload")
async def detect_upload(file: UploadFile = File(...)):
    """
    Direct file upload endpoint for testing.
    """
    try:
        content = await file.read()
        logger.info(f"Received file: {file.filename}")
        
        if file.filename.endswith('.csv'):
            df = pd.read_csv(io.BytesIO(content))
        elif file.filename.endswith('.json'):
            df = pd.read_json(io.BytesIO(content))
        else:
            return {"error": "Unsupported file type"}
            
        detector = AnomalyDetector()
        result = detector.detect(df)
        indices = result.get('anomaly_indices', [])
        explanations = detector.explain(df, indices)
        
        return {
            "filename": file.filename,
            "rows": len(df),
            "anomalies": len(indices),
            "result": result,
            "explanations": explanations
        }
        
    except Exception as e:
        return {"error": str(e)}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
