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
    // Azure OpenAI configuration
    const azureEndpoint = import.meta.env.VITE_AZURE_OPENAI_ENDPOINT
    const azureApiKey = import.meta.env.VITE_AZURE_OPENAI_API_KEY
    const azureModel = import.meta.env.VITE_AZURE_OPENAI_MODEL || 'gpt-35-turbo'
    const azureApiVersion = import.meta.env.VITE_AZURE_OPENAI_API_VERSION || '2024-02-01'
    
    console.log('🔧 NL to KQL Service Initialization (Azure OpenAI)')
    console.log('🔑 Azure API Key present:', !!azureApiKey)
    console.log('🌐 Azure Endpoint configured:', !!azureEndpoint)
    console.log('🎯 Model deployment:', azureModel)
    console.log('📅 API Version:', azureApiVersion)
    
    // Initialize Azure OpenAI if configuration is present
    if (azureEndpoint && azureApiKey && 
        azureApiKey !== 'your-azure-openai-api-key-here' && 
        azureEndpoint !== 'https://your-resource.openai.azure.com/') {
      
      this.openai = new OpenAI({
        apiKey: azureApiKey,
        baseURL: `${azureEndpoint.replace(/\/$/, '')}/openai/deployments/${azureModel}`,
        defaultQuery: { 'api-version': azureApiVersion },
        defaultHeaders: {
          'api-key': azureApiKey,
        },
        dangerouslyAllowBrowser: true
      })
      
      console.log('✅ Azure OpenAI initialized successfully')
      console.log('🔑 Azure API Key configured:', azureApiKey.substring(0, 10) + '...')
      console.log('🌐 Endpoint:', azureEndpoint.substring(0, 30) + '...')
      console.log('🚀 DEFAULT MODE: Azure OpenAI-powered NL to KQL generation')
    } else {
      console.warn('❌ Azure OpenAI not configured or invalid. Using fallback KQL generation.')
      console.warn('Required: VITE_AZURE_OPENAI_ENDPOINT and VITE_AZURE_OPENAI_API_KEY')
      console.warn('⚠️ FALLBACK MODE: Pattern-based KQL generation')
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

    console.log('🔄 Converting NL to KQL:', naturalLanguageQuery)
    console.log('🤖 OpenAI available:', !!this.openai)

    const forceOpenAI = import.meta.env.VITE_FORCE_OPENAI === 'true' || true // Force enabled for testing
    console.log('🎯 Force OpenAI mode:', forceOpenAI)

    // If Azure OpenAI is not available, use fallback method (unless forced)
    if (!this.openai) {
      if (forceOpenAI) {
        throw new Error('Azure OpenAI is required but not properly configured. Please check your Azure OpenAI endpoint and API key in .env.local')
      }
      console.log('⚠️ Using fallback KQL generation')
      return this.generateFallbackKQL(naturalLanguageQuery)
    }

    console.log('🚀 Using Azure OpenAI-powered KQL generation')

    const systemPrompt = `You are an expert in Kusto Query Language (KQL) for Azure Data Explorer, specializing in maritime vessel battery monitoring systems.

Database Schema:
${this.buildSchemaPrompt()}

Key Guidelines:
1. Generate syntactically correct KQL queries using proper operators (|, where, project, summarize, etc.)
2. Use EXACT table and column names from the schema provided above
3. For vessel queries, use VesselInfo table first, then join or filter other tables
4. For battery data, use BatteryReadings table with proper vesselId/vesselName filters
5. For time-based queries, use appropriate time operators (ago(), startofday(), bin())
6. Use string matching carefully: 'contains', 'startswith', 'endswith', 'matches regex'
7. When filtering by letter/character patterns, use appropriate string functions

Common Query Patterns:
- Vessel filtering: VesselInfo | where vesselName startswith "A" | project vesselId, vesselName, vesselType
- Battery data: BatteryReadings | where vesselName contains "Atlantic" | where timestamp >= ago(1d)
- Health issues: BatteryReadings | where batteryHealth < 80 | summarize count() by vesselName
- Maintenance: VesselMaintenance | where status == "pending" | project vesselName, component, priority

Return your response as a JSON object with:
- kqlQuery: The complete, executable KQL query
- explanation: Brief explanation of what the query does and returns
- confidence: Your confidence level (0-1) in the query correctness
- suggestedVisualizations: Array of suggested chart types (table, bar, line, pie, etc.)

CRITICAL: Only return valid JSON, no markdown, no additional text. The response must be parseable JSON.`

    const userPrompt = `Convert this natural language query to KQL: "${naturalLanguageQuery}"`

    try {
      const model = import.meta.env.VITE_AZURE_OPENAI_MODEL || 'gpt-35-turbo'
      console.log(`🤖 Making Azure OpenAI API call with deployment: ${model}`)
      console.log(`📝 Query: "${naturalLanguageQuery}"`)
      
      // Check if we're using o1-mini model (which has different parameter requirements)
      const isO1Model = model.toLowerCase().includes('o1') || model.toLowerCase().includes('o4')
      
      const requestParams: any = {
        model, // This is actually the deployment name for Azure OpenAI
        messages: [
          { role: 'system', content: systemPrompt },
          { role: 'user', content: userPrompt }
        ]
      }
      
      if (isO1Model) {
        // o1 models don't support temperature, system messages, or response_format
        requestParams.messages = [{ role: 'user', content: `${systemPrompt}\n\n${userPrompt}` }]
        requestParams.max_completion_tokens = 1500
      } else {
        requestParams.temperature = Number(import.meta.env.VITE_OPENAI_TEMPERATURE) || 0.2
        requestParams.max_tokens = 1500
        requestParams.response_format = { type: "json_object" }
      }
      
      const response = await this.openai.chat.completions.create(requestParams)

      const content = response.choices[0]?.message?.content
      if (!content) {
        throw new Error('No response from Azure OpenAI')
      }

      try {
        const result = JSON.parse(content) as KQLConversionResult
        
        if (!this.validateKQLResult(result)) {
          throw new Error('Invalid response format from OpenAI')
        }

        console.log('✅ Azure OpenAI response parsed successfully')
        console.log('📊 Generated KQL:', result.kqlQuery.split('\n')[0] + '...')
        console.log('🎯 Confidence:', result.confidence)
        
        return result
      } catch (parseError) {
        console.error('❌ Failed to parse Azure OpenAI response:', content)
        throw new Error('Failed to parse Azure OpenAI response')
      }
    } catch (error) {
      console.error('Azure OpenAI API call failed:', error)
      // Fall back to pattern-based generation if Azure OpenAI fails
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

    if (this.schemaContext && this.schemaContext.tables.length > 0) {
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

  getModelInfo(): { model: string | null; usingFallback: boolean } {
    const isAzureOpenAIAvailable = !!this.openai
    const model = isAzureOpenAIAvailable ? (import.meta.env.VITE_AZURE_OPENAI_MODEL || 'gpt-35-turbo') : null
    
    return {
      model,
      usingFallback: !isAzureOpenAIAvailable
    }
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