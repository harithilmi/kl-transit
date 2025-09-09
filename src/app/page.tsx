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
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [dragStart, setDragStart] = useState<{
    y: number;
    time: number;
  } | null>(null);
  const [dragOffset, setDragOffset] = useState(0);
  const previewTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const resultsListRef = useRef<HTMLDivElement | null>(null);
  const [savedScrollPosition, setSavedScrollPosition] = useState(0);

  // Zoom level constants
  const TOOLTIP_MIN_ZOOM = 14; // Show tooltips below this level (was 15)
  const LABEL_MIN_ZOOM = 14; // Show labels at this level and above (was 15)
  const FLYTO_ZOOM = 17; // Zoom level when flying to stops
  
  // Route color constant
  const ROUTE_COLOR = "#dc241f";

  // Function to close route info (reusable for X button and Escape key)
  const closeRouteInfo = () => {
    if (selectedRoute) {
      toggleRouteVisibility(selectedRoute, false);
      hideRouteStops();
      setSelectedRoute(null);
      setSelectedService(null);
      
      // Restore scroll position after React re-renders
      setTimeout(() => {
        if (resultsListRef.current) {
          resultsListRef.current.scrollTop = savedScrollPosition;
        }
      }, 0);
    }
  };

  // Reusable flyTo function for stops
  const flyToStop = (coordinates: [number, number]) => {
    if (!map.current) return;

    const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
    // Desktop sidebar: 350px width + 10px left margin + 10px internal padding = 370px total
    const sidebarWidth = 370;
    const padding = isMobile
      ? { top: 50, bottom: 120, left: 50, right: 50 }
      : { top: 50, bottom: 50, left: sidebarWidth + 50, right: 50 };

    map.current.flyTo({
      center: coordinates,
      zoom: FLYTO_ZOOM,
      padding,
    });
  };

  // Touch/drag handlers for mobile drawer
  const handleTouchStart = (e: React.TouchEvent) => {
    if (typeof window === "undefined" || window.innerWidth >= 768) return; // Only on mobile

    const touch = e.touches[0];
    setDragStart({ y: touch.clientY, time: Date.now() });
    setDragOffset(0);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (typeof window === "undefined" || window.innerWidth >= 768 || !dragStart)
      return;

    const touch = e.touches[0];
    const deltaY = touch.clientY - dragStart.y;

    // Only allow dragging down when open, or up when closed
    if ((drawerOpen && deltaY > 0) || (!drawerOpen && deltaY < 0)) {
      setDragOffset(deltaY);
      e.preventDefault(); // Prevent page scroll
    }
  };

  const handleTouchEnd = () => {
    if (typeof window === "undefined" || window.innerWidth >= 768 || !dragStart)
      return;

    const deltaTime = Date.now() - dragStart.time;
    const threshold = 50; // Minimum drag distance
    const velocityThreshold = 300; // Fast swipe threshold

    // Fast swipe detection
    const velocity = (Math.abs(dragOffset) / deltaTime) * 1000;
    const shouldToggle =
      Math.abs(dragOffset) > threshold || velocity > velocityThreshold;

    if (shouldToggle) {
      if (dragOffset > 0 && drawerOpen) {
        // Dragged down while open -> close
        setDrawerOpen(false);
      } else if (dragOffset < 0 && !drawerOpen) {
        // Dragged up while closed -> open
        setDrawerOpen(true);
      }
    }

    // Reset drag state
    setDragStart(null);
    setDragOffset(0);
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

  // Pre-load all routes on map initialization
  const loadAllRoutes = () => {
    if (!map.current || !services || !shapes || !routes) return;

    console.log("Pre-loading all routes...");

    Object.keys(services).forEach((routeId) => {
      const routeServices = services[routeId];
      if (!routeServices || routeServices.length === 0) return;

      routeServices.forEach((service) => {
        const shapePolyline = shapes[service.shape_id];
        if (!shapePolyline) return;

        // Decode polyline to coordinates
        const coordinates = decodePolyline(shapePolyline);
        if (coordinates.length === 0) return;

        // Create unique layer IDs
        const routeSourceId = `route-${service.shape_id}`;
        const routeBackgroundId = `route-background-${service.shape_id}`;
        const routeMainId = `route-main-${service.shape_id}`;
        const routeArrowsId = `route-arrows-${service.shape_id}`;

        // Skip if already exists
        if (map.current?.getSource(routeSourceId)) return;

        // Add route source
        map.current?.addSource(routeSourceId, {
          type: "geojson",
          lineMetrics: true,
          data: {
            type: "Feature",
            properties: {
              color: ROUTE_COLOR,
              direction: service.direction,
              routeId: routeId,
            },
            geometry: {
              type: "LineString",
              coordinates: coordinates,
            },
          },
        });

        // Add background route layer (white outline)
        map.current?.addLayer({
          id: routeBackgroundId,
          type: "line",
          source: routeSourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
            visibility: "none", // Hidden by default
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
        const baseColor = ROUTE_COLOR;
        map.current?.addLayer({
          id: routeMainId,
          type: "line",
          source: routeSourceId,
          layout: {
            "line-join": "round",
            "line-cap": "round",
            visibility: "none", // Hidden by default
          },
          paint: {
            "line-gradient": [
              "interpolate",
              ["linear"],
              ["line-progress"],
              0,
              baseColor,
              0.3,
              "#ef7875",
              0.7,
              baseColor,
              1,
              "#b01d1a",
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
          id: routeArrowsId,
          type: "symbol",
          source: routeSourceId,
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
            visibility: "none", // Hidden by default
          },
          paint: {
            "text-color": ROUTE_COLOR,
            "text-opacity": 0.9,
            "text-halo-color": "#fff",
            "text-halo-width": 2,
          },
        });
      });
    });

    console.log("All routes pre-loaded successfully");
  };

  const toggleRouteVisibility = (routeId: string, visible: boolean, selectedServiceDirection?: number) => {
    if (!services[routeId]) return;

    services[routeId].forEach((service) => {
      const layerIds = [
        `route-background-${service.shape_id}`,
        `route-main-${service.shape_id}`,
        `route-arrows-${service.shape_id}`,
      ];

      const isSelectedService = selectedServiceDirection === service.direction;
      const opacity = visible && selectedServiceDirection !== undefined && !isSelectedService ? 0.2 : 1;

      layerIds.forEach((layerId) => {
        if (map.current?.getLayer(layerId)) {
          map.current.setLayoutProperty(
            layerId,
            "visibility",
            visible ? "visible" : "none"
          );
          
          if (visible) {
            // Set opacity based on selection
            if (layerId.includes('background')) {
              map.current.setPaintProperty(layerId, "line-opacity", opacity * 0.9);
            } else if (layerId.includes('main')) {
              map.current.setPaintProperty(layerId, "line-opacity", opacity * 0.8);
            } else if (layerId.includes('arrows')) {
              map.current.setPaintProperty(layerId, "text-opacity", opacity * 0.9);
            }
          }
        }
      });
    });
  };

  // Handle route selection
  const handleRouteSelect = (routeId: string) => {
    if (selectedRoute === routeId) {
      // Hide current route and show all stops
      toggleRouteVisibility(routeId, false);
      hideRouteStops();
      setSelectedRoute(null);
      setSelectedService(null);
      
      // Restore scroll position after React re-renders
      setTimeout(() => {
        if (resultsListRef.current) {
          resultsListRef.current.scrollTop = savedScrollPosition;
        }
      }, 0);
      return;
    }

    // Save current scroll position before showing route info
    if (resultsListRef.current) {
      setSavedScrollPosition(resultsListRef.current.scrollTop);
    }

    // Hide previous route if any
    if (selectedRoute) {
      toggleRouteVisibility(selectedRoute, false);
    }

    // Show new route (layers already exist from pre-loading)
    const firstService = services[routeId]?.[0];
    toggleRouteVisibility(routeId, true, firstService?.direction);
    setSelectedRoute(routeId);

    // Default to first direction
    setSelectedService(firstService || null);

    // Auto-close drawer on mobile when route is selected
    if (typeof window !== "undefined" && window.innerWidth < 768) {
      setDrawerOpen(false);
    }

    // Show route stops and fit bounds
    showRouteStops(routeId, firstService?.direction);
    fitBoundsToRoute(routeId);
  };

  const fitBoundsToRoute = (routeId: string) => {
    const allCoords: [number, number][] = [];

    services[routeId].forEach((service) => {
      if (!shapes[service.shape_id]) return;
      const shapePolyline = shapes[service.shape_id];
      if (!shapePolyline) return;
      const coordinates = decodePolyline(shapePolyline);
      allCoords.push(...coordinates);
    });

    if (allCoords.length > 0) {
      const bounds = new maplibregl.LngLatBounds();
      allCoords.forEach((coord) => bounds.extend(coord));

      // Responsive padding - different for mobile vs desktop
      const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
      const sidebarWidth = 370; // 350px width + 10px left margin + 10px internal padding
      const padding = isMobile
        ? { top: 50, bottom: 120, left: 50, right: 50 } // Mobile - bottom drawer offset
        : { top: 50, bottom: 50, left: sidebarWidth + 50, right: 50 }; // Desktop - sidebar offset

      map.current?.fitBounds(bounds, { padding });
    }
  };

  const previewRoute = (routeId: string | null) => {
    // Clear any existing timeout
    if (previewTimeoutRef.current) {
      clearTimeout(previewTimeoutRef.current);
      previewTimeoutRef.current = null;
    }

    if (routeId) {
      // Hide previous preview immediately
      if (previewedRoute && previewedRoute !== selectedRoute) {
        toggleRouteVisibility(previewedRoute, false);
      }

      // Show new preview (layers already exist from pre-loading)
      // Show all directions for preview
      toggleRouteVisibility(routeId, true);
      setPreviewedRoute(routeId);
    } else {
      // Hide current preview with a small delay to prevent flickering
      previewTimeoutRef.current = setTimeout(() => {
        if (previewedRoute && previewedRoute !== selectedRoute) {
          toggleRouteVisibility(previewedRoute, false);
        }
        setPreviewedRoute(null);
      }, 100);
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

  // Keyboard event handler for Escape key
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        closeRouteInfo();
      }
    };

    document.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [selectedRoute]); // Re-run when selectedRoute changes

  // Pre-load all routes when data is ready
  useEffect(() => {
    if (map.current && routes && services && shapes && stops) {
      // Wait for map style to be loaded
      if (map.current.isStyleLoaded()) {
        // Load stops first, then routes
        addStopsToMap();
        // Small delay to ensure stops are loaded
        setTimeout(() => {
          loadAllRoutes();
        }, 100);
      } else {
        // If style isn't loaded yet, wait for it
        const checkStyleAndLoad = () => {
          if (map.current?.isStyleLoaded()) {
            addStopsToMap();
            setTimeout(() => {
              loadAllRoutes();
            }, 100);
          } else {
            setTimeout(checkStyleAndLoad, 100);
          }
        };
        checkStyleAndLoad();
      }
    }
  }, [routes, services, shapes, stops, map.current]);

  // Add stops to map
  const addStopsToMap = () => {
    // console.log("addStopsToMap called");

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
            "#dc241f", // Same color as fill for low zoom
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
        minzoom: LABEL_MIN_ZOOM,
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

        // Only show tooltip when labels aren't visible
        if (currentZoom >= TOOLTIP_MIN_ZOOM) return;

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
        flyToStop([e.lngLat.lng, e.lngLat.lat]);
      });

      // Remove tooltips when zooming to high levels (when labels appear)
      map.current.on("zoom", () => {
        const currentZoom = map.current!.getZoom();
        if (currentZoom >= LABEL_MIN_ZOOM) {
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

  // Add route-specific stops to map
  const addRouteStopsToMap = () => {
    if (!map.current || !map.current.isStyleLoaded()) {
      return;
    }

    // Check if route-stops source already exists
    if (!map.current.getSource("route-stops")) {
      map.current.addSource("route-stops", {
        type: "geojson",
        data: {
          type: "FeatureCollection",
          features: [],
        },
      });

      // Stops layer to be on top of route lines
      map.current.addLayer({
        id: "route-stops",
        type: "circle",
        source: "route-stops",
        layout: {
          visibility: "none", // Initially hidden
        },
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
          "circle-color": ["step", ["zoom"], "#dc241f", 12, "#fff"],
          "circle-stroke-color": ["step", ["zoom"], "#dc241f", 12, "#dc241f"],
          "circle-stroke-width": ["step", ["zoom"], 0, 12, 1.5, 14, 2, 16, 2.5],
          "circle-opacity": 0.9,
          "circle-stroke-opacity": ["step", ["zoom"], 0, 12, 1],
        },
      });

      map.current.addLayer({
        id: "route-stops-label",
        type: "symbol",
        source: "route-stops",
        minzoom: LABEL_MIN_ZOOM,
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

      // Add same hover and click handlers as main stops
      map.current.on("mouseenter", "route-stops", (e) => {
        map.current!.getCanvas().style.cursor = "pointer";
        
        const currentZoom = map.current!.getZoom();
        if (currentZoom >= TOOLTIP_MIN_ZOOM) return;

        if (e.features && e.features[0]) {
          const feature = e.features[0];
          const stopName = feature.properties?.name || "Unknown Stop";
          const stopCode = feature.properties?.code || "";

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

      map.current.on("mouseleave", "route-stops", () => {
        map.current!.getCanvas().style.cursor = "";
        document
          .querySelectorAll(".hover-tooltip")
          .forEach((popup) => popup.remove());
      });

      map.current.on("click", "route-stops", (e) => {
        console.log("Route stop clicked:", e.lngLat);
        e.originalEvent.stopPropagation();
        flyToStop([e.lngLat.lng, e.lngLat.lat]);
      });
    }
  };

  // Show route-specific stops
  const showRouteStops = (routeId: string, selectedServiceDirection?: number) => {
    if (!map.current || !services[routeId] || !stops) return;

    // Get all stop IDs from all directions of this route
    const allStopIds: number[] = [];
    const selectedServiceStops = new Set<number>();
    
    services[routeId].forEach((service) => {
      allStopIds.push(...service.stops);
      if (selectedServiceDirection === service.direction) {
        service.stops.forEach(stopId => selectedServiceStops.add(stopId));
      }
    });

    // Remove duplicates
    const uniqueStopIds = allStopIds.filter(
      (stopId, pos, arr) => arr.indexOf(stopId) === pos
    );

    // Filter stops data to only include route stops with opacity based on selection
    const routeStopsFeatures = uniqueStopIds
      .filter((stopId) => stops[stopId.toString()])
      .map((stopId) => {
        const stop = stops[stopId.toString()];
        const isSelectedServiceStop = selectedServiceStops.has(stopId);
        
        return {
          type: "Feature" as const,
          id: stopId.toString(),
          properties: {
            name: stop.name || "",
            code: stop.code || "",
            street_name: stop.street_name || "",
            isSelectedService: isSelectedServiceStop,
          },
          geometry: {
            type: "Point" as const,
            coordinates: stop.coordinates,
          },
        };
      });

    // Ensure route-stops layer exists
    addRouteStopsToMap();

    // Update route-stops source with filtered data
    if (map.current.getSource("route-stops")) {
      (
        map.current.getSource("route-stops") as maplibregl.GeoJSONSource
      ).setData({
        type: "FeatureCollection",
        features: routeStopsFeatures,
      });
    }

    // Update route-stops layer with conditional opacity
    if (map.current.getLayer("route-stops")) {
      map.current.setPaintProperty("route-stops", "circle-opacity", [
        "case",
        ["get", "isSelectedService"],
        0.9, // Full opacity for selected service stops
        0.2  // Low opacity for other stops
      ]);
      map.current.setPaintProperty("route-stops", "circle-stroke-opacity", [
        "case",
        ["get", "isSelectedService"],
        1,   // Full opacity for selected service stops
        0.2  // Low opacity for other stops
      ]);
    }

    // Update route-stops-label layer with conditional opacity
    if (map.current.getLayer("route-stops-label")) {
      map.current.setPaintProperty("route-stops-label", "text-opacity", [
        "case",
        ["get", "isSelectedService"],
        1,   // Full opacity for selected service stops
        0.2  // Low opacity for other stops
      ]);
    }

    // Hide main stops, show route stops
    if (map.current.getLayer("stops")) {
      map.current.setLayoutProperty("stops", "visibility", "none");
    }
    if (map.current.getLayer("stops-label")) {
      map.current.setLayoutProperty("stops-label", "visibility", "none");
    }
    if (map.current.getLayer("route-stops")) {
      map.current.setLayoutProperty("route-stops", "visibility", "visible");
    }
    if (map.current.getLayer("route-stops-label")) {
      map.current.setLayoutProperty(
        "route-stops-label",
        "visibility",
        "visible"
      );
    }

    // Move route stops layers to top to ensure they're above route lines
    try {
      if (map.current.getLayer("route-stops")) {
        map.current.moveLayer("route-stops");
      }
      if (map.current.getLayer("route-stops-label")) {
        map.current.moveLayer("route-stops-label");
      }
    } catch (error) {
      console.log("Layer reordering error (non-critical):", error);
    }
  };

  // Hide route-specific stops and show all stops
  const hideRouteStops = () => {
    if (!map.current) return;

    // Show main stops, hide route stops
    if (map.current.getLayer("stops")) {
      map.current.setLayoutProperty("stops", "visibility", "visible");
    }
    if (map.current.getLayer("stops-label")) {
      map.current.setLayoutProperty("stops-label", "visibility", "visible");
    }
    if (map.current.getLayer("route-stops")) {
      map.current.setLayoutProperty("route-stops", "visibility", "none");
    }
    if (map.current.getLayer("route-stops-label")) {
      map.current.setLayoutProperty("route-stops-label", "visibility", "none");
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
        zoom: 10,
        maxZoom: 18,
        minZoom: 8,
      });

      // After map loads, adjust for sidebar
      map.current.on("load", () => {
        const sidebarPixelWidth = Math.min(window.innerWidth * 0.3, 400);
        const offsetPixels = sidebarPixelWidth / 2;
        map.current?.easeTo({
          center: [101.6869, 3.139],
          offset: [offsetPixels, 0],
          duration: 0,
        });
      });

      map.current.on("error", (e) => {
        console.error("Map error:", e);
      });

      // Add navigation control
      map.current.addControl(new maplibregl.NavigationControl(), "top-right");

      // Initialize route-stops layers immediately after map load
      map.current.on("styledata", () => {
        if (!map.current?.getSource("route-stops")) {
          addRouteStopsToMap();
        }
      });

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

  // Note: Stops and routes are now loaded together in the useEffect above

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

      <div
        className={`search-container ${searchActive ? "active" : ""} ${
          drawerOpen ? "drawer-open" : ""
        }`}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{
          transform:
            typeof window !== "undefined" &&
            window.innerWidth < 768 &&
            dragOffset !== 0
              ? `translateY(${
                  drawerOpen
                    ? Math.max(0, dragOffset) + "px"
                    : `calc(100% - 80px + ${Math.min(0, dragOffset)}px)`
                })`
              : undefined,
        }}
      >
        {/* Drag Handle Area (Mobile Only) */}
        <div
          className="drawer-handle"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        />

        {!selectedRoute && (
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
        )}

        <div className="search-results">
          {/* Route Info Header */}
          {selectedRoute && (
            <div style={{ marginBottom: "8px", marginTop: "8px" }}>
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                  marginBottom: "8px",
                }}
              >
                <strong>Route {selectedRoute}</strong>
                <button
                  className="close-button"
                  onClick={closeRouteInfo}
                  title="Close route info (Esc)"
                >
                  ×
                </button>
              </div>

              {/* Direction Selector */}
              <div className="direction-selector">
                {services[selectedRoute].map((service) => {
                  const isLoop = services[selectedRoute].length === 1;
                  const destination =
                    service.headsign.split(" → ")[1] ||
                    service.headsign.split(" - ")[1] ||
                    service.headsign.split(" ↔ ")[1] ||
                    service.headsign;
                  const directionLabel = isLoop ? (
                    <>
                      Loop to
                      <br />
                      {destination}
                    </>
                  ) : (
                    <>
                      To <br />
                      {destination}
                    </>
                  );

                  return (
                    <div
                      key={service.direction}
                      className={`direction-option ${
                        selectedService?.direction === service.direction
                          ? "selected"
                          : ""
                      }`}
                      onClick={() => {
                        setSelectedService(service);
                        // Update route opacity to highlight selected service
                        if (selectedRoute) {
                          toggleRouteVisibility(selectedRoute, true, service.direction);
                          showRouteStops(selectedRoute, service.direction);
                        }
                      }}
                    >
                      <div className="direction-label">{directionLabel}</div>
                    </div>
                  );
                })}
              </div>

              {selectedService && (
                <strong>Stops ({selectedService.stops.length}):</strong>
              )}
            </div>
          )}

          {/* Stops List */}
          {selectedRoute && selectedService && (
            <div className="results-list">
              <ol
                className="stops-timeline"
                style={
                  {
                    "--line-start":
                      selectedService.stops.length > 1 ? "50%" : "50%",
                    "--line-end":
                      selectedService.stops.length > 1 ? "50%" : "50%",
                  } as React.CSSProperties
                }
              >
                {selectedService.stops.map((stopId, index) => {
                  const stop = stops[stopId.toString()];
                  const isFirst = index === 0;
                  const isLast = index === selectedService.stops.length - 1;

                  return (
                    <li
                      key={stopId}
                      className="stop-item"
                      data-first={isFirst}
                      data-last={isLast}
                      onClick={() => {
                        if (!stop) return;
                        flyToStop(stop.coordinates);
                      }}
                    >
                      {stop?.code && (
                        <div className="stop-code">{stop.code}</div>
                      )}
                      <div className="stop-name">
                        {stop?.name || `Stop ID: ${stopId}`}
                      </div>
                    </li>
                  );
                })}
              </ol>
            </div>
          )}

          {/* Route List */}
          <div
            ref={resultsListRef}
            className="results-list"
            onMouseLeave={() => previewRoute(null)}
            style={{ display: selectedRoute ? "none" : "block" }}
          >
            {filteredRoutes.map((routeId) => {
              const route = routes[routeId];
              if (!route) return null;

              return (
                <div
                  key={routeId}
                  className={`result-item ${
                    selectedRoute === routeId ? "selected" : ""
                  } select-none`}
                  onClick={() => handleRouteSelect(routeId)}
                  onMouseEnter={() => previewRoute(routeId)}
                  onMouseLeave={() => previewRoute(null)}
                >
                  <div
                    className="route-badge"
                    style={{
                      border: "2px solid " + ROUTE_COLOR,
                      color: ROUTE_COLOR,
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
