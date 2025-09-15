import { useState, useEffect } from 'react'
import { authService } from '../services/authService'
import { adxService } from '../services/adxService'
import { nlToKqlService, KQLConversionResult } from '../services/nlToKqlService'
import { QueryResult } from '../services/adxService'
import ChartRenderer from './ChartRenderer'
import ConfigurationPanel from './ConfigurationPanel'
import SavedQueries, { SavedQuery } from './SavedQueries'
import { getScenariosByCategory } from '../utils/testScenarios'
import './QueryInterface.css'

interface QueryHistory {
  id: string
  naturalQuery: string
  kqlQuery: string
  timestamp: Date
  result?: QueryResult
}

const QueryInterface = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [isConnected, setIsConnected] = useState(false)
  const [naturalQuery, setNaturalQuery] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [currentKQL, setCurrentKQL] = useState('')
  const [queryResult, setQueryResult] = useState<QueryResult | null>(null)
  const [kqlConversion, setKQLConversion] = useState<KQLConversionResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [queryHistory, setQueryHistory] = useState<QueryHistory[]>([])
  const [suggestedQueries, setSuggestedQueries] = useState<string[]>([])
  const [showConfig, setShowConfig] = useState(false)
  const [showSavedQueries, setShowSavedQueries] = useState(false)
  const [modelInfo, setModelInfo] = useState<{ model: string | null; usingFallback: boolean }>({ model: null, usingFallback: true })

  useEffect(() => {
    initializeApp()
    loadModelInfo()
  }, [])

  const loadModelInfo = () => {
    const info = nlToKqlService.getModelInfo()
    setModelInfo(info)
  }

  const initializeApp = async () => {
    try {
      await authService.initialize()
      setIsAuthenticated(authService.isAuthenticated())

      if (authService.isAuthenticated()) {
        await connectToADX()
      }
    } catch (error) {
      console.error('Failed to initialize app:', error)
      setError('Failed to initialize application')
    }
  }

  const connectToADX = async () => {
    try {
      const clusterUrl = import.meta.env.VITE_ADX_CLUSTER_URL
      const database = import.meta.env.VITE_ADX_DATABASE_NAME

      if (!clusterUrl || !database) {
        throw new Error('ADX configuration missing')
      }

      await adxService.initialize({ clusterUrl, database })
      const connected = await adxService.testConnection()
      
      if (connected) {
        setIsConnected(true)
        await nlToKqlService.loadSchemaContext()
        
        // Use test scenario suggestions if in mock mode, otherwise use AI suggestions
        if (adxService.isMockMode()) {
          const basicScenarios = getScenariosByCategory('monitoring')
          const testSuggestions = basicScenarios.slice(0, 5).map(scenario => scenario.naturalQuery)
          setSuggestedQueries(testSuggestions)
        } else {
          const suggestions = await nlToKqlService.suggestQueries()
          setSuggestedQueries(suggestions)
        }
      } else {
        throw new Error('Failed to connect to ADX')
      }
    } catch (error) {
      console.error('ADX connection failed:', error)
      setError('Failed to connect to Azure Data Explorer')
    }
  }

  const handleLogin = async () => {
    setIsLoading(true)
    try {
      await authService.loginWithTeams()
      setIsAuthenticated(true)
      await connectToADX()
    } catch (error) {
      console.error('Login failed:', error)
      setError('Login failed')
    }
    setIsLoading(false)
  }

  const handleQuery = async () => {
    if (!naturalQuery.trim()) return

    setIsLoading(true)
    setError(null)
    setQueryResult(null)
    setKQLConversion(null)

    try {
      const conversion = await nlToKqlService.convertToKQL(naturalQuery)
      setKQLConversion(conversion)
      setCurrentKQL(conversion.kqlQuery)

      const result = await adxService.executeQuery(conversion.kqlQuery)
      setQueryResult(result)

      const historyItem: QueryHistory = {
        id: Date.now().toString(),
        naturalQuery,
        kqlQuery: conversion.kqlQuery,
        timestamp: new Date(),
        result
      }
      setQueryHistory(prev => [historyItem, ...prev.slice(0, 9)])

    } catch (error) {
      console.error('Query failed:', error)
      setError(error instanceof Error ? error.message : 'Query failed')
    }
    setIsLoading(false)
  }

  const handleSuggestedQuery = (query: string) => {
    setNaturalQuery(query)
  }

  const handleHistoryQuery = (historyItem: QueryHistory) => {
    setNaturalQuery(historyItem.naturalQuery)
    setCurrentKQL(historyItem.kqlQuery)
    setQueryResult(historyItem.result || null)
  }

  const handleSavedQuerySelect = (savedQuery: SavedQuery) => {
    setNaturalQuery(savedQuery.naturalQuery)
    setCurrentKQL(savedQuery.kqlQuery)
    setQueryResult(null)
    setKQLConversion(null)
  }

  if (!isAuthenticated) {
    return (
      <div className="auth-container">
        <div className="auth-card">
          <h2>Authentication Required</h2>
          <p>Please sign in to access Azure Data Explorer</p>
          <button 
            className="login-button" 
            onClick={handleLogin}
            disabled={isLoading}
          >
            {isLoading ? 'Signing in...' : 'Sign in with Microsoft'}
          </button>
        </div>
      </div>
    )
  }

  if (!isConnected) {
    return (
      <div className="connection-container">
        <div className="connection-card">
          <h2>Connecting to Azure Data Explorer</h2>
          <p>Establishing connection to your database...</p>
          {error && (
            <div className="error-message">
              {error}
              <button 
                onClick={() => setShowConfig(true)} 
                className="config-link-button"
              >
                Configure Connection
              </button>
            </div>
          )}
        </div>
        <ConfigurationPanel
          isOpen={showConfig}
          onClose={() => setShowConfig(false)}
          onConnectionChange={setIsConnected}
        />
      </div>
    )
  }

  return (
    <div className="query-interface">
      {adxService.isMockMode() && (
        <div className="mock-mode-banner">
          <span className="mock-indicator">🧪 TEST MODE</span>
          <span className="mock-description">Using simulated vessel battery data for demonstration</span>
        </div>
      )}
      
      {/* AI Model Indicator */}
      <div className={`ai-model-indicator ${modelInfo.usingFallback ? 'fallback' : 'ai-powered'}`}>
        <div className="model-status">
          {modelInfo.usingFallback ? (
            <>
              <span className="model-icon">⚠️</span>
              <span className="model-info">
                <strong>Pattern-Based Generator</strong>
                <span className="model-detail">Using fallback KQL generation</span>
              </span>
            </>
          ) : (
            <>
              <span className="model-icon">🤖</span>
              <span className="model-info">
                <strong>AI-Powered</strong>
                <span className="model-detail">Using {modelInfo.model}</span>
              </span>
            </>
          )}
        </div>
        {modelInfo.usingFallback && (
          <button 
            className="config-ai-button"
            onClick={() => setShowConfig(true)}
            title="Configure OpenAI API key"
          >
            🔧 Configure AI
          </button>
        )}
      </div>
      
      <div className="query-section">
        <div className="query-header">
          <label htmlFor="natural-query">Ask a question about your data:</label>
          <div className="header-buttons">
            <button 
              className="header-button" 
              onClick={() => setShowSavedQueries(true)}
              title="Saved Queries"
            >
              📚
            </button>
            <button 
              className="header-button" 
              onClick={() => setShowConfig(true)}
              title="Configure ADX Connection"
            >
              ⚙️
            </button>
          </div>
        </div>
        <div className="query-input-container">
          <textarea
            id="natural-query"
            value={naturalQuery}
            onChange={(e) => setNaturalQuery(e.target.value)}
            placeholder="e.g., Show me the top 10 users by activity in the last 7 days"
            rows={3}
            className="query-input"
          />
          <button 
            onClick={handleQuery}
            disabled={isLoading || !naturalQuery.trim()}
            className="query-button"
          >
            {isLoading ? 'Processing...' : 'Run Query'}
          </button>
        </div>

        {suggestedQueries.length > 0 && (
          <div className="suggested-queries">
            <h3>Suggested queries:</h3>
            <div className="query-suggestions">
              {suggestedQueries.map((query, index) => (
                <button
                  key={index}
                  onClick={() => handleSuggestedQuery(query)}
                  className="suggestion-button"
                >
                  {query}
                </button>
              ))}
            </div>
          </div>
        )}
      </div>

      {error && (
        <div className="error-message">
          <strong>Error:</strong> {error}
        </div>
      )}

      {kqlConversion && (
        <div className="kql-conversion">
          <h3>Generated KQL Query:</h3>
          <pre className="kql-query">{currentKQL}</pre>
          <p className="query-explanation">{kqlConversion.explanation}</p>
          <div className="confidence-indicator">
            <span>Confidence: {Math.round(kqlConversion.confidence * 100)}%</span>
            <span className="generation-method">
              {modelInfo.usingFallback ? '⚠️ Pattern-based' : '🤖 AI-generated'}
            </span>
          </div>
        </div>
      )}

      {queryResult && (
        <div className="results-section">
          <div className="results-header">
            <h3>Results</h3>
            <div className="results-meta">
              {queryResult.rowCount} rows • {queryResult.executionTime}ms
            </div>
          </div>
          
          <ChartRenderer 
            data={queryResult.data} 
            columns={queryResult.columns}
            suggestedTypes={kqlConversion?.suggestedVisualizations || ['table']}
          />
        </div>
      )}

      {queryHistory.length > 0 && (
        <div className="history-section">
          <h3>Query History</h3>
          <div className="history-list">
            {queryHistory.map((item) => (
              <div key={item.id} className="history-item">
                <div className="history-query" onClick={() => handleHistoryQuery(item)}>
                  <div className="history-natural">{item.naturalQuery}</div>
                  <div className="history-timestamp">
                    {item.timestamp.toLocaleString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <ConfigurationPanel
        isOpen={showConfig}
        onClose={() => setShowConfig(false)}
        onConnectionChange={setIsConnected}
      />

      <SavedQueries
        isOpen={showSavedQueries}
        onClose={() => setShowSavedQueries(false)}
        onQuerySelect={handleSavedQuerySelect}
        currentQuery={kqlConversion ? {
          naturalQuery,
          kqlQuery: kqlConversion.kqlQuery
        } : undefined}
      />
    </div>
  )
}

export default QueryInterface