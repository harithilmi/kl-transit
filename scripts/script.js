const fs = require("fs");

// Find all unique headsigns from routes.json and sort by count
function findUniqueHeadsigns() {
  try {
    // Read routes.json file
    const routesData = fs.readFileSync("./public/routes.json", "utf8");
    const routes = JSON.parse(routesData);

    // Count headsign occurrences and track routes without headsigns
    const headsignCounts = new Map();
    const routesWithoutHeadsigns = [];

    routes.forEach((route) => {
      let hasHeadsign = false;
      
      if (route.trips) {
        route.trips.forEach((trip) => {
          if (trip.headsign && trip.headsign.trim()) {
            const headsign = trip.headsign.trim();
            headsignCounts.set(
              headsign,
              (headsignCounts.get(headsign) || 0) + 1
            );
            hasHeadsign = true;
          }
        });
      }
      
      if (!hasHeadsign) {
        routesWithoutHeadsigns.push({
          routeId: route.routeId,
          routeShortName: route.routeShortName,
          routeLongName: route.routeLongName
        });
      }
    });

    // Convert to array and sort by count (descending)
    const sortedHeadsigns = Array.from(headsignCounts.entries()).sort(
      (a, b) => b[1] - a[1]
    );

    console.log(
      `Found ${sortedHeadsigns.length} unique headsigns (sorted by count):`
    );
    console.log("=".repeat(60));

    sortedHeadsigns.forEach(([headsign, count], index) => {
      console.log(
        `${(index + 1).toString().padStart(3)}. ${headsign.padEnd(
          50
        )} (${count})`
      );
    });

    // Show routes without headsigns
    if (routesWithoutHeadsigns.length > 0) {
      console.log("\n");
      console.log(`Routes without headsigns (${routesWithoutHeadsigns.length}):`);
      console.log("=".repeat(60));
      
      routesWithoutHeadsigns.forEach((route, index) => {
        console.log(`${(index + 1).toString().padStart(3)}. Route ${route.routeShortName} - ${route.routeLongName}`);
      });
    } else {
      console.log("\nAll routes have headsigns!");
    }
    
  } catch (error) {
    console.error("Error reading routes.json:", error.message);
  }
}

findUniqueHeadsigns();
