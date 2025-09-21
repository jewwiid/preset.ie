'use client'

import { useEffect, useState } from 'react'

export function DebugTheme() {
  const [debugInfo, setDebugInfo] = useState<{
    isDarkClass: boolean
    popoverVar: string
    backgroundVar: string
    savedTheme: string | null
  } | null>(null)

  useEffect(() => {
    const updateDebugInfo = () => {
      if (typeof window !== 'undefined') {
        const root = document.documentElement
        const isDarkClass = root.classList.contains('dark')
        const popoverVar = getComputedStyle(root).getPropertyValue('--popover').trim()
        const backgroundVar = getComputedStyle(root).getPropertyValue('--background').trim()
        const savedTheme = localStorage.getItem('theme')
        
        setDebugInfo({
          isDarkClass,
          popoverVar,
          backgroundVar,
          savedTheme
        })
      }
    }

    updateDebugInfo()
    
    // Listen for class changes
    const observer = new MutationObserver(updateDebugInfo)
    observer.observe(document.documentElement, { 
      attributes: true, 
      attributeFilter: ['class'] 
    })

    return () => observer.disconnect()
  }, [])

  if (!debugInfo) return null

  return (
    <div className="fixed bottom-4 right-4 bg-red-500 text-white p-2 text-xs rounded z-[9999] font-mono">
      <div>Dark Class: {debugInfo.isDarkClass ? 'YES' : 'NO'}</div>
      <div>Saved Theme: {debugInfo.savedTheme}</div>
      <div>--popover: {debugInfo.popoverVar}</div>
      <div>--background: {debugInfo.backgroundVar}</div>
    </div>
  )
}
