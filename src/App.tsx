import { useEffect, useState } from 'react'
import { app, pages } from '@microsoft/teams-js'
import QueryInterface from './components/QueryInterface'
import ErrorBoundary from './components/ErrorBoundary'
import { handleError, logError } from './utils/errorHandler'
import './App.css'

interface TeamsContext {
  theme: string
  isInTeams: boolean
  user?: {
    displayName?: string
    userPrincipalName?: string
  }
}

function App() {
  const [teamsInitialized, setTeamsInitialized] = useState(false)
  const [teamsContext, setTeamsContext] = useState<TeamsContext>({
    theme: 'default',
    isInTeams: false
  })

  useEffect(() => {
    const initializeTeams = async () => {
      try {
        await app.initialize()
        
        // Get Teams context
        const context = await app.getContext()
        
        setTeamsContext({
          theme: context.app.theme || 'default',
          isInTeams: true,
          user: context.user
        })

        // Listen for theme changes
        app.registerOnThemeChangeHandler((theme: string) => {
          setTeamsContext(prev => ({ ...prev, theme }))
        })

        // Notify Teams that the app is ready
        pages.config.setValidityState(true)
        
        setTeamsInitialized(true)
        console.log('🎯 Teams initialized successfully')
      } catch (error) {
        const appError = handleError(error, 'App-TeamsInitialization')
        logError(appError)
        // Still set as initialized for browser testing
        setTeamsInitialized(true)
        console.log('🌐 Running in browser mode (not in Teams)')
      }
    }

    initializeTeams()
  }, [])

  // Apply Teams theme to document
  useEffect(() => {
    document.body.className = `teams-theme-${teamsContext.theme} ${teamsContext.isInTeams ? 'in-teams' : 'browser-mode'}`
  }, [teamsContext.theme, teamsContext.isInTeams])

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
              {teamsContext.isInTeams && (
                <div className="teams-indicator">
                  <div className="teams-icon">🎯</div>
                  <span>Teams Tab</span>
                  {teamsContext.user?.displayName && (
                    <span className="user-name">• {teamsContext.user.displayName}</span>
                  )}
                </div>
              )}
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