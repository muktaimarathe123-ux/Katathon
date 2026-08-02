from fastapi import FastAPI, HTTPException, UploadFile, File
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from typing import List, Optional
import os
import firebase_admin
from firebase_admin import credentials, firestore, storage, auth
from dotenv import load_dotenv
import uuid

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

# Firestore Collections — attempt to initialize, otherwise use in-memory fallbacks
USE_FIREBASE = True
try:
    db = firestore.client()
except Exception as e:
    print(f"Firestore not available: {e}")
    USE_FIREBASE = False

# In-memory fallback stores for development when Firestore isn't configured
demo_places_store: List[dict] = []
demo_obstacles_store: List[dict] = []
submissions_store: List[dict] = []

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

        # Obstacles
        obstacles = [
            {"lat": 18.53012, "lng": 73.84492, "type": "stairs", "description": "Steep stairs", "severity": 4, "verified": True, "category": "obstacle"},
            {"lat": 18.53067, "lng": 73.84618, "type": "steep_slope", "description": "Very steep slope", "severity": 3, "verified": True, "category": "obstacle"},
            {"lat": 18.53101, "lng": 73.84755, "type": "broken_sidewalk", "description": "Broken sidewalk", "severity": 2, "verified": True, "category": "obstacle"}
        ]

        if USE_FIREBASE:
            for place in places:
                db.collection("accessible_places").add(place)
            for obstacle in obstacles:
                db.collection("obstacles").add(obstacle)
        else:
            demo_places_store.extend(places)
            demo_obstacles_store.extend(obstacles)

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
        new_submission["created_at"] = firestore.SERVER_TIMESTAMP if USE_FIREBASE else None
        new_submission["verified"] = False

        if USE_FIREBASE:
            update_time, ref = db.collection("submissions").add(new_submission)
            return {"status": "success", "message": "Report submitted successfully", "id": ref.id}
        else:
            new_id = str(uuid.uuid4())
            new_submission["id"] = new_id
            submissions_store.append(new_submission)
            return {"status": "success", "message": "Report submitted (dev)", "id": new_id}
    except Exception as e:
        print(f"Error submitting report: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/submissions")
async def get_submissions(status: Optional[str] = None):
    """
    Fetches submissions from Firestore. Optional status filter.
    """
    try:
        if USE_FIREBASE:
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
        else:
            if status and status != "all":
                return [s for s in submissions_store if s.get("status") == status]
            return submissions_store
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
        if USE_FIREBASE:
            doc_ref = db.collection("submissions").document(submission_id)
            doc = doc_ref.get()

            if not doc.exists:
                raise HTTPException(status_code=404, detail="Submission not found")

            data = doc.to_dict()

            # Update status
            doc_ref.update({"status": status_update.status})

            if status_update.status == "approved":
                if data["type"] in ["obstacle", "stairs", "steep_slope", "broken_sidewalk"]:
                    target_collection = "obstacles"
                    data["category"] = "obstacle"
                    if "severity" not in data:
                        data["severity"] = 3
                else:
                    target_collection = "accessible_places"
                    data["category"] = "accessible"

                data["verified"] = True
                db.collection(target_collection).add(data)
        else:
            # Update in-memory submission
            found = None
            for s in submissions_store:
                if s.get("id") == submission_id:
                    s["status"] = status_update.status
                    found = s
                    break
            if not found:
                raise HTTPException(status_code=404, detail="Submission not found (dev store)")

            if status_update.status == "approved":
                data = found.copy()
                if data["type"] in ["obstacle", "stairs", "steep_slope", "broken_sidewalk"]:
                    data["category"] = "obstacle"
                    if "severity" not in data:
                        data["severity"] = 3
                    demo_obstacles_store.append(data)
                else:
                    data["category"] = "accessible"
                    demo_places_store.append(data)

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
        if USE_FIREBASE:
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
        else:
            # Return demo in-memory stores
            places.extend(demo_places_store)
            places.extend(demo_obstacles_store)

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
    # Try to construct an accessible route by routing via known accessible places
    TOMTOM_API_KEY = os.getenv("TOMTOM_API_KEY") or "EBcOqgmBNm4Cmk43fwKfmZErMHIfVvvg"

    def bbox_contains(slat, slng, elat, elng, plat, plng, pad=0.02):
        minlat = min(slat, elat) - pad
        maxlat = max(slat, elat) + pad
        minlng = min(slng, elng) - pad
        maxlng = max(slng, elng) + pad
        return minlat <= plat <= maxlat and minlng <= plng <= maxlng

    # Collect accessible candidate waypoints
    candidates = []
    if USE_FIREBASE:
        try:
            docs = db.collection("accessible_places").stream()
            for d in docs:
                p = d.to_dict()
                p["id"] = d.id
                candidates.append(p)
        except Exception:
            candidates = []
    else:
        candidates = demo_places_store.copy()

    # Filter candidates within bounding box between start and end
    filtered = [p for p in candidates if bbox_contains(start.lat, start.lng, end.lat, end.lng, p.get("lat"), p.get("lng"))]

    # Choose up to 2 waypoints: pick ones closest to midpoint
    midlat = (start.lat + end.lat) / 2
    midlng = (start.lng + end.lng) / 2

    def dist2(a,b,c,d):
        return (a-c)**2 + (b-d)**2

    filtered.sort(key=lambda p: dist2(p.get("lat"), p.get("lng"), midlat, midlng))
    waypoints = filtered[:2]

    # Build TomTom routing coordinate string: lat,lon pairs separated by ':' starting from start
    coords = [f"{start.lat},{start.lng}"]
    for wp in waypoints:
        coords.append(f"{wp.get('lat')},{wp.get('lng')}")
    coords.append(f"{end.lat},{end.lng}")

    coord_str = ":".join(coords)

    try:
        url = f"https://api.tomtom.com/routing/1/calculateRoute/{coord_str}/json?key={TOMTOM_API_KEY}&routeType=shortest&travelMode=pedestrian"
        import urllib.request, json
        with urllib.request.urlopen(url, timeout=10) as resp:
            data = json.load(resp)

        if not data.get("routes"):
            raise RuntimeError("No routes from TomTom")

        # Combine legs points into a single list of coords
        path_coords: List[dict] = []
        for leg in data["routes"][0].get("legs", []):
            for pt in leg.get("points", []):
                path_coords.append({"lat": pt["latitude"] if isinstance(pt, dict) and "latitude" in pt else pt[1] if isinstance(pt, (list,tuple)) else pt.get("latitude"),
                                     "lng": pt["longitude"] if isinstance(pt, dict) and "longitude" in pt else pt[0] if isinstance(pt, (list,tuple)) else pt.get("longitude")})

        # Fallback: some TomTom responses use points as dicts under 'points'
        if not path_coords and data["routes"][0].get("legs"):
            # try parsing per-leg 'points' with dict entries
            for leg in data["routes"][0].get("legs", []):
                for p in leg.get("points", []):
                    if isinstance(p, dict) and "latitude" in p:
                        path_coords.append({"lat": p["latitude"], "lng": p["longitude"]})

        # If still empty, fall back to simple start->end
        if not path_coords:
            path_coords = [{"lat": start.lat, "lng": start.lng}, {"lat": end.lat, "lng": end.lng}]

        return {
            "route_id": f"route_{uuid.uuid4().hex[:8]}",
            "accessibility_score": 85 if waypoints else 60,
            "distance": data["routes"][0]["summary"].get("lengthInMeters", 0),
            "estimated_time": data["routes"][0]["summary"].get("travelTimeInSeconds", 0),
            "path": path_coords,
            "via": [{"lat": w.get("lat"), "lng": w.get("lng"), "id": w.get("id")} for w in waypoints]
        }
    except Exception as e:
        print(f"Accessible route generation error: {e}")
        # Fallback simple midpoint path
        return {
            "route_id": "route_123",
            "accessibility_score": 50,
            "distance": "unknown",
            "estimated_time": "unknown",
            "path": [
                {"lat": start.lat, "lng": start.lng},
                {"lat": (start.lat + end.lat) / 2, "lng": (start.lng + end.lng) / 2},
                {"lat": end.lat, "lng": end.lng}
            ]
        }

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
