'use client'

import { useState, useEffect } from 'react'
import { CheckCircle, XCircle, Clock, Eye, User, Calendar, MessageSquare, Star } from 'lucide-react'
import { Button } from '../../../components/ui/button'
import { Badge } from '../../../components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Textarea } from '../../../components/ui/textarea'
import { Label } from '../../../components/ui/label'

interface FeaturedPresetRequest {
  id: string
  preset_id: string
  requester_id: string
  status: 'pending' | 'approved' | 'rejected'
  requested_at: string
  reviewed_by?: string
  reviewed_at?: string
  admin_notes?: string
  presets: {
    id: string
    name: string
    description: string
    category: string
    prompt_template: string
    is_public: boolean
    is_featured: boolean
    created_at: string
    user_id: string
  }
  requester: {
    id: string
    email: string
    raw_user_meta_data: {
      full_name?: string
      avatar_url?: string
    }
  }
}

export function FeaturedPresetsQueue() {
  const [requests, setRequests] = useState<FeaturedPresetRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState<string | null>(null)
  const [adminNotes, setAdminNotes] = useState<{ [key: string]: string }>({})

  useEffect(() => {
    fetchFeaturedRequests()
  }, [])

  const fetchFeaturedRequests = async () => {
    try {
      const response = await fetch('/api/admin/featured-requests')
      if (response.ok) {
        const data = await response.json()
        setRequests(data.requests || [])
      } else {
        console.error('Failed to fetch featured requests')
      }
    } catch (error) {
      console.error('Error fetching featured requests:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleApproval = async (requestId: string, status: 'approved' | 'rejected') => {
    setProcessing(requestId)
    try {
      const response = await fetch('/api/admin/featured-requests', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          request_id: requestId,
          status,
          admin_notes: adminNotes[requestId] || '',
          reviewed_by: 'admin' // In a real app, this would be the actual admin user ID
        })
      })

      if (response.ok) {
        // Remove the processed request from the list
        setRequests(prev => prev.filter(req => req.id !== requestId))
        setAdminNotes(prev => {
          const newNotes = { ...prev }
          delete newNotes[requestId]
          return newNotes
        })
      } else {
        const errorData = await response.json()
        alert(`Failed to ${status} request: ${errorData.error}`)
      }
    } catch (error) {
      console.error(`Error ${status} request:`, error)
      alert(`Failed to ${status} request`)
    } finally {
      setProcessing(null)
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const getCategoryIcon = (category: string) => {
    const icons: { [key: string]: string } = {
      'headshot': '📷',
      'product_photography': '📦',
      'ecommerce': '🛒',
      'corporate_portrait': '👔',
      'linkedin_photo': '💼',
      'professional_portrait': '👤',
      'business_headshot': '📸',
      'product_catalog': '📋',
      'product_lifestyle': '🏠',
      'product_studio': '🎬',
      'photography': '📸',
      'cinematic': '🎬',
      'artistic': '🎨',
      'portrait': '👤',
      'landscape': '🏞️',
      'commercial': '💼',
      'abstract': '🌀',
      'custom': '⚙️'
    }
    return icons[category] || '📸'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <div className="text-gray-500">Loading featured preset requests...</div>
      </div>
    )
  }

  if (requests.length === 0) {
    return (
      <div className="text-center py-8">
        <Star className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">No Featured Requests</h3>
        <p className="text-gray-500">There are no pending featured preset requests to review.</p>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Featured Preset Requests</h2>
          <p className="text-gray-600">Review and approve requests for featured preset status</p>
        </div>
        <Badge variant="outline" className="bg-yellow-50 text-yellow-700 border-yellow-200">
          <Clock className="h-3 w-3 mr-1" />
          {requests.length} Pending
        </Badge>
      </div>

      <div className="space-y-4">
        {requests.map((request) => (
          <Card key={request.id} className="border-l-4 border-l-yellow-400">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="text-2xl">{getCategoryIcon(request.presets.category)}</div>
                  <div>
                    <CardTitle className="text-lg">{request.presets.name}</CardTitle>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="outline" className="text-xs">
                        {request.presets.category.replace('_', ' ')}
                      </Badge>
                      <Badge variant="outline" className="text-xs">
                        {request.presets.is_public ? 'Public' : 'Private'}
                      </Badge>
                    </div>
                  </div>
                </div>
                <div className="text-right text-sm text-gray-500">
                  <div className="flex items-center">
                    <Calendar className="h-4 w-4 mr-1" />
                    {formatDate(request.requested_at)}
                  </div>
                </div>
              </div>
            </CardHeader>
            
            <CardContent className="space-y-4">
              {/* Preset Details */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Preset Description</h4>
                <p className="text-gray-700 text-sm">{request.presets.description}</p>
              </div>

              {/* Prompt Template */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Prompt Template</h4>
                <div className="bg-gray-50 p-3 rounded-md">
                  <code className="text-sm text-gray-800">{request.presets.prompt_template}</code>
                </div>
              </div>

              {/* Requester Info */}
              <div>
                <h4 className="font-medium text-gray-900 mb-2">Requested By</h4>
                <div className="flex items-center space-x-2">
                  <User className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-700">
                    {request.requester.raw_user_meta_data?.full_name || 'Unknown User'}
                  </span>
                  <span className="text-xs text-gray-500">
                    ({request.requester.email})
                  </span>
                </div>
              </div>

              {/* Admin Notes */}
              <div>
                <Label htmlFor={`notes-${request.id}`}>Admin Notes (Optional)</Label>
                <Textarea
                  id={`notes-${request.id}`}
                  value={adminNotes[request.id] || ''}
                  onChange={(e) => setAdminNotes(prev => ({
                    ...prev,
                    [request.id]: e.target.value
                  }))}
                  placeholder="Add notes about your decision..."
                  rows={2}
                  className="mt-1"
                />
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3 pt-4 border-t">
                <Button
                  onClick={() => handleApproval(request.id, 'approved')}
                  disabled={processing === request.id}
                  className="bg-green-600 hover:bg-green-700 text-white"
                >
                  <CheckCircle className="h-4 w-4 mr-2" />
                  {processing === request.id ? 'Processing...' : 'Approve'}
                </Button>
                <Button
                  onClick={() => handleApproval(request.id, 'rejected')}
                  disabled={processing === request.id}
                  variant="outline"
                  className="border-red-300 text-red-600 hover:bg-red-50"
                >
                  <XCircle className="h-4 w-4 mr-2" />
                  {processing === request.id ? 'Processing...' : 'Reject'}
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => window.open(`/presets/${request.presets.id}`, '_blank')}
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Preset
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  )
}
