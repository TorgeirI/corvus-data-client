import { useState, useEffect } from 'react'
import { performanceMonitor, QueryPerformanceMetrics, PerformanceStats } from '../utils/performanceMonitor'
import './PerformanceDashboard.css'

interface PerformanceDashboardProps {
  isOpen: boolean
  onClose: () => void
}

const PerformanceDashboard = ({ isOpen, onClose }: PerformanceDashboardProps) => {
  const [stats, setStats] = useState<PerformanceStats | null>(null)
  const [selectedQuery, setSelectedQuery] = useState<QueryPerformanceMetrics | null>(null)
  const [viewMode, setViewMode] = useState<'overview' | 'details' | 'export'>('overview')

  useEffect(() => {
    if (isOpen) {
      loadStats()
    }
  }, [isOpen])

  const loadStats = () => {
    const currentStats = performanceMonitor.getStats()
    setStats(currentStats)
  }

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${Math.round(ms)}ms`
    return `${(ms / 1000).toFixed(2)}s`
  }

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B'
    const sizes = ['B', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(1024))
    return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${sizes[i]}`
  }

  const getPerformanceColor = (duration: number, average: number): string => {
    if (duration < average * 0.5) return '#10b981' // Fast - green
    if (duration < average) return '#f59e0b' // Average - yellow
    if (duration < average * 2) return '#f97316' // Slow - orange
    return '#ef4444' // Very slow - red
  }

  const handleExportMetrics = () => {
    try {
      const exportData = performanceMonitor.exportMetrics()
      const blob = new Blob([exportData], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      
      const link = document.createElement('a')
      link.href = url
      link.download = `corvus-performance-metrics-${new Date().toISOString().split('T')[0]}.json`
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('Failed to export metrics:', error)
    }
  }

  const clearAllMetrics = () => {
    if (confirm('Are you sure you want to clear all performance metrics? This cannot be undone.')) {
      performanceMonitor.clearMetrics()
      loadStats()
      setSelectedQuery(null)
    }
  }

  if (!isOpen || !stats) return null

  return (
    <div className="performance-overlay">
      <div className="performance-dashboard">
        <div className="performance-header">
          <h2>Performance Dashboard</h2>
          <div className="header-controls">
            <div className="view-tabs">
              <button 
                className={`tab-button ${viewMode === 'overview' ? 'active' : ''}`}
                onClick={() => setViewMode('overview')}
              >
                Overview
              </button>
              <button 
                className={`tab-button ${viewMode === 'details' ? 'active' : ''}`}
                onClick={() => setViewMode('details')}
              >
                Query Details
              </button>
              <button 
                className={`tab-button ${viewMode === 'export' ? 'active' : ''}`}
                onClick={() => setViewMode('export')}
              >
                Export
              </button>
            </div>
            <button className="close-button" onClick={onClose}>✕</button>
          </div>
        </div>

        <div className="performance-content">
          {viewMode === 'overview' && (
            <div className="overview-section">
              <div className="stats-grid">
                <div className="stat-card">
                  <div className="stat-value">{stats.totalQueries}</div>
                  <div className="stat-label">Total Queries</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.successfulQueries}</div>
                  <div className="stat-label">Successful</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{stats.failedQueries}</div>
                  <div className="stat-label">Failed</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{formatDuration(stats.averageDuration)}</div>
                  <div className="stat-label">Avg Duration</div>
                </div>
                <div className="stat-card">
                  <div className="stat-value">{Math.round(stats.averageRowCount)}</div>
                  <div className="stat-label">Avg Rows</div>
                </div>
                <div className="stat-card success-rate">
                  <div className="stat-value">
                    {stats.totalQueries > 0 ? 
                      `${Math.round((stats.successfulQueries / stats.totalQueries) * 100)}%` : 
                      'N/A'
                    }
                  </div>
                  <div className="stat-label">Success Rate</div>
                </div>
              </div>

              <div className="performance-highlights">
                <div className="highlight-section">
                  <h3>Performance Highlights</h3>
                  <div className="highlight-grid">
                    {stats.fastestQuery && (
                      <div className="highlight-card fastest">
                        <div className="highlight-title">Fastest Query</div>
                        <div className="highlight-value">{formatDuration(stats.fastestQuery.duration)}</div>
                        <div className="highlight-details">{stats.fastestQuery.naturalQuery}</div>
                      </div>
                    )}
                    {stats.slowestQuery && (
                      <div className="highlight-card slowest">
                        <div className="highlight-title">Slowest Query</div>
                        <div className="highlight-value">{formatDuration(stats.slowestQuery.duration)}</div>
                        <div className="highlight-details">{stats.slowestQuery.naturalQuery}</div>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="recent-queries">
                <h3>Recent Queries</h3>
                <div className="queries-list">
                  {stats.recentQueries.map((query) => (
                    <div key={query.queryId} className="query-item">
                      <div className="query-info">
                        <div className="query-text">{query.naturalQuery}</div>
                        <div className="query-meta">
                          <span className="query-time">{query.timestamp.toLocaleTimeString()}</span>
                          <span 
                            className="query-duration" 
                            style={{ color: getPerformanceColor(query.duration, stats.averageDuration) }}
                          >
                            {formatDuration(query.duration)}
                          </span>
                          <span className="query-rows">{query.rowCount} rows</span>
                          <span className={`query-status ${query.success ? 'success' : 'error'}`}>
                            {query.success ? '✓' : '✗'}
                          </span>
                        </div>
                      </div>
                      <button 
                        className="details-button"
                        onClick={() => {
                          setSelectedQuery(query)
                          setViewMode('details')
                        }}
                      >
                        Details
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {viewMode === 'details' && (
            <div className="details-section">
              {selectedQuery ? (
                <div className="query-details">
                  <div className="details-header">
                    <h3>Query Performance Breakdown</h3>
                    <button onClick={() => setSelectedQuery(null)}>← Back to List</button>
                  </div>

                  <div className="details-grid">
                    <div className="detail-card">
                      <div className="detail-label">Natural Language Query</div>
                      <div className="detail-value">{selectedQuery.naturalQuery}</div>
                    </div>
                    <div className="detail-card">
                      <div className="detail-label">Generated KQL</div>
                      <pre className="detail-kql">{selectedQuery.kqlQuery}</pre>
                    </div>
                  </div>

                  <div className="timing-breakdown">
                    <h4>Timing Breakdown</h4>
                    <div className="timing-chart">
                      {selectedQuery.nlProcessingTime && (
                        <div className="timing-bar">
                          <span className="timing-label">NL Processing</span>
                          <span className="timing-value">{formatDuration(selectedQuery.nlProcessingTime)}</span>
                        </div>
                      )}
                      {selectedQuery.adxExecutionTime && (
                        <div className="timing-bar">
                          <span className="timing-label">ADX Execution</span>
                          <span className="timing-value">{formatDuration(selectedQuery.adxExecutionTime)}</span>
                        </div>
                      )}
                      {selectedQuery.dataTransformTime && (
                        <div className="timing-bar">
                          <span className="timing-label">Data Transform</span>
                          <span className="timing-value">{formatDuration(selectedQuery.dataTransformTime)}</span>
                        </div>
                      )}
                      {selectedQuery.renderTime && (
                        <div className="timing-bar">
                          <span className="timing-label">Chart Rendering</span>
                          <span className="timing-value">{formatDuration(selectedQuery.renderTime)}</span>
                        </div>
                      )}
                      <div className="timing-bar total">
                        <span className="timing-label">Total Duration</span>
                        <span className="timing-value">{formatDuration(selectedQuery.duration)}</span>
                      </div>
                    </div>
                  </div>

                  {selectedQuery.success && (
                    <div className="performance-suggestions">
                      <h4>Performance Suggestions</h4>
                      <div className="suggestions-list">
                        {performanceMonitor.getSuggestedOptimizations(selectedQuery).map((suggestion, index) => (
                          <div key={index} className="suggestion-item">
                            💡 {suggestion}
                          </div>
                        ))}
                        {performanceMonitor.getSuggestedOptimizations(selectedQuery).length === 0 && (
                          <div className="suggestion-item good">
                            ✨ Query performance looks good! No specific optimizations needed.
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {!selectedQuery.success && selectedQuery.errorMessage && (
                    <div className="error-details">
                      <h4>Error Details</h4>
                      <div className="error-message">{selectedQuery.errorMessage}</div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="no-selection">
                  <p>Select a query from the overview to see detailed performance breakdown.</p>
                  <button onClick={() => setViewMode('overview')}>Go to Overview</button>
                </div>
              )}
            </div>
          )}

          {viewMode === 'export' && (
            <div className="export-section">
              <h3>Export Performance Data</h3>
              <p>Export performance metrics for analysis or sharing with your team.</p>
              
              <div className="export-actions">
                <button className="export-button" onClick={handleExportMetrics}>
                  📥 Export Metrics as JSON
                </button>
                <button className="clear-button" onClick={clearAllMetrics}>
                  🗑️ Clear All Metrics
                </button>
              </div>

              <div className="export-info">
                <h4>What's Included</h4>
                <ul>
                  <li>Query execution times and breakdowns</li>
                  <li>Success/failure rates</li>
                  <li>Row counts and data sizes</li>
                  <li>Performance suggestions</li>
                  <li>Timestamps and query details</li>
                </ul>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default PerformanceDashboard