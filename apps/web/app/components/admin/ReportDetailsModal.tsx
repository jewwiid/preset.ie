'use client'

import { useState, useEffect } from 'react'
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { AlertCircle, Ban, Clock, Shield, Trash2, User, AlertTriangle } from 'lucide-react'
import { toast } from 'react-hot-toast'

interface ReportDetailsModalProps {
  reportId: string
  isOpen: boolean
  onClose: () => void
}

export function ReportDetailsModal({ reportId, isOpen, onClose }: ReportDetailsModalProps) {
  const [report, setReport] = useState<any>(null)
  const [loading, setLoading] = useState(true)
  const [resolving, setResolving] = useState(false)
  const [resolution, setResolution] = useState({
    action: '',
    notes: '',
    duration: 24
  })

  const supabase = createClientComponentClient()

  useEffect(() => {
    if (reportId) {
      fetchReportDetails()
    }
  }, [reportId])

  const fetchReportDetails = async () => {
    setLoading(true)
    try {
      const response = await fetch(`/api/admin/reports/${reportId}`)
      const data = await response.json()

      if (response.ok) {
        setReport(data.report)
      }
    } catch (error) {
      console.error('Error fetching report details:', error)
      toast.error('Failed to load report details')
    } finally {
      setLoading(false)
    }
  }

  const handleResolve = async () => {
    if (!resolution.action) {
      toast.error('Please select a resolution action')
      return
    }

    setResolving(true)
    try {
      const response = await fetch(`/api/admin/reports/${reportId}/resolve`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          resolution_action: resolution.action,
          resolution_notes: resolution.notes,
          duration_hours: resolution.action === 'user_suspended' ? resolution.duration : null
        })
      })

      if (response.ok) {
        toast.success('Report resolved successfully')
        onClose()
      } else {
        const error = await response.json()
        toast.error(error.error || 'Failed to resolve report')
      }
    } catch (error) {
      console.error('Error resolving report:', error)
      toast.error('Failed to resolve report')
    } finally {
      setResolving(false)
    }
  }

  const getActionIcon = (action: string) => {
    switch (action) {
      case 'warning': return <AlertTriangle className="h-4 w-4" />
      case 'content_removed': return <Trash2 className="h-4 w-4" />
      case 'user_suspended': return <Clock className="h-4 w-4" />
      case 'user_banned': return <Ban className="h-4 w-4" />
      default: return <Shield className="h-4 w-4" />
    }
  }

  if (loading) {
    return (
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-3xl">
          <div className="flex items-center justify-center py-8">
            Loading report details...
          </div>
        </DialogContent>
      </Dialog>
    )
  }

  if (!report) return null

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <AlertCircle className="h-5 w-5 text-red-500" />
            Report #{report.id.slice(0, 8)}
          </DialogTitle>
          <DialogDescription>
            Review the report details and take appropriate action
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Report Overview */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label className="text-sm text-gray-500">Status</Label>
              <Badge className="mt-1">{report.status}</Badge>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Priority</Label>
              <Badge className="mt-1" variant={report.priority === 'critical' ? 'destructive' : 'default'}>
                {report.priority}
              </Badge>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Reported</Label>
              <div className="mt-1">{new Date(report.created_at).toLocaleString()}</div>
            </div>
            <div>
              <Label className="text-sm text-gray-500">Reason</Label>
              <Badge className="mt-1" variant="outline">{report.reason}</Badge>
            </div>
          </div>

          {/* Users Involved */}
          <div className="space-y-3">
            <Label>Users Involved</Label>
            <div className="grid grid-cols-2 gap-4">
              <div className="p-3 border rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm font-medium">Reporter</span>
                </div>
                <div className="text-sm">{report.reporter_name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">@{report.reporter_handle}</div>
              </div>
              <div className="p-3 border rounded-lg bg-red-50">
                <div className="flex items-center gap-2 mb-2">
                  <User className="h-4 w-4 text-red-500" />
                  <span className="text-sm font-medium">Reported User</span>
                </div>
                <div className="text-sm">{report.reported_name || 'Unknown'}</div>
                <div className="text-xs text-gray-500">@{report.reported_handle}</div>
                {report.reported_user_violations > 0 && (
                  <Badge className="mt-2 bg-red-100 text-red-800">
                    {report.reported_user_violations} violations
                  </Badge>
                )}
                {report.reported_user_risk_score > 50 && (
                  <Badge className="mt-1 ml-1 bg-orange-100 text-orange-800">
                    Risk: {report.reported_user_risk_score}%
                  </Badge>
                )}
              </div>
            </div>
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label>Description</Label>
            <div className="p-3 bg-gray-50 rounded-lg text-sm">
              {report.description || 'No description provided'}
            </div>
          </div>

          {/* Evidence */}
          {report.evidence_urls && report.evidence_urls.length > 0 && (
            <div className="space-y-2">
              <Label>Evidence</Label>
              <div className="space-y-2">
                {report.evidence_urls.map((url: string, index: number) => (
                  <a
                    key={index}
                    href={url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-sm text-blue-600 hover:underline"
                  >
                    Evidence {index + 1}
                  </a>
                ))}
              </div>
            </div>
          )}

          {/* Resolution */}
          {report.status === 'pending' || report.status === 'reviewing' ? (
            <div className="space-y-4 border-t pt-4">
              <Label>Resolution Action</Label>
              <Select
                value={resolution.action}
                onValueChange={(value) => setResolution({ ...resolution, action: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select action..." />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="warning">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-4 w-4" />
                      Issue Warning
                    </div>
                  </SelectItem>
                  <SelectItem value="content_removed">
                    <div className="flex items-center gap-2">
                      <Trash2 className="h-4 w-4" />
                      Remove Content
                    </div>
                  </SelectItem>
                  <SelectItem value="user_suspended">
                    <div className="flex items-center gap-2">
                      <Clock className="h-4 w-4" />
                      Suspend User
                    </div>
                  </SelectItem>
                  <SelectItem value="user_banned">
                    <div className="flex items-center gap-2">
                      <Ban className="h-4 w-4" />
                      Ban User
                    </div>
                  </SelectItem>
                  <SelectItem value="dismissed">
                    <div className="flex items-center gap-2">
                      <Shield className="h-4 w-4" />
                      Dismiss Report
                    </div>
                  </SelectItem>
                </SelectContent>
              </Select>

              {resolution.action === 'user_suspended' && (
                <div>
                  <Label>Suspension Duration (hours)</Label>
                  <Select
                    value={resolution.duration.toString()}
                    onValueChange={(value) => setResolution({ ...resolution, duration: parseInt(value) })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="24">24 hours</SelectItem>
                      <SelectItem value="72">3 days</SelectItem>
                      <SelectItem value="168">7 days</SelectItem>
                      <SelectItem value="720">30 days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              )}

              <div>
                <Label>Resolution Notes</Label>
                <Textarea
                  placeholder="Add notes about this resolution..."
                  value={resolution.notes}
                  onChange={(e) => setResolution({ ...resolution, notes: e.target.value })}
                  rows={3}
                />
              </div>
            </div>
          ) : (
            <div className="space-y-2 border-t pt-4">
              <Label>Resolution</Label>
              <div className="p-3 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-2 mb-2">
                  {getActionIcon(report.resolution_action)}
                  <span className="font-medium capitalize">
                    {report.resolution_action?.replace('_', ' ')}
                  </span>
                </div>
                {report.resolution_notes && (
                  <div className="text-sm text-gray-600">{report.resolution_notes}</div>
                )}
                {report.resolved_at && (
                  <div className="text-xs text-gray-500 mt-2">
                    Resolved on {new Date(report.resolved_at).toLocaleString()}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
          {(report.status === 'pending' || report.status === 'reviewing') && (
            <Button 
              onClick={handleResolve} 
              disabled={resolving || !resolution.action}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {resolving ? 'Resolving...' : 'Resolve Report'}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}