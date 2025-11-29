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
  const [routeInfo, setRouteInfo] = useState<{distance: string, duration: string} | null>(null);
  const [userCoords, setUserCoords] = useState<{lat: number; lng: number} | null>(null);
  const [userAddress, setUserAddress] = useState<string | null>(null);
  const mapElement = useRef<HTMLDivElement>(null);
  const mapInstance = useRef<any>(null);
  const markersRef = useRef<any[]>([]);
  const userLocationMarkerRef = useRef<any>(null);
  const watchIdRef = useRef<number | null>(null);
  const accuracyCircleRef = useRef<any>(null);
  const routeLayerRef = useRef<string | null>(null);
  const destinationMarkerRef = useRef<any>(null);

  // Type to color mapping
  const getMarkerColor = (type: string): string => {
    const typeMap: Record<string, string> = {
      ramp: "#10b981", // green (accessible-high)
      elevator: "#3b82f6", // blue
      lift: "#3b82f6", // blue
      tactile_path: "#f59e0b", // orange (accessible-medium)
      tactile: "#f59e0b", // orange
      walkway: "#84cc16", // lime (accent-leaf)
      safe_walkway: "#84cc16", // lime
      stairs: "#ef4444", // red (accessible-low)
      obstacle: "#ef4444", // red
    };
    
    const normalizedType = type.toLowerCase().replace(/\s+/g, "_");
    return typeMap[normalizedType] || "#6b7280"; // default gray
  };

  // Map type -> emoji for markers and legend
  const getMarkerEmoji = (type: string): string => {
    const t = type.toLowerCase().replace(/\s+/g, "_");
    const map: Record<string, string> = {
      ramp: "♿",
      elevator: "🛗",
      lift: "🛗",
      tactile_path: "🦯",
      tactile: "🦯",
      walkway: "🚶",
      safe_walkway: "🚶",
      stairs: "🪜",
      obstacle: "🪜",
    };
    return map[t] || "📍";
  };

  const getReadableType = (type: string) => {
    return type
      .toString()
      .replace(/_/g, " ")
      .split(" ")
      .map((s) => s.charAt(0).toUpperCase() + s.slice(1))
      .join(" ");
  };

  // Load accessibility markers from database
  const loadMarkers = async () => {
    try {
      const { data, error } = await supabase
        .from("accessible_places")
        .select("*");

      if (error) throw error;

      // If no data from DB, fall back to a few sample markers in Maharashtra so markers are visible
      const samplePlaces = [
        {
          id: "mumbai-sample",
          type: "ramp",
          description: "Marine Drive - sample accessible ramp",
          lat: 19.0760,
          lng: 72.8777,
          rating: 4,
          verified: true,
        },
        // Multiple specific sample markers in Shivajinagar, Pune (helpful for differently-abled testing)
        {
          id: "shivajinagar-ramp-1",
          type: "ramp",
          description: "Accessible ramp near Shivajinagar bus stop",
          lat: 18.5212,
          lng: 73.8558,
          rating: 4,
          verified: true,
        },
        {
          id: "shivajinagar-elevator-1",
          type: "elevator",
          description: "Elevator access at commercial complex, Shivajinagar",
          lat: 18.5219,
          lng: 73.8565,
          rating: 3,
          verified: false,
        },
        {
          id: "shivajinagar-tactile-1",
          type: "tactile_path",
          description: "Tactile walking path towards the Shivajinagar market",
          lat: 18.5206,
          lng: 73.8576,
          rating: 3,
          verified: false,
        },
        {
          id: "shivajinagar-walkway-1",
          type: "walkway",
          description: "Safe walkway with ramps along Main Rd, Shivajinagar",
          lat: 18.5225,
          lng: 73.8580,
          rating: 4,
          verified: true,
        },
        {
          id: "shivajinagar-stairs-1",
          type: "stairs",
          description: "Stair access (note: not accessible)",
          lat: 18.5210,
          lng: 73.8587,
          rating: 2,
          verified: false,
        },
        {
          id: "nagpur-sample",
          type: "walkway",
          description: "Futala Lake - sample accessible walkway",
          lat: 21.1458,
          lng: 79.0882,
          rating: 4,
          verified: false,
        },
      ];

      // Demo markers for presentation — concentrated around Pune (Shivajinagar) so judges see many points
      const demoMarkers = (() => {
        const baseLat = 18.5212; // Shivajinagar center approx
        const baseLng = 73.8560;
        const types = ["ramp", "tactile_path", "walkway", "elevator", "stairs", "obstacle"];
        const demo: any[] = [];

        // generate a grid of sample demo markers close to Shivajinagar (5x6 = 30 markers)
        let idCounter = 1;
        for (let r = -2; r <= 2; r++) {
          for (let c = -2; c <= 3; c++) {
            const lat = +(baseLat + r * 0.0008 + (Math.random() - 0.5) * 0.0004).toFixed(6);
            const lng = +(baseLng + c * 0.0008 + (Math.random() - 0.5) * 0.0004).toFixed(6);
            const t = types[(idCounter - 1) % types.length];
            demo.push({
              id: `demo_pune_${idCounter}`,
              type: t,
              description: `Demo ${getReadableType(t)} — demonstration marker ${idCounter}`,
              lat,
              lng,
              rating: (Math.floor(Math.random() * 3) + 3),
              verified: idCounter % 4 === 0,
            });
            idCounter++;
          }
        }
        return demo;
      })();

      // Always include demo markers as well so the map is full of visible points for demos
      const placesToUse = (data && data.length > 0) ? data.concat(demoMarkers) : samplePlaces.concat(demoMarkers);

      if (placesToUse && mapInstance.current) {
        // Clear existing markers
        markersRef.current.forEach((marker) => marker.remove());
        markersRef.current = [];

        // Add new markers
        placesToUse.forEach((place) => {
          const color = getMarkerColor(place.type);
          
          // Create custom marker element
          const markerElement = document.createElement("div");
          // Use slightly larger markers so emoji fits nicely
          markerElement.style.width = "34px";
          markerElement.style.height = "34px";
          markerElement.style.borderRadius = "50%";
          markerElement.style.backgroundColor = color;
          markerElement.style.border = "3px solid white";
          markerElement.style.boxShadow = "0 2px 6px rgba(0,0,0,0.25)";
          markerElement.style.cursor = "pointer";
          markerElement.style.display = "flex";
          markerElement.style.alignItems = "center";
          markerElement.style.justifyContent = "center";
          markerElement.style.fontSize = "16px";
          markerElement.style.lineHeight = "1";
          markerElement.style.color = "white";
          markerElement.innerHTML = getMarkerEmoji(place.type);

          const marker = new tt.Marker({ element: markerElement })
            .setLngLat([place.lng, place.lat])
            .addTo(mapInstance.current);

          // Add popup with place info
          const popup = new tt.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong>${getMarkerEmoji(place.type)} ${getReadableType(place.type)}</strong>
              ${place.description ? `<p style="margin: 4px 0;">${place.description}</p>` : ""}
              ${place.rating ? `<p style="margin: 4px 0;">Rating: ${place.rating}/5</p>` : ""}
              ${place.verified ? '<p style="margin: 4px 0; color: #10b981;">✓ Verified</p>' : ""}
            </div>
          `);

          marker.setPopup(popup);
          markersRef.current.push(marker);
        });

        if (data && data.length > 0) {
          toast.success(`Loaded ${data.length} accessibility markers`);
        } else {
          toast.info("No markers in DB — showing sample Maharashtra markers (Mumbai / Pune / Nagpur)");
        }

        // If we used sample markers (DB empty) or markers were added, fit the map bounds
        if (placesToUse.length > 0 && mapInstance.current) {
          try {
            const coords = placesToUse.map((p: any) => [p.lng, p.lat] as [number, number]);
            const bounds = coords.reduce((b: any, c: [number, number]) => b.extend(c), new tt.LngLatBounds(coords[0], coords[0]));
            mapInstance.current.fitBounds(bounds, { padding: 80 });
          } catch (e) {
            console.warn("Could not fit map bounds for markers", e);
          }
        }
      }
    } catch (error) {
      console.error("Error loading markers:", error);
      toast.error("Failed to load accessibility markers");
    }
  };

  const [mapLoading, setMapLoading] = useState(false);
  const [mapLoadError, setMapLoadError] = useState<string | null>(null);

  const initMap = () => {
    if (!mapElement.current) return;

    setMapLoadError(null);
    setMapLoading(true);

    try {
      // Initialize TomTom map
      mapInstance.current = tt.map({
        key: TOMTOM_API_KEY,
        container: mapElement.current,
        center: [77.5946, 12.9716], // Bangalore coordinates as default
        zoom: 14,
      });

      // Add navigation controls
      mapInstance.current.addControl(new tt.NavigationControl());

      // When map finishes loading, proceed with markers and user location
      mapInstance.current.on("load", () => {
        setMapLoading(false);
        setMapLoadError(null);
        loadMarkers();
        getUserLocation();
      });

      // Attach error handler if map emits errors
      mapInstance.current.on("error", (err: any) => {
        console.error("TomTom map error event:", err);
        setMapLoading(false);
        setMapLoadError("TomTom reported an error while loading the map.");
      });

      // Safety timeout: if still loading after X seconds, treat as failure
      setTimeout(() => {
        if (mapLoading && !mapInstance.current?.isStyleLoaded?.()) {
          console.warn("Map still loading after timeout; marking load error");
          setMapLoading(false);
          setMapLoadError("Map timed out while loading. Check API key / network / allowed origins.");
        }
      }, 8000);
    } catch (e) {
      console.error("Failed to init map:", e);
      setMapLoadError((e as any)?.message || String(e));
      setMapLoading(false);
    }
  };

  useEffect(() => {
    initMap();

    // Cleanup
    return () => {
      markersRef.current.forEach((marker) => marker.remove());
      if (userLocationMarkerRef.current) {
        userLocationMarkerRef.current.remove();
      }
      if (destinationMarkerRef.current) {
        destinationMarkerRef.current.remove();
      }
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
      }
      if (routeLayerRef.current && mapInstance.current?.getLayer(routeLayerRef.current)) {
        mapInstance.current.removeLayer(routeLayerRef.current);
        mapInstance.current.removeSource(routeLayerRef.current);
      }
      if (watchIdRef.current !== null) {
        navigator.geolocation.clearWatch(watchIdRef.current);
      }
      if (mapInstance.current) {
        mapInstance.current.remove();
      }
    };
  }, []);

  // geolocation helper — get user location, watch for updates
  const getUserLocation = () => {
    // Cleanup
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    console.log("Starting high-accuracy location tracking...");
    let isFirstLocation = true;

    // Helper to create / update an accuracy circle marker
    const updateAccuracyCircle = (lng: number, lat: number, accuracy: number) => {
      // Create or update a semi-transparent circle element as a marker
      const radius = Math.max(accuracy, 10); // ensure minimum size

      const circleEl = document.createElement("div");
      circleEl.style.width = `${Math.min(Math.max(radius / 2, 20), 400)}px`;
      circleEl.style.height = circleEl.style.width;
      circleEl.style.borderRadius = "50%";
      circleEl.style.background = "rgba(59,130,246,0.12)";
      circleEl.style.border = "2px solid rgba(59,130,246,0.22)";
      circleEl.style.pointerEvents = "none";

      // Remove existing accuracy marker if present
      if (accuracyCircleRef.current) {
        accuracyCircleRef.current.remove();
        accuracyCircleRef.current = null;
      }

      accuracyCircleRef.current = new tt.Marker({ element: circleEl, anchor: "center" })
        .setLngLat([lng, lat])
        .addTo(mapInstance.current);
    };

    // Try a quick one-time getCurrentPosition so user sees a location immediately
    navigator.geolocation.getCurrentPosition(
      async (initialPos) => {
        const { latitude, longitude, accuracy } = initialPos.coords;
        if (mapInstance.current) {
          // Create marker immediately
          if (!userLocationMarkerRef.current) {
            const userMarkerElement = document.createElement("div");
            userMarkerElement.style.width = "24px";
            userMarkerElement.style.height = "24px";
            userMarkerElement.style.borderRadius = "50%";
            userMarkerElement.style.backgroundColor = "#3b82f6";
            userMarkerElement.style.border = "3px solid white";
            userMarkerElement.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.5)";
            userMarkerElement.style.cursor = "pointer";

            userLocationMarkerRef.current = new tt.Marker({ element: userMarkerElement })
              .setLngLat([longitude, latitude])
              .addTo(mapInstance.current);

            const popup = new tt.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong>📍 Your Location</strong>
                <p style="margin: 4px 0; font-size: 12px;">Accuracy: ±${Math.round(accuracy)}m</p>
              </div>
            `);
            userLocationMarkerRef.current.setPopup(popup);

            mapInstance.current.flyTo({ center: [longitude, latitude], zoom: 16 });
            toast.success(`Location found! Accuracy: ±${Math.round(accuracy)}m`);
          } else {
            // update existing marker position when marker is already created
            userLocationMarkerRef.current.setLngLat([longitude, latitude]);
          }

          // store coordinates in state
          setUserCoords({ lat: latitude, lng: longitude });

          // reverse geocode once for a human readable address (helps confirm state/city)
          try {
            const r = await fetch(
              `https://api.tomtom.com/search/2/reverseGeocode/${latitude},${longitude}.json?key=${TOMTOM_API_KEY}`
            );
            const reverse = await r.json();
            if (reverse && reverse.address) {
              // TomTom returns tentative address info at top-level address or results
              let addressText = "";
              if (reverse.address.freeformAddress) {
                addressText = reverse.address.freeformAddress;
              } else if (reverse.address.municipality) {
                addressText = `${reverse.address.municipality}, ${reverse.address.countrySubdivision || ""}`.trim();
              } else if (reverse.address.countrySubdivision) {
                addressText = reverse.address.countrySubdivision;
              }
              if (addressText) setUserAddress(addressText);
            } else if (reverse.results && reverse.results.length > 0) {
              setUserAddress(reverse.results[0].address.freeformAddress || null);
            }
          } catch (e) {
            console.warn("Reverse geocode failed", e);
          }
        

          // Render an accuracy circle so users can visually see the uncertainty
          updateAccuracyCircle(longitude, latitude, accuracy || 30);
          isFirstLocation = false; // we've already centered
        }
      },
      (err) => {
        console.warn("getCurrentPosition failed, will fall back to watchPosition", err);
        // Let watchPosition handle continuous updates / errors
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );

    // Use watchPosition for real-time tracking with high accuracy
    watchIdRef.current = navigator.geolocation.watchPosition(
      (position) => {
        const { latitude, longitude, accuracy } = position.coords;
        
        console.log(`Location update: Lat ${latitude}, Lng ${longitude}, Accuracy: ${accuracy}m`);
        
        if (mapInstance.current) {
          // Update or create accuracy circle
          // Update or create an accuracy circle marker (visual representation only)
          updateAccuracyCircle(longitude, latitude, accuracy);

          if (userLocationMarkerRef.current) {
            // Update existing marker position
            userLocationMarkerRef.current.setLngLat([longitude, latitude]);
            setUserCoords({ lat: latitude, lng: longitude });
            
            // Update popup with accuracy (keep existing popup if present)
            const popup = new tt.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong>📍 Your Location</strong>
                <p style="margin: 4px 0; font-size: 12px;">Accuracy: ±${Math.round(accuracy)}m</p>
              </div>
            `);
            userLocationMarkerRef.current.setPopup(popup);
          } else {
            // Create custom marker for user location
            const userMarkerElement = document.createElement("div");
            userMarkerElement.style.width = "24px";
            userMarkerElement.style.height = "24px";
            userMarkerElement.style.borderRadius = "50%";
            userMarkerElement.style.backgroundColor = "#3b82f6";
            userMarkerElement.style.border = "3px solid white";
            userMarkerElement.style.boxShadow = "0 2px 8px rgba(59, 130, 246, 0.5)";
            userMarkerElement.style.cursor = "pointer";
            userMarkerElement.style.animation = "pulse 2s infinite";

            userLocationMarkerRef.current = new tt.Marker({ element: userMarkerElement })
              .setLngLat([longitude, latitude])
              .addTo(mapInstance.current);

            const popup = new tt.Popup({ offset: 25 }).setHTML(`
              <div style="padding: 8px;">
                <strong>📍 Your Location</strong>
                <p style="margin: 4px 0; font-size: 12px;">Accuracy: ±${Math.round(accuracy)}m</p>
              </div>
            `);
            userLocationMarkerRef.current.setPopup(popup);
            setUserCoords({ lat: latitude, lng: longitude });
          }

          // Only center map on first location update
          if (isFirstLocation) {
            mapInstance.current.flyTo({
              center: [longitude, latitude],
              zoom: 16,
            });
            toast.success(`Location found! Accuracy: ±${Math.round(accuracy)}m`);
            isFirstLocation = false;
          }
        }
      },
      (error) => {
        console.error("Geolocation error:", error);
        let errorMessage = "Unable to get your location.";
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorMessage = "Location permission denied. Please enable location access.";
            break;
          case error.POSITION_UNAVAILABLE:
            errorMessage = "Location information unavailable.";
            break;
          case error.TIMEOUT:
            errorMessage = "Location request timed out.";
            break;
        }
        
        toast.error(errorMessage);
      },
      {
        enableHighAccuracy: true,
        maximumAge: 0,
        timeout: 10000,
      }
    );
  };

  // Manual locate function for UI button — we call getUserLocation and force reverse geocode
  const handleManualLocate = async () => {
    // call the same flow — the getUserLocation function will perform a getCurrentPosition
    getUserLocation();
  };

  const calculateRoute = async (userLng: number, userLat: number, destLng: number, destLat: number) => {
    try {
      const response = await fetch(
        `https://api.tomtom.com/routing/1/calculateRoute/${userLat},${userLng}:${destLat},${destLng}/json?key=${TOMTOM_API_KEY}`
      );
      const data = await response.json();

      if (data.routes && data.routes.length > 0) {
        const route = data.routes[0];
        const coordinates = route.legs[0].points.map((point: any) => [point.longitude, point.latitude]);
        
        // Remove previous route if exists
        if (routeLayerRef.current && mapInstance.current.getLayer(routeLayerRef.current)) {
          mapInstance.current.removeLayer(routeLayerRef.current);
          mapInstance.current.removeSource(routeLayerRef.current);
        }

        // Add route to map
        const routeId = 'route-' + Date.now();
        routeLayerRef.current = routeId;

        mapInstance.current.addSource(routeId, {
          type: 'geojson',
          data: {
            type: 'Feature',
            properties: {},
            geometry: {
              type: 'LineString',
              coordinates: coordinates
            }
          }
        });

        mapInstance.current.addLayer({
          id: routeId,
          type: 'line',
          source: routeId,
          layout: {
            'line-join': 'round',
            'line-cap': 'round'
          },
          paint: {
            'line-color': '#3b82f6',
            'line-width': 5,
            'line-opacity': 0.8
          }
        });

        // Calculate distance and time
        const distanceKm = (route.summary.lengthInMeters / 1000).toFixed(2);
        const durationMin = Math.round(route.summary.travelTimeInSeconds / 60);
        
        setRouteInfo({
          distance: `${distanceKm} km`,
          duration: `${durationMin} min`
        });

        // Fit map to show entire route
        const bounds = coordinates.reduce((bounds: any, coord: any) => {
          return bounds.extend(coord);
        }, new tt.LngLatBounds(coordinates[0], coordinates[0]));

        mapInstance.current.fitBounds(bounds, { padding: 50 });

        toast.success(`Route calculated: ${distanceKm} km, ${durationMin} minutes`);
      }
    } catch (error) {
      console.error("Route calculation error:", error);
      toast.error("Failed to calculate route");
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) {
      toast.error("Please enter a location to search");
      return;
    }

    try {
      const response = await fetch(
        `https://api.tomtom.com/search/2/geocode/${encodeURIComponent(
          searchQuery
        )}.json?key=${TOMTOM_API_KEY}`
      );
      const data = await response.json();

      if (data.results && data.results.length > 0) {
        const result = data.results[0];
        const { lat, lon } = result.position;
        
        if (mapInstance.current) {
          // Remove previous destination marker
          if (destinationMarkerRef.current) {
            destinationMarkerRef.current.remove();
          }

          // Add marker at searched location
          const destMarkerElement = document.createElement("div");
          destMarkerElement.style.width = "30px";
          destMarkerElement.style.height = "30px";
          destMarkerElement.style.borderRadius = "50%";
          destMarkerElement.style.backgroundColor = "#ef4444";
          destMarkerElement.style.border = "3px solid white";
          destMarkerElement.style.boxShadow = "0 2px 8px rgba(239, 68, 68, 0.5)";
          destMarkerElement.innerHTML = "🎯";
          destMarkerElement.style.display = "flex";
          destMarkerElement.style.alignItems = "center";
          destMarkerElement.style.justifyContent = "center";
          destMarkerElement.style.fontSize = "16px";

          destinationMarkerRef.current = new tt.Marker({ element: destMarkerElement })
            .setLngLat([lon, lat])
            .addTo(mapInstance.current);

          const popup = new tt.Popup({ offset: 25 }).setHTML(`
            <div style="padding: 8px;">
              <strong>🎯 Destination</strong>
              <p style="margin: 4px 0;">${result.address.freeformAddress}</p>
            </div>
          `);
          destinationMarkerRef.current.setPopup(popup);

          toast.success(`Found: ${result.address.freeformAddress}`);

          // Calculate route if user location is available
          if (userLocationMarkerRef.current) {
            const userLngLat = userLocationMarkerRef.current.getLngLat();
            calculateRoute(userLngLat.lng, userLngLat.lat, lon, lat);
          } else {
            toast.info("Getting your location to calculate route...");
            // Wait for user location, then calculate route
            const checkUserLocation = setInterval(() => {
              if (userLocationMarkerRef.current) {
                clearInterval(checkUserLocation);
                const userLngLat = userLocationMarkerRef.current.getLngLat();
                calculateRoute(userLngLat.lng, userLngLat.lat, lon, lat);
              }
            }, 500);
            
            // Clear interval after 10 seconds if location not found
            setTimeout(() => clearInterval(checkUserLocation), 10000);
          }
        }
      } else {
        toast.error("Location not found");
      }
    } catch (error) {
      toast.error("Search failed. Please try again.");
    }
  };

  return (
    <section className="container mx-auto px-4 py-8">
      <div className="flex flex-col gap-4">
        {/* Controls */}
        <div className="flex flex-col md:flex-row gap-4">
          <div className="flex-1 flex gap-2">
            <Input 
              placeholder="Search location..." 
              className="flex-1"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Button onClick={handleSearch} className="gap-2">
              <Search size={18} />
              Search
            </Button>
          </div>
          
          <div className="flex gap-2">
            <Button 
              variant={showHeatmap ? "default" : "outline"} 
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="gap-2"
            >
              <Layers size={18} />
              Heatmap
            </Button>
            <Button onClick={onAddMarker} className="gap-2">
              <Plus size={18} />
              Add Marker
            </Button>
            <Button onClick={handleManualLocate} className="gap-2">
              <Navigation2 size={18} />
              Locate me
            </Button>
          </div>
        </div>

        {/* Map Container */}
        <Card className="relative h-[600px] overflow-hidden">
          <div ref={mapElement} className="absolute inset-0" />

          {/* Map loading / error overlays */}
          {mapLoading && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/30">
              <div className="bg-card/95 p-4 rounded-md shadow-lg border border-border text-center">
                <div className="mb-2 font-semibold">Loading map…</div>
                <div className="text-xs text-muted-foreground">Initializing map tiles — please wait</div>
              </div>
            </div>
          )}

          {mapLoadError && (
            <div className="absolute inset-0 z-20 flex items-center justify-center bg-black/40">
              <div className="bg-card/95 p-4 rounded-md shadow-lg border border-border text-center max-w-sm">
                <div className="mb-2 font-semibold text-destructive">Map failed to load</div>
                <div className="text-xs text-muted-foreground mb-3">{mapLoadError}</div>
                <div className="flex gap-2 justify-center">
                  <Button onClick={() => initMap()} variant="outline">Retry</Button>
                </div>
              </div>
            </div>
          )}
          
          {/* Route Info */}
          {routeInfo && (
            <div className="absolute top-4 left-1/2 -translate-x-1/2 bg-primary/95 backdrop-blur-sm text-primary-foreground rounded-lg px-6 py-3 border border-primary z-10 shadow-lg">
              <div className="flex items-center gap-6">
                <div className="flex items-center gap-2">
                  <Navigation2 size={18} />
                  <span className="font-semibold">{routeInfo.distance}</span>
                </div>
                <div className="border-l border-primary-foreground/30 h-4" />
                <div className="flex items-center gap-2">
                  <span className="text-sm">⏱️</span>
                  <span className="font-semibold">{routeInfo.duration}</span>
                </div>
              </div>
            </div>
          )}

          {/* Current user coords/address */}
          {userCoords && (
            <div className="absolute top-4 right-4 bg-card/95 backdrop-blur-sm rounded-lg px-4 py-2 border border-border z-10 text-sm shadow-md">
              <div className="font-medium">Your location</div>
              <div className="text-xs mt-1">
                {userAddress ? (
                  <div className="truncate max-w-xs">{userAddress}</div>
                ) : (
                  <div className="truncate max-w-xs">Lat: {userCoords.lat.toFixed(6)}, Lng: {userCoords.lng.toFixed(6)}</div>
                )}
              </div>
            </div>
          )}

          {/* Map Legend */}
          <div className="absolute bottom-4 left-4 bg-card/95 backdrop-blur-sm rounded-lg p-4 border border-border z-10 max-w-xs">
            <h4 className="font-semibold mb-3">Accessibility Markers</h4>
            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accessible-high flex items-center justify-center text-xs">♿</div>
                <span>♿ Ramp</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center text-xs">🛗</div>
                <span>🛗 Lift/Elevator</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accessible-medium flex items-center justify-center text-xs">🦯</div>
                <span>🦯 Tactile Path</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accent-leaf flex items-center justify-center text-xs">🚶</div>
                <span>🚶 Safe Walkway</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-6 h-6 rounded-full bg-accessible-low flex items-center justify-center text-xs">🪜</div>
                <span>🪜 Stairs/Obstacle</span>
              </div>
            </div>
            
            {showHeatmap && (
              <>
                <div className="border-t border-border my-3" />
                <h4 className="font-semibold mb-3">Accessibility Score</h4>
                <div className="space-y-2 text-sm">
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-accessible-high" />
                    <span>🟢 Fully Accessible (60+)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-accessible-medium" />
                    <span>🟡 Partial (35-60)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-accessible-low" />
                    <span>🔴 Low (10-35)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="w-4 h-4 rounded bg-accessible-unknown" />
                    <span>🔵 Needs Data</span>
                  </div>
                </div>
              </>
            )}
          </div>
        </Card>
      </div>
    </section>
  );
};

export default MapView;
