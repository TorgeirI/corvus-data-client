export interface ChartData {
  labels: string[]
  datasets: {
    label: string
    data: number[]
    backgroundColor?: string | string[]
    borderColor?: string | string[]
    borderWidth?: number
  }[]
}

export type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'doughnut'

const CHART_COLORS = [
  '#FF6384',
  '#36A2EB',
  '#FFCE56',
  '#4BC0C0',
  '#9966FF',
  '#FF9F40',
  '#FF6384',
  '#C9CBCF',
  '#4BC0C0',
  '#FF9F40'
]

export function detectChartType(data: any[], columns: string[]): ChartType {
  if (data.length === 0 || columns.length === 0) {
    return 'table'
  }

  const numericColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'number')
  )
  
  const dateColumns = columns.filter(col =>
    data.some(row => {
      const value = row[col]
      return value instanceof Date || 
             (typeof value === 'string' && !isNaN(Date.parse(value)))
    })
  )

  const stringColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'string' && !dateColumns.includes(col))
  )

  if (dateColumns.length > 0 && numericColumns.length > 0) {
    return 'line'
  }

  if (stringColumns.length > 0 && numericColumns.length > 0) {
    return data.length <= 10 ? 'pie' : 'bar'
  }

  if (numericColumns.length >= 2) {
    return 'bar'
  }

  return 'table'
}

export function transformDataForVisualization(
  data: any[], 
  columns: string[], 
  chartType: ChartType
): ChartData {
  if (data.length === 0) {
    return { labels: [], datasets: [] }
  }

  const numericColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'number')
  )
  
  const stringColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'string')
  )

  const dateColumns = columns.filter(col =>
    data.some(row => {
      const value = row[col]
      return value instanceof Date || 
             (typeof value === 'string' && !isNaN(Date.parse(value)))
    })
  )

  switch (chartType) {
    case 'pie':
    case 'doughnut':
      return transformForPieChart(data, stringColumns, numericColumns)
    
    case 'line':
      return transformForLineChart(data, dateColumns, numericColumns)
    
    case 'bar':
    default:
      return transformForBarChart(data, stringColumns, numericColumns)
  }
}

function transformForPieChart(
  data: any[], 
  stringColumns: string[], 
  numericColumns: string[]
): ChartData {
  const labelColumn = stringColumns[0] || Object.keys(data[0])[0]
  const valueColumn = numericColumns[0] || Object.keys(data[0]).find(key => 
    typeof data[0][key] === 'number'
  )

  if (!labelColumn || !valueColumn) {
    return { labels: [], datasets: [] }
  }

  const aggregatedData = aggregateData(data, labelColumn, valueColumn)
  const sortedData = Object.entries(aggregatedData)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)

  return {
    labels: sortedData.map(([label]) => String(label)),
    datasets: [{
      label: valueColumn,
      data: sortedData.map(([, value]) => value as number),
      backgroundColor: CHART_COLORS.slice(0, sortedData.length),
      borderColor: CHART_COLORS.slice(0, sortedData.length),
      borderWidth: 1
    }]
  }
}

function transformForLineChart(
  data: any[], 
  dateColumns: string[], 
  numericColumns: string[]
): ChartData {
  const dateColumn = dateColumns[0]
  const valueColumns = numericColumns.slice(0, 3)

  if (!dateColumn || valueColumns.length === 0) {
    return transformForBarChart(data, [], numericColumns)
  }

  const sortedData = [...data].sort((a, b) => {
    const dateA = new Date(a[dateColumn]).getTime()
    const dateB = new Date(b[dateColumn]).getTime()
    return dateA - dateB
  })

  const labels = sortedData.map(row => {
    const date = new Date(row[dateColumn])
    return date.toLocaleDateString()
  })

  const datasets = valueColumns.map((col, index) => ({
    label: col,
    data: sortedData.map(row => row[col] || 0),
    borderColor: CHART_COLORS[index % CHART_COLORS.length],
    backgroundColor: CHART_COLORS[index % CHART_COLORS.length] + '20',
    borderWidth: 2
  }))

  return { labels, datasets }
}

function transformForBarChart(
  data: any[], 
  stringColumns: string[], 
  numericColumns: string[]
): ChartData {
  const labelColumn = stringColumns[0] || Object.keys(data[0])[0]
  const valueColumns = numericColumns.slice(0, 3)

  if (!labelColumn) {
    const firstNumericCol = numericColumns[0]
    if (!firstNumericCol) {
      return { labels: [], datasets: [] }
    }
    
    return {
      labels: data.map((_, index) => `Row ${index + 1}`),
      datasets: [{
        label: firstNumericCol,
        data: data.map(row => row[firstNumericCol] || 0),
        backgroundColor: CHART_COLORS[0],
        borderColor: CHART_COLORS[0],
        borderWidth: 1
      }]
    }
  }

  if (valueColumns.length === 0) {
    const counts = aggregateData(data, labelColumn, null)
    const sortedEntries = Object.entries(counts)
      .sort(([,a], [,b]) => (b as number) - (a as number))
      .slice(0, 20)

    return {
      labels: sortedEntries.map(([label]) => String(label)),
      datasets: [{
        label: 'Count',
        data: sortedEntries.map(([, value]) => value as number),
        backgroundColor: CHART_COLORS[0],
        borderColor: CHART_COLORS[0],
        borderWidth: 1
      }]
    }
  }

  const aggregatedData: { [key: string]: { [col: string]: number } } = {}
  
  data.forEach(row => {
    const key = String(row[labelColumn] || 'Unknown')
    if (!aggregatedData[key]) {
      aggregatedData[key] = {}
    }
    
    valueColumns.forEach(col => {
      if (!aggregatedData[key][col]) {
        aggregatedData[key][col] = 0
      }
      aggregatedData[key][col] += row[col] || 0
    })
  })

  const labels = Object.keys(aggregatedData).slice(0, 20)
  
  const datasets = valueColumns.map((col, index) => ({
    label: col,
    data: labels.map(label => aggregatedData[label][col] || 0),
    backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
    borderColor: CHART_COLORS[index % CHART_COLORS.length],
    borderWidth: 1
  }))

  return { labels, datasets }
}

function aggregateData(
  data: any[], 
  groupColumn: string, 
  valueColumn: string | null
): { [key: string]: number } {
  const result: { [key: string]: number } = {}

  data.forEach(row => {
    const key = String(row[groupColumn] || 'Unknown')
    
    if (valueColumn) {
      result[key] = (result[key] || 0) + (row[valueColumn] || 0)
    } else {
      result[key] = (result[key] || 0) + 1
    }
  })

  return result
}

export function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '—'
  }

  if (typeof value === 'number') {
    if (Number.isInteger(value)) {
      return value.toLocaleString()
    }
    return value.toLocaleString(undefined, { maximumFractionDigits: 2 })
  }

  if (value instanceof Date) {
    return value.toLocaleString()
  }

  if (typeof value === 'string') {
    if (value.length > 50) {
      return value.substring(0, 47) + '...'
    }
    if (!isNaN(Date.parse(value))) {
      return new Date(value).toLocaleString()
    }
  }

  return String(value)
}

export function analyzeDataStructure(data: any[], columns: string[]) {
  if (data.length === 0) {
    return {
      rowCount: 0,
      columnCount: 0,
      numericColumns: [],
      stringColumns: [],
      dateColumns: [],
      summary: 'No data available'
    }
  }

  const sample = data[0]
  const numericColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'number')
  )
  
  const stringColumns = columns.filter(col => 
    data.some(row => typeof row[col] === 'string')
  )

  const dateColumns = columns.filter(col =>
    data.some(row => {
      const value = row[col]
      return value instanceof Date || 
             (typeof value === 'string' && !isNaN(Date.parse(value)))
    })
  )

  return {
    rowCount: data.length,
    columnCount: columns.length,
    numericColumns,
    stringColumns,
    dateColumns,
    summary: `${data.length} rows, ${columns.length} columns (${numericColumns.length} numeric, ${stringColumns.length} text, ${dateColumns.length} dates)`
  }
}