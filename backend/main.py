from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Initialize FastAPI app
print("--- STARTING FASTAPI APP ---")
app = FastAPI(title="Marg-Darshak Backend")

# Configure CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, replace with frontend URL
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Initialize Firebase Admin SDK
try:
    cred = credentials.Certificate("serviceAccountKey.json")
    firebase_admin.initialize_app(cred)
    print("Firebase Admin initialized successfully.")
except Exception as e:
    print(f"Error initializing Firebase Admin: {e}")

# Models
class Location(BaseModel):
    lat: float
    lng: float

class Submission(BaseModel):
    type: str
    description: str
    rating: int
    location: Location
    created_by: str
    status: str = "pending" # pending, approved, rejected
    image_url: Optional[str] = None

class SubmissionStatusUpdate(BaseModel):
    status: str

class ARPredictionRequest(BaseModel):
    image_url: str
    location: Location

# Routes
@app.get("/")
async def root():
    return {"message": "Accessible Trails Backend is running"}

@app.get("/health")
async def health_check():
    return {"status": "healthy"}

# Firestore Collections
db = firestore.client()

@app.post("/api/seed-data")
async def seed_data():
    """
    Seeds the database with initial data.
    """
    try:
        # Accessible Places
        places = [
            {"lat": 18.53075, "lng": 73.84854, "type": "ramp", "description": "College Main Entrance Ramp", "rating": 5, "verified": True, "category": "accessible"},
            {"lat": 18.53104, "lng": 73.84397, "type": "safe_path", "description": "Wide railing path", "rating": 4, "verified": True, "category": "accessible"},
            {"lat": 18.52988, "lng": 73.84224, "type": "tactile_path", "description": "Tactile walkway segment", "rating": 4, "verified": True, "category": "accessible"}
        ]
        
        for place in places:
            db.collection("accessible_places").add(place)

        # Obstacles
        obstacles = [
            {"lat": 18.53012, "lng": 73.84492, "type": "stairs", "description": "Steep stairs", "severity": 4, "verified": True, "category": "obstacle"},
            {"lat": 18.53067, "lng": 73.84618, "type": "steep_slope", "description": "Very steep slope", "severity": 3, "verified": True, "category": "obstacle"},
            {"lat": 18.53101, "lng": 73.84755, "type": "broken_sidewalk", "description": "Broken sidewalk", "severity": 2, "verified": True, "category": "obstacle"}
        ]

        for obstacle in obstacles:
            db.collection("obstacles").add(obstacle)

        return {"status": "success", "message": "Seed data added successfully"}
    except Exception as e:
        print(f"Error seeding data: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/submit-report")
async def submit_report(submission: Submission):
    """
    Receives a new report submission and saves it to Firestore.
    """
    try:
        new_submission = submission.dict()
        new_submission["created_at"] = firestore.SERVER_TIMESTAMP
        new_submission["verified"] = False
        
        # Save to 'submissions' collection
        update_time, ref = db.collection("submissions").add(new_submission)
        
        return {"status": "success", "message": "Report submitted successfully", "id": ref.id}
    except Exception as e:
        print(f"Error submitting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions")
async def get_submissions(status: Optional[str] = None):
    """
    Fetches submissions from Firestore. Optional status filter.
    """
    try:
        submissions_ref = db.collection("submissions")
        if status and status != "all":
            query = submissions_ref.where("status", "==", status)
        else:
            query = submissions_ref

        docs = query.stream()
        result = []
        for doc in docs:
            data = doc.to_dict()
            data["id"] = doc.id
            result.append(data)
        return result
    except Exception as e:
        print(f"Error fetching submissions: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.put("/api/submissions/{submission_id}/status")
async def update_submission_status(submission_id: str, status_update: SubmissionStatusUpdate):
    """
    Updates the status of a submission (approve/reject).
    If approved, moves the data to 'accessible_places' or 'obstacles'.
    """
    try:
        doc_ref = db.collection("submissions").document(submission_id)
        doc = doc_ref.get()
        
        if not doc.exists:
            raise HTTPException(status_code=404, detail="Submission not found")
            
        data = doc.to_dict()
        
        # Update status
        doc_ref.update({"status": status_update.status})
        
        if status_update.status == "approved":
            # Determine collection based on type
            # This logic might need refinement based on exact types, but for now:
            if data["type"] in ["obstacle", "stairs", "steep_slope", "broken_sidewalk"]:
                target_collection = "obstacles"
                data["category"] = "obstacle"
                # Default severity if not present
                if "severity" not in data:
                    data["severity"] = 3 
            else:
                target_collection = "accessible_places"
                data["category"] = "accessible"

            data["verified"] = True
            db.collection(target_collection).add(data)
            
        return {"status": "success", "message": f"Submission {status_update.status}"}
    except Exception as e:
        print(f"Error updating submission: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/places")
async def get_places():
    """
    Fetches approved accessible places and obstacles for the map from Firestore.
    """
    try:
        places = []
        
        # Fetch Accessible Places
        acc_docs = db.collection("accessible_places").stream()
        for doc in acc_docs:
            data = doc.to_dict()
            data["id"] = doc.id
            data["category"] = "accessible"
            places.append(data)
            
        # Fetch Obstacles
        obs_docs = db.collection("obstacles").stream()
        for doc in obs_docs:
            data = doc.to_dict()
            data["id"] = doc.id
            data["category"] = "obstacle"
            places.append(data)
            
        return places
    except Exception as e:
        print(f"Error fetching places: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/predict-accessibility")
async def predict_accessibility(request: ARPredictionRequest):
    """
    AI Endpoint: Predicts accessibility score based on image and location.
    This is a placeholder for the AI model integration.
    """
    # TODO: Load your trained model and run inference
    # model = load_model("accessibility_model.pkl")
    # prediction = model.predict(request.image_url)
    
    # Mock response
    return {
        "score": 85,
        "features": ["ramp_detected", "wide_path"],
        "confidence": 0.92,
        "recommendation": "Highly Accessible"
    }

@app.post("/api/calculate-route")
async def calculate_route(start: Location, end: Location):
    """
    AI Endpoint: Calculates the most accessible route using high-weightage algorithms.
    """
    # TODO: Implement pathfinding algorithm (e.g., A*) with accessibility weights
    
    return {
        "route_id": "route_123",
        "accessibility_score": 90,
        "distance": "1.2km",
        "estimated_time": "15 mins",
        "path": [
            {"lat": start.lat, "lng": start.lng},
            {"lat": (start.lat + end.lat) / 2, "lng": (start.lng + end.lng) / 2}, # Midpoint mock
            {"lat": end.lat, "lng": end.lng}
        ]
    }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
