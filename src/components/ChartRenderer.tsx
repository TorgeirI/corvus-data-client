import { useState, useMemo } from 'react'
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  TimeScale,
} from 'chart.js'
import { Bar, Line, Pie, Doughnut } from 'react-chartjs-2'
import { transformDataForVisualization, detectChartType } from '../utils/dataTransformer'
import { exportData, getExportSummary, validateExportData, ExportFormat } from '../utils/dataExporter'
import './ChartRenderer.css'

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  LineElement,
  PointElement,
  ArcElement,
  TimeScale
)

interface ChartRendererProps {
  data: any[]
  columns: string[]
  suggestedTypes?: string[]
}

type ChartType = 'table' | 'bar' | 'line' | 'pie' | 'doughnut'

const ChartRenderer = ({ data, columns, suggestedTypes = [] }: ChartRendererProps) => {
  const [selectedChartType, setSelectedChartType] = useState<ChartType>('table')
  const [showExportMenu, setShowExportMenu] = useState(false)

  const availableChartTypes = useMemo(() => {
    const detectedType = detectChartType(data, columns)
    const types: ChartType[] = ['table']
    
    if (data.length > 0) {
      types.push('bar', 'line')
      
      if (data.length <= 20) {
        types.push('pie', 'doughnut')
      }
    }
    
    return { types, recommended: detectedType }
  }, [data, columns])

  const chartData = useMemo(() => {
    if (selectedChartType === 'table') {
      return null
    }
    
    return transformDataForVisualization(data, columns, selectedChartType)
  }, [data, columns, selectedChartType])

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top' as const,
      },
      title: {
        display: true,
        text: `Data Visualization (${selectedChartType})`,
      },
    },
    scales: selectedChartType === 'pie' || selectedChartType === 'doughnut' ? undefined : {
      y: {
        beginAtZero: true,
      },
    },
  }

  const handleExport = (format: ExportFormat) => {
    const validation = validateExportData(data, columns)
    if (!validation.valid) {
      alert(`Export failed: ${validation.error}`)
      return
    }

    try {
      const timestamp = new Date().toISOString().split('T')[0]
      const filename = `adx-query-results-${timestamp}`
      
      exportData(data, columns, {
        format,
        filename,
        includeHeaders: true
      })
      
      setShowExportMenu(false)
    } catch (error) {
      console.error('Export failed:', error)
      alert('Export failed. Please try again.')
    }
  }

  const renderChart = () => {
    if (!chartData) return null

    switch (selectedChartType) {
      case 'bar':
        return <Bar data={chartData} options={chartOptions} />
      case 'line':
        return <Line data={chartData} options={chartOptions} />
      case 'pie':
        return <Pie data={chartData} options={chartOptions} />
      case 'doughnut':
        return <Doughnut data={chartData} options={chartOptions} />
      default:
        return null
    }
  }

  const renderTable = () => {
    if (data.length === 0) {
      return <div className="no-data">No data to display</div>
    }

    return (
      <div className="table-container">
        <table className="data-table">
          <thead>
            <tr>
              {columns.map((column) => (
                <th key={column}>{column}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {data.slice(0, 100).map((row, index) => (
              <tr key={index}>
                {columns.map((column) => (
                  <td key={column}>
                    {row[column] !== null && row[column] !== undefined
                      ? String(row[column])
                      : '—'}
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
        {data.length > 100 && (
          <div className="table-footer">
            Showing first 100 rows of {data.length} total rows
          </div>
        )}
      </div>
    )
  }

  return (
    <div className="chart-renderer">
      <div className="chart-controls">
        <div className="chart-controls-row">
          <div className="chart-type-selector">
            <label>Visualization type:</label>
            <div className="chart-type-buttons">
              {availableChartTypes.types.map((type) => (
                <button
                  key={type}
                  className={`chart-type-button ${
                    selectedChartType === type ? 'active' : ''
                  } ${
                    availableChartTypes.recommended === type ? 'recommended' : ''
                  }`}
                  onClick={() => setSelectedChartType(type)}
                >
                  {type.charAt(0).toUpperCase() + type.slice(1)}
                  {availableChartTypes.recommended === type && (
                    <span className="recommended-badge">Recommended</span>
                  )}
                </button>
              ))}
            </div>
          </div>

          <div className="export-controls">
            <div className="export-dropdown">
              <button 
                className="export-button"
                onClick={() => setShowExportMenu(!showExportMenu)}
                disabled={data.length === 0}
              >
                📥 Export
              </button>
              {showExportMenu && (
                <div className="export-menu">
                  <button onClick={() => handleExport('csv')} className="export-option">
                    <span className="export-format">CSV</span>
                    <span className="export-description">{getExportSummary(data, 'csv')}</span>
                  </button>
                  <button onClick={() => handleExport('json')} className="export-option">
                    <span className="export-format">JSON</span>
                    <span className="export-description">{getExportSummary(data, 'json')}</span>
                  </button>
                  <button onClick={() => handleExport('tsv')} className="export-option">
                    <span className="export-format">TSV</span>
                    <span className="export-description">{getExportSummary(data, 'tsv')}</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>

        {suggestedTypes.length > 0 && (
          <div className="ai-suggestions">
            <span className="suggestions-label">AI suggests:</span>
            <div className="suggestion-chips">
              {suggestedTypes.filter(type => availableChartTypes.types.includes(type as ChartType)).map((type) => (
                <button
                  key={type}
                  className="suggestion-chip"
                  onClick={() => setSelectedChartType(type as ChartType)}
                >
                  {type}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      <div className="chart-content">
        {selectedChartType === 'table' ? (
          renderTable()
        ) : (
          <div className="chart-container">
            {renderChart()}
          </div>
        )}
      </div>

      <div className="data-summary">
        <div className="summary-stats">
          <span className="stat">
            <strong>Rows:</strong> {data.length}
          </span>
          <span className="stat">
            <strong>Columns:</strong> {columns.length}
          </span>
          {data.length > 0 && (
            <span className="stat">
              <strong>Sample:</strong> {JSON.stringify(data[0]).substring(0, 50)}...
            </span>
          )}
        </div>
      </div>
    </div>
  )
}

export default ChartRenderer