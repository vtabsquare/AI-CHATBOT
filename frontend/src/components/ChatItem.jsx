import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, Trash2, PenLine, AlertTriangle } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function ChatItem({ chat, isActive, onClick, onRename, onDelete }) {
  const [hovered, setHovered] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(chat.title)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isRenaming])

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== chat.title) {
      onRename(chat.id, renameValue.trim())
    } else {
      setRenameValue(chat.title)
    }
    setIsRenaming(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit()
    if (e.key === 'Escape') {
      setIsRenaming(false)
      setRenameValue(chat.title)
    }
  }

  const confirmDelete = (e) => {
    e.stopPropagation()
    onDelete(chat.id)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => { setHovered(false) }}
        onClick={() => { if (!isRenaming) onClick() }}
        whileTap={!isRenaming ? { scale: 0.98 } : {}}
        className="relative group flex items-center gap-2.5 px-3 py-2 rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: isActive
            ? 'var(--bg-glass-hover)'
            : hovered ? 'var(--bg-glass-hover)' : 'transparent',
          border: isActive ? '1px solid var(--border-medium)' : '1px solid transparent'
        }}
        title={chat.title}
      >
        {/* Icon */}
        <MessageCircle size={14} style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-muted)' }} />

        {/* Name or Input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm bg-transparent outline-none"
            style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--accent-primary)' }}
          />
        ) : (
          <span className="flex-1 text-sm truncate"
            style={{ color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)' }}>
            {chat.title}
          </span>
        )}

        {/* Explicit Action Buttons (Visible on Hover or Active - mobile friendly) */}
        {(hovered || isActive) && !isRenaming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-0.5"
          >
            <button
              onClick={(e) => { e.stopPropagation(); setIsRenaming(true) }}
              className="p-1 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Rename chat"
            >
              <PenLine size={13} />
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}
              className="p-1 rounded-md transition-colors"
              style={{ color: 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
              onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
              title="Delete chat"
            >
              <Trash2 size={13} />
            </button>
          </motion.div>
        )}
      </motion.div>

      {/* Delete Confirmation Modal */}
      <AnimatePresence>
        {showDeleteConfirm && (
          <>
            <motion.div
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false) }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4"
              style={{ background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(4px)' }}
            >
              <motion.div
                initial={{ opacity: 0, scale: 0.95, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.95, y: 10 }}
                onClick={(e) => e.stopPropagation()}
                className="w-full max-w-sm p-5 rounded-2xl flex flex-col gap-4"
                style={{
                  background: 'var(--bg-elevated)',
                  border: '1px solid var(--border-medium)',
                  boxShadow: 'var(--shadow-elevated)'
                }}
              >
                <div className="flex items-start gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: 'rgba(248,113,113,0.1)' }}>
                    <AlertTriangle size={20} style={{ color: '#f87171' }} />
                  </div>
                  <div>
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Delete Chat</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Are you sure you want to delete <strong style={{ color: 'var(--text-secondary)' }}>"{chat.title}"</strong>? Your messages will be lost.
                    </p>
                  </div>
                </div>

                <div className="flex justify-end gap-2 mt-2">
                  <button
                    onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(false) }}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-colors"
                    style={{ background: 'var(--bg-glass)', color: 'var(--text-secondary)' }}
                    onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
                    onMouseLeave={e => e.currentTarget.style.background = 'var(--bg-glass)'}
                  >
                    Cancel
                  </button>
                  <button
                    onClick={confirmDelete}
                    className="px-4 py-2 rounded-xl text-sm font-medium transition-transform active:scale-95"
                    style={{ background: '#f87171', color: '#fff' }}
                    onMouseEnter={e => e.currentTarget.style.filter = 'brightness(1.1)'}
                    onMouseLeave={e => e.currentTarget.style.filter = 'none'}
                  >
                    Delete Chat
                  </button>
                </div>
              </motion.div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}
