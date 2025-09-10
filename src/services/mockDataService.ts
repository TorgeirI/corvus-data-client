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

export interface VesselMaintenance {
  maintenanceId: string
  vesselId: string
  vesselName: string
  maintenanceType: 'scheduled' | 'emergency' | 'preventive' | 'corrective'
  component: string
  description: string
  scheduledDate: Date
  completedDate: Date | null
  technicianId: string
  status: 'pending' | 'in_progress' | 'completed' | 'cancelled'
  cost: number
  priority: 'low' | 'medium' | 'high' | 'critical'
  estimatedHours: number
  actualHours: number | null
}

export interface WeatherData {
  timestamp: Date
  location: {
    latitude: number
    longitude: number
  }
  windSpeed: number // knots
  windDirection: number // degrees
  waveHeight: number // meters
  visibility: number // nautical miles
  seaState: number // 0-9 scale
  airTemperature: number // celsius
  waterTemperature: number // celsius
  barometricPressure: number // hPa
  humidity: number // percentage
}

export interface NavigationData {
  timestamp: Date
  vesselId: string
  vesselName: string
  latitude: number
  longitude: number
  speed: number // knots
  heading: number // degrees
  depth: number // meters
  fuelConsumption: number // liters per hour
  engineRPM: number
  routeId: string
  portOfOrigin: string
  portOfDestination: string
  estimatedArrival: Date
}

export interface AlertsAndEvents {
  eventId: string
  timestamp: Date
  vesselId: string
  vesselName: string
  eventType: 'alert' | 'warning' | 'info' | 'maintenance' | 'operational'
  severity: 'low' | 'medium' | 'high' | 'critical'
  component: string
  message: string
  acknowledged: boolean
  acknowledgedBy: string | null
  acknowledgedAt: Date | null
  resolved: boolean
  resolvedAt: Date | null
}

export interface KQLQuery {
  table: string
  operations: KQLOperation[]
}

export interface KQLOperation {
  type: 'where' | 'summarize' | 'project' | 'extend' | 'join' | 'union' | 'distinct' | 'top' | 'sort' | 'bin'
  parameters: any
}

class MockDataService {
  private vessels: VesselInfo[] = []
  private dataCache: Map<string, BatteryReading[]> = new Map()
  private maintenanceCache: Map<string, VesselMaintenance[]> = new Map()
  private weatherCache: Map<string, WeatherData[]> = new Map()
  private navigationCache: Map<string, NavigationData[]> = new Map()
  private eventsCache: Map<string, AlertsAndEvents[]> = new Map()
  private schemaCache: MockSchema[] | null = null

  constructor() {
    this.initializeVesselFleet()
    this.initializeMaintenanceData()
    this.initializeWeatherData()
    this.initializeNavigationData()
    this.initializeEventsData()
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

  private initializeMaintenanceData(): void {
    // Generate realistic maintenance schedules for all vessels
    const maintenanceTypes = ['scheduled', 'emergency', 'preventive', 'corrective'] as const
    const components = ['Battery System', 'Engine', 'Navigation', 'Safety Equipment', 'Hull', 'Propulsion']
    const technicians = ['TECH-001', 'TECH-002', 'TECH-003', 'TECH-004', 'TECH-005']
    
    this.vessels.forEach(vessel => {
      const maintenanceRecords: VesselMaintenance[] = []
      const recordCount = 5 + Math.floor(Math.random() * 10) // 5-15 records per vessel
      
      for (let i = 0; i < recordCount; i++) {
        const scheduledDate = new Date(Date.now() - Math.random() * 180 * 24 * 60 * 60 * 1000) // Last 6 months
        const isCompleted = Math.random() > 0.3
        
        maintenanceRecords.push({
          maintenanceId: `MAINT-${vessel.vesselId}-${String(i + 1).padStart(3, '0')}`,
          vesselId: vessel.vesselId,
          vesselName: vessel.vesselName,
          maintenanceType: maintenanceTypes[Math.floor(Math.random() * maintenanceTypes.length)],
          component: components[Math.floor(Math.random() * components.length)],
          description: `Routine maintenance and inspection of ${components[Math.floor(Math.random() * components.length)].toLowerCase()}`,
          scheduledDate,
          completedDate: isCompleted ? new Date(scheduledDate.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null,
          technicianId: technicians[Math.floor(Math.random() * technicians.length)],
          status: isCompleted ? 'completed' : (['pending', 'in_progress'][Math.floor(Math.random() * 2)] as any),
          cost: 500 + Math.random() * 5000,
          priority: (['low', 'medium', 'high', 'critical'][Math.floor(Math.random() * 4)] as any),
          estimatedHours: 2 + Math.random() * 12,
          actualHours: isCompleted ? 2 + Math.random() * 15 : null
        })
      }
      
      this.maintenanceCache.set(vessel.vesselId, maintenanceRecords)
    })
  }

  private initializeWeatherData(): void {
    // Generate weather data for common maritime regions
    const regions = [
      { name: 'North Sea', lat: 56.0, lon: 3.0 },
      { name: 'Baltic Sea', lat: 58.0, lon: 20.0 },
      { name: 'Norwegian Sea', lat: 66.0, lon: 2.0 },
      { name: 'Atlantic', lat: 60.0, lon: -5.0 }
    ]

    regions.forEach(region => {
      const weatherRecords: WeatherData[] = []
      const now = new Date()
      
      // Generate hourly weather data for the last 7 days
      for (let i = 0; i < 7 * 24; i++) {
        const timestamp = new Date(now.getTime() - i * 60 * 60 * 1000)
        
        weatherRecords.push({
          timestamp,
          location: {
            latitude: region.lat + (Math.random() - 0.5) * 2,
            longitude: region.lon + (Math.random() - 0.5) * 4
          },
          windSpeed: 5 + Math.random() * 25,
          windDirection: Math.random() * 360,
          waveHeight: 0.5 + Math.random() * 4,
          visibility: 1 + Math.random() * 9,
          seaState: Math.floor(Math.random() * 6),
          airTemperature: -5 + Math.random() * 25,
          waterTemperature: 2 + Math.random() * 18,
          barometricPressure: 980 + Math.random() * 60,
          humidity: 60 + Math.random() * 40
        })
      }
      
      this.weatherCache.set(region.name, weatherRecords)
    })
  }

  private initializeNavigationData(): void {
    const routes = [
      { id: 'ROUTE-001', origin: 'Oslo', destination: 'Copenhagen' },
      { id: 'ROUTE-002', origin: 'Bergen', destination: 'Stavanger' },
      { id: 'ROUTE-003', origin: 'Trondheim', destination: 'Bergen' }
    ]

    this.vessels.forEach(vessel => {
      const navigationRecords: NavigationData[] = []
      const route = routes[Math.floor(Math.random() * routes.length)]
      const now = new Date()
      
      // Generate navigation data for the last 24 hours (every 15 minutes)
      for (let i = 0; i < 24 * 4; i++) {
        const timestamp = new Date(now.getTime() - i * 15 * 60 * 1000)
        const baseLocation = this.generateLocation(vessel)
        
        navigationRecords.push({
          timestamp,
          vesselId: vessel.vesselId,
          vesselName: vessel.vesselName,
          latitude: baseLocation.latitude + (Math.random() - 0.5) * 0.1,
          longitude: baseLocation.longitude + (Math.random() - 0.5) * 0.1,
          speed: 5 + Math.random() * 15,
          heading: Math.random() * 360,
          depth: 10 + Math.random() * 200,
          fuelConsumption: 50 + Math.random() * 200,
          engineRPM: 800 + Math.random() * 1200,
          routeId: route.id,
          portOfOrigin: route.origin,
          portOfDestination: route.destination,
          estimatedArrival: new Date(timestamp.getTime() + (12 + Math.random() * 24) * 60 * 60 * 1000)
        })
      }
      
      this.navigationCache.set(vessel.vesselId, navigationRecords)
    })
  }

  private initializeEventsData(): void {
    const eventTypes = ['alert', 'warning', 'info', 'maintenance', 'operational'] as const
    const severities = ['low', 'medium', 'high', 'critical'] as const
    const components = ['Battery', 'Engine', 'Navigation', 'Safety', 'Communication', 'Propulsion']
    const messages = [
      'Battery voltage below normal range',
      'Engine temperature high',
      'Navigation system offline',
      'Scheduled maintenance due',
      'Low fuel warning',
      'Communication system error',
      'Battery charging fault detected',
      'Engine oil pressure low'
    ]

    this.vessels.forEach(vessel => {
      const events: AlertsAndEvents[] = []
      const eventCount = 3 + Math.floor(Math.random() * 10) // 3-13 events per vessel
      
      for (let i = 0; i < eventCount; i++) {
        const timestamp = new Date(Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000) // Last 30 days
        const isAcknowledged = Math.random() > 0.3
        const isResolved = isAcknowledged && Math.random() > 0.4
        
        events.push({
          eventId: `EVT-${vessel.vesselId}-${String(i + 1).padStart(4, '0')}`,
          timestamp,
          vesselId: vessel.vesselId,
          vesselName: vessel.vesselName,
          eventType: eventTypes[Math.floor(Math.random() * eventTypes.length)],
          severity: severities[Math.floor(Math.random() * severities.length)],
          component: components[Math.floor(Math.random() * components.length)],
          message: messages[Math.floor(Math.random() * messages.length)],
          acknowledged: isAcknowledged,
          acknowledgedBy: isAcknowledged ? `USER-${Math.floor(Math.random() * 5) + 1}` : null,
          acknowledgedAt: isAcknowledged ? new Date(timestamp.getTime() + Math.random() * 24 * 60 * 60 * 1000) : null,
          resolved: isResolved,
          resolvedAt: isResolved ? new Date(timestamp.getTime() + Math.random() * 7 * 24 * 60 * 60 * 1000) : null
        })
      }
      
      this.eventsCache.set(vessel.vesselId, events)
    })
  }

  private generateBatteryReading(
    vessel: VesselInfo, 
    timestamp: Date, 
    batteryBank: 'main' | 'backup' | 'auxiliary',
    _baseValues?: Partial<BatteryReading>
  ): BatteryReading {
    const nominalVoltage = this.getNominalVoltage(vessel.batterySystemType)
    const hourOfDay = timestamp.getHours()
    const dayOfWeek = timestamp.getDay()
    // const seasonFactor = this.getSeasonFactor(timestamp) // Currently unused
    
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
      },
      {
        tableName: 'VesselMaintenance',
        columns: [
          { name: 'maintenanceId', type: 'string', description: 'Unique maintenance record identifier' },
          { name: 'vesselId', type: 'string', description: 'Vessel identifier' },
          { name: 'vesselName', type: 'string', description: 'Vessel name' },
          { name: 'maintenanceType', type: 'string', description: 'Type of maintenance (scheduled/emergency/preventive/corrective)' },
          { name: 'component', type: 'string', description: 'Component being maintained' },
          { name: 'description', type: 'string', description: 'Maintenance description' },
          { name: 'scheduledDate', type: 'datetime', description: 'Scheduled maintenance date' },
          { name: 'completedDate', type: 'datetime', description: 'Actual completion date' },
          { name: 'technicianId', type: 'string', description: 'Assigned technician ID' },
          { name: 'status', type: 'string', description: 'Maintenance status (pending/in_progress/completed/cancelled)' },
          { name: 'cost', type: 'real', description: 'Maintenance cost' },
          { name: 'priority', type: 'string', description: 'Priority level (low/medium/high/critical)' },
          { name: 'estimatedHours', type: 'real', description: 'Estimated work hours' },
          { name: 'actualHours', type: 'real', description: 'Actual work hours' }
        ]
      },
      {
        tableName: 'WeatherData',
        columns: [
          { name: 'timestamp', type: 'datetime', description: 'Weather observation timestamp' },
          { name: 'latitude', type: 'real', description: 'Location latitude' },
          { name: 'longitude', type: 'real', description: 'Location longitude' },
          { name: 'windSpeed', type: 'real', description: 'Wind speed in knots' },
          { name: 'windDirection', type: 'real', description: 'Wind direction in degrees' },
          { name: 'waveHeight', type: 'real', description: 'Wave height in meters' },
          { name: 'visibility', type: 'real', description: 'Visibility in nautical miles' },
          { name: 'seaState', type: 'int', description: 'Sea state (0-9 scale)' },
          { name: 'airTemperature', type: 'real', description: 'Air temperature in Celsius' },
          { name: 'waterTemperature', type: 'real', description: 'Water temperature in Celsius' },
          { name: 'barometricPressure', type: 'real', description: 'Barometric pressure in hPa' },
          { name: 'humidity', type: 'real', description: 'Relative humidity percentage' }
        ]
      },
      {
        tableName: 'NavigationData',
        columns: [
          { name: 'timestamp', type: 'datetime', description: 'Navigation data timestamp' },
          { name: 'vesselId', type: 'string', description: 'Vessel identifier' },
          { name: 'vesselName', type: 'string', description: 'Vessel name' },
          { name: 'latitude', type: 'real', description: 'Current latitude' },
          { name: 'longitude', type: 'real', description: 'Current longitude' },
          { name: 'speed', type: 'real', description: 'Speed in knots' },
          { name: 'heading', type: 'real', description: 'Heading in degrees' },
          { name: 'depth', type: 'real', description: 'Water depth in meters' },
          { name: 'fuelConsumption', type: 'real', description: 'Fuel consumption in liters per hour' },
          { name: 'engineRPM', type: 'real', description: 'Engine RPM' },
          { name: 'routeId', type: 'string', description: 'Route identifier' },
          { name: 'portOfOrigin', type: 'string', description: 'Port of origin' },
          { name: 'portOfDestination', type: 'string', description: 'Port of destination' },
          { name: 'estimatedArrival', type: 'datetime', description: 'Estimated arrival time' }
        ]
      },
      {
        tableName: 'AlertsAndEvents',
        columns: [
          { name: 'eventId', type: 'string', description: 'Unique event identifier' },
          { name: 'timestamp', type: 'datetime', description: 'Event timestamp' },
          { name: 'vesselId', type: 'string', description: 'Vessel identifier' },
          { name: 'vesselName', type: 'string', description: 'Vessel name' },
          { name: 'eventType', type: 'string', description: 'Event type (alert/warning/info/maintenance/operational)' },
          { name: 'severity', type: 'string', description: 'Severity level (low/medium/high/critical)' },
          { name: 'component', type: 'string', description: 'Affected component' },
          { name: 'message', type: 'string', description: 'Event message' },
          { name: 'acknowledged', type: 'bool', description: 'Whether event has been acknowledged' },
          { name: 'acknowledgedBy', type: 'string', description: 'User who acknowledged the event' },
          { name: 'acknowledgedAt', type: 'datetime', description: 'Acknowledgment timestamp' },
          { name: 'resolved', type: 'bool', description: 'Whether event has been resolved' },
          { name: 'resolvedAt', type: 'datetime', description: 'Resolution timestamp' }
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

  async executeKQLQuery(kqlQuery: string): Promise<any[]> {
    const parsedQuery = this.parseKQLStatement(kqlQuery)
    let result = await this.getTableData(parsedQuery.table)

    // Apply operations in sequence
    for (const operation of parsedQuery.operations) {
      result = await this.applyKQLOperation(result, operation)
    }

    return result
  }

  private parseKQLStatement(kqlQuery: string): KQLQuery {
    const lines = kqlQuery.split('\n').map(line => line.trim()).filter(line => line)
    const operations: KQLOperation[] = []
    
    // Extract table name from first line
    const firstLine = lines[0]
    const tableName = firstLine.split(/\s/)[0]

    // Parse each subsequent line as an operation
    for (let i = 1; i < lines.length; i++) {
      const line = lines[i]
      if (line.startsWith('|')) {
        const operation = this.parseKQLOperation(line.substring(1).trim())
        if (operation) {
          operations.push(operation)
        }
      }
    }

    // Also check if the first line contains operations after the table name
    const firstLineRest = firstLine.substring(tableName.length).trim()
    if (firstLineRest.startsWith('|')) {
      const restLines = firstLineRest.split('|').filter(part => part.trim())
      for (const part of restLines) {
        const operation = this.parseKQLOperation(part.trim())
        if (operation) {
          operations.push(operation)
        }
      }
    }

    return { table: tableName, operations }
  }

  private parseKQLOperation(operationText: string): KQLOperation | null {
    const parts = operationText.split(/\s+/)
    const operator = parts[0].toLowerCase()

    switch (operator) {
      case 'where':
        return {
          type: 'where',
          parameters: { condition: operationText.substring(5).trim() }
        }
      case 'summarize':
        return {
          type: 'summarize',
          parameters: this.parseSummarizeOperation(operationText)
        }
      case 'project':
        return {
          type: 'project',
          parameters: { columns: operationText.substring(7).split(',').map(c => c.trim()) }
        }
      case 'extend':
        return {
          type: 'extend',
          parameters: { expression: operationText.substring(6).trim() }
        }
      case 'distinct':
        return {
          type: 'distinct',
          parameters: { columns: operationText.substring(8).split(',').map(c => c.trim()) }
        }
      case 'top':
        const topMatch = operationText.match(/top\s+(\d+)(?:\s+by\s+(.+))?/i)
        return {
          type: 'top',
          parameters: {
            count: topMatch ? parseInt(topMatch[1]) : 10,
            orderBy: topMatch?.[2]?.trim()
          }
        }
      case 'sort':
      case 'order':
        return {
          type: 'sort',
          parameters: { expression: operationText.substring(operator.length).replace(/^\s+by\s+/i, '').trim() }
        }
      case 'bin':
        return {
          type: 'bin',
          parameters: { expression: operationText }
        }
      case 'join':
        return {
          type: 'join',
          parameters: this.parseJoinOperation(operationText)
        }
      case 'union':
        return {
          type: 'union',
          parameters: this.parseUnionOperation(operationText)
        }
      default:
        return null
    }
  }

  private parseSummarizeOperation(operationText: string): any {
    const content = operationText.substring(9).trim() // Remove 'summarize'
    const parts = content.split(/\s+by\s+/i)
    
    return {
      aggregations: parts[0].split(',').map(a => a.trim()),
      groupBy: parts.length > 1 ? parts[1].split(',').map(g => g.trim()) : []
    }
  }

  private parseJoinOperation(operationText: string): any {
    // Parse join operation: join kind=inner table on condition
    const joinMatch = operationText.match(/join\s+(?:kind\s*=\s*(\w+)\s+)?(\w+)\s+on\s+(.+)/i)
    if (joinMatch) {
      const [, kind, table, condition] = joinMatch
      return {
        kind: kind || 'inner',
        table,
        condition: condition.trim()
      }
    }
    
    // Simple join without condition
    const simpleJoinMatch = operationText.match(/join\s+(\w+)/i)
    if (simpleJoinMatch) {
      return {
        kind: 'inner',
        table: simpleJoinMatch[1],
        condition: null
      }
    }
    
    return { kind: 'inner', table: '', condition: null }
  }

  private parseUnionOperation(operationText: string): any {
    const unionMatch = operationText.match(/union\s+(\w+)/i)
    return {
      table: unionMatch ? unionMatch[1] : ''
    }
  }

  private async getTableData(tableName: string): Promise<any[]> {
    const table = tableName.toLowerCase()
    
    switch (table) {
      case 'batteryreadings':
        return this.getAllBatteryReadings()
      case 'vesselinfo':
        return this.getVessels()
      case 'vesselmaintenance':
        return this.getAllMaintenanceRecords()
      case 'weatherdata':
        return this.getAllWeatherData()
      case 'navigationdata':
        return this.getAllNavigationData()
      case 'alertsandevents':
        return this.getAllEventsData()
      default:
        throw new Error(`Unknown table: ${tableName}`)
    }
  }

  private async applyKQLOperation(data: any[], operation: KQLOperation): Promise<any[]> {
    switch (operation.type) {
      case 'where':
        return this.applyWhereOperation(data, operation.parameters.condition)
      case 'project':
        return this.applyProjectOperation(data, operation.parameters.columns)
      case 'summarize':
        return this.applySummarizeOperation(data, operation.parameters)
      case 'distinct':
        return this.applyDistinctOperation(data, operation.parameters.columns)
      case 'top':
        return this.applyTopOperation(data, operation.parameters)
      case 'sort':
        return this.applySortOperation(data, operation.parameters.expression)
      case 'extend':
        return this.applyExtendOperation(data, operation.parameters.expression)
      case 'bin':
        return this.applyBinOperation(data, operation.parameters.expression)
      case 'join':
        return await this.applyJoinOperation(data, operation.parameters)
      case 'union':
        return await this.applyUnionOperation(data, operation.parameters)
      default:
        return data
    }
  }

  private applyWhereOperation(data: any[], condition: string): any[] {
    return data.filter(row => {
      try {
        return this.evaluateComplexCondition(row, condition)
      } catch (error) {
        return true
      }
    })
  }

  private evaluateComplexCondition(row: any, condition: string): boolean {
    // Handle OR conditions first (lowest precedence)
    if (condition.includes(' or ')) {
      const orParts = condition.split(/ or /i)
      return orParts.some(part => this.evaluateComplexCondition(row, part.trim()))
    }

    // Handle AND conditions (higher precedence)
    if (condition.includes(' and ')) {
      const andParts = condition.split(/ and /i)
      return andParts.every(part => this.evaluateComplexCondition(row, part.trim()))
    }

    // Handle parentheses (highest precedence)
    const parenMatch = condition.match(/^\((.+)\)$/)
    if (parenMatch) {
      return this.evaluateComplexCondition(row, parenMatch[1])
    }

    // Handle NOT conditions
    if (condition.trim().startsWith('not ')) {
      const innerCondition = condition.trim().substring(4)
      return !this.evaluateComplexCondition(row, innerCondition)
    }

    // Handle IN conditions
    const inMatch = condition.match(/(\w+)\s+in\s*\(([^)]+)\)/i)
    if (inMatch) {
      const [, field, valuesList] = inMatch
      const values = valuesList.split(',').map(v => v.trim().replace(/['"]/g, ''))
      return values.includes(String(row[field]))
    }

    // Handle CONTAINS/HAS conditions
    const containsMatch = condition.match(/(\w+)\s+(contains|has)\s+["']([^"']+)["']/i)
    if (containsMatch) {
      const [, field, operator, value] = containsMatch
      const fieldValue = String(row[field]).toLowerCase()
      return fieldValue.includes(value.toLowerCase())
    }

    // Handle STARTSWITH/ENDSWITH conditions
    const stringFuncMatch = condition.match(/(\w+)\s+(startswith|endswith)\s+["']([^"']+)["']/i)
    if (stringFuncMatch) {
      const [, field, func, value] = stringFuncMatch
      const fieldValue = String(row[field]).toLowerCase()
      const searchValue = value.toLowerCase()
      
      switch (func.toLowerCase()) {
        case 'startswith':
          return fieldValue.startsWith(searchValue)
        case 'endswith':
          return fieldValue.endsWith(searchValue)
        default:
          return false
      }
    }

    // Handle IS NULL/IS NOT NULL
    if (condition.includes('is null') || condition.includes('is not null')) {
      const nullMatch = condition.match(/(\w+)\s+is\s+(not\s+)?null/i)
      if (nullMatch) {
        const [, field, notNull] = nullMatch
        const isNull = row[field] === null || row[field] === undefined
        return notNull ? !isNull : isNull
      }
    }

    // Fall back to simple condition evaluation
    return this.evaluateCondition(row, condition)
  }

  private evaluateCondition(row: any, condition: string): boolean {
    if (condition.includes('ago(')) {
      return this.evaluateTimeCondition(row, condition)
    }
    
    const equalityMatch = condition.match(/(\w+)\s*==\s*["']([^"']+)["']/)
    if (equalityMatch) {
      const [, field, value] = equalityMatch
      return String(row[field]).toLowerCase() === value.toLowerCase()
    }

    const numericMatch = condition.match(/(\w+)\s*([<>=!]+)\s*(\d+(?:\.\d+)?)/)
    if (numericMatch) {
      const [, field, operator, value] = numericMatch
      const fieldValue = parseFloat(row[field])
      const compareValue = parseFloat(value)
      
      switch (operator) {
        case '>': return fieldValue > compareValue
        case '<': return fieldValue < compareValue
        case '>=': return fieldValue >= compareValue
        case '<=': return fieldValue <= compareValue
        case '==': return fieldValue === compareValue
        case '!=': return fieldValue !== compareValue
        default: return true
      }
    }

    return true
  }

  private evaluateTimeCondition(row: any, condition: string): boolean {
    const rowTime = new Date(row.timestamp)
    
    // Handle ago() function
    const agoMatch = condition.match(/timestamp\s*([><=!]+)\s*ago\((\d+)(d|h|m|s)\)/)
    if (agoMatch) {
      const [, operator, value, unit] = agoMatch
      const numValue = parseInt(value)
      const multiplier = unit === 'd' ? 24 * 60 * 60 * 1000 : 
                        unit === 'h' ? 60 * 60 * 1000 : 
                        unit === 'm' ? 60 * 1000 : 1000
      
      const cutoffTime = new Date(Date.now() - numValue * multiplier)
      
      switch (operator) {
        case '>=': return rowTime >= cutoffTime
        case '>': return rowTime > cutoffTime
        case '<=': return rowTime <= cutoffTime
        case '<': return rowTime < cutoffTime
        case '==': return Math.abs(rowTime.getTime() - cutoffTime.getTime()) < 60000 // Within 1 minute
        case '!=': return Math.abs(rowTime.getTime() - cutoffTime.getTime()) >= 60000
        default: return true
      }
    }

    // Handle between() function
    const betweenMatch = condition.match(/timestamp\s+between\s*\(\s*ago\((\d+)(d|h|m|s)\)\s*\.\.\s*ago\((\d+)(d|h|m|s)\)\s*\)/)
    if (betweenMatch) {
      const [, startValue, startUnit, endValue, endUnit] = betweenMatch
      const startMultiplier = startUnit === 'd' ? 24 * 60 * 60 * 1000 : 
                             startUnit === 'h' ? 60 * 60 * 1000 : 
                             startUnit === 'm' ? 60 * 1000 : 1000
      const endMultiplier = endUnit === 'd' ? 24 * 60 * 60 * 1000 : 
                           endUnit === 'h' ? 60 * 60 * 1000 : 
                           endUnit === 'm' ? 60 * 1000 : 1000
      
      const startTime = new Date(Date.now() - parseInt(startValue) * startMultiplier)
      const endTime = new Date(Date.now() - parseInt(endValue) * endMultiplier)
      
      return rowTime >= endTime && rowTime <= startTime
    }

    // Handle startofday() function
    const startOfDayMatch = condition.match(/timestamp\s*([><=!]+)\s*startofday\((.*?)\)/)
    if (startOfDayMatch) {
      const [, operator, dateExpr] = startOfDayMatch
      let targetDate: Date
      
      if (dateExpr.includes('ago(')) {
        const agoInner = dateExpr.match(/ago\((\d+)(d|h|m|s)\)/)
        if (agoInner) {
          const [, value, unit] = agoInner
          const multiplier = unit === 'd' ? 24 * 60 * 60 * 1000 : 
                            unit === 'h' ? 60 * 60 * 1000 : 
                            unit === 'm' ? 60 * 1000 : 1000
          targetDate = new Date(Date.now() - parseInt(value) * multiplier)
        } else {
          targetDate = new Date()
        }
      } else {
        targetDate = new Date()
      }
      
      const startOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate())
      
      switch (operator) {
        case '>=': return rowTime >= startOfDay
        case '>': return rowTime > startOfDay
        case '<=': return rowTime <= startOfDay
        case '<': return rowTime < startOfDay
        case '==': return rowTime >= startOfDay && rowTime < new Date(startOfDay.getTime() + 24 * 60 * 60 * 1000)
        default: return true
      }
    }

    // Handle endofday() function
    const endOfDayMatch = condition.match(/timestamp\s*([><=!]+)\s*endofday\((.*?)\)/)
    if (endOfDayMatch) {
      const [, operator, dateExpr] = endOfDayMatch
      let targetDate: Date
      
      if (dateExpr.includes('ago(')) {
        const agoInner = dateExpr.match(/ago\((\d+)(d|h|m|s)\)/)
        if (agoInner) {
          const [, value, unit] = agoInner
          const multiplier = unit === 'd' ? 24 * 60 * 60 * 1000 : 
                            unit === 'h' ? 60 * 60 * 1000 : 
                            unit === 'm' ? 60 * 1000 : 1000
          targetDate = new Date(Date.now() - parseInt(value) * multiplier)
        } else {
          targetDate = new Date()
        }
      } else {
        targetDate = new Date()
      }
      
      const endOfDay = new Date(targetDate.getFullYear(), targetDate.getMonth(), targetDate.getDate(), 23, 59, 59, 999)
      
      switch (operator) {
        case '>=': return rowTime >= endOfDay
        case '>': return rowTime > endOfDay
        case '<=': return rowTime <= endOfDay
        case '<': return rowTime < endOfDay
        case '==': return rowTime.getDate() === targetDate.getDate() && 
                         rowTime.getMonth() === targetDate.getMonth() && 
                         rowTime.getFullYear() === targetDate.getFullYear()
        default: return true
      }
    }

    // Handle startofweek() function
    const startOfWeekMatch = condition.match(/timestamp\s*([><=!]+)\s*startofweek\((.*?)\)/)
    if (startOfWeekMatch) {
      const [, operator] = startOfWeekMatch
      const now = new Date()
      const dayOfWeek = now.getDay()
      const startOfWeek = new Date(now.getTime() - dayOfWeek * 24 * 60 * 60 * 1000)
      startOfWeek.setHours(0, 0, 0, 0)
      
      switch (operator) {
        case '>=': return rowTime >= startOfWeek
        case '>': return rowTime > startOfWeek
        case '<=': return rowTime <= startOfWeek
        case '<': return rowTime < startOfWeek
        default: return true
      }
    }
    
    return true
  }

  private applyProjectOperation(data: any[], columns: string[]): any[] {
    return data.map(row => {
      const projected: any = {}
      columns.forEach(col => {
        projected[col] = row[col]
      })
      return projected
    })
  }

  private applySummarizeOperation(data: any[], parameters: any): any[] {
    const { aggregations, groupBy } = parameters
    
    if (groupBy.length === 0) {
      // Simple aggregation without grouping
      const result: any = {}
      aggregations.forEach((agg: string) => {
        const aggResult = this.calculateAggregation(data, agg)
        if (aggResult !== null) {
          result[agg] = aggResult
        }
      })
      return [result]
    }

    // Group by operation
    const groups = new Map<string, any[]>()
    
    data.forEach(row => {
      const groupKey = groupBy.map((col: string) => {
        if (col.includes('bin(')) {
          return this.applyBinFunction(row, col)
        }
        return String(row[col])
      }).join('|')
      
      if (!groups.has(groupKey)) {
        groups.set(groupKey, [])
      }
      groups.get(groupKey)!.push(row)
    })

    const results: any[] = []
    groups.forEach((groupData, groupKey) => {
      const result: any = {}
      
      // Add group by columns to result
      const groupValues = groupKey.split('|')
      groupBy.forEach((col: string, index: number) => {
        if (col.includes('bin(')) {
          result[col] = groupValues[index]
        } else {
          result[col] = groupValues[index]
        }
      })
      
      // Calculate aggregations for this group
      aggregations.forEach((agg: string) => {
        const aggResult = this.calculateAggregation(groupData, agg)
        if (aggResult !== null) {
          result[agg] = aggResult
        }
      })
      
      results.push(result)
    })

    return results.sort((a, b) => {
      // Sort by first group by column
      if (groupBy.length > 0) {
        const firstCol = groupBy[0]
        return a[firstCol] < b[firstCol] ? -1 : a[firstCol] > b[firstCol] ? 1 : 0
      }
      return 0
    })
  }

  private calculateAggregation(data: any[], agg: string): any {
    // Handle basic aggregations
    const basicMatch = agg.match(/(avg|sum|count|min|max)\(([^)]+)\)/)
    if (basicMatch) {
      const [, func, field] = basicMatch
      const values = data.map(row => parseFloat(row[field])).filter(v => !isNaN(v))
      
      switch (func.toLowerCase()) {
        case 'avg':
          return values.length > 0 ? values.reduce((a, b) => a + b, 0) / values.length : 0
        case 'sum':
          return values.reduce((a, b) => a + b, 0)
        case 'count':
          return data.length
        case 'min':
          return values.length > 0 ? Math.min(...values) : null
        case 'max':
          return values.length > 0 ? Math.max(...values) : null
      }
    }

    // Handle count() without field
    if (agg === 'count()' || agg === 'count') {
      return data.length
    }

    // Handle dcount (distinct count)
    const dcountMatch = agg.match(/dcount\(([^)]+)\)/)
    if (dcountMatch) {
      const [, field] = dcountMatch
      const uniqueValues = new Set(data.map(row => row[field]))
      return uniqueValues.size
    }

    // Handle percentile
    const percentileMatch = agg.match(/percentile\(([^,]+),\s*(\d+(?:\.\d+)?)\)/)
    if (percentileMatch) {
      const [, field, percentileStr] = percentileMatch
      const percentile = parseFloat(percentileStr) / 100
      const values = data.map(row => parseFloat(row[field])).filter(v => !isNaN(v)).sort((a, b) => a - b)
      
      if (values.length === 0) return null
      
      const index = Math.floor(percentile * (values.length - 1))
      return values[index]
    }

    // Handle stdev (standard deviation)
    const stdevMatch = agg.match(/stdev\(([^)]+)\)/)
    if (stdevMatch) {
      const [, field] = stdevMatch
      const values = data.map(row => parseFloat(row[field])).filter(v => !isNaN(v))
      
      if (values.length <= 1) return 0
      
      const mean = values.reduce((a, b) => a + b, 0) / values.length
      const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length
      return Math.sqrt(variance)
    }

    // Handle make_list
    const makeListMatch = agg.match(/make_list\(([^)]+)\)/)
    if (makeListMatch) {
      const [, field] = makeListMatch
      return data.map(row => row[field]).filter(val => val !== null && val !== undefined)
    }

    // Handle make_set (unique values)
    const makeSetMatch = agg.match(/make_set\(([^)]+)\)/)
    if (makeSetMatch) {
      const [, field] = makeSetMatch
      const uniqueValues = [...new Set(data.map(row => row[field]).filter(val => val !== null && val !== undefined))]
      return uniqueValues
    }

    return null
  }

  private applyBinFunction(row: any, binExpression: string): string {
    const binMatch = binExpression.match(/bin\(([^,]+),\s*([^)]+)\)/)
    if (binMatch) {
      const [, field, intervalExpr] = binMatch
      const fieldValue = row[field]
      
      if (field === 'timestamp' || fieldValue instanceof Date) {
        return this.applyTimeBin(new Date(fieldValue), intervalExpr)
      } else {
        return this.applyNumericBin(parseFloat(fieldValue), intervalExpr)
      }
    }
    return String(row[binExpression])
  }

  private applyTimeBin(timestamp: Date, interval: string): string {
    // Handle time intervals like 1h, 1d, 30m, etc.
    const intervalMatch = interval.match(/(\d+)(h|d|m|s)/)
    if (intervalMatch) {
      const [, value, unit] = intervalMatch
      const numValue = parseInt(value)
      
      switch (unit) {
        case 'h': // Hour bins
          const hourBin = new Date(timestamp)
          hourBin.setMinutes(0, 0, 0)
          const hourGroup = Math.floor(hourBin.getHours() / numValue) * numValue
          hourBin.setHours(hourGroup)
          return hourBin.toISOString()
          
        case 'd': // Day bins
          const dayBin = new Date(timestamp)
          dayBin.setHours(0, 0, 0, 0)
          return dayBin.toISOString().split('T')[0]
          
        case 'm': // Minute bins
          const minuteBin = new Date(timestamp)
          minuteBin.setSeconds(0, 0)
          const minuteGroup = Math.floor(minuteBin.getMinutes() / numValue) * numValue
          minuteBin.setMinutes(minuteGroup)
          return minuteBin.toISOString()
          
        default:
          return timestamp.toISOString()
      }
    }
    
    return timestamp.toISOString()
  }

  private applyNumericBin(value: number, interval: string): string {
    const intervalValue = parseFloat(interval)
    if (isNaN(intervalValue)) return String(value)
    
    const binValue = Math.floor(value / intervalValue) * intervalValue
    return String(binValue)
  }

  private applyDistinctOperation(data: any[], columns: string[]): any[] {
    const seen = new Set<string>()
    return data.filter(row => {
      const key = columns.map(col => String(row[col])).join('|')
      if (seen.has(key)) {
        return false
      }
      seen.add(key)
      return true
    })
  }

  private applyTopOperation(data: any[], parameters: any): any[] {
    const { count, orderBy } = parameters
    
    if (orderBy) {
      const [field, direction] = orderBy.includes(' desc') 
        ? [orderBy.replace(' desc', '').trim(), 'desc']
        : [orderBy.replace(' asc', '').trim(), 'asc']
      
      data.sort((a, b) => {
        const aVal = a[field]
        const bVal = b[field]
        const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
        return direction === 'desc' ? -comparison : comparison
      })
    }
    
    return data.slice(0, count)
  }

  private applySortOperation(data: any[], expression: string): any[] {
    const [field, direction] = expression.includes(' desc') 
      ? [expression.replace(' desc', '').trim(), 'desc']
      : [expression.replace(' asc', '').trim(), 'asc']
    
    return [...data].sort((a, b) => {
      const aVal = a[field]
      const bVal = b[field]
      const comparison = aVal < bVal ? -1 : aVal > bVal ? 1 : 0
      return direction === 'desc' ? -comparison : comparison
    })
  }

  private applyExtendOperation(data: any[], expression: string): any[] {
    const assignmentMatch = expression.match(/(\w+)\s*=\s*(.+)/)
    if (assignmentMatch) {
      const [, newField, expr] = assignmentMatch
      return data.map(row => ({
        ...row,
        [newField]: this.evaluateExpression(row, expr)
      }))
    }
    return data
  }

  private evaluateExpression(row: any, expression: string): any {
    if (expression.includes('+')) {
      const parts = expression.split('+')
      return parts.reduce((sum, part) => {
        const field = part.trim()
        return sum + (parseFloat(row[field]) || 0)
      }, 0)
    }
    return row[expression] || expression
  }

  private applyBinOperation(data: any[], expression: string): any[] {
    // Bin operation is typically used within summarize, but can also be standalone
    // For standalone bin operation, we'll add the binned column to each row
    const binMatch = expression.match(/bin\(([^,]+),\s*([^)]+)\)/)
    if (binMatch) {
      const [, field, interval] = binMatch
      const binColumnName = `bin_${field}`
      
      return data.map(row => ({
        ...row,
        [binColumnName]: this.applyBinFunction(row, expression)
      }))
    }
    
    return data
  }

  private async applyJoinOperation(leftData: any[], parameters: any): Promise<any[]> {
    const { kind, table, condition } = parameters
    
    // Get right table data
    const rightData = await this.getTableData(table)
    
    if (!condition) {
      // Cross join (cartesian product)
      const result: any[] = []
      leftData.forEach(leftRow => {
        rightData.forEach(rightRow => {
          result.push({ ...leftRow, ...rightRow })
        })
      })
      return result
    }

    // Parse join condition (e.g., "left.vesselId == right.vesselId")
    const conditionMatch = condition.match(/(\w+)\.(\w+)\s*==\s*(\w+)\.(\w+)/)
    if (!conditionMatch) {
      // Simple field equality join (assume same field names)
      const fieldMatch = condition.match(/(\w+)\s*==\s*(\w+)/)
      if (fieldMatch) {
        const [, leftField, rightField] = fieldMatch
        return this.performJoin(leftData, rightData, leftField, rightField, kind)
      }
      return leftData
    }

    const [, , leftField, , rightField] = conditionMatch
    return this.performJoin(leftData, rightData, leftField, rightField, kind)
  }

  private performJoin(leftData: any[], rightData: any[], leftField: string, rightField: string, kind: string): any[] {
    const result: any[] = []
    
    switch (kind.toLowerCase()) {
      case 'inner':
        leftData.forEach(leftRow => {
          rightData.forEach(rightRow => {
            if (leftRow[leftField] === rightRow[rightField]) {
              result.push({ ...leftRow, ...rightRow })
            }
          })
        })
        break
        
      case 'left':
      case 'leftouter':
        leftData.forEach(leftRow => {
          let matched = false
          rightData.forEach(rightRow => {
            if (leftRow[leftField] === rightRow[rightField]) {
              result.push({ ...leftRow, ...rightRow })
              matched = true
            }
          })
          if (!matched) {
            // Add left row with null values for right table columns
            const rightNulls: any = {}
            if (rightData.length > 0) {
              Object.keys(rightData[0]).forEach(key => {
                rightNulls[key] = null
              })
            }
            result.push({ ...leftRow, ...rightNulls })
          }
        })
        break
        
      case 'right':
      case 'rightouter':
        rightData.forEach(rightRow => {
          let matched = false
          leftData.forEach(leftRow => {
            if (leftRow[leftField] === rightRow[rightField]) {
              result.push({ ...leftRow, ...rightRow })
              matched = true
            }
          })
          if (!matched) {
            // Add right row with null values for left table columns
            const leftNulls: any = {}
            if (leftData.length > 0) {
              Object.keys(leftData[0]).forEach(key => {
                leftNulls[key] = null
              })
            }
            result.push({ ...leftNulls, ...rightRow })
          }
        })
        break
        
      case 'full':
      case 'fullouter':
        // This is complex - would need proper full outer join logic
        // For now, approximate with left join
        return this.performJoin(leftData, rightData, leftField, rightField, 'left')
        
      default:
        return this.performJoin(leftData, rightData, leftField, rightField, 'inner')
    }
    
    return result
  }

  private async applyUnionOperation(leftData: any[], parameters: any): Promise<any[]> {
    const { table } = parameters
    const rightData = await this.getTableData(table)
    
    // Simple union - combine all rows
    return [...leftData, ...rightData]
  }

  private getAllBatteryReadings(): BatteryReading[] {
    const now = new Date()
    const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
    
    const allReadings: BatteryReading[] = []
    this.vessels.forEach(vessel => {
      const batteryBanks: ('main' | 'backup' | 'auxiliary')[] = ['main', 'backup', 'auxiliary']
      
      for (const bank of batteryBanks) {
        for (let i = 0; i <= 7 * 4; i++) {
          const timestamp = new Date(oneWeekAgo.getTime() + i * 6 * 60 * 60 * 1000)
          const reading = this.generateBatteryReading(vessel, timestamp, bank)
          allReadings.push(reading)
        }
      }
    })
    
    return allReadings.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private getAllMaintenanceRecords(): VesselMaintenance[] {
    const allRecords: VesselMaintenance[] = []
    this.maintenanceCache.forEach(records => {
      allRecords.push(...records)
    })
    return allRecords.sort((a, b) => a.scheduledDate.getTime() - b.scheduledDate.getTime())
  }

  private getAllWeatherData(): WeatherData[] {
    const allData: WeatherData[] = []
    this.weatherCache.forEach(records => {
      allData.push(...records)
    })
    return allData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private getAllNavigationData(): NavigationData[] {
    const allData: NavigationData[] = []
    this.navigationCache.forEach(records => {
      allData.push(...records)
    })
    return allData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
  }

  private getAllEventsData(): AlertsAndEvents[] {
    const allData: AlertsAndEvents[] = []
    this.eventsCache.forEach(records => {
      allData.push(...records)
    })
    return allData.sort((a, b) => a.timestamp.getTime() - b.timestamp.getTime())
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