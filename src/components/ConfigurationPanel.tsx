import { useState, useEffect } from 'react'
import { adxService, ADXConnection } from '../services/adxService'
import { handleError, logError } from '../utils/errorHandler'
import './ConfigurationPanel.css'

interface ConfigurationPanelProps {
  isOpen: boolean
  onClose: () => void
  onConnectionChange: (connected: boolean) => void
}

interface ConnectionSettings {
  clusterUrl: string
  database: string
  customEndpoint: boolean
}

const ConfigurationPanel = ({ isOpen, onClose, onConnectionChange }: ConfigurationPanelProps) => {
  const [settings, setSettings] = useState<ConnectionSettings>({
    clusterUrl: import.meta.env.VITE_ADX_CLUSTER_URL || '',
    database: import.meta.env.VITE_ADX_DATABASE_NAME || '',
    customEndpoint: false
  })
  const [isConnecting, setIsConnecting] = useState(false)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'connected' | 'failed'>('idle')
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const [availableDatabases, setAvailableDatabases] = useState<string[]>([])

  useEffect(() => {
    if (isOpen) {
      loadCurrentSettings()
    }
  }, [isOpen])

  const loadCurrentSettings = () => {
    const current = adxService.getConnection()
    if (current) {
      setSettings({
        clusterUrl: current.clusterUrl,
        database: current.database,
        customEndpoint: true
      })
      setConnectionStatus('connected')
    }
  }

  const testConnection = async () => {
    setIsConnecting(true)
    setErrorMessage(null)
    
    try {
      const connection: ADXConnection = {
        clusterUrl: settings.clusterUrl,
        database: settings.database
      }
      
      await adxService.initialize(connection)
      const isConnected = await adxService.testConnection()
      
      if (isConnected) {
        setConnectionStatus('connected')
        onConnectionChange(true)
        
        try {
          const tables = await adxService.getTables()
          setAvailableDatabases(tables)
        } catch (error) {
          console.warn('Failed to load database tables:', error)
        }
      } else {
        throw new Error('Connection test failed')
      }
    } catch (error) {
      const appError = handleError(error, 'ConfigurationPanel')
      logError(appError)
      setConnectionStatus('failed')
      setErrorMessage(appError.message)
      onConnectionChange(false)
    }
    
    setIsConnecting(false)
  }

  const saveSettings = async () => {
    const savedSettings = {
      clusterUrl: settings.clusterUrl,
      database: settings.database,
      customEndpoint: settings.customEndpoint
    }
    
    localStorage.setItem('corvus-adx-settings', JSON.stringify(savedSettings))
    
    if (connectionStatus === 'connected') {
      onClose()
    } else {
      await testConnection()
    }
  }

  const resetToDefaults = () => {
    setSettings({
      clusterUrl: import.meta.env.VITE_ADX_CLUSTER_URL || '',
      database: import.meta.env.VITE_ADX_DATABASE_NAME || '',
      customEndpoint: false
    })
    setConnectionStatus('idle')
    setErrorMessage(null)
    setAvailableDatabases([])
  }

  const validateUrl = (url: string): boolean => {
    try {
      const urlObj = new URL(url)
      return urlObj.protocol === 'https:' && urlObj.hostname.includes('kusto')
    } catch {
      return false
    }
  }

  const isValidConfiguration = () => {
    return settings.clusterUrl.trim() !== '' && 
           settings.database.trim() !== '' &&
           validateUrl(settings.clusterUrl)
  }

  if (!isOpen) return null

  return (
    <div className="config-overlay">
      <div className="config-panel">
        <div className="config-header">
          <h2>Azure Data Explorer Configuration</h2>
          <button className="close-button" onClick={onClose} aria-label="Close">
            ✕
          </button>
        </div>

        <div className="config-content">
          <div className="config-section">
            <h3>Connection Settings</h3>
            
            <div className="form-group">
              <label htmlFor="cluster-url">Cluster URL</label>
              <input
                id="cluster-url"
                type="text"
                value={settings.clusterUrl}
                onChange={(e) => setSettings({ ...settings, clusterUrl: e.target.value })}
                placeholder="https://your-cluster.kusto.windows.net"
                className={!validateUrl(settings.clusterUrl) && settings.clusterUrl ? 'invalid' : ''}
              />
              {settings.clusterUrl && !validateUrl(settings.clusterUrl) && (
                <span className="field-error">Please enter a valid ADX cluster URL</span>
              )}
            </div>

            <div className="form-group">
              <label htmlFor="database">Database Name</label>
              <input
                id="database"
                type="text"
                value={settings.database}
                onChange={(e) => setSettings({ ...settings, database: e.target.value })}
                placeholder="your-database-name"
              />
            </div>

            <div className="checkbox-group">
              <label>
                <input
                  type="checkbox"
                  checked={settings.customEndpoint}
                  onChange={(e) => setSettings({ ...settings, customEndpoint: e.target.checked })}
                />
                <span>Use custom endpoint (override environment variables)</span>
              </label>
            </div>
          </div>

          {connectionStatus === 'connected' && availableDatabases.length > 0 && (
            <div className="config-section">
              <h3>Available Tables</h3>
              <div className="tables-list">
                {availableDatabases.slice(0, 10).map((table) => (
                  <span key={table} className="table-tag">
                    {table}
                  </span>
                ))}
                {availableDatabases.length > 10 && (
                  <span className="table-tag more">
                    +{availableDatabases.length - 10} more
                  </span>
                )}
              </div>
            </div>
          )}

          <div className="config-section">
            <h3>Connection Status</h3>
            <div className={`status-indicator ${connectionStatus}`}>
              <div className="status-icon"></div>
              <span className="status-text">
                {connectionStatus === 'idle' && 'Not tested'}
                {connectionStatus === 'connected' && 'Connected successfully'}
                {connectionStatus === 'failed' && 'Connection failed'}
              </span>
            </div>
            
            {errorMessage && (
              <div className="error-message">
                {errorMessage}
              </div>
            )}
          </div>
        </div>

        <div className="config-footer">
          <div className="button-group">
            <button
              className="test-button"
              onClick={testConnection}
              disabled={isConnecting || !isValidConfiguration()}
            >
              {isConnecting ? 'Testing...' : 'Test Connection'}
            </button>
            
            <button
              className="reset-button"
              onClick={resetToDefaults}
              disabled={isConnecting}
            >
              Reset to Defaults
            </button>
          </div>
          
          <div className="button-group">
            <button
              className="cancel-button"
              onClick={onClose}
              disabled={isConnecting}
            >
              Cancel
            </button>
            
            <button
              className="save-button"
              onClick={saveSettings}
              disabled={isConnecting || !isValidConfiguration()}
            >
              {connectionStatus === 'connected' ? 'Save & Close' : 'Save & Test'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default ConfigurationPanel