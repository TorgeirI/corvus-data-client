export interface TestScenario {
  id: string
  title: string
  description: string
  naturalQuery: string
  expectedKQL: string
  category: 'monitoring' | 'troubleshooting' | 'analytics' | 'maintenance'
  difficulty: 'basic' | 'intermediate' | 'advanced'
  expectedVisualization: string[]
}

export const vesselBatteryTestScenarios: TestScenario[] = [
  // Basic Monitoring Scenarios
  {
    id: 'basic-voltage-trend',
    title: 'Battery Voltage Monitoring',
    description: 'Monitor voltage trends for a specific vessel over the last 24 hours',
    naturalQuery: 'Show battery voltage for Atlantic Carrier over the last 24 hours',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(24h) 
| where vesselName == "Atlantic Carrier"
| project timestamp, batteryBank, voltage
| order by timestamp asc`,
    category: 'monitoring',
    difficulty: 'basic',
    expectedVisualization: ['line', 'table']
  },
  {
    id: 'basic-fleet-status',
    title: 'Fleet Battery Health Overview',
    description: 'Get current battery health status for all vessels',
    naturalQuery: 'What is the current battery health for all vessels?',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(1h)
| summarize currentHealth = avg(batteryHealth), 
          currentSOC = avg(stateOfCharge) by vesselName, batteryBank
| order by currentHealth asc`,
    category: 'monitoring',
    difficulty: 'basic',
    expectedVisualization: ['bar', 'table']
  },
  {
    id: 'basic-charging-status',
    title: 'Current Charging Status',
    description: 'Show which vessels are currently charging their batteries',
    naturalQuery: 'Which vessels are currently charging their batteries?',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(30m)
| where chargingStatus == "charging"
| summarize chargingBanks = dcount(batteryBank) by vesselName
| order by chargingBanks desc`,
    category: 'monitoring',
    difficulty: 'basic',
    expectedVisualization: ['bar', 'pie']
  },

  // Troubleshooting Scenarios
  {
    id: 'trouble-low-health',
    title: 'Low Battery Health Alert',
    description: 'Identify vessels with critically low battery health requiring maintenance',
    naturalQuery: 'Which vessels have battery health below 80%?',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(6h)
| where batteryHealth < 80
| summarize minHealth = min(batteryHealth), 
          avgHealth = avg(batteryHealth), 
          readings = count() by vesselName, batteryBank
| order by minHealth asc`,
    category: 'troubleshooting',
    difficulty: 'intermediate',
    expectedVisualization: ['bar', 'table']
  },
  {
    id: 'trouble-temperature-alerts',
    title: 'Temperature Anomaly Detection',
    description: 'Find battery systems with abnormal temperature readings',
    naturalQuery: 'Show me battery temperature anomalies in the last 48 hours',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(48h)
| where temperature > 45 or temperature < -5
| project timestamp, vesselName, batteryBank, temperature, stateOfCharge, chargingStatus
| order by timestamp desc`,
    category: 'troubleshooting',
    difficulty: 'intermediate',
    expectedVisualization: ['line', 'table']
  },
  {
    id: 'trouble-fault-analysis',
    title: 'Battery Fault Analysis',
    description: 'Analyze battery fault patterns across the fleet',
    naturalQuery: 'Show me all battery faults this week and their patterns',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(7d)
| where chargingStatus == "fault"
| summarize faultCount = count(), 
          lastFault = max(timestamp),
          vesselType = any(strcat(split(vesselName, " ")[0])) by vesselName, batteryBank
| order by faultCount desc`,
    category: 'troubleshooting',
    difficulty: 'advanced',
    expectedVisualization: ['bar', 'table']
  },

  // Analytics Scenarios
  {
    id: 'analytics-vessel-comparison',
    title: 'Vessel Type Performance Comparison',
    description: 'Compare battery performance across different vessel types',
    naturalQuery: 'Compare battery performance between cargo and passenger vessels',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(7d)
| extend vesselType = case(
    vesselName contains "Carrier" or vesselName contains "Freight", "cargo",
    vesselName contains "Ferry" or vesselName contains "Express", "passenger",
    "other")
| where vesselType in ("cargo", "passenger")
| summarize avgVoltage = avg(voltage),
          avgCurrent = avg(current),
          avgSOC = avg(stateOfCharge),
          avgHealth = avg(batteryHealth) by vesselType
| order by avgHealth desc`,
    category: 'analytics',
    difficulty: 'advanced',
    expectedVisualization: ['bar', 'line']
  },
  {
    id: 'analytics-usage-patterns',
    title: 'Daily Usage Pattern Analysis',
    description: 'Analyze daily power consumption patterns across the fleet',
    naturalQuery: 'Show daily battery usage patterns for the fleet',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(7d)
| extend hour = hourofday(timestamp)
| summarize avgPower = avg(powerConsumption),
          avgCurrent = avg(current),
          vessels = dcount(vesselName) by hour
| order by hour asc`,
    category: 'analytics',
    difficulty: 'intermediate',
    expectedVisualization: ['line', 'bar']
  },
  {
    id: 'analytics-efficiency-trends',
    title: 'Battery Efficiency Trending',
    description: 'Track battery efficiency trends over time to predict maintenance needs',
    naturalQuery: 'Show battery efficiency trends for the last month',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(30d)
| where powerConsumption > 0 and current > 0
| extend efficiency = powerConsumption / current
| extend day = bin(timestamp, 1d)
| summarize avgEfficiency = avg(efficiency),
          minEfficiency = min(efficiency),
          maxEfficiency = max(efficiency) by day, vesselName
| order by day asc`,
    category: 'analytics',
    difficulty: 'advanced',
    expectedVisualization: ['line', 'table']
  },

  // Maintenance Scenarios
  {
    id: 'maintenance-schedule',
    title: 'Maintenance Schedule Optimization',
    description: 'Identify vessels that need battery maintenance based on health trends',
    naturalQuery: 'Which vessels need battery maintenance based on recent performance?',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(14d)
| summarize healthTrend = (max(batteryHealth) - min(batteryHealth)) / 14,
          avgHealth = avg(batteryHealth),
          faultCount = countif(chargingStatus == "fault"),
          readings = count() by vesselName, batteryBank
| where avgHealth < 85 or healthTrend < -1 or faultCount > 5
| order by avgHealth asc, healthTrend asc`,
    category: 'maintenance',
    difficulty: 'advanced',
    expectedVisualization: ['bar', 'table']
  },
  {
    id: 'maintenance-replacement',
    title: 'Battery Replacement Planning',
    description: 'Predict which batteries need replacement based on degradation patterns',
    naturalQuery: 'Show me batteries that might need replacement soon',
    expectedKQL: `BatteryReadings 
| where timestamp >= ago(30d)
| extend week = bin(timestamp, 7d)
| summarize weeklyAvgHealth = avg(batteryHealth) by vesselName, batteryBank, week
| order by vesselName, batteryBank, week
| extend prevWeekHealth = prev(weeklyAvgHealth, 1)
| extend healthDecline = prevWeekHealth - weeklyAvgHealth
| where weeklyAvgHealth < 85 and healthDecline > 2
| project vesselName, batteryBank, week, weeklyAvgHealth, healthDecline`,
    category: 'maintenance',
    difficulty: 'advanced',
    expectedVisualization: ['line', 'table']
  }
]

export const getScenariosByCategory = (category: TestScenario['category']): TestScenario[] => {
  return vesselBatteryTestScenarios.filter(scenario => scenario.category === category)
}

export const getScenariosByDifficulty = (difficulty: TestScenario['difficulty']): TestScenario[] => {
  return vesselBatteryTestScenarios.filter(scenario => scenario.difficulty === difficulty)
}

export const getRandomScenario = (): TestScenario => {
  const randomIndex = Math.floor(Math.random() * vesselBatteryTestScenarios.length)
  return vesselBatteryTestScenarios[randomIndex]
}

export const searchScenarios = (searchTerm: string): TestScenario[] => {
  const term = searchTerm.toLowerCase()
  return vesselBatteryTestScenarios.filter(scenario => 
    scenario.title.toLowerCase().includes(term) ||
    scenario.description.toLowerCase().includes(term) ||
    scenario.naturalQuery.toLowerCase().includes(term)
  )
}