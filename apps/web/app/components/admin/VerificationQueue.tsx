'use client'

export function VerificationQueue() {
  return (
    <div className="bg-white rounded-lg shadow p-6">
      <h3 className="text-lg font-semibold mb-4">Verification Queue</h3>
      <p className="text-gray-600">ID verification requests</p>
      <div className="mt-4 space-y-2">
        <div className="p-3 border rounded">
          <p className="text-sm text-gray-500">No pending verifications</p>
        </div>
      </div>
    </div>
  )
}