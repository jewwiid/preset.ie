'use client'

export function ReportDetailsModal({ reportId, isOpen, onClose }: any) {
  if (!isOpen) return null
  
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg p-6 max-w-md w-full">
        <h3 className="text-lg font-semibold mb-4">Report Details</h3>
        <p className="text-gray-600 mb-4">Report ID: {reportId}</p>
        <button
          onClick={onClose}
          className="px-4 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg"
        >
          Close
        </button>
      </div>
    </div>
  )
}