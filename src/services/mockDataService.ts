export interface VesselInfo {
  vesselId: string
  vesselName: string
  vesselType: 'cargo' | 'tanker' | 'passenger' | 'fishing' | 'research'
  batterySystemType: '12V' | '24V' | '48V'
  batteryCapacity: number // in kWh
  operationalProfile: 'continuous' | 'intermittent' | 'seasonal'
}

export interface BatteryReading {
  timestamp: Date
  vesselId: string
  vesselName: string
  batteryBank: 'main' | 'backup' | 'auxiliary'
  voltage: number
  current: number
  temperature: number
  stateOfCharge: number // 0-100%
  batteryHealth: number // 0-100%
  powerConsumption: number // in kW
  chargingStatus: 'charging' | 'discharging' | 'idle' | 'fault'
  location?: {
    latitude: number
    longitude: number
  }
}

export interface MockSchema {
  tableName: string
  columns: {
    name: string
    type: string
    description: string
  }[]
}

class MockDataService {
  private vessels: VesselInfo[] = []
  private dataCache: Map<string, BatteryReading[]> = new Map()
  private schemaCache: MockSchema[] | null = null

  constructor() {
    this.initializeVesselFleet()
  }

  private initializeVesselFleet(): void {
    this.vessels = [
      // Cargo Vessels
      {
        vesselId: 'CGO-001',
        vesselName: 'Atlantic Carrier',
        vesselType: 'cargo',
        batterySystemType: '24V',
        batteryCapacity: 150,
        operationalProfile: 'continuous'
      },
      {
        vesselId: 'CGO-002',
        vesselName: 'Pacific Explorer',
        vesselType: 'cargo',
        batterySystemType: '48V',
        batteryCapacity: 200,
        operationalProfile: 'continuous'
      },
      {
        vesselId: 'CGO-003',
        vesselName: 'Nordic Freight',
        vesselType: 'cargo',
        batterySystemType: '24V',
        batteryCapacity: 120,
        operationalProfile: 'intermittent'
      },
      
      // Passenger Ferries
      {
        vesselId: 'PSG-001',
        vesselName: 'Island Hopper',
        vesselType: 'passenger',
        batterySystemType: '48V',
        batteryCapacity: 300,
        operationalProfile: 'intermittent'
      },
      {
        vesselId: 'PSG-002',
        vesselName: 'City Ferry',
        vesselType: 'passenger',
        batterySystemType: '48V',
        batteryCapacity: 250,
        operationalProfile: 'continuous'
      },
      {
        vesselId: 'PSG-003',
        vesselName: 'Coastal Express',
        vesselType: 'passenger',
        batterySystemType: '24V',
        batteryCapacity: 180,
        operationalProfile: 'intermittent'
      },

      // Tanker Vessels
      {
        vesselId: 'TNK-001',
        vesselName: 'Oil Pioneer',
        vesselType: 'tanker',
        batterySystemType: '24V',
        batteryCapacity: 180,
        operationalProfile: 'continuous'
      },
      {
        vesselId: 'TNK-002',
        vesselName: 'Chemical Carrier',
        vesselType: 'tanker',
        batterySystemType: '48V',
        batteryCapacity: 220,
        operationalProfile: 'continuous'
      },

      // Fishing Vessels
      {
        vesselId: 'FSH-001',
        vesselName: 'Sea Hunter',
        vesselType: 'fishing',
        batterySystemType: '12V',
        batteryCapacity: 80,
        operationalProfile: 'seasonal'
      },
      {
        vesselId: 'FSH-002',
        vesselName: 'Ocean Harvester',
        vesselType: 'fishing',
        batterySystemType: '24V',
        batteryCapacity: 100,
        operationalProfile: 'seasonal'
      },
      {
        vesselId: 'FSH-003',
        vesselName: 'Deep Sea Fisher',
        vesselType: 'fishing',
        batterySystemType: '12V',
        batteryCapacity: 60,
        operationalProfile: 'intermittent'
      },

      // Research Vessels
      {
        vesselId: 'RSH-001',
        vesselName: 'Marine Explorer',
        vesselType: 'research',
        batterySystemType: '48V',
        batteryCapacity: 400,
        operationalProfile: 'continuous'
      },
      {
        vesselId: 'RSH-002',
        vesselName: 'Ocean Lab',
        vesselType: 'research',
        batterySystemType: '48V',
        batteryCapacity: 350,
        operationalProfile: 'intermittent'
      }
    ]
  }

  private generateBatteryReading(
    vessel: VesselInfo, 
    timestamp: Date, 
    batteryBank: 'main' | 'backup' | 'auxiliary',
    baseValues?: Partial<BatteryReading>
  ): BatteryReading {
    const nominalVoltage = this.getNominalVoltage(vessel.batterySystemType)
    const hourOfDay = timestamp.getHours()
    const dayOfWeek = timestamp.getDay()
    const seasonFactor = this.getSeasonFactor(timestamp)
    
    // Operational pattern based on vessel type and time
    const operationalIntensity = this.getOperationalIntensity(vessel, hourOfDay, dayOfWeek)
    
    // Base battery parameters with some realistic variation
    const baseVoltage = nominalVoltage + (Math.random() - 0.5) * 2
    const baseCurrent = this.generateCurrent(vessel, operationalIntensity, batteryBank)
    const baseTemp = this.generateTemperature(timestamp, vessel, operationalIntensity)
    const baseSOC = this.generateStateOfCharge(vessel, operationalIntensity, hourOfDay)
    const baseHealth = this.generateBatteryHealth(vessel, batteryBank)
    
    // Add some realistic noise and correlations
    const voltage = Math.max(0, baseVoltage + (Math.random() - 0.5) * 0.5)
    const current = Math.max(0, baseCurrent + (Math.random() - 0.5) * 5)
    const temperature = baseTemp + (Math.random() - 0.5) * 2
    const stateOfCharge = Math.min(100, Math.max(0, baseSOC + (Math.random() - 0.5) * 5))
    const batteryHealth = Math.min(100, Math.max(0, baseHealth + (Math.random() - 0.5) * 2))
    
    const powerConsumption = (voltage * current) / 1000 // Convert to kW
    const chargingStatus = this.determineChargingStatus(current, stateOfCharge)
    
    return {
      timestamp,
      vesselId: vessel.vesselId,
      vesselName: vessel.vesselName,
      batteryBank,
      voltage: Math.round(voltage * 100) / 100,
      current: Math.round(current * 100) / 100,
      temperature: Math.round(temperature * 10) / 10,
      stateOfCharge: Math.round(stateOfCharge * 10) / 10,
      batteryHealth: Math.round(batteryHealth * 10) / 10,
      powerConsumption: Math.round(powerConsumption * 100) / 100,
      chargingStatus,
      location: this.generateLocation(vessel)
    }
  }

  private getNominalVoltage(systemType: string): number {
    switch (systemType) {
      case '12V': return 12.6
      case '24V': return 25.2
      case '48V': return 50.4
      default: return 24.0
    }
  }

  private generateCurrent(vessel: VesselInfo, operationalIntensity: number, batteryBank: string): number {
    const baseCurrentByType = {
      cargo: 50,
      tanker: 45,
      passenger: 60,
      fishing: 30,
      research: 40
    }

    const bankMultiplier = {
      main: 1.0,
      backup: 0.3,
      auxiliary: 0.5
    }

    const baseCurrent = baseCurrentByType[vessel.vesselType] * bankMultiplier[batteryBank as keyof typeof bankMultiplier]
    return baseCurrent * operationalIntensity * (0.5 + Math.random())
  }

  private generateTemperature(timestamp: Date, vessel: VesselInfo, operationalIntensity: number): number {
    const month = timestamp.getMonth()
    const seasonalTemp = 10 + 15 * Math.sin((month - 3) * Math.PI / 6) // Seasonal variation
    const operationalHeat = operationalIntensity * 20 // Higher operation = more heat
    const ambientVariation = (Math.random() - 0.5) * 10
    
    return seasonalTemp + operationalHeat + ambientVariation
  }

  private generateStateOfCharge(vessel: VesselInfo, operationalIntensity: number, hourOfDay: number): number {
    // Base SOC varies by operational profile
    let baseSOC = 80
    
    if (vessel.operationalProfile === 'continuous') {
      baseSOC = 70 + 20 * (1 - operationalIntensity)
    } else if (vessel.operationalProfile === 'intermittent') {
      // Higher SOC during rest periods (night for most vessels)
      baseSOC = hourOfDay >= 22 || hourOfDay <= 6 ? 85 : 60
    } else if (vessel.operationalProfile === 'seasonal') {
      const month = new Date().getMonth()
      const isActiveSeason = month >= 3 && month <= 9 // Apr-Oct more active
      baseSOC = isActiveSeason ? 65 : 85
    }
    
    return baseSOC
  }

  private generateBatteryHealth(vessel: VesselInfo, batteryBank: string): number {
    // Simulate battery degradation over time
    const ageFactors = {
      main: 0.95, // Main batteries get more use
      backup: 0.98, // Backup batteries degrade slower
      auxiliary: 0.96
    }
    
    const typeFactors = {
      cargo: 0.92,
      tanker: 0.94,
      passenger: 0.90, // High cycle count
      fishing: 0.88, // Harsh conditions
      research: 0.96 // Well maintained
    }
    
    const baseFactor = ageFactors[batteryBank as keyof typeof ageFactors] * 
                      typeFactors[vessel.vesselType as keyof typeof typeFactors]
    
    return 100 * baseFactor
  }

  private getOperationalIntensity(vessel: VesselInfo, hourOfDay: number, dayOfWeek: number): number {
    let intensity = 0.5 // Base intensity
    
    switch (vessel.operationalProfile) {
      case 'continuous':
        intensity = 0.7 + 0.3 * Math.sin(hourOfDay * Math.PI / 12) // Slight daily variation
        break
      case 'intermittent':
        // Higher intensity during work hours
        if (hourOfDay >= 6 && hourOfDay <= 18) {
          intensity = 0.8
        } else {
          intensity = 0.2
        }
        // Lower on weekends for some vessel types
        if ((dayOfWeek === 0 || dayOfWeek === 6) && vessel.vesselType === 'passenger') {
          intensity *= 0.6
        }
        break
      case 'seasonal':
        const month = new Date().getMonth()
        const isActiveSeason = month >= 3 && month <= 9
        intensity = isActiveSeason ? 0.8 : 0.3
        break
    }
    
    return Math.min(1, Math.max(0, intensity))
  }

  private getSeasonFactor(timestamp: Date): number {
    const month = timestamp.getMonth()
    return 0.8 + 0.4 * Math.sin((month - 3) * Math.PI / 6)
  }

  private determineChargingStatus(current: number, stateOfCharge: number): 'charging' | 'discharging' | 'idle' | 'fault' {
    if (Math.random() < 0.02) return 'fault' // 2% chance of fault
    
    if (current < 2) return 'idle'
    
    if (stateOfCharge < 20) return 'charging'
    if (stateOfCharge > 95) return 'idle'
    
    // Determine based on current direction (simplified)
    return Math.random() > 0.3 ? 'discharging' : 'charging'
  }

  private generateLocation(vessel: VesselInfo): { latitude: number; longitude: number } {
    // Simplified location generation - could be enhanced with realistic routes
    const baseLocations = {
      cargo: { lat: 59.9, lon: 10.7 }, // Oslo area
      tanker: { lat: 60.4, lon: 5.3 }, // Bergen area
      passenger: { lat: 58.9, lon: 5.7 }, // Stavanger area
      fishing: { lat: 69.6, lon: 18.9 }, // Northern Norway
      research: { lat: 78.9, lon: 11.9 } // Svalbard area
    }
    
    const base = baseLocations[vessel.vesselType] || baseLocations.cargo
    
    return {
      latitude: base.lat + (Math.random() - 0.5) * 2,
      longitude: base.lon + (Math.random() - 0.5) * 4
    }
  }

  async generateTimeSeriesData(
    vesselIds: string[] | null, 
    startTime: Date, 
    endTime: Date, 
    intervalMinutes: number = 15
  ): Promise<BatteryReading[]> {
    const readings: BatteryReading[] = []
    const targetVessels = vesselIds ? 
      this.vessels.filter(v => vesselIds.includes(v.vesselId)) : 
      this.vessels

    const totalMinutes = Math.floor((endTime.getTime() - startTime.getTime()) / (1000 * 60))
    const dataPoints = Math.floor(totalMinutes / intervalMinutes)

    for (const vessel of targetVessels) {
      const batteryBanks: ('main' | 'backup' | 'auxiliary')[] = ['main', 'backup', 'auxiliary']
      
      for (const bank of batteryBanks) {
        for (let i = 0; i <= dataPoints; i++) {
          const timestamp = new Date(startTime.getTime() + i * intervalMinutes * 60 * 1000)
          const reading = this.generateBatteryReading(vessel, timestamp, bank)
          readings.push(reading)
        }
      }
    }

    return readings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  async getMockSchema(): Promise<MockSchema[]> {
    if (this.schemaCache) {
      return this.schemaCache
    }

    this.schemaCache = [
      {
        tableName: 'BatteryReadings',
        columns: [
          { name: 'timestamp', type: 'datetime', description: 'Reading timestamp' },
          { name: 'vesselId', type: 'string', description: 'Unique vessel identifier' },
          { name: 'vesselName', type: 'string', description: 'Human-readable vessel name' },
          { name: 'batteryBank', type: 'string', description: 'Battery bank (main/backup/auxiliary)' },
          { name: 'voltage', type: 'real', description: 'Battery voltage in volts' },
          { name: 'current', type: 'real', description: 'Battery current in amperes' },
          { name: 'temperature', type: 'real', description: 'Battery temperature in Celsius' },
          { name: 'stateOfCharge', type: 'real', description: 'State of charge percentage (0-100)' },
          { name: 'batteryHealth', type: 'real', description: 'Battery health percentage (0-100)' },
          { name: 'powerConsumption', type: 'real', description: 'Power consumption in kilowatts' },
          { name: 'chargingStatus', type: 'string', description: 'Charging status (charging/discharging/idle/fault)' },
          { name: 'latitude', type: 'real', description: 'GPS latitude' },
          { name: 'longitude', type: 'real', description: 'GPS longitude' }
        ]
      },
      {
        tableName: 'VesselInfo',
        columns: [
          { name: 'vesselId', type: 'string', description: 'Unique vessel identifier' },
          { name: 'vesselName', type: 'string', description: 'Human-readable vessel name' },
          { name: 'vesselType', type: 'string', description: 'Vessel type (cargo/tanker/passenger/fishing/research)' },
          { name: 'batterySystemType', type: 'string', description: 'Battery system voltage (12V/24V/48V)' },
          { name: 'batteryCapacity', type: 'real', description: 'Total battery capacity in kWh' },
          { name: 'operationalProfile', type: 'string', description: 'Operational profile (continuous/intermittent/seasonal)' }
        ]
      }
    ]

    return this.schemaCache
  }

  async getMockTables(): Promise<string[]> {
    const schema = await this.getMockSchema()
    return schema.map(table => table.tableName)
  }

  getVessels(): VesselInfo[] {
    return [...this.vessels]
  }

  async simulateQuery(query: string): Promise<BatteryReading[]> {
    // Simple query simulation - in a real implementation, this would parse KQL
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    // Default: return last week's data for all vessels
    return this.generateTimeSeriesData(null, oneWeekAgo, now, 60) // 1-hour intervals
  }

  clearCache(): void {
    this.dataCache.clear()
    this.schemaCache = null
  }
}

export const mockDataService = new MockDataService()