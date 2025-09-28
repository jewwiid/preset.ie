'use client'

import { useAuth } from '@/lib/auth-context'
import { supabase } from '@/lib/supabase'
import { useState, useEffect } from 'react'

export default function WebSocketDebugPage() {
  const { user, session, loading } = useAuth()
  const [connectionStatus, setConnectionStatus] = useState<string>('Not started')
  const [logs, setLogs] = useState<string[]>([])
  const [channel, setChannel] = useState<any>(null)

  const addLog = (message: string) => {
    const timestamp = new Date().toLocaleTimeString()
    setLogs(prev => [...prev, `[${timestamp}] ${message}`])
    console.log(`[WebSocket Debug] ${message}`)
  }

  const testWebSocketConnection = async () => {
    if (!user) {
      addLog('❌ No user found')
      return
    }

    addLog('🔍 Starting WebSocket connection test...')
    setConnectionStatus('Testing...')

    try {
      if (!supabase) {
        addLog('❌ Supabase client not initialized')
        setConnectionStatus('Client error')
        return
      }

      // Check session first
      const { data: { session: currentSession }, error: sessionError } = await supabase.auth.getSession()
      
      if (sessionError) {
        addLog(`❌ Session error: ${sessionError.message}`)
        setConnectionStatus('Session error')
        return
      }

      if (!currentSession) {
        addLog('❌ No session found')
        setConnectionStatus('No session')
        return
      }

      addLog(`✅ Session found: ${currentSession.user.id}`)
      addLog(`🔑 Token expires: ${new Date(currentSession.expires_at! * 1000).toLocaleString()}`)

      // Test basic channel connection
      const testChannel = supabase!.channel('websocket-test')
      
      testChannel
        .on('presence', { event: 'sync' }, () => {
          addLog('✅ Presence sync successful')
        })
        .on('presence', { event: 'join' }, () => {
          addLog('✅ User joined channel')
        })
        .on('presence', { event: 'leave' }, () => {
          addLog('✅ User left channel')
        })
        .subscribe((status) => {
          addLog(`📡 Channel status: ${status}`)
          setConnectionStatus(status)
          
          if (status === 'SUBSCRIBED') {
            addLog('✅ WebSocket connection successful!')
            setChannel(testChannel)
          } else if (status === 'CHANNEL_ERROR') {
            addLog('❌ Channel error occurred')
          } else if (status === 'TIMED_OUT') {
            addLog('❌ Connection timed out')
          } else if (status === 'CLOSED') {
            addLog('❌ Connection closed')
          }
        })

    } catch (error: any) {
      addLog(`❌ Error: ${error.message}`)
      setConnectionStatus('Error')
    }
  }

  const disconnect = () => {
    if (channel) {
      channel.unsubscribe()
      addLog('🔌 Disconnected from channel')
      setChannel(null)
      setConnectionStatus('Disconnected')
    }
  }

  const clearLogs = () => {
    setLogs([])
  }

  if (loading) {
    return <div>Loading...</div>
  }

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">WebSocket Connection Debug</h1>
      
      <div className="space-y-6">
        {/* Auth Status */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
          <pre className="text-sm">
            {JSON.stringify({
              hasUser: !!user,
              userId: user?.id,
              userEmail: user?.email,
              hasSession: !!session,
              sessionUserId: session?.user?.id,
              sessionExpiresAt: session?.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : null,
              loading
            }, null, 2)}
          </pre>
        </div>

        {/* Connection Controls */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Connection Test</h2>
          <div className="space-x-2 mb-4">
            <button 
              onClick={testWebSocketConnection}
              disabled={!user}
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:opacity-50"
            >
              Test WebSocket Connection
            </button>
            <button 
              onClick={disconnect}
              disabled={!channel}
              className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 disabled:opacity-50"
            >
              Disconnect
            </button>
            <button 
              onClick={clearLogs}
              className="px-4 py-2 bg-gray-500 text-white rounded hover:bg-gray-600"
            >
              Clear Logs
            </button>
          </div>
          <div className="text-sm">
            <strong>Status:</strong> {connectionStatus}
          </div>
        </div>

        {/* Logs */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Connection Logs</h2>
          <div className="bg-black text-green-400 p-4 rounded font-mono text-sm max-h-96 overflow-y-auto">
            {logs.length === 0 ? (
              <div className="text-gray-500">No logs yet. Click "Test WebSocket Connection" to start.</div>
            ) : (
              logs.map((log, index) => (
                <div key={index} className="mb-1">{log}</div>
              ))
            )}
          </div>
        </div>

        {/* Environment Info */}
        <div className="bg-gray-100 p-4 rounded">
          <h2 className="text-lg font-semibold mb-2">Environment Info</h2>
          <pre className="text-sm">
            {JSON.stringify({
              supabaseClient: supabase ? 'Initialized' : 'Not initialized',
              nodeEnv: process.env.NODE_ENV
            }, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  )
}
