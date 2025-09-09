'use client'

export function ReportsQueue() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Reports Queue</h3>
      <p className="text-gray-600">Reports management interface</p>
      <div className="mt-4 space-y-2">
        <div className="p-3 border rounded">
          <p className="text-sm text-gray-500">No pending reports</p>
        </div>
      </div>
    </div>
  )
}