'use client'

import React, { Component, ReactNode, ErrorInfo } from 'react'
import { AlertTriangle, RefreshCw, Bug } from 'lucide-react'
import { MessageErrorHandler } from '../lib/utils/messaging-performance'

interface MessagingErrorBoundaryProps {
  children: ReactNode
  fallbackComponent?: React.ComponentType<MessagingErrorFallbackProps>
  onError?: (error: Error, errorInfo: ErrorInfo) => void
  context?: string
}

interface MessagingErrorBoundaryState {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
  errorId: string | null
}

export interface MessagingErrorFallbackProps {
  error: Error | null
  errorInfo: ErrorInfo | null
  resetError: () => void
  context?: string
  errorId: string | null
}

export class MessagingErrorBoundary extends Component<
  MessagingErrorBoundaryProps,
  MessagingErrorBoundaryState
> {
  constructor(props: MessagingErrorBoundaryProps) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    }
  }

  static getDerivedStateFromError(error: Error): Partial<MessagingErrorBoundaryState> {
    const errorId = `msg_error_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    return {
      hasError: true,
      error,
      errorId
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    const { onError, context } = this.props
    
    // Log to our error handler
    MessageErrorHandler.logError(error, {
      ...errorInfo,
      timestamp: Date.now(),
      eventType: 'component_error'
    }, context)

    // Call custom error handler if provided
    onError?.(error, errorInfo)

    // Update state with error info
    this.setState({
      errorInfo,
      error
    })

    // Log to console for development
    console.error('MessagingErrorBoundary caught an error:', error, errorInfo)
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null
    })
  }

  render() {
    const { hasError, error, errorInfo, errorId } = this.state
    const { children, fallbackComponent: FallbackComponent, context } = this.props

    if (hasError) {
      if (FallbackComponent) {
        return (
          <FallbackComponent
            error={error}
            errorInfo={errorInfo}
            resetError={this.resetError}
            context={context}
            errorId={errorId}
          />
        )
      }

      return (
        <DefaultMessagingErrorFallback
          error={error}
          errorInfo={errorInfo}
          resetError={this.resetError}
          context={context}
          errorId={errorId}
        />
      )
    }

    return children
  }
}

// Default error fallback component
function DefaultMessagingErrorFallback({
  error,
  errorInfo,
  resetError,
  context,
  errorId
}: MessagingErrorFallbackProps) {
  const [showDetails, setShowDetails] = React.useState(false)

  return (
    <div className="flex flex-col items-center justify-center p-8 bg-red-50 rounded-lg border border-red-200 min-h-[200px]">
      <div className="text-center max-w-md">
        <AlertTriangle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        
        <h3 className="text-lg font-semibold text-red-900 mb-2">
          Messaging Error
        </h3>
        
        <p className="text-red-700 mb-4">
          {context 
            ? `Something went wrong with ${context.toLowerCase()}.`
            : 'Something went wrong with the messaging system.'
          }
        </p>

        <p className="text-sm text-red-600 mb-6">
          {error?.message || 'An unexpected error occurred.'}
        </p>

        <div className="flex flex-col sm:flex-row gap-3 justify-center">
          <button
            onClick={resetError}
            className="inline-flex items-center px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
          >
            <RefreshCw className="h-4 w-4 mr-2" />
            Try Again
          </button>
          
          <button
            onClick={() => setShowDetails(!showDetails)}
            className="inline-flex items-center px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
          >
            <Bug className="h-4 w-4 mr-2" />
            {showDetails ? 'Hide' : 'Show'} Details
          </button>
        </div>

        {showDetails && (
          <div className="mt-6 text-left">
            <details className="bg-white rounded-lg p-4 border border-red-300">
              <summary className="cursor-pointer font-medium text-red-900 mb-2">
                Error Details
              </summary>
              
              {errorId && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-600">Error ID:</p>
                  <code className="text-xs bg-gray-100 px-2 py-1 rounded font-mono">
                    {errorId}
                  </code>
                </div>
              )}
              
              <div className="mb-3">
                <p className="text-xs font-medium text-gray-600">Error Message:</p>
                <code className="text-xs text-red-800 bg-red-100 px-2 py-1 rounded block">
                  {error?.message}
                </code>
              </div>
              
              {error?.stack && (
                <div className="mb-3">
                  <p className="text-xs font-medium text-gray-600">Stack Trace:</p>
                  <pre className="text-xs text-gray-700 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {error.stack}
                  </pre>
                </div>
              )}
              
              {errorInfo?.componentStack && (
                <div>
                  <p className="text-xs font-medium text-gray-600">Component Stack:</p>
                  <pre className="text-xs text-gray-700 bg-gray-100 p-2 rounded overflow-auto max-h-32">
                    {errorInfo.componentStack}
                  </pre>
                </div>
              )}
            </details>
          </div>
        )}
        
        <p className="text-xs text-red-500 mt-4">
          If this problem persists, please contact support.
        </p>
      </div>
    </div>
  )
}

// Specialized error fallbacks for different messaging components
export function ConversationErrorFallback(props: MessagingErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-4 bg-red-50 rounded-lg border border-red-200">
      <div className="text-center">
        <AlertTriangle className="h-6 w-6 text-red-500 mx-auto mb-2" />
        <p className="text-sm text-red-700 mb-2">Failed to load conversation</p>
        <button
          onClick={props.resetError}
          className="text-xs text-red-600 underline hover:text-red-800"
        >
          Try again
        </button>
      </div>
    </div>
  )
}

export function MessageErrorFallback(props: MessagingErrorFallbackProps) {
  return (
    <div className="flex items-center justify-center p-2 bg-red-50 rounded border border-red-200">
      <div className="text-center">
        <AlertTriangle className="h-4 w-4 text-red-500 mx-auto mb-1" />
        <p className="text-xs text-red-600">Message error</p>
        <button
          onClick={props.resetError}
          className="text-xs text-red-500 underline"
        >
          Retry
        </button>
      </div>
    </div>
  )
}

export function TypingIndicatorErrorFallback(props: MessagingErrorFallbackProps) {
  return (
    <span className="text-xs text-red-500 italic">
      typing status unavailable
    </span>
  )
}

// Higher-order component for wrapping messaging components with error boundaries
export function withMessagingErrorBoundary<P extends object>(
  Component: React.ComponentType<P>,
  context?: string,
  fallbackComponent?: React.ComponentType<MessagingErrorFallbackProps>
) {
  const WrappedComponent = (props: P) => (
    <MessagingErrorBoundary 
      context={context}
      fallbackComponent={fallbackComponent}
    >
      <Component {...props} />
    </MessagingErrorBoundary>
  )
  
  WrappedComponent.displayName = `withMessagingErrorBoundary(${Component.displayName || Component.name})`
  
  return WrappedComponent
}

export default MessagingErrorBoundary