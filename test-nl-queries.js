// Test script for Enhanced KQL Mock Database
// Run this in the browser console at http://localhost:3000

console.log('🚢 Testing Enhanced KQL Mock Database...');

// Test natural language queries
const testQueries = [
    "Show battery data from the last 24 hours",
    "Which vessels have low battery health?", 
    "Show average voltage by vessel",
    "What maintenance is pending?",
    "Show critical alerts that are unresolved",
    "Display weather data for stormy conditions"
];

async function testNLQueries() {
    console.log('\n📝 Testing Natural Language to KQL Conversion...\n');
    
    for (const query of testQueries) {
        try {
            console.log(`🔍 Query: "${query}"`);
            
            // This would be called from the browser console where nlToKqlService is available
            // const result = await nlToKqlService.convertToKQL(query);
            // console.log('✅ Generated KQL:', result.kqlQuery);
            // console.log('📊 Explanation:', result.explanation);
            // console.log('🎯 Confidence:', result.confidence);
            // console.log('📈 Suggested visualizations:', result.suggestedVisualizations);
            
            console.log('   ⏳ Use: await nlToKqlService.convertToKQL("' + query + '")');
            console.log('');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
}

async function testDirectKQL() {
    console.log('\n🔧 Testing Direct KQL Execution...\n');
    
    const kqlQueries = [
        "BatteryReadings | top 5 by timestamp desc",
        "VesselMaintenance | where status == \"pending\" | top 5 by scheduledDate",
        "AlertsAndEvents | where severity == \"critical\" and not resolved",
        "BatteryReadings | summarize avg(voltage) by vesselName | top 5 by avg_voltage desc"
    ];
    
    for (const kql of kqlQueries) {
        try {
            console.log(`🔍 KQL: ${kql}`);
            
            // This would be called from the browser console where mockDataService is available
            // const results = await mockDataService.executeKQLQuery(kql);
            // console.log(`✅ Results: ${results.length} rows`);
            
            console.log('   ⏳ Use: await mockDataService.executeKQLQuery("' + kql + '")');
            console.log('');
        } catch (error) {
            console.error('❌ Error:', error.message);
        }
    }
}

console.log(`
🎯 Enhanced Mock Database Features:
   • 6 comprehensive tables (BatteryReadings, VesselInfo, VesselMaintenance, WeatherData, NavigationData, AlertsAndEvents)
   • 13 realistic vessels with different types
   • Complex KQL support: JOINs, aggregations, time functions
   • Natural language fallback when OpenAI is not configured

📋 To test in browser console:
   1. Open http://localhost:3000
   2. Open browser console (F12)
   3. Run: await mockDataService.executeKQLQuery("BatteryReadings | top 5 by timestamp desc")
   4. Run: await nlToKqlService.convertToKQL("Show battery data from last 24 hours")

🔧 Sample KQL Queries:
`);

const sampleQueries = [
    "BatteryReadings | where timestamp >= ago(24h) | top 10 by timestamp desc",
    "BatteryReadings | summarize avg(voltage), avg(temperature) by vesselName",
    "VesselMaintenance | where priority == \"critical\" | project vesselName, component, description",
    "AlertsAndEvents | where not resolved and severity in (\"high\", \"critical\")",
    "BatteryReadings | join VesselMaintenance on vesselId | where batteryHealth < 85"
];

sampleQueries.forEach((query, i) => {
    console.log(`   ${i + 1}. ${query}`);
});

console.log('\n🚀 Ready to test! Open browser console and try the queries above.');

// Export functions for manual testing
window.testNLQueries = testNLQueries;
window.testDirectKQL = testDirectKQL;