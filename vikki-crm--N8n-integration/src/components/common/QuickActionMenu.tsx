import { useState } from 'react'
import { Plus, FileText, Pencil, Calculator, X } from 'lucide-react'

interface QuickActionMenuProps {
  onGenerateDocument: () => void
  onAddNote: () => void
  onUpdateStatus: () => void
  onAddMedicalBill: () => void
}

export function QuickActionMenu({
  onGenerateDocument,
  onAddNote,
  onUpdateStatus,
  onAddMedicalBill,
}: QuickActionMenuProps) {
  const [isOpen, setIsOpen] = useState(false)

  const toggleMenu = () => setIsOpen(!isOpen)

  const handleAction = (action: () => void) => {
    action()
    setIsOpen(false)
  }

  return (
    <div className="fixed bottom-6 right-6 z-50">
      {/* Main FAB Button */}
      <button
        onClick={toggleMenu}
        className={`
          w-14 h-14 rounded-full bg-primary-600 text-white shadow-elevated
          hover:bg-primary-700 transition-all duration-200 flex items-center justify-center
          ${isOpen ? 'rotate-45' : ''}
        `}
        aria-label={isOpen ? 'Close menu' : 'Open quick actions'}
      >
        {isOpen ? <X size={24} /> : <Plus size={24} />}
      </button>

      {/* Action Menu */}
      {isOpen && (
        <div className="absolute bottom-20 right-0 bg-white rounded-lg shadow-elevated p-2 w-48 animate-scale-in">
          <div className="space-y-1">
            <button
              onClick={() => handleAction(onGenerateDocument)}
              className="w-full flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
            >
              <FileText size={18} className="mr-3 text-primary-600" />
              Generate Document
            </button>
            <button
              onClick={() => handleAction(onAddNote)}
              className="w-full flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
            >
              <Pencil size={18} className="mr-3 text-primary-600" />
              Add Note
            </button>
            <button
              onClick={() => handleAction(onUpdateStatus)}
              className="w-full flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
            >
              <Plus size={18} className="mr-3 text-primary-600" />
              Update Status
            </button>
            <button
              onClick={() => handleAction(onAddMedicalBill)}
              className="w-full flex items-center px-4 py-3 text-sm text-neutral-700 hover:bg-neutral-50 rounded-md transition-colors"
            >
              <Calculator size={18} className="mr-3 text-primary-600" />
              Add Medical Bill
            </button>
          </div>
        </div>
      )}

      {/* Backdrop */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/20 backdrop-blur-sm animate-fade-in"
          onClick={toggleMenu}
        />
      )}
    </div>
  )
}


