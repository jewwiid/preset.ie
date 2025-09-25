'use client'

import { RoleIndicator } from './RoleIndicator'

export function RoleIndicatorDemo() {
  return (
    <div className="space-y-8 p-8">
      <div>
        <h2 className="text-2xl font-bold mb-4">Role Indicator Variants</h2>
        
        {/* Default Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Default</h3>
          <div className="space-y-2">
            <RoleIndicator role="CONTRIBUTOR" />
            <RoleIndicator role="TALENT" />
            <RoleIndicator role="BOTH" />
          </div>
        </div>

        {/* Compact Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Compact</h3>
          <div className="space-y-2">
            <RoleIndicator role="CONTRIBUTOR" variant="compact" />
            <RoleIndicator role="TALENT" variant="compact" />
            <RoleIndicator role="BOTH" variant="compact" />
          </div>
        </div>

        {/* Minimal Variant */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold">Minimal</h3>
          <div className="flex gap-2 flex-wrap">
            <RoleIndicator role="CONTRIBUTOR" variant="minimal" />
            <RoleIndicator role="TALENT" variant="minimal" />
            <RoleIndicator role="BOTH" variant="minimal" />
          </div>
        </div>
      </div>
    </div>
  )
}

export default RoleIndicatorDemo
