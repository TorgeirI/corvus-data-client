// Simple test script to demonstrate the mock data capabilities
// This simulates what the actual React app would generate

console.log('🚢 CORVUS ADX TEAMS APP - MOCK DATA DEMONSTRATION');
console.log('================================================');

// Simulate vessel fleet
const vessels = [
  { id: 'CGO-001', name: 'Atlantic Carrier', type: 'cargo', voltage: '24V', capacity: 150 },
  { id: 'PSG-001', name: 'Island Hopper', type: 'passenger', voltage: '48V', capacity: 300 },
  { id: 'TNK-001', name: 'Oil Pioneer', type: 'tanker', voltage: '24V', capacity: 180 },
  { id: 'FSH-001', name: 'Sea Hunter', type: 'fishing', voltage: '12V', capacity: 80 },
  { id: 'RSH-001', name: 'Marine Explorer', type: 'research', voltage: '48V', capacity: 400 }
];

console.log('\n📊 MOCK VESSEL FLEET:');
console.log('===================');
vessels.forEach(vessel => {
  console.log(`${vessel.id} - ${vessel.name}`);
  console.log(`  Type: ${vessel.type} | System: ${vessel.voltage} | Capacity: ${vessel.capacity}kWh`);
});

console.log('\n🔋 SAMPLE BATTERY READINGS:');
console.log('===========================');

// Generate sample readings
const now = new Date();
vessels.slice(0, 3).forEach(vessel => {
  const voltage = vessel.voltage === '12V' ? 12.6 : vessel.voltage === '24V' ? 25.2 : 50.4;
  const reading = {
    timestamp: now.toISOString(),
    vessel: vessel.name,
    batteryBank: 'main',
    voltage: +(voltage + (Math.random() - 0.5) * 1).toFixed(2),
    current: +(Math.random() * 50 + 20).toFixed(1),
    temperature: +(Math.random() * 30 + 15).toFixed(1),
    stateOfCharge: +(Math.random() * 40 + 60).toFixed(1),
    batteryHealth: +(Math.random() * 20 + 80).toFixed(1),
    chargingStatus: Math.random() > 0.5 ? 'discharging' : 'charging'
  };
  
  console.log(`\n${vessel.name} (${vessel.id}):`);
  console.log(`  Voltage: ${reading.voltage}V`);
  console.log(`  Current: ${reading.current}A`);
  console.log(`  Temperature: ${reading.temperature}°C`);
  console.log(`  State of Charge: ${reading.stateOfCharge}%`);
  console.log(`  Battery Health: ${reading.batteryHealth}%`);
  console.log(`  Status: ${reading.chargingStatus}`);
});

console.log('\n🧪 TEST SCENARIOS AVAILABLE:');
console.log('============================');
const scenarios = [
  'Show battery voltage for Atlantic Carrier over the last 24 hours',
  'Which vessels have battery health below 85%?',
  'Compare charging patterns between cargo and passenger vessels',
  'Show temperature anomalies in battery systems this week',
  'What is the average state of charge across the fleet?'
];

scenarios.forEach((scenario, i) => {
  console.log(`${i + 1}. ${scenario}`);
});

console.log('\n✅ FEATURES IMPLEMENTED:');
console.log('========================');
console.log('• 13 realistic vessels with different operational profiles');
console.log('• Comprehensive battery monitoring (voltage, current, temp, SOC, health)');
console.log('• Time series generation with realistic patterns');
console.log('• Natural language query processing (with OpenAI)');
console.log('• Interactive charts and data visualization');
console.log('• Data export (CSV, JSON, TSV)');
console.log('• Performance monitoring and analytics');
console.log('• Microsoft Teams integration ready');

console.log('\n🚀 TO RUN THE FULL APPLICATION:');
console.log('===============================');
console.log('1. npm install');
console.log('2. cp .env.test .env');
console.log('3. Add OpenAI API key to .env (optional)');
console.log('4. npm run dev');
console.log('5. Open browser to http://localhost:3000');
console.log('');
console.log('The app will show a blue "TEST MODE" banner and provide');
console.log('realistic vessel battery data for comprehensive testing!');