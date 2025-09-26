'use client'

export function UserActionsModal({ userId, isOpen, onClose }: any) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-background rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">User Actions</h3>
        <p className="text-muted-foreground-600 mb-4">User ID: {userId}</p>
        <div className="space-y-2">
          <button className="w-full px-4 py-2 bg-primary-100 hover:bg-primary-200 rounded-lg text-left">
            Send Warning
          </button>
          <button className="w-full px-4 py-2 bg-primary-100 hover:bg-primary-200 rounded-lg text-left">
            Suspend User
          </button>
          <button className="w-full px-4 py-2 bg-destructive-100 hover:bg-destructive-200 rounded-lg text-left">
            Ban User
          </button>
        </div>
        <button
          onClick={onClose}
          className="mt-4 px-4 py-2 bg-muted-100 hover:bg-muted-200 rounded-lg w-full"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}