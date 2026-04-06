import { AnimatePresence, motion } from 'framer-motion'
import { X } from 'lucide-react'
import { useEffect } from 'react'
import { createPortal } from 'react-dom'

interface ModalProps {
  open: boolean
  onClose: () => void
  title: string
  children: React.ReactNode
  size?: 'sm' | 'md' | 'lg'
}

const SIZE_CLASSES = {
  sm: 'max-w-sm',
  md: 'max-w-lg',
  lg: 'max-w-2xl',
}

export function Modal({ open, onClose, title, children, size = 'md' }: ModalProps) {
  // Close on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('keydown', onKey) }
  }, [onClose])

  if (typeof document === 'undefined') return null

  return createPortal(
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-40"
            onClick={onClose}
          />
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-3 sm:p-4 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 16 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 16 }}
              transition={{ type: 'spring', stiffness: 400, damping: 30 }}
              className={`w-full ${SIZE_CLASSES[size]} max-h-[min(90vh,48rem)] overflow-hidden bg-surface-secondary border border-surface-border rounded-2xl shadow-2xl pointer-events-auto`}
            >
              {/* Header */}
              <div className="flex items-center justify-between px-4 sm:px-6 py-4 border-b border-surface-border">
                <h2 className="font-semibold text-zinc-100 text-base">{title}</h2>
                <button
                  onClick={onClose}
                  className="btn-ghost p-1 -mr-1"
                  aria-label="Cerrar"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Content */}
              <div className="px-4 sm:px-6 py-4 sm:py-5 overflow-y-auto max-h-[calc(min(90vh,48rem)-4.5rem)]">{children}</div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
    ,
    document.body,
  )
}
