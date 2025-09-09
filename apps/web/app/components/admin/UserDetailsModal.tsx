'use client'

export function UserDetailsModal({ userId, isOpen, onClose }: any) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
        <h3 className="text-lg font-semibold mb-4">User Details</h3>
        <div className="space-y-4">
          <div>
            <p className="text-sm text-gray-500">User ID</p>
            <p className="text-gray-900">{userId}</p>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <p className="text-gray-900">Active</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Subscription</p>
              <p className="text-gray-900">Free</p>
            </div>
          </div>
        </div>
        <button
          onClick={onClose}
          className="mt-6 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  )
}