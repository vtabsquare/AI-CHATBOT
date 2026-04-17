import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, X, Layers, MessageSquare, ArrowRight } from 'lucide-react'

export default function SearchModal({ isOpen, onClose, workspaces = [], chats = {}, onSelectWorkspace, onSelectChat }) {
  const [query, setQuery] = useState('')
  const inputRef = useRef(null)

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 80)
    } else {
      setQuery('')
    }
  }, [isOpen])

  // ESC to close
  useEffect(() => {
    const handleKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', handleKey)
    return () => window.removeEventListener('keydown', handleKey)
  }, [onClose])

  const q = query.toLowerCase().trim()

  // Filter workspaces
  const matchedWorkspaces = workspaces.filter(ws =>
    !q || ws.name.toLowerCase().includes(q)
  )

  // Filter chats (flatten with workspace info)
  const matchedChats = []
  workspaces.forEach(ws => {
    const wsChats = chats[ws.id] || []
    wsChats.forEach(chat => {
      if (!q || chat.title.toLowerCase().includes(q) || ws.name.toLowerCase().includes(q)) {
        matchedChats.push({ ...chat, wsId: ws.id, wsName: ws.name })
      }
    })
  })

  const hasResults = matchedWorkspaces.length > 0 || matchedChats.length > 0

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.65)', backdropFilter: 'blur(6px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            transition={{ type: 'spring', stiffness: 380, damping: 30 }}
            className="fixed z-50 w-full max-w-lg mx-auto left-0 right-0"
            style={{
              top: '18%',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: '20px',
              boxShadow: 'var(--shadow-elevated)',
              overflow: 'hidden',
            }}
          >
            {/* Search Input Row */}
            <div
              className="flex items-center gap-3 px-4"
              style={{
                borderBottom: '1px solid var(--border-subtle)',
                height: '52px',
              }}
            >
              <Search size={16} style={{ color: 'var(--text-muted)', flexShrink: 0 }} />
              <input
                ref={inputRef}
                value={query}
                onChange={e => setQuery(e.target.value)}
                placeholder="Search workspaces and chats…"
                className="flex-1 text-sm bg-transparent outline-none"
                style={{ color: 'var(--text-primary)' }}
              />
              {query && (
                <motion.button
                  initial={{ opacity: 0, scale: 0.7 }}
                  animate={{ opacity: 1, scale: 1 }}
                  onClick={() => setQuery('')}
                  className="p-1 rounded-md"
                  style={{ color: 'var(--text-muted)' }}
                >
                  <X size={13} />
                </motion.button>
              )}
              <kbd
                className="text-xs px-2 py-0.5 rounded-md font-mono"
                style={{ background: 'var(--bg-glass)', color: 'var(--text-muted)', border: '1px solid var(--border-subtle)' }}
              >
                ESC
              </kbd>
            </div>

            {/* Results */}
            <div style={{ maxHeight: '360px', overflowY: 'auto', padding: '10px 8px' }}>
              {!hasResults && (
                <div className="flex flex-col items-center justify-center py-10 gap-2">
                  <Search size={28} style={{ color: 'var(--text-muted)', opacity: 0.4 }} />
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    No results for &ldquo;{query}&rdquo;
                  </p>
                </div>
              )}

              {/* Workspaces Section */}
              {matchedWorkspaces.length > 0 && (
                <div className="mb-2">
                  <p className="text-xs font-semibold px-3 py-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Workspaces
                  </p>
                  {matchedWorkspaces.map(ws => (
                    <motion.button
                      key={ws.id}
                      whileHover={{ background: 'var(--bg-glass)' }}
                      onClick={() => onSelectWorkspace(ws.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.2)' }}
                      >
                        <Layers size={13} style={{ color: 'var(--accent-primary)' }} />
                      </div>
                      <span className="text-sm flex-1 truncate">{ws.name}</span>
                      <ArrowRight size={13} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    </motion.button>
                  ))}
                </div>
              )}

              {/* Chats Section */}
              {matchedChats.length > 0 && (
                <div>
                  <p className="text-xs font-semibold px-3 py-1 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                    Chats
                  </p>
                  {matchedChats.map(chat => (
                    <motion.button
                      key={`${chat.wsId}-${chat.id}`}
                      whileHover={{ background: 'var(--bg-glass)' }}
                      onClick={() => onSelectChat(chat.wsId, chat.id)}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left"
                      style={{ color: 'var(--text-primary)' }}
                    >
                      <div
                        className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
                        style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border-subtle)' }}
                      >
                        <MessageSquare size={13} style={{ color: 'var(--text-secondary)' }} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm truncate">{chat.title}</p>
                        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{chat.wsName}</p>
                      </div>
                      <ArrowRight size={13} style={{ color: 'var(--text-muted)', opacity: 0.5 }} />
                    </motion.button>
                  ))}
                </div>
              )}
            </div>

            {/* Footer hint */}
            <div
              className="flex items-center gap-4 px-4 py-2.5 text-xs"
              style={{
                borderTop: '1px solid var(--border-subtle)',
                color: 'var(--text-muted)',
              }}
            >
              <span><kbd className="font-mono">↑↓</kbd> navigate</span>
              <span><kbd className="font-mono">↵</kbd> select</span>
              <span><kbd className="font-mono">ESC</kbd> close</span>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
