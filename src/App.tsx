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
        <div className="loading-spinner"></div>
        <p>Initializing Teams app...</p>
      </div>
    )
  }

  return (
    <ErrorBoundary>
      <div className="app">
        <header className="app-header">
          <h1>Corvus ADX Query</h1>
          <p>Query your Azure Data Explorer database with natural language</p>
        </header>
        <main className="app-main">
          <QueryInterface />
        </main>
      </div>
    </ErrorBoundary>
  )
}

export default App