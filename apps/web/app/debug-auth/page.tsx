'use client'

import { useEffect, useState } from 'react'
import { useAuth } from '../../lib/auth-context'
import { supabase } from '../../lib/supabase'

export default function DebugAuth() {
  const { user, session, userRole, loading } = useAuth()
  const [storageKeys, setStorageKeys] = useState<string[]>([])
  const [storageData, setStorageData] = useState<Record<string, any>>({})

  useEffect(() => {
    if (typeof window !== 'undefined') {
      // Get all localStorage keys
      const keys = Object.keys(localStorage)
      setStorageKeys(keys)
      
      // Get data for relevant keys
      const data: Record<string, any> = {}
      keys.forEach(key => {
        if (key.includes('supabase') || key.includes('auth') || key.includes('preset') || key.includes('sb-')) {
          try {
            const value = localStorage.getItem(key)
            if (value) {
              data[key] = JSON.parse(value)
            }
          } catch {
            data[key] = localStorage.getItem(key)
          }
        }
      })
      setStorageData(data)
    }
  }, [])

  const handleSignOut = async () => {
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }
    
    await supabase.auth.signOut()
    window.location.reload()
  }

  const handleRefresh = async () => {
    if (!supabase) {
      console.error('Supabase client not available')
      return
    }
    
    const { data, error } = await supabase.auth.refreshSession()
    console.log('Refresh result:', { data, error })
  }

  return (
    <div className="container mx-auto p-8 max-w-4xl">
      <h1 className="text-2xl font-bold mb-6">Authentication Debug</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Auth Context State */}
        <div className="bg-background p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Auth Context State</h2>
          <div className="space-y-2 text-sm">
            <div><strong>Loading:</strong> {loading.toString()}</div>
            <div><strong>User:</strong> {user ? user.email : 'null'}</div>
            <div><strong>Session:</strong> {session ? 'exists' : 'null'}</div>
            <div><strong>User Role:</strong> {JSON.stringify(userRole)}</div>
          </div>
        </div>

        {/* Session Details */}
        <div className="bg-background p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Session Details</h2>
          {session ? (
            <div className="space-y-2 text-sm">
              <div><strong>Access Token:</strong> {session.access_token ? 'exists' : 'missing'}</div>
              <div><strong>Refresh Token:</strong> {session.refresh_token ? 'exists' : 'missing'}</div>
              <div><strong>Expires At:</strong> {session.expires_at ? new Date(session.expires_at * 1000).toLocaleString() : 'unknown'}</div>
              <div><strong>User ID:</strong> {session.user?.id || 'unknown'}</div>
            </div>
          ) : (
            <p className="text-muted-foreground-500">No session found</p>
          )}
        </div>

        {/* LocalStorage Keys */}
        <div className="bg-background p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">LocalStorage Keys</h2>
          <div className="space-y-1 text-sm">
            {storageKeys.length > 0 ? (
              storageKeys.map(key => (
                <div key={key} className={key.includes('supabase') || key.includes('auth') || key.includes('sb-') ? 'text-primary-600 font-medium' : ''}>
                  {key}
                </div>
              ))
            ) : (
              <p className="text-muted-foreground-500">No keys found</p>
            )}
          </div>
        </div>

        {/* Auth Storage Data */}
        <div className="bg-background p-6 rounded-lg border">
          <h2 className="text-lg font-semibold mb-4">Auth Storage Data</h2>
          <div className="space-y-2 text-xs">
            {Object.keys(storageData).length > 0 ? (
              Object.entries(storageData).map(([key, value]) => (
                <div key={key} className="border-b pb-2">
                  <div className="font-medium text-primary-600">{key}:</div>
                  <pre className="mt-1 bg-muted-100 p-2 rounded text-xs overflow-auto">
                    {typeof value === 'object' ? JSON.stringify(value, null, 2) : String(value)}
                  </pre>
                </div>
              ))
            ) : (
              <p className="text-muted-foreground-500">No auth-related data found</p>
            )}
          </div>
        </div>
      </div>

      {/* Actions */}
      <div className="mt-6 flex gap-4">
        <button 
          onClick={handleSignOut}
          className="px-4 py-2 bg-destructive-500 text-primary-foreground rounded hover:bg-destructive-600"
        >
          Sign Out
        </button>
        <button 
          onClick={handleRefresh}
          className="px-4 py-2 bg-primary-500 text-primary-foreground rounded hover:bg-primary-600"
        >
          Refresh Session
        </button>
        <button 
          onClick={() => window.location.reload()}
          className="px-4 py-2 bg-muted-500 text-primary-foreground rounded hover:bg-muted-600"
        >
          Reload Page
        </button>
      </div>
    </div>
  )
}