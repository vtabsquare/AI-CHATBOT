import { motion, AnimatePresence } from 'framer-motion'
import { MessageSquare, Trash2, PenLine, AlertTriangle, Code, Check } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'

export default function WorkspaceItem({ workspace, isActive, onClick, onRename, onDelete, isAdmin }) {
  const [hovered, setHovered] = useState(false)
  const [isRenaming, setIsRenaming] = useState(false)
  const [renameValue, setRenameValue] = useState(workspace.name)
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
  const [copied, setCopied] = useState(false)
  const inputRef = useRef(null)

  useEffect(() => {
    if (isRenaming) {
      inputRef.current?.focus()
      inputRef.current?.select()
    }
  }, [isRenaming])

  const handleRenameSubmit = () => {
    if (renameValue.trim() && renameValue !== workspace.name) {
      onRename(workspace.id, renameValue.trim())
    } else {
      setRenameValue(workspace.name)
    }
    setIsRenaming(false)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleRenameSubmit()
    if (e.key === 'Escape') {
      setIsRenaming(false)
      setRenameValue(workspace.name)
    }
  }

  const confirmDelete = (e) => {
    e.stopPropagation()
    onDelete(workspace.id)
    setShowDeleteConfirm(false)
  }

  return (
    <>
      <motion.div
        onHoverStart={() => setHovered(true)}
        onHoverEnd={() => { setHovered(false) }}
        onClick={() => { if (!isRenaming) onClick() }}
        whileTap={!isRenaming ? { scale: 0.98 } : {}}
        className="relative group flex items-center gap-3 px-3 py-2.5 rounded-xl cursor-pointer transition-all duration-200"
        style={{
          background: isActive
            ? 'rgba(16,185,129,0.12)'
            : hovered ? 'var(--bg-glass-hover)' : 'transparent',
          border: `1px solid ${isActive ? 'rgba(16,185,129,0.15)' : 'transparent'}`,
        }}
        title="Click to select workspace"
      >
        {/* Icon */}
        <div className="w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0"
          style={{
            background: isActive
              ? 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))'
              : 'rgba(255,255,255,0.06)',
          }}>
          <MessageSquare size={13} style={{ color: isActive ? '#fff' : 'var(--text-secondary)' }} />
        </div>

        {/* Name or Input */}
        {isRenaming ? (
          <input
            ref={inputRef}
            value={renameValue}
            onChange={(e) => setRenameValue(e.target.value)}
            onBlur={handleRenameSubmit}
            onKeyDown={handleKeyDown}
            onClick={(e) => e.stopPropagation()}
            className="flex-1 text-sm font-medium bg-transparent outline-none"
            style={{ color: 'var(--text-primary)', borderBottom: '1px solid var(--accent-primary)' }}
          />
        ) : (
          <span className="flex-1 text-xs font-bold leading-[1.3]"
            title={workspace.name}
            style={{ 
              color: isActive ? 'var(--text-primary)' : 'var(--text-secondary)',
              wordBreak: 'break-word',
              overflowWrap: 'anywhere',
              whiteSpace: 'normal',
              display: 'block'
            }}>
            {workspace.name}
          </span>
        )}

        {/* Active dot (Only show if not hovering and active) */}
        {isActive && !hovered && !isRenaming && (
          <motion.div
            layoutId="active-dot"
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: 'var(--accent-primary)' }}
          />
        )}

        {/* Explicit Action Buttons (Visible on Hover or Active - mobile friendly) */}
        {(hovered || isActive) && !isRenaming && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="flex items-center gap-1"
          >
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); setIsRenaming(true) }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = 'var(--text-primary)'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Rename Business Bot"
              >
                <PenLine size={14} />
              </button>
            )}
            <button
              onClick={(e) => { 
                e.stopPropagation();
                const snippet = `<script src="https://ai-chatbot-lpap.onrender.com/static/widget.js" data-business-id="${workspace.id}"></script>`;
                navigator.clipboard.writeText(snippet);
                setCopied(true);
                setTimeout(() => setCopied(false), 2000);
              }}
              className="p-1.5 rounded-md transition-colors"
              style={{ color: copied ? '#10b981' : 'var(--text-muted)' }}
              onMouseEnter={e => e.currentTarget.style.color = copied ? '#10b981' : 'var(--text-primary)'}
              onMouseLeave={e => e.currentTarget.style.color = copied ? '#10b981' : 'var(--text-muted)'}
              title={copied ? "Copied Snippet!" : "Copy Embed Widget Snippet"}
            >
              {copied ? <Check size={14} /> : <Code size={14} />}
            </button>
            {isAdmin && (
              <button
                onClick={(e) => { e.stopPropagation(); setShowDeleteConfirm(true) }}
                className="p-1.5 rounded-md transition-colors"
                style={{ color: 'var(--text-muted)' }}
                onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
                onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
                title="Delete workspace"
              >
                <Trash2 size={14} />
              </button>
            )}
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
                    <h3 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>Delete Workspace</h3>
                    <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                      Are you sure you want to delete <strong style={{ color: 'var(--text-secondary)' }}>"{workspace.name}"</strong>? This action cannot be undone.
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
                    Delete Workspace
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
