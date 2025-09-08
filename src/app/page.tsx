"use client";

import { useEffect, useRef, useState } from "react";
import maplibregl from "maplibre-gl";
import "maplibre-gl/dist/maplibre-gl.css";
import "./globals.css";

interface Stop {
  name: string;
  code: string | null;
  coordinates: [number, number];
  street_name: string;
  rapid_stop_id?: number | null;
  mrt_stop_id?: number | null;
}

interface Route {
  name: string;
  operator: string;
  color: string | null;
  route_type: number;
}

interface Service {
  headsign: string;
  direction: number;
  stops: number[];
  shape_id: string;
}

export default function Home() {
  const mapContainer = useRef<HTMLDivElement | null>(null);
  const map = useRef<maplibregl.Map | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchActive, setSearchActive] = useState(false);
  const [routes, setRoutes] = useState<Record<string, Route>>({});
  const [services, setServices] = useState<Record<string, Service[]>>({});
  const [stops, setStops] = useState<Record<string, Stop>>({});
  const [shapes, setShapes] = useState<Record<string, string>>({});
  const [filteredRoutes, setFilteredRoutes] = useState<string[]>([]);
  const [selectedRoute, setSelectedRoute] = useState<string | null>(null);
  const [previewedRoute, setPreviewedRoute] = useState<string | null>(null);

  // Helper functions for color manipulation
  const lightenColor = (color: string, percent: number): string => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const lighten = (val: number) =>
      Math.min(255, Math.floor(val + (255 - val) * (percent / 100)));

    return `rgb(${lighten(r)}, ${lighten(g)}, ${lighten(b)})`;
  };

  const darkenColor = (color: string, percent: number): string => {
    const hex = color.replace("#", "");
    const r = parseInt(hex.substr(0, 2), 16);
    const g = parseInt(hex.substr(2, 2), 16);
    const b = parseInt(hex.substr(4, 2), 16);

    const darken = (val: number) =>
      Math.max(0, Math.floor(val * (1 - percent / 100)));

    return `rgb(${darken(r)}, ${darken(g)}, ${darken(b)})`;
  };

  // Decode polyline string to coordinates
  const decodePolyline = (str: string): [number, number][] => {
    let index = 0;
    let lat = 0;
    let lng = 0;
    const coordinates: [number, number][] = [];
    const precision = 5;

    while (index < str.length) {
      let b;
      let shift = 0;
      let result = 0;

      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLat = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lat += deltaLat;

      shift = 0;
      result = 0;

      do {
        b = str.charCodeAt(index++) - 63;
        result |= (b & 0x1f) << shift;
        shift += 5;
      } while (b >= 0x20);

      const deltaLng = (result & 1) !== 0 ? ~(result >> 1) : result >> 1;
      lng += deltaLng;

      coordinates.push([
        lng / Math.pow(10, precision),
        lat / Math.pow(10, precision),
      ]);
    }

    return coordinates;
  };

  // Display route on map
  const showRouteOnMap = (routeId: string) => {
    if (!map.current || !services[routeId] || !shapes) return;

    // Get first service for the route
    const routeServices = services[routeId];
    if (!routeServices || routeServices.length === 0) return;

    const allCoords: [number, number][] = [];
    const service = routeServices;
    service.forEach((service) => {
      const shapePolyline = shapes[service.shape_id];

      if (!shapePolyline) return;

      // Decode polyline to coordinates
      const coordinates = decodePolyline(shapePolyline);

      allCoords.push(...coordinates);

      if (coordinates.length === 0) return;

      // if (
      //   map.current?.getSource("route" + service.direction) ||
      //   map.current?.getSource("route-background" + service.direction) ||
      //   map.current?.getSource("route-arrows" + service.direction) ||
      //   map.current?.getLayer("route-arrows" + service.direction) ||
      //   map.current?.getLayer("route-background" + service.direction) ||
      //   map.current?.getLayer("route" + service.direction)
      // ) {
      //   map.current?.removeSource("route" + service.direction);
      //   map.current?.removeSource("route-background" + service.direction);
      //   map.current?.removeSource("route-arrows" + service.direction);
      //   map.current?.removeLayer("route-arrows" + service.direction);
      //   map.current?.removeLayer("route-background" + service.direction);
      //   map.current?.removeLayer("route" + service.direction);
      // }

      //Separate the if statement for each  sources and layers
      if (map.current?.getSource("route" + service.shape_id)) {
        map.current?.removeSource("route" + service.shape_id);
      }
      if (map.current?.getSource("route-background" + service.shape_id)) {
        map.current?.removeSource("route-background" + service.shape_id);
      }
      if (map.current?.getSource("route-arrows" + service.shape_id)) {
        map.current?.removeSource("route-arrows" + service.shape_id);
      }

      if (
        map.current?.getLayer("route-arrows" + service.shape_id) ||
        map.current?.getLayer("route-background" + service.shape_id) ||
        map.current?.getLayer("route" + service.shape_id)
      ) {
        map.current?.removeLayer("route-arrows" + service.shape_id);
        map.current?.removeLayer("route-background" + service.shape_id);
        map.current?.removeLayer("route" + service.shape_id);
      }

      // Add route source
      map.current?.addSource("route" + service.shape_id, {
        type: "geojson",
        lineMetrics: true,
        data: {
          type: "Feature",
          properties: {
            color: routes[routeId]?.color || "#dc241f",
            direction: service.direction,
          },
          geometry: {
            type: "LineString",
            coordinates: coordinates,
          },
        },
      });

      // Add background route layer (white outline)
      map.current?.addLayer({
        id: "route-background" + service.shape_id,
        type: "line",
        source: "route" + service.shape_id,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none",
        },
        paint: {
          "line-color": "#fff",
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            6,
            16,
            10,
            22,
            16,
          ],
          "line-opacity": 0.9,
        },
      });

      // Add main route layer with gradient
      const baseColor = routes[routeId]?.color || "#dc241f";

      map.current?.addLayer({
        id: "route" + service.shape_id,
        type: "line",
        source: "route" + service.shape_id,
        layout: {
          "line-join": "round",
          "line-cap": "round",
          visibility: "none",
        },
        paint: {
          "line-gradient": [
            "interpolate",
            ["linear"],
            ["line-progress"],
            0,
            baseColor,
            0.3,
            lightenColor(baseColor, 30), // Lighter version
            0.7,
            baseColor,
            1,
            darkenColor(baseColor, 20), // Darker version
          ],
          "line-width": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            2,
            16,
            5,
            22,
            10,
          ],
          "line-opacity": 0.8,
        },
      });

      // Add route arrows
      map.current?.addLayer({
        id: "route-arrows" + service.shape_id,
        type: "symbol",
        source: "route" + service.shape_id,
        minzoom: 12,
        layout: {
          "symbol-placement": "line",
          "symbol-spacing": 100,
          "text-field": "→",
          "text-size": 16,
          "text-font": ["Open Sans Bold", "Arial Unicode MS Bold"],
          "text-allow-overlap": true,
          "text-ignore-placement": true,
          "text-keep-upright": false,
          "text-anchor": "bottom",
          "text-padding": 0,
          "text-line-height": 1,
          "text-offset": [
            "interpolate",
            ["linear"],
            ["zoom"],
            12,
            ["literal", [0, 0]],
            22,
            ["literal", [0, -2]],
          ],
          visibility: "none",
        },
        paint: {
          "text-color": routes[routeId]?.color || "#dc241f",
          "text-opacity": 0.9,
          "text-halo-color": "#fff",
          "text-halo-width": 2,
        },
      });
    });
  };

  const toggleRouteVisibility = (routeId: string, visible: boolean) => {
    services[routeId]?.forEach((service) => {
      const layerIds = [
        `route-arrows${service.shape_id}`,
        `route-background${service.shape_id}`,
        `route${service.shape_id}`,
      ];

      layerIds.forEach((layerId) => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(
            layerId,
            "visibility",
            visible ? "visible" : "none"
          );

          // map.current.setPaintProperty(
          //   layerId,
          //   "line-opacity",
          //   visible ? 0.8 : 0
          // );
        }
      });
    });
  };

  // Handle route selection
  const handleRouteSelect = (routeId: string) => {
    if (selectedRoute === routeId) {
      // Hide current route
      toggleRouteVisibility(routeId, false);
      setSelectedRoute(null);
      return;
    }

    // Hide previous route if any
    if (selectedRoute) {
      toggleRouteVisibility(selectedRoute, false);
    }

    // Show new route (create layers if they don't exist)
    if (!map.current?.getSource(`route${services[routeId][0].shape_id}`)) {
      showRouteOnMap(routeId); // Create layers
    }

    toggleRouteVisibility(routeId, true);
    setSelectedRoute(routeId);
    fitBoundsToRoute(routeId);
  };

  const fitBoundsToRoute = (routeId: string) => {
    const allCoords = services[routeId].map((service) => {
      if (!shapes[service.shape_id]) return [];
      const shapePolyline = shapes[service.shape_id];
      if (!shapePolyline) return [];
      return decodePolyline(shapePolyline);
    });

    const bounds = new maplibregl.LngLatBounds();
    allCoords.forEach((coord) => bounds.extend(coord));
    map.current?.fitBounds(bounds, {
      padding: {
        top: 50,
        bottom: 50,
        left: 450,
        right: 50,
      },
    });
  };

  const previewRoute = (routeId: string | null) => {
    // Hide previous preview
    if (previewedRoute && previewedRoute !== selectedRoute) {
      toggleRouteVisibility(previewedRoute, false);
    }

    if (routeId) {
      // Show new preview (only if route exists and layers are created)
      if (!map.current?.getSource(`route${services[routeId][0].shape_id}`)) {
        showRouteOnMap(routeId);
      } else {
        toggleRouteVisibility(routeId, true);
      }
      setPreviewedRoute(routeId);
    } else {
      setPreviewedRoute(null);
    }
  };

  // Load data
  useEffect(() => {
    const loadData = async () => {
      try {
        const [routesRes, servicesRes, stopsRes, shapesRes] = await Promise.all(
          [
            fetch("/routes.json"),
            fetch("/services.json"),
            fetch("/stops.json"),
            fetch("/shapes.json"),
          ]
        );

        const routesData = await routesRes.json();
        const servicesData = await servicesRes.json();
        const stopsData = await stopsRes.json();
        const shapesData = await shapesRes.json();

        // console.log("Loaded routes:", routesData);
        // console.log("Loaded services:", servicesData);
        // console.log("Routes count:", Object.keys(routesData).length);

        setRoutes(routesData);
        setServices(servicesData);
        setStops(stopsData);
        setShapes(shapesData);
        setFilteredRoutes(Object.keys(routesData));
      } catch (error) {
        console.error("Error loading data:", error);
      }
    };

    loadData();
  }, []);

  // Add stops to map
  const addStopsToMap = () => {
    console.log("addStopsToMap called");

    if (!map.current || !Object.keys(stops).length) {
      console.log("Skipping addStopsToMap: map or stops not ready", {
        hasMap: !!map.current,
        stopsCount: Object.keys(stops).length,
      });
      return;
    }

    // Check if map style is loaded
    if (!map.current.isStyleLoaded()) {
      console.log("Style not loaded yet, waiting...");
      return;
    }

    // Check if stops source already exists
    if (map.current.getSource("stops")) {
      console.log("Stops already added to map");
      return;
    }

    console.log(
      "Actually adding stops to map, count:",
      Object.keys(stops).length
    );

    try {
      map.current.addSource("stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: Object.entries(stops).map(([stopId, stop]) => ({
            type: "Feature",
            id: stopId,
            properties: {
              name: stop.name || "",
              code: stop.code || "",
              street_name: stop.street_name || "",
            },
            geometry: {
              type: "Point",
              coordinates: stop.coordinates,
            },
          })),
        },
      });

      // Add stops layer with different styling based on zoom level
      map.current.addLayer({
        id: "stops",
        type: "circle",
        source: "stops",
        paint: {
          "circle-radius": [
            "interpolate",
            ["linear"],
            ["zoom"],
            10,
            1,
            12,
            2,
            14,
            3,
            16,
            4,
          ],
          // For zoom < 12: solid red dots, for zoom >= 12: white with red border
          "circle-color": [
            "step",
            ["zoom"],
            "#dc241f", // Solid red dot for low zoom
            12,
            "#fff", // White fill for zoom >= 12
          ],
          "circle-stroke-color": [
            "step",
            ["zoom"],
            "#dc241f", // Same color as fill for low zoom (creates solid appearance)
            12,
            "#dc241f", // Red border for higher zoom
          ],
          "circle-stroke-width": [
            "step",
            ["zoom"],
            0, // No border for low zoom
            12,
            1.5, // Start border at zoom 12
            14,
            2,
            16,
            2.5,
          ],
          "circle-opacity": 0.9,
          "circle-stroke-opacity": [
            "step",
            ["zoom"],
            0, // No stroke opacity for low zoom
            12,
            1, // Full stroke opacity for higher zoom
          ],
        },
      });

      map.current.addLayer({
        id: "stops-label",
        type: "symbol",
        source: "stops",
        minzoom: 17,
        layout: {
          "text-field": [
            "format",
            ["get", "code"],
            { "font-scale": 1 },
            "\n",
            {},
            ["get", "name"],
            { "font-scale": 1.2 },
          ],
          "text-size": 12,
          "text-offset": [1.5, 0],
          "text-anchor": "left",
          "text-max-width": 10,
          "text-justify": "left",
        },
        paint: {
          "text-color": "#f01b48",
          "text-halo-color": "#fff",
          "text-halo-width": 1,
        },
      });

      // Add hover tooltip for lower zoom levels (when labels aren't showing)
      map.current.on("mouseenter", "stops", (e) => {
        const currentZoom = map.current!.getZoom();

        // Only show tooltip when labels aren't visible (zoom < 17)
        if (currentZoom >= 17) return;

        // Don't show hover tooltip if there's already a persistent one
        // if (persistentPopup) return;

        map.current!.getCanvas().style.cursor = "pointer";

        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const stopName = feature.properties?.name || "Unknown Stop";
          const stopCode = feature.properties?.code || "";

          // Create popup
          new maplibregl.Popup({
            closeButton: false,
            closeOnClick: false,
            className: "stop-tooltip hover-tooltip",
          })
            .setLngLat(e.lngLat)
            .setHTML(
              `${
                stopCode ? `<span class="stop-code">${stopCode}</span>` : ""
              }<span class="stop-name">${stopName}</span>`
            )
            .addTo(map.current!);
        }
      });

      map.current.on("mouseleave", "stops", () => {
        map.current!.getCanvas().style.cursor = "";
        // Remove only hover tooltips, not persistent ones
        document
          .querySelectorAll(".hover-tooltip")
          .forEach((popup) => popup.remove());
      });

      // Add click handler for persistent tooltip
      map.current.on("click", "stops", (e) => {
        map.current!.flyTo({
          center: e.lngLat,
          zoom: 17,
          padding: {
            top: 50,
            bottom: 50,
            left: 450,
            right: 50,
          },
        });
      });

      // Remove tooltips when zooming to high levels (when labels appear)
      map.current.on("zoom", () => {
        const currentZoom = map.current!.getZoom();
        if (currentZoom >= 17) {
          document
            .querySelectorAll(".maplibregl-popup")
            .forEach((popup) => popup.remove());
        }
      });

      console.log("Successfully added stops to map");
    } catch (error) {
      console.error("Error adding stops to map:", error);
    }
  };

  // Initialize map
  useEffect(() => {
    if (map.current || !mapContainer.current) return;

    console.log("Initializing map...", mapContainer.current);

    try {
      map.current = new maplibregl.Map({
        container: mapContainer.current,
        style:
          "https://api.maptiler.com/maps/basic-v2/style.json?key=Ob6oqyzoBDkIaOhNs9Ew",
        center: [101.6869, 3.139], // Kuala Lumpur center
        zoom: 12,
        maxZoom: 18,
        minZoom: 8,
      });

      map.current.on("load", () => {
        console.log("Map loaded successfully");
      });

      map.current.on("styledata", () => {
        console.log("Map style loaded");
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
      });

      // Add navigation control
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      map.current.touchPitch.disable();
    } catch (error) {
      console.error("Error initializing map:", error);
    }

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, []);

  // Add stops when data is loaded and map style is ready
  useEffect(() => {
    // console.log("Stops useEffect triggered:", {
    //   hasMap: !!map.current,
    //   stopsCount: Object.keys(stops).length,
    //   isStyleLoaded: map.current?.isStyleLoaded(),
    // });

    if (map.current && Object.keys(stops).length > 0) {
      if (map.current.isStyleLoaded()) {
        addStopsToMap();
      } else {
        // If style isn't loaded yet, wait for it
        const checkStyle = () => {
          if (map.current?.isStyleLoaded()) {
            // console.log("Style loaded, adding stops");
            addStopsToMap();
          } else {
            setTimeout(checkStyle, 100);
          }
        };
        checkStyle();
      }
    }
  }, [stops]);

  // Handle search
  const handleSearch = (query: string) => {
    setSearchQuery(query);
    if (query.trim() === "") {
      setFilteredRoutes(Object.keys(routes));
    } else {
      const filtered = Object.keys(routes).filter((routeId) => {
        const route = routes[routeId];
        if (!route) return false;

        return (
          routeId.toLowerCase().includes(query.toLowerCase()) ||
          (route.name && route.name.toLowerCase().includes(query.toLowerCase()))
        );
      });
      setFilteredRoutes(filtered);
    }
  };

  return (
    <div className="app">
      {/* Map Container */}
      <div ref={mapContainer} className="map-container" />

      <div className={`search-container ${searchActive ? "active" : ""}`}>
        <div className="search-bar">
          <input
            type="text"
            placeholder="Search routes, stops..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            onFocus={() => setSearchActive(true)}
            onBlur={() => setTimeout(() => setSearchActive(false), 150)}
            className="search-input"
          />
        </div>

        <div className="search-results">
          <div className="results-list">
            {filteredRoutes.slice(0, 100).map((routeId) => {
              const route = routes[routeId];
              if (!route) return null;

              return (
                <div
                  key={routeId}
                  className={`result-item ${
                    selectedRoute === routeId ? "selected" : ""
                  }`}
                  onClick={() => handleRouteSelect(routeId)}
                  onMouseEnter={() => previewRoute(routeId)}
                  onMouseLeave={() => previewRoute(null)}
                >
                  <div
                    className="route-badge"
                    style={{
                      border: "2px solid " + (route.color || "#dc241f"),
                      color: route.color || "#dc241f",
                    }}
                  >
                    {routeId}
                  </div>
                  <div className="route-info">
                    <div
                      className="route-name"
                      dangerouslySetInnerHTML={{
                        __html: (route.name || "Unknown Route")
                          .replace(" ↺ ", " <br>↺ ")
                          .replace(" ⇌ ", " <br>⇌ "),
                      }}
                    ></div>
                    <div className="route-operator">
                      {route.operator || "Unknown Operator"}
                    </div>
                  </div>
                </div>
              );
            })}
            {filteredRoutes.length === 0 && (
              <div className="no-results">No routes found</div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
