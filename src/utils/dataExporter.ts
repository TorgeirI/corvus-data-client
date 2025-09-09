export type ExportFormat = 'csv' | 'json' | 'tsv'

export interface ExportOptions {
  filename?: string
  format: ExportFormat
  includeHeaders?: boolean
}

export function exportData(data: any[], columns: string[], options: ExportOptions): void {
  const { format, filename = 'query-results', includeHeaders = true } = options

  let content: string
  let mimeType: string
  let fileExtension: string

  switch (format) {
    case 'csv':
      content = exportToCSV(data, columns, includeHeaders)
      mimeType = 'text/csv'
      fileExtension = 'csv'
      break
    case 'tsv':
      content = exportToTSV(data, columns, includeHeaders)
      mimeType = 'text/tab-separated-values'
      fileExtension = 'tsv'
      break
    case 'json':
      content = exportToJSON(data)
      mimeType = 'application/json'
      fileExtension = 'json'
      break
    default:
      throw new Error(`Unsupported export format: ${format}`)
  }

  downloadFile(content, `${filename}.${fileExtension}`, mimeType)
}

function exportToCSV(data: any[], columns: string[], includeHeaders: boolean): string {
  const rows: string[] = []

  if (includeHeaders && columns.length > 0) {
    rows.push(columns.map(col => escapeCSVField(col)).join(','))
  }

  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col]
      return escapeCSVField(formatValueForExport(value))
    })
    rows.push(values.join(','))
  })

  return rows.join('\n')
}

function exportToTSV(data: any[], columns: string[], includeHeaders: boolean): string {
  const rows: string[] = []

  if (includeHeaders && columns.length > 0) {
    rows.push(columns.map(col => escapeTSVField(col)).join('\t'))
  }

  data.forEach(row => {
    const values = columns.map(col => {
      const value = row[col]
      return escapeTSVField(formatValueForExport(value))
    })
    rows.push(values.join('\t'))
  })

  return rows.join('\n')
}

function exportToJSON(data: any[]): string {
  return JSON.stringify(data, null, 2)
}

function escapeCSVField(field: string): string {
  if (field == null) return ''
  
  const stringField = String(field)
  
  if (stringField.includes(',') || stringField.includes('"') || stringField.includes('\n') || stringField.includes('\r')) {
    return `"${stringField.replace(/"/g, '""')}"`
  }
  
  return stringField
}

function escapeTSVField(field: string): string {
  if (field == null) return ''
  
  return String(field)
    .replace(/\t/g, '\\t')
    .replace(/\n/g, '\\n')
    .replace(/\r/g, '\\r')
}

function formatValueForExport(value: any): string {
  if (value === null || value === undefined) {
    return ''
  }

  if (value instanceof Date) {
    return value.toISOString()
  }

  if (typeof value === 'object') {
    return JSON.stringify(value)
  }

  return String(value)
}

function downloadFile(content: string, filename: string, mimeType: string): void {
  const blob = new Blob([content], { type: mimeType })
  const url = window.URL.createObjectURL(blob)

  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.style.display = 'none'

  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)

  window.URL.revokeObjectURL(url)
}

export function getExportSummary(data: any[], format: ExportFormat): string {
  const rowCount = data.length
  const sizeEstimate = estimateFileSize(data, format)

  return `Export ${rowCount} rows as ${format.toUpperCase()} (≈${formatFileSize(sizeEstimate)})`
}

function estimateFileSize(data: any[], format: ExportFormat): number {
  if (data.length === 0) return 0

  const sampleSize = Math.min(10, data.length)
  const sample = data.slice(0, sampleSize)
  
  let sampleContent: string
  const columns = Object.keys(sample[0] || {})

  switch (format) {
    case 'csv':
      sampleContent = exportToCSV(sample, columns, true)
      break
    case 'tsv':
      sampleContent = exportToTSV(sample, columns, true)
      break
    case 'json':
      sampleContent = exportToJSON(sample)
      break
    default:
      return 0
  }

  const avgRowSize = sampleContent.length / sampleSize
  return Math.round(avgRowSize * data.length)
}

function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B'

  const sizes = ['B', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(1024))
  const size = bytes / Math.pow(1024, i)

  return `${size.toFixed(1)} ${sizes[i]}`
}

export function validateExportData(data: any[], columns: string[]): { valid: boolean; error?: string } {
  if (!Array.isArray(data)) {
    return { valid: false, error: 'Data must be an array' }
  }

  if (data.length === 0) {
    return { valid: false, error: 'No data to export' }
  }

  if (!Array.isArray(columns) || columns.length === 0) {
    return { valid: false, error: 'No columns specified' }
  }

  const maxRows = 100000
  if (data.length > maxRows) {
    return { valid: false, error: `Too many rows to export (max: ${maxRows})` }
  }

  return { valid: true }
}