import { useEffect, useState } from 'react'
import { app } from '@microsoft/teams-js'
import QueryInterface from './components/QueryInterface'
import ErrorBoundary from './components/ErrorBoundary'
import { handleError, logError } from './utils/errorHandler'
import './App.css'

function App() {
  const [teamsInitialized, setTeamsInitialized] = useState(false)

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        await app.initialize()
        setTeamsInitialized(true)
      } catch (error) {
        const appError = handleError(error, 'App-TeamsInitialization')
        logError(appError)
        setTeamsInitialized(true)
      }
    }

    initializeTeams()
  }, [])

  if (!teamsInitialized) {
    return (
      <div className="loading">
        <div className="loading-content animate-fade-in">
          <div className="loading-spinner"></div>
          <h2>Initializing Corvus ADX</h2>
          <p>Setting up your maritime data query interface...</p>
        </div>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <div className="app-header-content">
            <div className="app-logo">
              <div className="app-logo-icon">🚢</div>
              <div className="app-header-text">
                <h1>Corvus ADX Query</h1>
                <p>Query your Azure Data Explorer database with natural language</p>
              </div>
            </div>
            <div className="app-header-actions">
              <div className="status-indicator">
                <div className="status-dot"></div>
                <span>Mock Mode Active</span>
              </div>
            </div>
          </div>
        </header>
        <main className="app-main">
          <QueryInterface />
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App