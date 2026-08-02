const API_BASE = "http://127.0.0.1:8000";

// Fetch community submissions (used by Community page)
export async function getAccessiblePlaces() {
  const res = await fetch(`${API_BASE}/api/submissions`);
  return res.json();
}

// Fetch approved places for map display (accessible places + obstacles)
export async function getPlaces() {
  const res = await fetch(`${API_BASE}/api/places`);
  return res.json();
}

// Submit a new place/report
export async function submitPlace(data: any) {
  const res = await fetch(`${API_BASE}/api/submit-report`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Get route comparison / accessible route from backend
export async function getRoute(start: any, end: any) {
  const res = await fetch(`${API_BASE}/api/calculate-route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start, end }),
  });
  return res.json();
}
