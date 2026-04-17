import { motion, AnimatePresence } from 'framer-motion'
import { X, FileText, Link, Globe, File } from 'lucide-react'

function KnowledgeChip({ item, onRemove }) {
  const isUrl = item.type === 'url'
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.85 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.85 }}
      layout
      className="group flex items-center gap-2 px-3 py-2 rounded-xl"
      style={{
        background: 'var(--bg-glass)',
        border: '1px solid var(--border-subtle)',
      }}
    >
      <div className="w-6 h-6 rounded-lg flex items-center justify-center flex-shrink-0"
        style={{ background: isUrl ? 'rgba(96,165,250,0.15)' : 'rgba(124,106,247,0.15)' }}>
        {isUrl ? <Globe size={11} style={{ color: '#60a5fa' }} /> : <FileText size={11} style={{ color: 'var(--accent-primary)' }} />}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-medium truncate" style={{ color: 'var(--text-primary)', maxWidth: '160px' }}>{item.name}</p>
        <p className="text-xs truncate" style={{ color: 'var(--text-muted)' }}>{isUrl ? 'URL' : item.size}</p>
      </div>
      <motion.button
        whileHover={{ scale: 1.2 }}
        whileTap={{ scale: 0.9 }}
        onClick={() => onRemove(item.id)}
        className="opacity-0 group-hover:opacity-100 p-0.5 rounded-md"
        style={{ color: 'var(--text-muted)' }}
        onMouseEnter={e => e.currentTarget.style.color = '#f87171'}
        onMouseLeave={e => e.currentTarget.style.color = 'var(--text-muted)'}
      >
        <X size={11} />
      </motion.button>
    </motion.div>
  )
}

export default function KnowledgePanel({ items, onRemove, isOpen }) {
  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ height: 0, opacity: 0 }}
          animate={{ height: 'auto', opacity: 1 }}
          exit={{ height: 0, opacity: 0 }}
          transition={{ duration: 0.25, ease: [0.25, 0.46, 0.45, 0.94] }}
          style={{
            overflow: 'hidden',
            borderBottom: '1px solid var(--border-subtle)',
            background: 'rgba(17,17,24,0.6)',
            backdropFilter: 'blur(12px)',
          }}
        >
          <div className="px-4 py-3">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs font-semibold uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                Knowledge Base · {items.length} item{items.length !== 1 ? 's' : ''}
              </p>
            </div>
            {items.length === 0 ? (
              <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No files or URLs added yet.</p>
            ) : (
              <div className="flex flex-wrap gap-2">
                <AnimatePresence>
                  {items.map(item => (
                    <KnowledgeChip key={item.id} item={item} onRemove={onRemove} />
                  ))}
                </AnimatePresence>
              </div>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
