const API_BASE = "http://127.0.0.1:8000";

// GET all accessible places
export async function getAccessiblePlaces() {
  const res = await fetch(`${API_BASE}/accessible_places`);
  return res.json();
}

// Submit a new place
export async function submitPlace(data: any) {
  const res = await fetch(`${API_BASE}/submit_place`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(data),
  });
  return res.json();
}

// Get route
export async function getRoute(start: any, end: any) {
  const res = await fetch(`${API_BASE}/route`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ start, end }),
  });
  return res.json();
}
