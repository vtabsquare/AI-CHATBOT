import { motion } from 'framer-motion'
import { BookOpen, Menu, Sparkles } from 'lucide-react'

export default function TopBar({ workspaceName, onKnowledgeToggle, knowledgeOpen, onSidebarToggle, isMobile }) {
  return (
    <motion.header
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.1 }}
      className="flex items-center justify-between px-4 py-3 border-b"
      style={{
        borderColor: 'var(--border-subtle)',
        background: 'rgba(10,10,15,0.8)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        position: 'relative',
        zIndex: 5,
      }}
    >
      <div className="flex items-center gap-3">
        {isMobile && (
          <button onClick={onSidebarToggle} className="p-1.5 rounded-lg" style={{ color: 'var(--text-secondary)' }}>
            <Menu size={18} />
          </button>
        )}
        <div className="flex items-center gap-2">
          <motion.div
            animate={{ rotate: [0, 10, -10, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            <Sparkles size={14} style={{ color: 'var(--accent-primary)' }} />
          </motion.div>
          <h1 className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>
            {workspaceName}
          </h1>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={onKnowledgeToggle}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-medium"
          style={{
            background: knowledgeOpen ? 'rgba(124,106,247,0.2)' : 'var(--bg-glass)',
            border: `1px solid ${knowledgeOpen ? 'rgba(124,106,247,0.3)' : 'var(--border-subtle)'}`,
            color: knowledgeOpen ? 'var(--accent-primary)' : 'var(--text-secondary)',
          }}
        >
          <BookOpen size={13} />
          Knowledge
        </motion.button>
      </div>
    </motion.header>
  )
}
