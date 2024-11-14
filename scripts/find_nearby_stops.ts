import fs from 'fs'
import path from 'path'

interface Stop {
  stop_id: string
  stop_code: string
  stop_name: string
  street_name: string
  latitude: number
  longitude: number
  direction: number
  zone: number
}

interface NearbyGroup {
  stops: Array<{
    stop_id: string
    stop_code: string
    stop_name: string
    latitude: number
    longitude: number
  }>
  distance: number // Distance in meters between stops
}

interface ServiceStop {
  route_number: string
  sequence: number
  direction: number
}

function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number,
): number {
  const R = 6371e3 // Earth's radius in meters
  const φ1 = (lat1 * Math.PI) / 180
  const φ2 = (lat2 * Math.PI) / 180
  const Δφ = ((lat2 - lat1) * Math.PI) / 180
  const Δλ = ((lon2 - lon1) * Math.PI) / 180

  const a =
    Math.sin(Δφ / 2) * Math.sin(Δφ / 2) +
    Math.cos(φ1) * Math.cos(φ2) * Math.sin(Δλ / 2) * Math.sin(Δλ / 2)
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a))

  return R * c
}

async function findNearbyStops() {
  const processedDir = path.join(process.cwd(), 'src/data/processed')
  const stopsFile = path.join(processedDir, 'stops.json')
  const servicesFile = path.join(processedDir, 'services.json')

  // Read processed stops and services
  const stops: Stop[] = JSON.parse(fs.readFileSync(stopsFile, 'utf-8'))
  const services: any[] = JSON.parse(fs.readFileSync(servicesFile, 'utf-8'))

  const DISTANCE_THRESHOLD = 10
  const markerColors = ['#e41a1c', '#377eb8', '#4daf4a', '#984ea3', '#ff7f00']
  const nearbyGroups: NearbyGroup[] = []

  // Create a map of stop_id to routes that serve it
  const stopServices = new Map<string, ServiceStop[]>()
  services.forEach((service) => {
    if (!stopServices.has(service.stop_id)) {
      stopServices.set(service.stop_id, [])
    }
    stopServices.get(service.stop_id)?.push({
      route_number: service.route_number,
      sequence: service.sequence,
      direction: service.direction,
    })
  })

  for (let i = 0; i < stops.length; i++) {
    const stop1 = stops[i]
    const group = [
      {
        stop_id: stop1.stop_id,
        stop_code: stop1.stop_code,
        stop_name: stop1.stop_name,
        latitude: stop1.latitude,
        longitude: stop1.longitude,
      },
    ]

    for (let j = i + 1; j < stops.length; j++) {
      const stop2 = stops[j]

      // Skip if code AND name AND street all match
      if (
        stop1.stop_code === stop2.stop_code && 
        stop1.stop_name === stop2.stop_name &&
        stop1.street_name === stop2.street_name
      ) {
        continue
      }

      const distance = calculateDistance(
        stop1.latitude,
        stop1.longitude,
        stop2.latitude,
        stop2.longitude,
      )

      if (distance <= DISTANCE_THRESHOLD) {
        group.push({
          stop_id: stop2.stop_id,
          stop_code: stop2.stop_code,
          stop_name: stop2.stop_name,
          latitude: stop2.latitude,
          longitude: stop2.longitude,
        })
      }
    }

    if (group.length > 1) {
      nearbyGroups.push({
        stops: group,
        distance:
          Math.round(
            calculateDistance(
              group[0].latitude,
              group[0].longitude,
              group[1].latitude,
              group[1].longitude,
            ) * 100,
          ) / 100,
      })
    }
  }

  // Sort by distance
  nearbyGroups.sort((a, b) => a.distance - b.distance)

  const htmlContent = `
<!DOCTYPE html>
<html>
<head>
  <title>Nearby Bus Stops</title>
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    body { 
      margin: 0;
      padding: 20px;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
    }
    .container {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 20px;
      height: calc(100vh - 40px);
    }
    #map { 
      height: 100%;
      border: 1px solid #ccc;
      border-radius: 4px;
    }
    .stop-list {
      height: 100%;
      overflow-y: auto;
      padding-right: 10px;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      margin-bottom: 20px;
    }
    th, td {
      padding: 8px;
      text-align: left;
      border: 1px solid #ddd;
    }
    th {
      background: #f5f5f5;
      position: sticky;
      top: 0;
    }
    tr:hover {
      background: #f9f9f9;
    }
    .group-header {
      background: #eee;
      font-weight: bold;
    }
    .map-link {
      color: blue;
      text-decoration: underline;
      cursor: pointer;
    }
    .marker-icon {
      display: inline-block;
      width: 12px;
      height: 12px;
      border-radius: 50%;
      margin-right: 5px;
    }
    .distance-warning {
      color: ${DISTANCE_THRESHOLD <= 5 ? 'red' : 'orange'};
      font-weight: bold;
    }
    .route-stops {
      color: #666;
      font-size: 0.9em;
      margin-top: 5px;
    }
    .route-number {
      background: #eee;
      padding: 2px 6px;
      border-radius: 3px;
      margin-right: 5px;
      display: inline-block;
    }
    .route-direction {
      font-size: 0.8em;
      color: #888;
    }
    .route-marker {
      opacity: 0.6;
    }
    .routes-list {
      margin-top: 8px;
      padding-top: 8px;
      border-top: 1px solid #ddd;
    }
    .route-badge {
      display: inline-block;
      padding: 2px 6px;
      margin: 2px;
      background: #f0f0f0;
      border-radius: 3px;
      font-size: 0.9em;
    }
  </style>
</head>
<body>
  <div class="container">
    <div class="stop-list">
      <h2>Nearby Stops (within ${DISTANCE_THRESHOLD}m)</h2>
      <table>
        <thead>
          <tr>
            <th>Group</th>
            <th>Stop Code</th>
            <th>Name</th>
            <th>Coordinates</th>
            <th>Routes</th>
            <th>Action</th>
          </tr>
        </thead>
        <tbody>
          ${nearbyGroups
            .map(
              (group, i) => `
            <tr class="group-header">
              <td colspan="6">
                Group ${i + 1} 
                <span class="distance-warning">(${group.distance}m apart)</span>
              </td>
            </tr>
            ${group.stops
              .map((stop, j) => {
                const stopRoutes = stopServices.get(stop.stop_id) || []
                const routesList = Array.from(
                  new Set(stopRoutes.map((r) => r.route_number)),
                ).join(', ')
                return `
                <tr>
                  <td>
                    <span class="marker-icon" style="background: ${
                      markerColors[i % markerColors.length]
                    }"></span>
                    Stop ${j + 1}
                  </td>
                  <td>${stop.stop_code || '(no code)'}</td>
                  <td>${stop.stop_name}</td>
                  <td>${stop.latitude}, ${stop.longitude}</td>
                  <td>${routesList}</td>
                  <td>
                    <span class="map-link" onclick="focusStop(${i}, ${j})">
                      Focus
                    </span>
                  </td>
                </tr>
              `
              })
              .join('')}
          `,
            )
            .join('')}
        </tbody>
      </table>
    </div>
    <div id="map"></div>
  </div>

  <script>
    const map = L.map('map').setView([3.1390, 101.6869], 11);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png').addTo(map);

    const groups = ${JSON.stringify(nearbyGroups)};
    const colors = ${JSON.stringify(markerColors)};
    const stopServices = ${JSON.stringify(Array.from(stopServices))};
    const servicesMap = new Map(stopServices);
    const markers = [];
    const routeMarkers = new Map();

    groups.forEach((group, i) => {
      const groupMarkers = [];
      const color = colors[i % colors.length];
      
      group.stops.forEach((stop, j) => {
        const offset = j * 0.00002;
        const routes = servicesMap.get(stop.stop_id) || [];
        const routesList = Array.from(new Set(routes.map(r => r.route_number)))
          .map(route => \`<span class="route-badge">\${route}</span>\`)
          .join(' ');

        const marker = L.circleMarker(
          [stop.latitude + offset, stop.longitude + offset], 
          {
            color: color,
            radius: 8,
            fillOpacity: 0.5,
            weight: 2
          }
        )
        .bindPopup(\`
          <strong>\${stop.stop_code || '(no code)'}</strong><br/>
          \${stop.stop_name}<br/>
          <small>\${stop.latitude}, \${stop.longitude}</small>
          \${routesList ? \`<div class="routes-list">Routes:<br/>\${routesList}</div>\` : ''}
        \`)
        .addTo(map);
        
        groupMarkers.push(marker);
      });
      
      markers.push(groupMarkers);
    });

    function clearRouteMarkers() {
      routeMarkers.forEach(markers => {
        markers.forEach(marker => marker.remove());
      });
      routeMarkers.clear();
    }

    function showRouteStops(stopId) {
      clearRouteMarkers();
      
      const services = servicesMap.get(stopId) || [];
      services.forEach(service => {
        const routeKey = \`\${service.route_number}-\${service.direction}\`;
        
        // Find all stops for this route+direction
        const routeStops = Array.from(servicesMap.entries())
          .filter(([_, services]) => 
            services.some(s => 
              s.route_number === service.route_number && 
              s.direction === service.direction
            )
          )
          .map(([stopId, services]) => ({
            stopId,
            sequence: services.find(s => 
              s.route_number === service.route_number && 
              s.direction === service.direction
            )?.sequence || 0
          }))
          .sort((a, b) => a.sequence - b.sequence);

        // Create markers for route stops
        const routeMarkerList = [];
        routeStops.forEach((routeStop, index) => {
          const stop = groups.flatMap(g => g.stops).find(s => s.stop_id === routeStop.stopId);
          if (stop) {
            const marker = L.circleMarker(
              [stop.latitude, stop.longitude],
              {
                color: '#999',
                radius: 4,
                fillOpacity: 0.3,
                weight: 1,
                className: 'route-marker'
              }
            )
            .bindPopup(\`Stop #\${index + 1} on Route \${service.route_number}\`)
            .addTo(map);
            routeMarkerList.push(marker);
          }
        });
        
        routeMarkers.set(routeKey, routeMarkerList);
      });
    }

    function focusStop(groupIndex, stopIndex) {
      const group = groups[groupIndex];
      const stop = group.stops[stopIndex];
      const marker = markers[groupIndex][stopIndex];
      
      clearRouteMarkers();
      showRouteStops(stop.stop_id);
      
      map.setView([stop.latitude, stop.longitude], 19);
      marker.openPopup();
    }
  </script>
</body>
</html>
  `

  fs.writeFileSync(path.join(processedDir, 'nearby_stops.html'), htmlContent)

  console.log(`Found ${nearbyGroups.length} groups of nearby stops`)
  console.log('Check nearby_stops.html in your browser')
}

findNearbyStops().catch(console.error)
