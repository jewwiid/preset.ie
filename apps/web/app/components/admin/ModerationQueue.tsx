'use client'

import { useState, useEffect } from 'react'
import { AlertTriangle, CheckCircle, XCircle, Eye, Clock, User, MessageSquare } from 'lucide-react'

interface ModerationItem {
  id: string
  content_type: string
  content_id: string
  content_text: string
  user_id: string
  user_name: string
  user_handle: string
  flagged_reason: string[]
  severity_score: number
  status: string
  auto_flagged_at: string
  created_at: string
  user_stats?: {
    total_flagged: number
    flagged_last_30_days: number
    resolved_violations: number
    current_risk_score: number
  }
}

interface ModerationStats {
  pending_items: number
  resolved_today: number
  average_severity: number
  resolution_time_hours: number
}

export function ModerationQueue() {
  const [items, setItems] = useState<ModerationItem[]>([])
  const [stats, setStats] = useState<ModerationStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set())
  const [filter, setFilter] = useState<'pending' | 'reviewing' | 'escalated' | 'all'>('pending')
  const [severityFilter, setSeverityFilter] = useState<number>(0)
  const [processingAction, setProcessingAction] = useState<string | null>(null)

  useEffect(() => {
    fetchModerationQueue()
  }, [filter, severityFilter])

  const fetchModerationQueue = async () => {
    try {
      const params = new URLSearchParams({
        ...(filter !== 'all' && { status: filter }),
        ...(severityFilter > 0 && { severityMin: severityFilter.toString() }),
        limit: '50'
      })
      
      const response = await fetch(`/api/admin/moderation/queue?${params}`)
      if (!response.ok) throw new Error('Failed to fetch moderation queue')
      
      const data = await response.json()
      setItems(data.items || [])
      setStats(data.stats || null)
    } catch (error) {
      console.error('Error fetching moderation queue:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleAction = async (itemId: string, action: 'approved' | 'rejected' | 'escalated') => {
    try {
      setProcessingAction(itemId)
      
      const response = await fetch('/api/admin/moderation/queue', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          items: [{
            queueId: itemId,
            status: action,
            notes: `Manual ${action} by admin`
          }]
        })
      })
      
      if (!response.ok) throw new Error('Failed to process moderation action')
      
      // Remove item from list if approved/rejected
      if (action === 'approved' || action === 'rejected') {
        setItems(prev => prev.filter(item => item.id !== itemId))
      } else {
        // Update status for escalated items
        setItems(prev => prev.map(item => 
          item.id === itemId ? { ...item, status: action } : item
        ))
      }
      
      // Update stats
      await fetchStats()
    } catch (error) {
      console.error('Error processing moderation action:', error)
      alert('Failed to process action. Please try again.')
    } finally {
      setProcessingAction(null)
    }
  }

  const handleBulkAction = async (action: 'approved' | 'rejected') => {
    if (selectedItems.size === 0) return
    
    try {
      setProcessingAction('bulk')
      
      const response = await fetch('/api/admin/moderation/bulk', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          queueIds: Array.from(selectedItems),
          action,
          notes: `Bulk ${action} by admin`
        })
      })
      
      if (!response.ok) throw new Error('Failed to process bulk action')
      
      // Remove processed items from list
      setItems(prev => prev.filter(item => !selectedItems.has(item.id)))
      setSelectedItems(new Set())
      
      // Update stats
      await fetchStats()
    } catch (error) {
      console.error('Error processing bulk action:', error)
      alert('Failed to process bulk action. Please try again.')
    } finally {
      setProcessingAction(null)
    }
  }

  const fetchStats = async () => {
    try {
      const response = await fetch('/api/admin/moderation/stats')
      if (response.ok) {
        const data = await response.json()
        setStats(data)
      }
    } catch (error) {
      console.error('Error fetching moderation stats:', error)
    }
  }

  const getSeverityColor = (score: number) => {
    if (score >= 80) return 'bg-red-100 text-red-800 border-red-200'
    if (score >= 60) return 'bg-orange-100 text-orange-800 border-orange-200'
    if (score >= 40) return 'bg-yellow-100 text-yellow-800 border-yellow-200'
    return 'bg-green-100 text-green-800 border-green-200'
  }

  const getRiskColor = (score: number) => {
    if (score >= 70) return 'text-red-600'
    if (score >= 40) return 'text-orange-600'
    return 'text-green-600'
  }

  const formatRelativeTime = (dateString: string) => {
    const date = new Date(dateString)
    const now = new Date()
    const diffMs = now.getTime() - date.getTime()
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
    const diffDays = Math.floor(diffHours / 24)
    
    if (diffDays > 0) return `${diffDays}d ago`
    if (diffHours > 0) return `${diffHours}h ago`
    return 'Just now'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <div className="text-gray-500">Loading moderation queue...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Pending Review</p>
                <p className="text-2xl font-bold text-gray-900">{stats.pending_items}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-yellow-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Resolved Today</p>
                <p className="text-2xl font-bold text-green-600">{stats.resolved_today}</p>
              </div>
              <CheckCircle className="w-8 h-8 text-green-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Severity</p>
                <p className="text-2xl font-bold text-gray-900">{stats.average_severity.toFixed(1)}</p>
              </div>
              <AlertTriangle className="w-8 h-8 text-blue-500" />
            </div>
          </div>
          <div className="bg-white rounded-lg shadow p-4">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-500">Avg Resolution</p>
                <p className="text-2xl font-bold text-gray-900">{stats.resolution_time_hours.toFixed(1)}h</p>
              </div>
              <Clock className="w-8 h-8 text-purple-500" />
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="bg-white rounded-lg shadow p-4">
        <div className="flex flex-col sm:flex-row gap-4 items-start sm:items-center justify-between">
          {/* Status Filter */}
          <div className="flex gap-2 flex-wrap">
            {(['pending', 'reviewing', 'escalated', 'all'] as const).map((status) => (
              <button
                key={status}
                onClick={() => setFilter(status)}
                className={`px-4 py-2 rounded-lg capitalize transition-colors text-sm font-medium ${
                  filter === status 
                    ? 'bg-blue-600 text-white' 
                    : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
                }`}
              >
                {status}
              </button>
            ))}
          </div>
          
          {/* Severity Filter */}
          <div className="flex items-center gap-2">
            <label className="text-sm text-gray-600">Min Severity:</label>
            <select
              value={severityFilter}
              onChange={(e) => setSeverityFilter(parseInt(e.target.value))}
              className="border border-gray-300 rounded px-2 py-1 text-sm"
            >
              <option value={0}>All</option>
              <option value={40}>Medium (40+)</option>
              <option value={60}>High (60+)</option>
              <option value={80}>Critical (80+)</option>
            </select>
          </div>
        </div>
        
        {/* Bulk Actions */}
        {selectedItems.size > 0 && (
          <div className="flex gap-2 mt-4 pt-4 border-t">
            <button
              onClick={() => handleBulkAction('approved')}
              disabled={processingAction === 'bulk'}
              className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {processingAction === 'bulk' ? 'Processing...' : `Approve Selected (${selectedItems.size})`}
            </button>
            <button
              onClick={() => handleBulkAction('rejected')}
              disabled={processingAction === 'bulk'}
              className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 transition-colors"
            >
              {processingAction === 'bulk' ? 'Processing...' : `Reject Selected (${selectedItems.size})`}
            </button>
          </div>
        )}
      </div>

      {/* Queue Items */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        {items.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <AlertTriangle className="w-12 h-12 mx-auto mb-4 opacity-50" />
            <p>No items in moderation queue</p>
            <p className="text-sm">All content is currently approved or no content matches your filters.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {/* Header */}
            <div className="px-6 py-3 bg-gray-50 flex items-center gap-4">
              <input
                type="checkbox"
                onChange={(e) => {
                  if (e.target.checked) {
                    setSelectedItems(new Set(items.map(i => i.id)))
                  } else {
                    setSelectedItems(new Set())
                  }
                }}
                checked={selectedItems.size === items.length && items.length > 0}
                className="rounded border-gray-300"
              />
              <span className="text-sm font-medium text-gray-600">
                Select All ({items.length} items)
              </span>
            </div>
            
            {/* Items */}
            {items.map((item) => (
              <div key={item.id} className="px-6 py-4 hover:bg-gray-50">
                <div className="flex items-start gap-4">
                  {/* Checkbox */}
                  <input
                    type="checkbox"
                    checked={selectedItems.has(item.id)}
                    onChange={(e) => {
                      const newSelected = new Set(selectedItems)
                      if (e.target.checked) {
                        newSelected.add(item.id)
                      } else {
                        newSelected.delete(item.id)
                      }
                      setSelectedItems(newSelected)
                    }}
                    className="rounded border-gray-300 mt-1"
                  />
                  
                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4 mb-2">
                      <div className="flex items-center gap-2">
                        <span className={`px-2 py-1 text-xs font-medium rounded border ${getSeverityColor(item.severity_score)}`}>
                          {item.severity_score}
                        </span>
                        <span className="text-sm text-gray-600 capitalize">
                          {item.content_type}
                        </span>
                        <span className="text-sm text-gray-400">•</span>
                        <span className="text-sm text-gray-500">
                          {formatRelativeTime(item.auto_flagged_at)}
                        </span>
                      </div>
                      
                      {/* User Info */}
                      <div className="flex items-center gap-2 text-sm text-gray-600">
                        <User className="w-4 h-4" />
                        <span>{item.user_name || item.user_handle}</span>
                        {item.user_stats && (
                          <span className={`text-xs ${getRiskColor(item.user_stats.current_risk_score)}`}>
                            (Risk: {item.user_stats.current_risk_score})
                          </span>
                        )}
                      </div>
                    </div>
                    
                    {/* Content Preview */}
                    <div className="bg-gray-50 rounded p-3 mb-3">
                      <p className="text-sm text-gray-900 line-clamp-3">
                        {item.content_text || 'No text content available'}
                      </p>
                    </div>
                    
                    {/* Flags */}
                    <div className="flex flex-wrap gap-1 mb-3">
                      {item.flagged_reason.map((reason) => (
                        <span key={reason} className="px-2 py-1 text-xs bg-red-100 text-red-700 rounded">
                          {reason.replace('_', ' ')}
                        </span>
                      ))}
                    </div>
                    
                    {/* Actions */}
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleAction(item.id, 'approved')}
                        disabled={processingAction === item.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-green-700 bg-green-100 hover:bg-green-200 rounded transition-colors disabled:opacity-50"
                        title="Approve content"
                      >
                        <CheckCircle className="w-4 h-4" />
                        Approve
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'rejected')}
                        disabled={processingAction === item.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-red-700 bg-red-100 hover:bg-red-200 rounded transition-colors disabled:opacity-50"
                        title="Reject and delete content"
                      >
                        <XCircle className="w-4 h-4" />
                        Reject
                      </button>
                      <button
                        onClick={() => handleAction(item.id, 'escalated')}
                        disabled={processingAction === item.id}
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-orange-700 bg-orange-100 hover:bg-orange-200 rounded transition-colors disabled:opacity-50"
                        title="Escalate for senior review"
                      >
                        <AlertTriangle className="w-4 h-4" />
                        Escalate
                      </button>
                      <button
                        className="flex items-center gap-1 px-3 py-1.5 text-sm text-gray-600 hover:bg-gray-100 rounded transition-colors"
                        title="View full content"
                      >
                        <Eye className="w-4 h-4" />
                        View
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}