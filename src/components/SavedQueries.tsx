import { useState, useEffect } from 'react'
import './SavedQueries.css'

export interface SavedQuery {
  id: string
  name: string
  naturalQuery: string
  kqlQuery: string
  description?: string
  tags: string[]
  createdAt: Date
  lastUsed?: Date
  useCount: number
}

interface SavedQueriesProps {
  isOpen: boolean
  onClose: () => void
  onQuerySelect: (query: SavedQuery) => void
  currentQuery?: {
    naturalQuery: string
    kqlQuery: string
  }
}

const SavedQueries = ({ isOpen, onClose, onQuerySelect, currentQuery }: SavedQueriesProps) => {
  const [savedQueries, setSavedQueries] = useState<SavedQuery[]>([])
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedTag, setSelectedTag] = useState<string | null>(null)
  const [showSaveDialog, setShowSaveDialog] = useState(false)
  const [newQueryName, setNewQueryName] = useState('')
  const [newQueryDescription, setNewQueryDescription] = useState('')
  const [newQueryTags, setNewQueryTags] = useState('')

  useEffect(() => {
    if (isOpen) {
      loadSavedQueries()
    }
  }, [isOpen])

  const loadSavedQueries = () => {
    try {
      const saved = localStorage.getItem('corvus-saved-queries')
      if (saved) {
        const queries = JSON.parse(saved).map((q: any) => ({
          ...q,
          createdAt: new Date(q.createdAt),
          lastUsed: q.lastUsed ? new Date(q.lastUsed) : undefined
        }))
        setSavedQueries(queries.sort((a: SavedQuery, b: SavedQuery) => b.createdAt.getTime() - a.createdAt.getTime()))
      }
    } catch (error) {
      console.error('Failed to load saved queries:', error)
    }
  }

  const saveSavedQueries = (queries: SavedQuery[]) => {
    try {
      localStorage.setItem('corvus-saved-queries', JSON.stringify(queries))
      setSavedQueries(queries)
    } catch (error) {
      console.error('Failed to save queries:', error)
    }
  }

  const saveCurrentQuery = () => {
    if (!currentQuery || !newQueryName.trim()) return

    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name: newQueryName.trim(),
      naturalQuery: currentQuery.naturalQuery,
      kqlQuery: currentQuery.kqlQuery,
      description: newQueryDescription.trim() || undefined,
      tags: newQueryTags.split(',').map(tag => tag.trim()).filter(Boolean),
      createdAt: new Date(),
      useCount: 0
    }

    const updatedQueries = [newQuery, ...savedQueries]
    saveSavedQueries(updatedQueries)
    
    setShowSaveDialog(false)
    setNewQueryName('')
    setNewQueryDescription('')
    setNewQueryTags('')
  }

  const deleteQuery = (id: string) => {
    const updatedQueries = savedQueries.filter(q => q.id !== id)
    saveSavedQueries(updatedQueries)
  }

  const selectQuery = (query: SavedQuery) => {
    const updatedQuery = {
      ...query,
      lastUsed: new Date(),
      useCount: query.useCount + 1
    }

    const updatedQueries = savedQueries.map(q => 
      q.id === query.id ? updatedQuery : q
    )
    saveSavedQueries(updatedQueries)
    
    onQuerySelect(updatedQuery)
    onClose()
  }

  const getAllTags = () => {
    const allTags = new Set<string>()
    savedQueries.forEach(query => {
      query.tags.forEach(tag => allTags.add(tag))
    })
    return Array.from(allTags).sort()
  }

  const filteredQueries = savedQueries.filter(query => {
    const matchesSearch = !searchTerm || 
      query.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.naturalQuery.toLowerCase().includes(searchTerm.toLowerCase()) ||
      query.description?.toLowerCase().includes(searchTerm.toLowerCase())

    const matchesTag = !selectedTag || query.tags.includes(selectedTag)

    return matchesSearch && matchesTag
  })

  if (!isOpen) return null

  return (
    <div className="saved-queries-overlay">
      <div className="saved-queries-panel">
        <div className="saved-queries-header">
          <h2>Saved Queries</h2>
          <div className="header-actions">
            {currentQuery && (
              <button 
                className="save-current-button"
                onClick={() => setShowSaveDialog(true)}
              >
                💾 Save Current
              </button>
            )}
            <button className="close-button" onClick={onClose}>
              ✕
            </button>
          </div>
        </div>

        <div className="saved-queries-content">
          <div className="queries-filters">
            <div className="search-box">
              <input
                type="text"
                placeholder="Search queries..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
            </div>
            
            <div className="tag-filters">
              <button
                className={`tag-filter ${!selectedTag ? 'active' : ''}`}
                onClick={() => setSelectedTag(null)}
              >
                All
              </button>
              {getAllTags().map(tag => (
                <button
                  key={tag}
                  className={`tag-filter ${selectedTag === tag ? 'active' : ''}`}
                  onClick={() => setSelectedTag(tag)}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div className="queries-list">
            {filteredQueries.length === 0 ? (
              <div className="no-queries">
                {searchTerm || selectedTag ? 
                  'No queries match your search criteria.' : 
                  'No saved queries yet. Save your first query to get started!'}
              </div>
            ) : (
              filteredQueries.map(query => (
                <div key={query.id} className="query-item">
                  <div className="query-content" onClick={() => selectQuery(query)}>
                    <div className="query-name">{query.name}</div>
                    <div className="query-natural">{query.naturalQuery}</div>
                    {query.description && (
                      <div className="query-description">{query.description}</div>
                    )}
                    <div className="query-tags">
                      {query.tags.map(tag => (
                        <span key={tag} className="query-tag">{tag}</span>
                      ))}
                    </div>
                    <div className="query-meta">
                      <span>Created: {query.createdAt.toLocaleDateString()}</span>
                      <span>Used: {query.useCount} times</span>
                      {query.lastUsed && (
                        <span>Last: {query.lastUsed.toLocaleDateString()}</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="delete-query-button"
                    onClick={(e) => {
                      e.stopPropagation()
                      deleteQuery(query.id)
                    }}
                    title="Delete query"
                  >
                    🗑️
                  </button>
                </div>
              ))
            )}
          </div>
        </div>

        {showSaveDialog && (
          <div className="save-dialog-overlay">
            <div className="save-dialog">
              <h3>Save Query</h3>
              
              <div className="form-group">
                <label htmlFor="query-name">Query Name *</label>
                <input
                  id="query-name"
                  type="text"
                  value={newQueryName}
                  onChange={(e) => setNewQueryName(e.target.value)}
                  placeholder="e.g., Top 10 Active Users"
                  maxLength={100}
                />
              </div>

              <div className="form-group">
                <label htmlFor="query-description">Description</label>
                <textarea
                  id="query-description"
                  value={newQueryDescription}
                  onChange={(e) => setNewQueryDescription(e.target.value)}
                  placeholder="Optional description of what this query does..."
                  rows={3}
                  maxLength={500}
                />
              </div>

              <div className="form-group">
                <label htmlFor="query-tags">Tags (comma-separated)</label>
                <input
                  id="query-tags"
                  type="text"
                  value={newQueryTags}
                  onChange={(e) => setNewQueryTags(e.target.value)}
                  placeholder="e.g., users, analytics, weekly"
                />
              </div>

              <div className="dialog-actions">
                <button 
                  onClick={() => setShowSaveDialog(false)}
                  className="cancel-button"
                >
                  Cancel
                </button>
                <button 
                  onClick={saveCurrentQuery}
                  disabled={!newQueryName.trim()}
                  className="save-button"
                >
                  Save Query
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

export default SavedQueries