'use client'

import { useState, useEffect } from 'react'
import { supabase } from '../../../lib/supabase'
import { AlertTriangle, CheckCircle, XCircle, Clock, Eye, Filter } from 'lucide-react'

interface Report {
  id: string
  reporter_user_id: string
  reported_user_id?: string
  reported_content_id?: string
  report_type: string
  reason: string
  description?: string
  status: string
  priority: string
  created_at: string
  resolved_at?: string
  resolved_by?: string
  resolution_notes?: string
}

export function ReportsQueue() {
  const [reports, setReports] = useState<Report[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState<'pending' | 'reviewing' | 'resolved' | 'all'>('pending')
  const [selectedReport, setSelectedReport] = useState<Report | null>(null)

  useEffect(() => {
    fetchReports()
  }, [filter])

  const fetchReports = async () => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      let query = supabase
        .from('reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(50)

      if (filter !== 'all') {
        query = query.eq('status', filter)
      }

      const { data, error } = await query

      if (error) {
        console.error('Error fetching reports:', error)
        setReports([])
      } else {
        setReports(data || [])
      }
    } catch (error) {
      console.error('Error fetching reports:', error)
      setReports([])
    } finally {
      setLoading(false)
    }
  }

  const updateReportStatus = async (reportId: string, newStatus: string, notes?: string) => {
    try {
      if (!supabase) {
        console.error('Supabase client not available')
        return
      }
      
      const { error } = await supabase
        .from('reports')
        .update({
          status: newStatus,
          resolved_at: newStatus === 'resolved' ? new Date().toISOString() : null,
          resolution_notes: notes
        })
        .eq('id', reportId)

      if (error) throw error
      await fetchReports()
    } catch (error) {
      console.error('Error updating report:', error)
    }
  }

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="w-4 h-4 text-primary-500" />
      case 'reviewing':
        return <AlertTriangle className="w-4 h-4 text-primary-500" />
      case 'resolved':
        return <CheckCircle className="w-4 h-4 text-primary-500" />
      default:
        return <XCircle className="w-4 h-4 text-muted-foreground-500" />
    }
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'critical': return 'bg-destructive-100 text-destructive-800'
      case 'high': return 'bg-primary-100 text-primary-800'
      case 'medium': return 'bg-primary-100 text-primary-800'
      case 'low': return 'bg-primary-100 text-primary-800'
      default: return 'bg-muted-100 text-muted-foreground-800'
    }
  }

  if (loading) {
    return (
      <div className="bg-background rounded-lg shadow p-8">
        <div className="text-center text-muted-foreground-500">Loading reports...</div>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filter Tabs */}
      <div className="flex gap-2 mb-4">
        {(['pending', 'reviewing', 'resolved', 'all'] as const).map((status) => (
          <button
            key={status}
            onClick={() => setFilter(status)}
            className={`px-4 py-2 rounded-lg capitalize transition-colors ${
              filter === status 
                ? 'bg-primary-600 text-primary-foreground' 
                : 'bg-muted-200 text-muted-foreground-700 hover:bg-muted-300'
            }`}
          >
            {status}
          </button>
        ))}
      </div>

      {/* Reports Table */}
      <div className="bg-background rounded-lg shadow overflow-hidden">
        <table className="min-w-full divide-y divide-muted-primary/30">
          <thead className="bg-muted-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Priority
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Type
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Reason
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-muted-foreground-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-background divide-y divide-muted-primary/30">
            {reports.length === 0 ? (
              <tr>
                <td colSpan={6} className="px-6 py-4 text-center text-muted-foreground-500">
                  No reports found
                </td>
              </tr>
            ) : (
              reports.map((report) => (
                <tr key={report.id} className="hover:bg-muted-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      {getStatusIcon(report.status)}
                      <span className="ml-2 text-sm text-muted-foreground-900">{report.status}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${getPriorityColor(report.priority)}`}>
                      {report.priority || 'medium'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground-900">
                    {report.report_type}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground-900">
                    {report.reason}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-muted-foreground-500">
                    {new Date(report.created_at).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => setSelectedReport(report)}
                        className="text-primary-600 hover:text-primary-900"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                      {report.status === 'pending' && (
                        <button
                          onClick={() => updateReportStatus(report.id, 'reviewing')}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Review
                        </button>
                      )}
                      {report.status === 'reviewing' && (
                        <button
                          onClick={() => updateReportStatus(report.id, 'resolved', 'Action taken')}
                          className="text-primary-600 hover:text-primary-900"
                        >
                          Resolve
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Report Details Modal */}
      {selectedReport && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-background rounded-lg p-6 max-w-2xl w-full max-h-[80vh] overflow-y-auto">
            <h3 className="text-lg font-semibold mb-4">Report Details</h3>
            
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground-500">Report ID</p>
                  <p className="font-medium">{selectedReport.id}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Status</p>
                  <div className="flex items-center">
                    {getStatusIcon(selectedReport.status)}
                    <span className="ml-2">{selectedReport.status}</span>
                  </div>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Type</p>
                  <p className="font-medium">{selectedReport.report_type}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground-500">Reason</p>
                  <p className="font-medium">{selectedReport.reason}</p>
                </div>
              </div>
              
              {selectedReport.description && (
                <div>
                  <p className="text-sm text-muted-foreground-500">Description</p>
                  <p className="mt-1 text-muted-foreground-900">{selectedReport.description}</p>
                </div>
              )}
              
              <div className="flex justify-end gap-2 pt-4 border-t">
                {selectedReport.status === 'pending' && (
                  <button
                    onClick={() => {
                      updateReportStatus(selectedReport.id, 'reviewing')
                      setSelectedReport(null)
                    }}
                    className="px-4 py-2 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary-700"
                  >
                    Start Review
                  </button>
                )}
                {selectedReport.status === 'reviewing' && (
                  <>
                    <button
                      onClick={() => {
                        updateReportStatus(selectedReport.id, 'resolved', 'Dismissed')
                        setSelectedReport(null)
                      }}
                      className="px-4 py-2 bg-muted-600 text-primary-foreground rounded-lg hover:bg-muted-700"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => {
                        updateReportStatus(selectedReport.id, 'resolved', 'Action taken')
                        setSelectedReport(null)
                      }}
                      className="px-4 py-2 bg-primary-600 text-primary-foreground rounded-lg hover:bg-primary/90"
                    >
                      Take Action
                    </button>
                  </>
                )}
                <button
                  onClick={() => setSelectedReport(null)}
                  className="px-4 py-2 bg-muted-200 text-muted-foreground-800 rounded-lg hover:bg-muted-300"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}