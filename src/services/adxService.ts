import { mockDataService, BatteryReading } from './mockDataService'

export interface QueryResult {
  data: any[]
  columns: string[]
  rowCount: number
  executionTime: number
}

export interface ADXConnection {
  clusterUrl: string
  database: string
}

class ADXService {
  private client: any = null
  private connection: ADXConnection | null = null
  private useMockData: boolean = false

  async initialize(connection: ADXConnection): Promise<void> {
    this.connection = connection
    
    // Check if we should use mock data
    this.useMockData = import.meta.env.VITE_USE_MOCK_DATA === 'true' || 
                      connection.clusterUrl.includes('mock') ||
                      connection.database.includes('mock')
    
    if (this.useMockData) {
      console.log('🔧 ADX Service initialized in MOCK MODE')
      return
    }
    
    // In mock mode, we don't need real Azure clients
    throw new Error('Real ADX mode requires Azure packages. Use mock mode for testing.')
  }

  async executeQuery(kqlQuery: string): Promise<QueryResult> {
    if (!this.connection) {
      throw new Error('ADX service not initialized')
    }

    if (this.useMockData) {
      return this.executeMockQuery(kqlQuery)
    }

    if (!this.client) {
      throw new Error('ADX client not initialized')
    }

    const startTime = Date.now()

    try {
      const clientRequestProps = new ClientRequestProperties()
      clientRequestProps.setOption('servertimeout', '00:10:00')
      
      const response: KustoResponseDataSet = await this.client.execute(
        this.connection.database,
        kqlQuery,
        clientRequestProps
      )

      const primaryTable = response.primaryResults[0]
      if (!primaryTable) {
        throw new Error('No results returned from query')
      }

      const columns = primaryTable.columns?.map(col => col.columnName) || []
      const rows = primaryTable.rows || []

      const executionTime = Date.now() - startTime

      return {
        data: rows.map(row => {
          const rowObj: any = {}
          columns.forEach((col, index) => {
            rowObj[col] = row[index]
          })
          return rowObj
        }),
        columns,
        rowCount: rows.length,
        executionTime
      }
    } catch (error) {
      console.error('ADX query execution failed:', error)
      throw new Error(`Query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async executeMockQuery(kqlQuery: string): Promise<QueryResult> {
    const startTime = Date.now()
    
    // Add artificial delay to simulate network latency
    await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 800))

    try {
      const mockData = await this.parseMockQuery(kqlQuery)
      const executionTime = Date.now() - startTime

      if (mockData.length === 0) {
        return {
          data: [],
          columns: [],
          rowCount: 0,
          executionTime
        }
      }

      // Extract columns from the first data item
      const columns = Object.keys(mockData[0])

      return {
        data: mockData,
        columns,
        rowCount: mockData.length,
        executionTime
      }
    } catch (error) {
      console.error('Mock query execution failed:', error)
      throw new Error(`Mock query execution failed: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private async parseMockQuery(kqlQuery: string): Promise<any[]> {
    const query = kqlQuery.toLowerCase().trim()
    
    // Simple query parsing for common patterns
    if (query.includes('batteryreadings')) {
      return this.generateBatteryData(kqlQuery)
    } else if (query.includes('vesselinfo')) {
      return this.generateVesselData()
    } else if (query.includes('print')) {
      // Handle simple print statements for connection testing
      return [{ Result: 'Connection test successful' }]
    } else {
      // Default to battery readings
      return this.generateBatteryData(kqlQuery)
    }
  }

  private async generateBatteryData(kqlQuery: string): Promise<BatteryReading[]> {
    const now = new Date()
    let startTime = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000) // Default: 7 days ago
    let endTime = now
    let vesselIds: string[] | null = null
    
    // Simple parsing for time ranges and vessel filters
    if (kqlQuery.includes('ago(')) {
      const agoMatch = kqlQuery.match(/ago\((\d+)(d|h|m)\)/)
      if (agoMatch) {
        const value = parseInt(agoMatch[1])
        const unit = agoMatch[2]
        const multiplier = unit === 'd' ? 24 * 60 * 60 * 1000 : 
                          unit === 'h' ? 60 * 60 * 1000 : 60 * 1000
        startTime = new Date(now.getTime() - value * multiplier)
      }
    }

    // Parse vessel filter
    if (kqlQuery.includes('vesselid')) {
      const vesselMatch = kqlQuery.match(/vesselid\s*==\s*["']([^"']+)["']/i)
      if (vesselMatch) {
        vesselIds = [vesselMatch[1]]
      }
    }

    // Determine appropriate interval based on time range
    const timeRangeHours = (endTime.getTime() - startTime.getTime()) / (1000 * 60 * 60)
    let intervalMinutes = 15 // Default

    if (timeRangeHours <= 6) {
      intervalMinutes = 5 // 5 min intervals for last 6 hours
    } else if (timeRangeHours <= 24) {
      intervalMinutes = 15 // 15 min intervals for last day
    } else if (timeRangeHours <= 168) { // 1 week
      intervalMinutes = 60 // 1 hour intervals for last week
    } else {
      intervalMinutes = 240 // 4 hour intervals for longer periods
    }

    return mockDataService.generateTimeSeriesData(vesselIds, startTime, endTime, intervalMinutes)
  }

  private async generateVesselData(): Promise<any[]> {
    return mockDataService.getVessels()
  }

  async testConnection(): Promise<boolean> {
    if (this.useMockData) {
      // Simulate connection test delay
      await new Promise(resolve => setTimeout(resolve, 500))
      return true
    }

    try {
      const testQuery = 'print "Connection test successful"'
      const result = await this.executeQuery(testQuery)
      return result.rowCount > 0
    } catch (error) {
      console.error('ADX connection test failed:', error)
      return false
    }
  }

  async getDatabaseSchema(): Promise<any[]> {
    if (this.useMockData) {
      const mockSchema = await mockDataService.getMockSchema()
      const schemaRows: any[] = []
      
      mockSchema.forEach(table => {
        table.columns.forEach(column => {
          schemaRows.push({
            TableName: table.tableName,
            ColumnName: column.name,
            ColumnType: column.type,
            DataType: column.type
          })
        })
      })
      
      return schemaRows
    }

    if (!this.client || !this.connection) {
      throw new Error('ADX client not initialized')
    }

    try {
      const schemaQuery = `
        .show database schema 
        | where TableName != "" 
        | project TableName, ColumnName, ColumnType, DataType
        | order by TableName, ColumnName
      `
      
      const result = await this.executeQuery(schemaQuery)
      return result.data
    } catch (error) {
      console.error('Failed to retrieve database schema:', error)
      throw new Error('Failed to retrieve database schema')
    }
  }

  async getTables(): Promise<string[]> {
    if (this.useMockData) {
      return mockDataService.getMockTables()
    }

    if (!this.client || !this.connection) {
      throw new Error('ADX client not initialized')
    }

    try {
      const tablesQuery = '.show tables | project TableName'
      const result = await this.executeQuery(tablesQuery)
      return result.data.map(row => row.TableName)
    } catch (error) {
      console.error('Failed to retrieve tables:', error)
      throw new Error('Failed to retrieve tables')
    }
  }

  getConnection(): ADXConnection | null {
    return this.connection
  }

  isConnected(): boolean {
    if (this.useMockData) {
      return this.connection !== null
    }
    return this.client !== null && this.connection !== null
  }

  isMockMode(): boolean {
    return this.useMockData
  }
}

export const adxService = new ADXService()