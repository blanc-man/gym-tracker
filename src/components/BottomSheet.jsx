import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'

export default function BottomSheet({ open, onClose, title, children }) {
  const ref = useRef(null)

  useEffect(() => {
    if (open && ref.current) ref.current.scrollTop = 0
  }, [open])

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end" style={{ background: 'rgba(0,0,0,0.4)' }}>
      <div
        className="bg-white rounded-t-2xl flex flex-col"
        style={{ maxHeight: '85vh' }}
        ref={ref}
      >
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100 flex-shrink-0">
          <h2 className="text-xl font-bold text-gray-900">{title}</h2>
          <button onClick={onClose} className="min-tap w-10 h-10 flex items-center justify-center text-gray-400">
            <X size={22} />
          </button>
        </div>
        <div className="overflow-y-auto flex-1 pb-safe">
          {children}
        </div>
      </div>
    </div>
  )
}
