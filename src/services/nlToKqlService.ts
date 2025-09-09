import OpenAI from 'openai'
import { adxService } from './adxService'
import { mockDataService } from './mockDataService'

export interface KQLConversionResult {
  kqlQuery: string
  explanation: string
  confidence: number
  suggestedVisualizations: string[]
}

export interface SchemaContext {
  tables: string[]
  schema: any[]
}

class NLToKQLService {
  private openai: OpenAI
  private schemaContext: SchemaContext | null = null

  constructor() {
    const apiKey = import.meta.env.VITE_OPENAI_API_KEY
    if (!apiKey) {
      throw new Error('OpenAI API key not configured')
    }

    this.openai = new OpenAI({
      apiKey,
      dangerouslyAllowBrowser: true
    })
  }

  async loadSchemaContext(): Promise<void> {
    try {
      const [tables, schema] = await Promise.all([
        adxService.getTables(),
        adxService.getDatabaseSchema()
      ])

      this.schemaContext = { tables, schema }
    } catch (error) {
      console.error('Failed to load schema context:', error)
      this.schemaContext = { tables: [], schema: [] }
    }
  }

  private buildSchemaPrompt(): string {
    if (!this.schemaContext) {
      return 'No database schema available.'
    }

    const tablesInfo = this.schemaContext.tables.join(', ')
    const schemaInfo = this.schemaContext.schema
      .slice(0, 50) 
      .map(col => `${col.TableName}.${col.ColumnName} (${col.DataType})`)
      .join('\n')

    // Add vessel battery specific context for mock mode
    const isUsingMockData = adxService.isMockMode()
    let additionalContext = ''
    
    if (isUsingMockData) {
      const vessels = mockDataService.getVessels()
      const vesselTypes = [...new Set(vessels.map(v => v.vesselType))].join(', ')
      const vesselList = vessels.slice(0, 5).map(v => `${v.vesselId} (${v.vesselName})`).join(', ')
      
      additionalContext = `

VESSEL BATTERY MONITORING DATABASE:
This database contains time series data from vessel battery monitoring systems.

Key Concepts:
- Vessels: ${vesselTypes} vessels with battery monitoring systems
- Battery Banks: Each vessel has main, backup, and auxiliary battery banks
- Sensors: Voltage, current, temperature, state-of-charge, health metrics
- Time Range: Historical data available for analysis and trending

Sample Vessels: ${vesselList}...

Common Query Patterns:
- "Show battery voltage for [vessel]" → Filter by vesselId and select voltage
- "Low battery health alerts" → Filter batteryHealth < 80
- "Charging patterns last week" → Time range + chargingStatus analysis
- "Temperature anomalies" → Temperature outside normal ranges
- "Fleet comparison" → Group by vesselType or vesselId
`
    }

    return `
Available tables: ${tablesInfo}

Schema sample (first 50 columns):
${schemaInfo}
${additionalContext}
`
  }

  async convertToKQL(naturalLanguageQuery: string): Promise<KQLConversionResult> {
    if (!this.schemaContext) {
      await this.loadSchemaContext()
    }

    const systemPrompt = `You are an expert in Kusto Query Language (KQL) for Azure Data Explorer. 
Your task is to convert natural language queries into valid KQL queries.

Database Schema:
${this.buildSchemaPrompt()}

Guidelines:
1. Generate syntactically correct KQL queries
2. Use appropriate table and column names from the schema
3. Include proper time range filters when dealing with time-based data
4. Use summarize, where, project, and other KQL operators appropriately
5. Consider performance optimizations
6. Suggest appropriate visualization types based on the query results

Return your response as a JSON object with:
- kqlQuery: The generated KQL query
- explanation: Brief explanation of what the query does
- confidence: Your confidence level (0-1) in the query correctness
- suggestedVisualizations: Array of suggested chart types (line, bar, pie, table, etc.)

Only return valid JSON, no additional text.`

    const userPrompt = `Convert this natural language query to KQL: "${naturalLanguageQuery}"`

    try {
      const response = await this.openai.chat.completions.create({
        model: import.meta.env.VITE_OPENAI_MODEL || 'gpt-4-turbo-preview',
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ],
        temperature: 0.3,
        max_tokens: 1000
      })

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from OpenAI')
      }

      try {
        const result = JSON.parse(content) as KQLConversionResult
        
        if (!this.validateKQLResult(result)) {
          throw new Error('Invalid response format from OpenAI')
        }

        return result
      } catch (parseError) {
        console.error('Failed to parse OpenAI response:', content)
        throw new Error('Failed to parse AI response')
      }
    } catch (error) {
      console.error('OpenAI API call failed:', error)
      throw new Error('Failed to convert natural language to KQL')
    }
  }

  private validateKQLResult(result: any): result is KQLConversionResult {
    return (
      typeof result === 'object' &&
      typeof result.kqlQuery === 'string' &&
      typeof result.explanation === 'string' &&
      typeof result.confidence === 'number' &&
      Array.isArray(result.suggestedVisualizations)
    )
  }

  async suggestQueries(): Promise<string[]> {
    if (!this.schemaContext) {
      await this.loadSchemaContext()
    }

    // Check if we're in mock mode to provide vessel-specific suggestions
    if (adxService.isMockMode()) {
      const vessels = mockDataService.getVessels()
      const sampleVessel = vessels.find(v => v.vesselType === 'cargo') || vessels[0]
      
      return [
        `Show battery voltage trends for ${sampleVessel.vesselName} over the last 24 hours`,
        'Which vessels have battery health below 85%?',
        'Compare charging patterns between cargo and passenger vessels',
        'Show temperature anomalies in battery systems this week',
        'What is the average state of charge across the fleet?',
        `Display power consumption for ${sampleVessel.vesselType} vessels`,
        'Find vessels with frequent battery faults',
        'Show daily battery usage patterns'
      ]
    }

    // Default suggestions for real ADX
    const sampleQueries = [
      'Show me the count of records by day for the last week',
      'What are the top 10 most frequent values in the first table?',
      'Show me the average, min, and max values over time',
      'Find any anomalies or spikes in the data',
      'Group the data by category and show totals'
    ]

    if (this.schemaContext.tables.length > 0) {
      const table = this.schemaContext.tables[0]
      return sampleQueries.map(query => 
        query.replace('first table', table).replace('the data', `data from ${table}`)
      )
    }

    return sampleQueries
  }

  getSchemaContext(): SchemaContext | null {
    return this.schemaContext
  }

  // Helper method to generate sample KQL queries for testing
  async generateSampleKQLQueries(): Promise<{ query: string; description: string }[]> {
    if (!adxService.isMockMode()) {
      return []
    }

    const vessels = mockDataService.getVessels()
    const sampleVessel = vessels[0]

    return [
      {
        query: `BatteryReadings 
| where timestamp >= ago(24h) 
| where vesselId == "${sampleVessel.vesselId}"
| where batteryBank == "main"
| summarize avg(voltage), avg(current), avg(temperature) by bin(timestamp, 1h)
| order by timestamp asc`,
        description: `24-hour battery metrics for ${sampleVessel.vesselName}`
      },
      {
        query: `BatteryReadings 
| where timestamp >= ago(7d)
| where batteryHealth < 85
| summarize count(), avg(batteryHealth) by vesselName, batteryBank
| order by avg_batteryHealth asc`,
        description: 'Vessels with low battery health in the last 7 days'
      },
      {
        query: `BatteryReadings 
| where timestamp >= ago(1d)
| where chargingStatus == "fault"
| summarize faultCount = count() by vesselName, batteryBank
| order by faultCount desc`,
        description: 'Battery faults by vessel in the last day'
      },
      {
        query: `BatteryReadings 
| where timestamp >= ago(7d)
| summarize avgSOC = avg(stateOfCharge), 
          avgHealth = avg(batteryHealth),
          avgTemp = avg(temperature) by vesselType = strcat(split(vesselName, " ")[0])
| order by avgSOC desc`,
        description: 'Fleet-wide battery performance by vessel type'
      },
      {
        query: `BatteryReadings 
| where timestamp >= ago(3d)
| where temperature > 40 or temperature < 0
| project timestamp, vesselName, batteryBank, temperature, stateOfCharge
| order by timestamp desc`,
        description: 'Temperature anomalies in battery systems'
      }
    ]
  }
}

export const nlToKqlService = new NLToKQLService()