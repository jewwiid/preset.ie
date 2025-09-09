'use client'

export function UserActionsModal({ userId, isOpen, onClose }: any) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">User Actions</h3>
        <p className="text-gray-600 mb-4">User ID: {userId}</p>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-yellow-100 hover:bg-yellow-200 rounded-lg text-left">
            Send Warning
          </button>
          <button className="w-full px-4 py-2 bg-orange-100 hover:bg-orange-200 rounded-lg text-left">
            Suspend User
          </button>
          <button className="w-full px-4 py-2 bg-red-100 hover:bg-red-200 rounded-lg text-left">
            Ban User
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}