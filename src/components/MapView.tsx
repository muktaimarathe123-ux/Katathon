// MapView.tsx — Clean & Optimized With Live Location + Heatmap Near You

import { useState, useEffect, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Search, Navigation2, Layers, Plus } from "lucide-react";
import { toast } from "sonner";
import tt from "@tomtom-international/web-sdk-maps";
import "@tomtom-international/web-sdk-maps/dist/maps.css";
import { supabase } from "@/integrations/firebase/supabase/client";

interface MapViewProps {
  onAddMarker: () => void;
}

const TOMTOM_API_KEY = "EBcOqgmBNm4Cmk43fwKfmZErMHIfVvvg";

const MapView = ({ onAddMarker }: MapViewProps) => {
  const [showHeatmap, setShowHeatmap] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [routeInfo, setRouteInfo] = useState<{
    distance: string;
    duration: string;
  } | null>(null);
  const [userCoords, setUserCoords] = useState<{
    lat: number;
    lng: number;
  } | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);

  const mapElement = useRef<HTMLDivElement>(null);
  const map = useRef<any>(null);
  const markers = useRef<any[]>([]);
  const accuracyCircle = useRef<any>(null);
  const userMarker = useRef<any>(null);
  const heatmapLayerId = "heatmap-layer";
  const routeLayerRef = useRef<string | null>(null);
  const destMarkerRef = useRef<any>(null);
  const watchId = useRef<number | null>(null);

  //---------------------------------------------------------
  // MARKER HELPERS
  //---------------------------------------------------------
  const colorMap: Record<string, string> = {
    ramp: "#10b981",
    elevator: "#3b82f6",
    lift: "#3b82f6",
    tactile_path: "#f59e0b",
    walkway: "#84cc16",
    stairs: "#ef4444",
    obstacle: "#ef4444",
  };

  const emojiMap: Record<string, string> = {
    ramp: "♿",
    elevator: "🛗",
    lift: "🛗",
    tactile_path: "🦯",
    walkway: "🚶",
    stairs: "🪜",
    obstacle: "🪜",
  };

  const pretty = (t: string) =>
    t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  //---------------------------------------------------------
  // LOAD ACCESSIBILITY MARKERS (Supabase + Demo Pune)
  //---------------------------------------------------------
  const loadMarkers = async () => {
    try {
      const { data } = await supabase.from("accessible_places").select("*");

      const demoMarkers = generateDemoShivajinagar(); // 30 demo markers around Pune
      const places =
        data && data.length > 0 ? data.concat(demoMarkers) : demoMarkers;

      // Clear old markers
      markers.current.forEach((m) => m.remove());
      markers.current = [];

      places.forEach((p) => {
        const markerEl = document.createElement("div");
        markerEl.className = "marker-dot";
        markerEl.style.cssText = `
          width: 32px;
          height: 32px;
          border-radius: 50%;
          background: ${colorMap[p.type] || "#6b7280"};
          border: 3px solid white;
          display: flex;
          align-items: center;
          justify-content: center;
          font-size: 16px;
          box-shadow: 0 2px 6px rgba(0,0,0,0.25)
        `;
        markerEl.innerHTML = emojiMap[p.type] || "📍";

        const m = new tt.Marker({ element: markerEl })
          .setLngLat([p.lng, p.lat])
          .addTo(map.current);

        const popup = new tt.Popup({ offset: 25 }).setHTML(`
          <strong>${emojiMap[p.type] || "📍"} ${pretty(p.type)}</strong>
          <p>${p.description || ""}</p>
        `);

        m.setPopup(popup);
        markers.current.push(m);
      });
    } catch (e) {
      console.error(e);
      toast.error("Failed to load accessibility markers");
    }
  };

  //---------------------------------------------------------
  // DEMO MARKERS (PUNE SHIVAJINAGAR GRID)
  //---------------------------------------------------------
  function generateDemoShivajinagar() {
    const baseLat = 18.5212;
    const baseLng = 73.856;
    const types = [
      "ramp",
      "tactile_path",
      "walkway",
      "elevator",
      "stairs",
      "obstacle",
    ];
    let list: any[] = [];
    let id = 1;

    for (let r = -2; r <= 2; r++) {
      for (let c = -2; c <= 3; c++) {
        list.push({
          id: "demo_" + id,
          type: types[id % types.length],
          description: "Demo Marker " + id,
          lat: baseLat + r * 0.0008 + (Math.random() - 0.5) * 0.0003,
          lng: baseLng + c * 0.0008 + (Math.random() - 0.5) * 0.0003,
        });
        id++;
      }
    }
    return list;
  }

  //---------------------------------------------------------
  // HEATMAP LAYER — Focus around your location, fallback to all markers
  //---------------------------------------------------------
  const toggleHeatmap = () => {
    if (!map.current) return;

    // If already visible → remove
    if (map.current.getLayer(heatmapLayerId)) {
      map.current.removeLayer(heatmapLayerId);
      map.current.removeSource(heatmapLayerId);
      setShowHeatmap(false);
      return;
    }

    // 1) Start with ALL marker coordinates
    let coords: any[] = markers.current.map((m) => m.getLngLat());

    // 2) If we know user's location, prefer nearby markers (~5km)
    if (userCoords) {
      const { lat: uLat, lng: uLng } = userCoords;

      const delta = 0.05; // ~5 km in degrees
      const nearby = coords.filter(
        (c) =>
          Math.abs(c.lat - uLat) <= delta && Math.abs(c.lng - uLng) <= delta
      );

      if (nearby.length > 0) {
        coords = nearby;
        map.current.flyTo({ center: [uLng, uLat], zoom: 14 });
        toast.success(
          "Showing accessibility hotspots around your location (~5 km)."
        );
      } else {
        // No nearby markers → keep all coords but still center on user
        map.current.flyTo({ center: [uLng, uLat], zoom: 12 });
        toast.info(
          "No markers very close to you yet — showing nearest city hotspots."
        );
      }
    }

    if (!coords.length) {
      toast.info("No accessibility markers available for heatmap yet.");
      return;
    }

    map.current.addSource(heatmapLayerId, {
      type: "geojson",
      data: {
        type: "FeatureCollection",
        features: coords.map((c: any) => ({
          type: "Feature",
          geometry: { type: "Point", coordinates: [c.lng, c.lat] },
        })),
      },
    });

    map.current.addLayer({
      id: heatmapLayerId,
      type: "heatmap",
      source: heatmapLayerId,
      paint: {
        "heatmap-intensity": 1.4,
        "heatmap-radius": 40,
        "heatmap-opacity": 0.85,
        "heatmap-color": [
          "interpolate",
          ["linear"],
          ["heatmap-density"],
          0,
          "rgba(0,0,255,0.0)",
          0.2,
          "rgba(0,255,255,0.4)",
          0.4,
          "rgba(0,255,0,0.6)",
          0.7,
          "rgba(255,255,0,0.8)",
          1,
          "rgba(255,0,0,0.9)",
        ],
      },
    });

    setShowHeatmap(true);
  };

  //---------------------------------------------------------
  // USER LOCATION + ACCURACY CIRCLE
  //---------------------------------------------------------
  const updateAccuracyCircle = (lng: number, lat: number, accuracy: number) => {
    const circle = document.createElement("div");
    const size = Math.min(Math.max(accuracy / 2, 20), 300);

    circle.style.cssText = `
      width:${size}px;
      height:${size}px;
      border-radius:50%;
      background:rgba(59,130,246,0.15);
      border:2px solid rgba(59,130,246,0.4);
      pointer-events:none;
    `;

    if (accuracyCircle.current) accuracyCircle.current.remove();

    accuracyCircle.current = new tt.Marker({ element: circle })
      .setLngLat([lng, lat])
      .addTo(map.current);
  };

  const updateUserMarker = (lng: number, lat: number, accuracy: number) => {
    if (!userMarker.current) {
      const dot = document.createElement("div");
      dot.style.cssText = `
        width:22px;height:22px;border-radius:50%;
        background:#3b82f6;border:3px solid white;
        box-shadow:0 2px 8px rgba(59,130,246,.5)
      `;
      userMarker.current = new tt.Marker({ element: dot })
        .setLngLat([lng, lat])
        .addTo(map.current);
    } else {
      userMarker.current.setLngLat([lng, lat]);
    }

    updateAccuracyCircle(lng, lat, accuracy);
  };

  //---------------------------------------------------------
  // LOCATE ME (Manual) — also used automatically on load
  //---------------------------------------------------------
  const locateOnce = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation not supported in this browser.");
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const { latitude, longitude, accuracy } = pos.coords;
        updateUserMarker(longitude, latitude, accuracy);
        setUserCoords({ lat: latitude, lng: longitude });
        map.current.flyTo({ center: [longitude, latitude], zoom: 15 });
      },
      (err) => {
        console.warn("Locate error:", err);
        toast.error("Unable to fetch your location.");
      },
      { enableHighAccuracy: true }
    );
  };

  const handleLocateMe = () => {
    locateOnce();
  };

  //---------------------------------------------------------
  // ROUTING
  //---------------------------------------------------------
  const calculateRoute = async (
    uLng: number,
    uLat: number,
    dLng: number,
    dLat: number
  ) => {
    try {
      const res = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${uLat},${uLng}:${dLat},${dLng}/json?key=${TOMTOM_API_KEY}`
      );
      const data = await res.json();

      if (!data.routes?.length) return;

      const coords = data.routes[0].legs[0].points.map((p: any) => [
        p.longitude,
        p.latitude,
      ]);

      if (routeLayerRef.current) {
        map.current.removeLayer(routeLayerRef.current);
        map.current.removeSource(routeLayerRef.current);
      }

      const id = "route-" + Date.now();
      routeLayerRef.current = id;

      map.current.addSource(id, {
        type: "geojson",
        data: {
          type: "Feature",
          geometry: { type: "LineString", coordinates: coords },
        },
      });

      map.current.addLayer({
        id,
        type: "line",
        source: id,
        paint: { "line-color": "#3b82f6", "line-width": 5 },
      });

      const dist = (data.routes[0].summary.lengthInMeters / 1000).toFixed(2);
      const time = Math.round(data.routes[0].summary.travelTimeInSeconds / 60);

      setRouteInfo({ distance: `${dist} km`, duration: `${time} min` });
    } catch (e) {
      console.error(e);
      toast.error("Route error");
    }
  };

  //---------------------------------------------------------
  // SEARCH DESTINATION
  //---------------------------------------------------------
  const handleSearch = async () => {
    if (!searchQuery.trim()) return toast.error("Enter a location");

    const res = await fetch(
      `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(
        searchQuery
      )}.json?key=${TOMTOM_API_KEY}`
    );
    const data = await res.json();

    if (!data.results?.length) return toast.error("Not found");

    const { lat, lon } = data.results[0].position;

    // Remove old destination pin
    if (destMarkerRef.current) destMarkerRef.current.remove();

    const el = document.createElement("div");
    el.style.cssText = `
      width:28px;height:28px;border-radius:50%;
      background:#ef4444;border:3px solid white;
      box-shadow:0 2px 6px rgba(239,68,68,.5);
      display:flex;align-items:center;justify-content:center;
      font-size:16px
    `;
    el.innerHTML = "🎯";

    destMarkerRef.current = new tt.Marker({ element: el })
      .setLngLat([lon, lat])
      .addTo(map.current);

    toast.success(`Found: ${data.results[0].address.freeformAddress}`);

    if (userMarker.current) {
      const u = userMarker.current.getLngLat();
      calculateRoute(u.lng, u.lat, lon, lat);
    }
  };

  //---------------------------------------------------------
  // INIT MAP
  //---------------------------------------------------------
  useEffect(() => {
    if (!mapElement.current) return;

    map.current = tt.map({
      key: TOMTOM_API_KEY,
      container: mapElement.current,
      center: [73.8567, 18.5204], // Temporary center (Pune) – will jump to your location
      zoom: 5,
    });

    map.current.on("load", () => {
      loadMarkers();
      // 🔥 automatically locate user when map is ready
      locateOnce();
    });

    return () => {
      map.current?.remove();
    };
  }, []);

  //---------------------------------------------------------
  // UI RENDER
  //---------------------------------------------------------
  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4">
        {/* TOP CONTROLS */}
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1 flex gap-2">
            <Input
              placeholder="Search location…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSearch()}
            />
            <Button onClick={handleSearch}>
              <Search size={18} /> Search
            </Button>
          </div>

          <Button
            variant={showHeatmap ? "default" : "outline"}
            onClick={toggleHeatmap}
          >
            <Layers size={18} /> Heatmap
          </Button>

          <Button onClick={onAddMarker}>
            <Plus size={18} /> Add Marker
          </Button>

          <Button onClick={handleLocateMe}>
            <Navigation2 size={18} /> Locate Me
          </Button>
        </div>

        {/* MAP */}
        <Card className="relative h-[600px] overflow-hidden">
          <div ref={mapElement} className="absolute inset-0" />

          {routeInfo && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary/90 text-white px-6 py-2 rounded-lg shadow-lg flex gap-4">
              <span>🛣 {routeInfo.distance}</span>
              <span>⏱ {routeInfo.duration}</span>
            </div>
          )}
        </Card>
      </div>
    </section>
  );
};

export default MapView;
