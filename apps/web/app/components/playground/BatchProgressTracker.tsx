'use client'

import React, { useEffect, useState } from 'react'
import { Progress } from '../../../components/ui/progress'
import { Button } from '../../../components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '../../../components/ui/card'
import { Badge } from '../../../components/ui/badge'
import { X, RotateCcw, CheckCircle, AlertCircle } from 'lucide-react'

import { LoadingSpinner } from '@/components/ui/loading-spinner';
interface BatchJob {
  id: string
  job_type: string
  total_items: number
  processed_items: number
  failed_items: number
  status: string
  progress_percentage: number
  results: any[]
  errors: any[]
  created_at: string
  started_at?: string
  completed_at?: string
}

interface BatchProgressTrackerProps {
  batchJobId: string | null
  onComplete?: (results: any[]) => void
  onCancel?: () => void
}

const BatchProgressTracker: React.FC<BatchProgressTrackerProps> = ({
  batchJobId,
  onComplete,
  onCancel
}) => {
  const [batchJob, setBatchJob] = useState<BatchJob | null>(null)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    if (!batchJobId) return

    const pollStatus = async () => {
      try {
        const response = await fetch(`/api/playground/batch-status?batchJobId=${batchJobId}`)
        if (!response.ok) throw new Error('Failed to fetch batch status')
        
        const { batchJob: job } = await response.json()
        setBatchJob(job)

        // Check if completed
        if (job.status === 'completed' && onComplete) {
          onComplete(job.results)
        }
      } catch (error) {
        console.error('Failed to poll batch status:', error)
      }
    }

    // Poll immediately
    pollStatus()

    // Set up polling interval
    const interval = setInterval(pollStatus, 2000)

    return () => clearInterval(interval)
  }, [batchJobId, onComplete])

  const handleCancel = async () => {
    if (!batchJobId) return

    setLoading(true)
    try {
      const response = await fetch('/api/playground/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchJobId, action: 'cancel' })
      })

      if (!response.ok) throw new Error('Failed to cancel batch job')
      
      if (onCancel) onCancel()
    } catch (error) {
      console.error('Failed to cancel batch job:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleRetry = async () => {
    if (!batchJobId) return

    setLoading(true)
    try {
      const response = await fetch('/api/playground/batch-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ batchJobId, action: 'retry' })
      })

      if (!response.ok) throw new Error('Failed to retry batch job')
    } catch (error) {
      console.error('Failed to retry batch job:', error)
    } finally {
      setLoading(false)
    }
  }

  if (!batchJob) return null

  const getStatusIcon = () => {
    switch (batchJob.status) {
      case 'completed':
        return <CheckCircle className="h-5 w-5 text-primary-500" />
      case 'failed':
        return <AlertCircle className="h-5 w-5 text-destructive-500" />
      case 'processing':
        return <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-500" />
      default:
        return <div className="h-5 w-5 rounded-full bg-muted-400" />
    }
  }

  const getStatusBadge = () => {
    const variants = {
      pending: 'secondary',
      processing: 'default',
      completed: 'default',
      failed: 'destructive',
      cancelled: 'outline'
    } as const

    return (
      <Badge variant={variants[batchJob.status as keyof typeof variants] || 'secondary'}>
        {batchJob.status}
      </Badge>
    )
  }

  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg flex items-center space-x-2">
            {getStatusIcon()}
            <span>Batch Processing</span>
            {getStatusBadge()}
          </CardTitle>
          {batchJob.status === 'processing' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleCancel}
              disabled={loading}
            >
              <X className="h-4 w-4 mr-1" />
              Cancel
            </Button>
          )}
          {batchJob.status === 'failed' && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleRetry}
              disabled={loading}
            >
              <RotateCcw className="h-4 w-4 mr-1" />
              Retry
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <div className="flex justify-between text-sm text-muted-foreground-600 mb-1">
            <span>Progress</span>
            <span>{batchJob.progress_percentage.toFixed(1)}%</span>
          </div>
          <Progress value={batchJob.progress_percentage} className="h-2" />
        </div>

        <div className="grid grid-cols-3 gap-4 text-sm">
          <div className="text-center">
            <div className="font-semibold text-lg">{batchJob.processed_items}</div>
            <div className="text-muted-foreground-600">Processed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg text-destructive-500">{batchJob.failed_items}</div>
            <div className="text-muted-foreground-600">Failed</div>
          </div>
          <div className="text-center">
            <div className="font-semibold text-lg">{batchJob.total_items}</div>
            <div className="text-muted-foreground-600">Total</div>
          </div>
        </div>

        {batchJob.errors.length > 0 && (
          <div className="bg-destructive-50 border border-destructive-200 rounded-md p-3">
            <h4 className="text-sm font-medium text-destructive-800 mb-2">Errors:</h4>
            <div className="space-y-1">
              {batchJob.errors.slice(0, 3).map((error, index) => (
                <div key={index} className="text-xs text-destructive-700">
                  {error.message || 'Unknown error'}
                </div>
              ))}
              {batchJob.errors.length > 3 && (
                <div className="text-xs text-destructive-600">
                  +{batchJob.errors.length - 3} more errors
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  )
}

export default BatchProgressTracker
