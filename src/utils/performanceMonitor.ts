export interface QueryPerformanceMetrics {
  queryId: string
  naturalQuery: string
  kqlQuery: string
  startTime: number
  endTime: number
  duration: number
  rowCount: number
  columnCount: number
  adxExecutionTime?: number
  nlProcessingTime?: number
  dataTransformTime?: number
  renderTime?: number
  success: boolean
  errorMessage?: string
  timestamp: Date
}

export interface PerformanceStats {
  totalQueries: number
  successfulQueries: number
  failedQueries: number
  averageDuration: number
  averageRowCount: number
  slowestQuery: QueryPerformanceMetrics | null
  fastestQuery: QueryPerformanceMetrics | null
  recentQueries: QueryPerformanceMetrics[]
}

class PerformanceMonitor {
  private metrics: QueryPerformanceMetrics[] = []
  private currentQuery: Partial<QueryPerformanceMetrics> | null = null
  private maxStoredMetrics = 100

  startQuery(queryId: string, naturalQuery: string, kqlQuery: string): void {
    this.currentQuery = {
      queryId,
      naturalQuery,
      kqlQuery,
      startTime: performance.now(),
      timestamp: new Date(),
      success: false
    }
  }

  recordNLProcessingTime(startTime: number): void {
    if (this.currentQuery) {
      this.currentQuery.nlProcessingTime = performance.now() - startTime
    }
  }

  recordADXExecutionTime(executionTime: number): void {
    if (this.currentQuery) {
      this.currentQuery.adxExecutionTime = executionTime
    }
  }

  recordDataTransformTime(startTime: number): void {
    if (this.currentQuery) {
      this.currentQuery.dataTransformTime = performance.now() - startTime
    }
  }

  recordRenderTime(startTime: number): void {
    if (this.currentQuery) {
      this.currentQuery.renderTime = performance.now() - startTime
    }
  }

  completeQuery(rowCount: number, columnCount: number, success: boolean = true, errorMessage?: string): void {
    if (!this.currentQuery) return

    const endTime = performance.now()
    const completedMetric: QueryPerformanceMetrics = {
      ...this.currentQuery,
      endTime,
      duration: endTime - this.currentQuery.startTime!,
      rowCount,
      columnCount,
      success,
      errorMessage,
      timestamp: this.currentQuery.timestamp!
    } as QueryPerformanceMetrics

    this.metrics.unshift(completedMetric)
    
    if (this.metrics.length > this.maxStoredMetrics) {
      this.metrics = this.metrics.slice(0, this.maxStoredMetrics)
    }

    this.saveMetricsToStorage()
    this.currentQuery = null
  }

  abortCurrentQuery(errorMessage: string): void {
    if (!this.currentQuery) return
    
    this.completeQuery(0, 0, false, errorMessage)
  }

  getStats(): PerformanceStats {
    const successfulQueries = this.metrics.filter(m => m.success)
    const failedQueries = this.metrics.filter(m => !m.success)

    const totalDuration = successfulQueries.reduce((sum, m) => sum + m.duration, 0)
    const totalRows = successfulQueries.reduce((sum, m) => sum + m.rowCount, 0)

    const sortedByDuration = [...successfulQueries].sort((a, b) => a.duration - b.duration)

    return {
      totalQueries: this.metrics.length,
      successfulQueries: successfulQueries.length,
      failedQueries: failedQueries.length,
      averageDuration: successfulQueries.length > 0 ? totalDuration / successfulQueries.length : 0,
      averageRowCount: successfulQueries.length > 0 ? totalRows / successfulQueries.length : 0,
      slowestQuery: sortedByDuration.length > 0 ? sortedByDuration[sortedByDuration.length - 1] : null,
      fastestQuery: sortedByDuration.length > 0 ? sortedByDuration[0] : null,
      recentQueries: this.metrics.slice(0, 10)
    }
  }

  getMetrics(): QueryPerformanceMetrics[] {
    return [...this.metrics]
  }

  clearMetrics(): void {
    this.metrics = []
    this.saveMetricsToStorage()
  }

  private saveMetricsToStorage(): void {
    try {
      const metricsToSave = this.metrics.slice(0, 50) // Save only most recent 50
      localStorage.setItem('corvus-performance-metrics', JSON.stringify(metricsToSave))
    } catch (error) {
      console.warn('Failed to save performance metrics:', error)
    }
  }

  loadMetricsFromStorage(): void {
    try {
      const saved = localStorage.getItem('corvus-performance-metrics')
      if (saved) {
        const parsed = JSON.parse(saved)
        this.metrics = parsed.map((m: any) => ({
          ...m,
          timestamp: new Date(m.timestamp)
        }))
      }
    } catch (error) {
      console.warn('Failed to load performance metrics:', error)
      this.metrics = []
    }
  }

  exportMetrics(): string {
    return JSON.stringify({
      exportedAt: new Date().toISOString(),
      metrics: this.metrics,
      stats: this.getStats()
    }, null, 2)
  }

  getQueryBreakdown(queryId: string): QueryPerformanceMetrics | null {
    return this.metrics.find(m => m.queryId === queryId) || null
  }

  isSlowQuery(duration: number): boolean {
    const stats = this.getStats()
    return duration > stats.averageDuration * 2 && duration > 1000 // Slower than 2x average and over 1 second
  }

  getSuggestedOptimizations(metric: QueryPerformanceMetrics): string[] {
    const suggestions: string[] = []

    if (metric.duration > 10000) {
      suggestions.push('Query is very slow (>10s). Consider optimizing your KQL query.')
    }

    if (metric.rowCount > 10000) {
      suggestions.push('Large result set. Consider adding filters or using summarization.')
    }

    if (metric.nlProcessingTime && metric.nlProcessingTime > 3000) {
      suggestions.push('Natural language processing is slow. Try using more specific terms.')
    }

    if (metric.adxExecutionTime && metric.duration && metric.adxExecutionTime < metric.duration * 0.3) {
      suggestions.push('Most time spent outside ADX. Check network connection.')
    }

    if (metric.renderTime && metric.renderTime > 1000) {
      suggestions.push('Chart rendering is slow. Try using table view for large datasets.')
    }

    return suggestions
  }
}

export const performanceMonitor = new PerformanceMonitor()

// Auto-load metrics on initialization
performanceMonitor.loadMetricsFromStorage()