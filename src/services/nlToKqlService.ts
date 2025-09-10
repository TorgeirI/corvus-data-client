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
    
    // Only initialize OpenAI if we have a real API key (not placeholder)
    if (apiKey && apiKey !== 'your-openai-api-key-here') {
      this.openai = new OpenAI({
        apiKey,
        dangerouslyAllowBrowser: true
      })
    } else {
      console.warn('OpenAI API key not configured. Using fallback KQL generation for testing.')
      this.openai = null as any // Will use fallback methods
    }
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

    // If OpenAI is not available, use fallback method
    if (!this.openai) {
      return this.generateFallbackKQL(naturalLanguageQuery)
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
      // Fall back to pattern-based generation if OpenAI fails
      return this.generateFallbackKQL(naturalLanguageQuery)
    }
  }

  private generateFallbackKQL(naturalLanguageQuery: string): KQLConversionResult {
    const query = naturalLanguageQuery.toLowerCase().trim()
    
    // Pattern-based KQL generation for common maritime vessel queries
    let kqlQuery = 'BatteryReadings'
    let explanation = 'Query vessel battery data'
    const suggestedVisualizations = ['table', 'line']
    
    // Time range detection
    if (query.includes('last 24 hours') || query.includes('yesterday')) {
      kqlQuery += '\n| where timestamp >= ago(24h)'
      explanation += ' from the last 24 hours'
    } else if (query.includes('last week') || query.includes('7 days')) {
      kqlQuery += '\n| where timestamp >= ago(7d)'
      explanation += ' from the last week'
    } else if (query.includes('today')) {
      kqlQuery += '\n| where timestamp >= startofday(now())'
      explanation += ' from today'
    }

    // Vessel-specific filters
    if (query.includes('vessel')) {
      const vesselMatch = query.match(/vessel\s+(\w+)/i)
      if (vesselMatch) {
        kqlQuery += `\n| where vesselName contains "${vesselMatch[1]}"`
        explanation += ` for vessels containing "${vesselMatch[1]}"`
      }
    }

    // Battery health filters
    if (query.includes('low battery') || query.includes('battery health')) {
      if (query.includes('below') || query.includes('less than')) {
        const numberMatch = query.match(/(\d+)/)
        const threshold = numberMatch ? numberMatch[1] : '85'
        kqlQuery += `\n| where batteryHealth < ${threshold}`
        explanation += ` with battery health below ${threshold}%`
      }
    }

    // Temperature conditions
    if (query.includes('temperature') || query.includes('hot') || query.includes('cold')) {
      if (query.includes('high') || query.includes('hot') || query.includes('above')) {
        kqlQuery += '\n| where temperature > 35'
        explanation += ' with high temperatures'
      } else if (query.includes('low') || query.includes('cold') || query.includes('below')) {
        kqlQuery += '\n| where temperature < 5'
        explanation += ' with low temperatures'
      }
    }

    // Aggregations
    if (query.includes('average') || query.includes('avg')) {
      if (query.includes('voltage')) {
        kqlQuery += '\n| summarize avg(voltage) by vesselName'
        explanation += ', showing average voltage by vessel'
        suggestedVisualizations.push('bar')
      } else if (query.includes('temperature')) {
        kqlQuery += '\n| summarize avg(temperature) by vesselName'
        explanation += ', showing average temperature by vessel'
        suggestedVisualizations.push('bar')
      }
    }

    // Maintenance queries
    if (query.includes('maintenance')) {
      kqlQuery = 'VesselMaintenance'
      explanation = 'Query vessel maintenance records'
      
      if (query.includes('pending') || query.includes('scheduled')) {
        kqlQuery += '\n| where status == "pending"'
        explanation += ' for pending maintenance'
      } else if (query.includes('emergency') || query.includes('critical')) {
        kqlQuery += '\n| where priority == "critical" or maintenanceType == "emergency"'
        explanation += ' for critical or emergency maintenance'
      }
    }

    // Weather queries
    if (query.includes('weather') || query.includes('wind') || query.includes('wave')) {
      kqlQuery = 'WeatherData'
      explanation = 'Query weather data'
      
      if (query.includes('storm') || query.includes('rough')) {
        kqlQuery += '\n| where windSpeed > 25 or waveHeight > 3'
        explanation += ' for stormy conditions'
      }
    }

    // Events and alerts
    if (query.includes('alert') || query.includes('event') || query.includes('problem')) {
      kqlQuery = 'AlertsAndEvents'
      explanation = 'Query system alerts and events'
      
      if (query.includes('unresolved') || query.includes('open')) {
        kqlQuery += '\n| where not resolved'
        explanation += ' for unresolved issues'
      } else if (query.includes('critical') || query.includes('high')) {
        kqlQuery += '\n| where severity in ("high", "critical")'
        explanation += ' for high-severity issues'
      }
    }

    // Add common projections and limits
    if (!kqlQuery.includes('summarize')) {
      kqlQuery += '\n| project timestamp, vesselName, vesselId'
      if (kqlQuery.startsWith('BatteryReadings')) {
        kqlQuery = kqlQuery.replace('| project timestamp, vesselName, vesselId', 
          '| project timestamp, vesselName, voltage, current, temperature, stateOfCharge, batteryHealth')
      }
    }
    
    kqlQuery += '\n| top 100 by timestamp desc'

    return {
      kqlQuery,
      explanation,
      confidence: 0.7, // Lower confidence for pattern-based generation
      suggestedVisualizations
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
        'Show battery data from the last 24 hours',
        'Which vessels have low battery health?',
        'Show average voltage by vessel',
        'Display temperature anomalies in battery systems',
        'What maintenance is pending?',
        'Show critical alerts that are unresolved',
        'Display weather data for stormy conditions',
        `Show battery data for vessel ${sampleVessel?.vesselName || 'Atlantic'}`,
        'Show average temperature by vessel',
        'Find emergency maintenance records'
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