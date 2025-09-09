export interface AppError {
  code: string
  message: string
  details?: string
  timestamp: Date
  component?: string
}

export class ADXQueryError extends Error {
  code: string
  details?: string

  constructor(code: string, message: string, details?: string) {
    super(message)
    this.name = 'ADXQueryError'
    this.code = code
    this.details = details
  }
}

export class AuthenticationError extends Error {
  code: string
  
  constructor(code: string, message: string) {
    super(message)
    this.name = 'AuthenticationError'
    this.code = code
  }
}

export class NLProcessingError extends Error {
  code: string
  
  constructor(code: string, message: string) {
    super(message)
    this.name = 'NLProcessingError'
    this.code = code
  }
}

export function handleError(error: unknown, component?: string): AppError {
  console.error(`Error in ${component || 'Unknown component'}:`, error)

  if (error instanceof ADXQueryError) {
    return {
      code: error.code,
      message: error.message,
      details: error.details,
      timestamp: new Date(),
      component
    }
  }

  if (error instanceof AuthenticationError) {
    return {
      code: error.code,
      message: error.message,
      timestamp: new Date(),
      component
    }
  }

  if (error instanceof NLProcessingError) {
    return {
      code: error.code,
      message: error.message,
      timestamp: new Date(),
      component
    }
  }

  if (error instanceof Error) {
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message,
      details: error.stack,
      timestamp: new Date(),
      component
    }
  }

  return {
    code: 'UNKNOWN_ERROR',
    message: 'An unknown error occurred',
    details: String(error),
    timestamp: new Date(),
    component
  }
}

export function getErrorMessage(error: AppError): string {
  switch (error.code) {
    case 'AUTH_FAILED':
      return 'Authentication failed. Please sign in again.'
    
    case 'ADX_CONNECTION_FAILED':
      return 'Could not connect to Azure Data Explorer. Please check your configuration.'
    
    case 'QUERY_EXECUTION_FAILED':
      return 'Query execution failed. Please check your query syntax.'
    
    case 'NL_CONVERSION_FAILED':
      return 'Could not convert your natural language query. Please try rephrasing.'
    
    case 'INVALID_CONFIGURATION':
      return 'Application configuration is invalid. Please check your environment variables.'
    
    case 'NETWORK_ERROR':
      return 'Network error occurred. Please check your internet connection.'
    
    case 'RATE_LIMIT_EXCEEDED':
      return 'API rate limit exceeded. Please wait a moment before trying again.'
    
    default:
      return error.message || 'An unexpected error occurred'
  }
}

export function isRetryableError(error: AppError): boolean {
  const retryableCodes = [
    'NETWORK_ERROR',
    'TIMEOUT',
    'RATE_LIMIT_EXCEEDED',
    'TEMPORARY_SERVICE_UNAVAILABLE'
  ]
  
  return retryableCodes.includes(error.code)
}

export async function withRetry<T>(
  operation: () => Promise<T>,
  maxRetries: number = 3,
  delayMs: number = 1000
): Promise<T> {
  let lastError: AppError | null = null
  
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation()
    } catch (error) {
      lastError = handleError(error)
      
      if (attempt === maxRetries || !isRetryableError(lastError)) {
        throw lastError
      }
      
      await new Promise(resolve => setTimeout(resolve, delayMs * attempt))
    }
  }
  
  throw lastError
}

export function logError(error: AppError): void {
  console.error('Application Error:', {
    code: error.code,
    message: error.message,
    component: error.component,
    timestamp: error.timestamp,
    details: error.details
  })
  
  if (typeof window !== 'undefined' && window.localStorage) {
    try {
      const errorLog = JSON.parse(localStorage.getItem('corvus-error-log') || '[]')
      errorLog.push(error)
      
      const maxLogEntries = 50
      if (errorLog.length > maxLogEntries) {
        errorLog.splice(0, errorLog.length - maxLogEntries)
      }
      
      localStorage.setItem('corvus-error-log', JSON.stringify(errorLog))
    } catch (storageError) {
      console.warn('Failed to log error to localStorage:', storageError)
    }
  }
}

export function getErrorLog(): AppError[] {
  if (typeof window === 'undefined' || !window.localStorage) {
    return []
  }
  
  try {
    return JSON.parse(localStorage.getItem('corvus-error-log') || '[]')
  } catch {
    return []
  }
}

export function clearErrorLog(): void {
  if (typeof window !== 'undefined' && window.localStorage) {
    localStorage.removeItem('corvus-error-log')
  }
}