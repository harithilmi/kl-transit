const fs = require("fs");
const path = require("path");

// Transform current routes.json and stops.json into 4 separate files
function transformData() {
  try {
    console.log("🚀 Starting data transformation...");
    
    // Read source files
    const routesData = JSON.parse(fs.readFileSync("./public/routes.json", "utf8"));
    const stopsData = JSON.parse(fs.readFileSync("./public/stops.json", "utf8"));
    
    console.log(`📊 Processing ${routesData.length} routes and ${stopsData.length} stops`);

    // Initialize output objects
    const newRoutes = {};
    const services = {};
    const shapes = {};
    const newStops = {};

    // Process stops first
    console.log("🚏 Processing stops...");
    stopsData.forEach(stop => {
      newStops[stop.stop_id] = {
        name: stop.stop_name,
        code: stop.stop_code || null,
        coordinates: [stop.longitude, stop.latitude],
        street_name: stop.street_name,
        rapid_stop_id: stop.rapid_stop_id || null,
        mrt_stop_id: stop.mrt_stop_id || null, // Preserve if exists
        old_stop_id: stop.old_stop_id || null
      };
    });

    // Process routes
    console.log("🚌 Processing routes...");
    routesData.forEach(route => {
      const routeKey = route.routeShortName;
      
      // Routes metadata
      newRoutes[routeKey] = {
        name: route.routeLongName,
        operator: route.operatorId,
        network: route.networkId || null,
        route_type: route.routeType,
        color: route.routeColor ? `#${route.routeColor}` : null,
        text_color: route.routeTextColor ? `#${route.routeTextColor}` : null
      };

      // Services (trips)
      if (route.trips && route.trips.length > 0) {
        services[routeKey] = [];
        
        route.trips.forEach(trip => {
          const shapeId = `${routeKey}_${trip.direction}`;
          
          // Extract stop sequence
          const stops = trip.stopDetails ? trip.stopDetails.map(sd => sd.stopId) : [];
          
          services[routeKey].push({
            headsign: trip.headsign || `${routeKey} Service`,
            direction: trip.direction,
            stops: stops,
            shape_id: shapeId
          });
          
          // Store shape if available
          if (trip.fullShape) {
            shapes[shapeId] = trip.fullShape;
          }
        });
      }
    });

    // Create backup directory
    const backupDir = "./public/backup";
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // Backup original files
    console.log("💾 Creating backups...");
    fs.copyFileSync("./public/routes.json", "./public/backup/routes_original.json");
    fs.copyFileSync("./public/stops.json", "./public/backup/stops_original.json");

    // Write new files
    console.log("✍️  Writing new files...");
    
    fs.writeFileSync(
      "./public/routes.json", 
      JSON.stringify(newRoutes, null, 2)
    );
    
    fs.writeFileSync(
      "./public/services.json", 
      JSON.stringify(services, null, 2)
    );
    
    fs.writeFileSync(
      "./public/shapes.json", 
      JSON.stringify(shapes, null, 2)
    );
    
    fs.writeFileSync(
      "./public/stops.json", 
      JSON.stringify(newStops, null, 2)
    );

    // Summary
    console.log("\n✅ Transformation completed!");
    console.log(`📁 Generated files:`);
    console.log(`   - routes.json: ${Object.keys(newRoutes).length} routes`);
    console.log(`   - services.json: ${Object.keys(services).length} route services`);
    console.log(`   - shapes.json: ${Object.keys(shapes).length} shapes`);
    console.log(`   - stops.json: ${Object.keys(newStops).length} stops`);
    console.log(`💾 Original files backed up to ./public/backup/`);

    // Check for routes without shapes
    const routesWithoutShapes = Object.keys(services).filter(routeKey => {
      return services[routeKey].some(service => !shapes[service.shape_id]);
    });

    if (routesWithoutShapes.length > 0) {
      console.log(`\n⚠️  Routes without shapes: ${routesWithoutShapes.join(", ")}`);
    }

  } catch (error) {
    console.error("❌ Error during transformation:", error.message);
    process.exit(1);
  }
}

transformData();