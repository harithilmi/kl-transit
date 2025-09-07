const fs = require('fs');

// Remove old_stop_id field from stops.json
function removeOldStopId() {
  try {
    console.log('🚀 Reading stops.json...');
    const stopsData = JSON.parse(fs.readFileSync('./public/stops.json', 'utf8'));
    
    let removedCount = 0;
    
    // Remove old_stop_id from each stop
    Object.keys(stopsData).forEach(stopId => {
      if (stopsData[stopId].old_stop_id !== undefined) {
        delete stopsData[stopId].old_stop_id;
        removedCount++;
      }
    });
    
    // Write back to file
    fs.writeFileSync('./public/stops.json', JSON.stringify(stopsData, null, 2));
    
    console.log(`✅ Removed old_stop_id from ${removedCount} stops`);
    console.log(`📁 Updated stops.json file`);
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

removeOldStopId();