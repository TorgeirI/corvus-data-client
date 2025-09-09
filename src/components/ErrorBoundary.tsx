import React, { Component, ErrorInfo, ReactNode } from 'react'
import { handleError, logError, AppError } from '../utils/errorHandler'
import './ErrorBoundary.css'

interface ErrorBoundaryState {
  hasError: boolean
  error: AppError | null
}

interface ErrorBoundaryProps {
  children: ReactNode
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    const appError = handleError(error, 'ErrorBoundary')
    logError(appError)
    
    return {
      hasError: true,
      error: appError
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('ErrorBoundary caught an error:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null })
  }

  render() {
    if (this.state.hasError && this.state.error) {
      return (
        <div className="error-boundary">
          <div className="error-boundary-card">
            <div className="error-icon">⚠️</div>
            <h2>Something went wrong</h2>
            <p className="error-message">
              {this.state.error.message}
            </p>
            
            {this.state.error.details && (
              <details className="error-details">
                <summary>Technical details</summary>
                <pre>{this.state.error.details}</pre>
              </details>
            )}
            
            <div className="error-actions">
              <button onClick={this.handleReset} className="error-button">
                Try Again
              </button>
              <button onClick={this.handleReload} className="error-button secondary">
                Reload Page
              </button>
            </div>
            
            <div className="error-meta">
              <span>Error Code: {this.state.error.code}</span>
              <span>Time: {this.state.error.timestamp.toLocaleString()}</span>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary