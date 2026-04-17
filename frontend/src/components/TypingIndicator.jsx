import { motion } from 'framer-motion'
import { Bot, Loader2 } from 'lucide-react'

export default function TypingIndicator({ statusText = 'Thinking...', isDarkMode = true }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0 }}
      transition={{ duration: 0.25 }}
      className="flex gap-4 px-4 md:px-10 mb-8"
    >
      {/* AI icon */}
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ 
          background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)', 
          border: `1px solid ${isDarkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}` 
        }}
      >
        <Bot size={15} style={{ color: 'var(--accent-primary)' }} />
      </div>

      <div className="flex-1 max-w-3xl pt-1">
        {/* Sender label */}
        <div className="text-[11px] font-semibold mb-3 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          Llama 3
        </div>

        {/* Skeleton lines */}
        <div className="flex flex-col gap-2.5">
          {[85, 72, 55].map((w, i) => (
            <motion.div
              key={i}
              className="skeleton rounded-full"
              style={{ height: '13px', width: `${w}%`, opacity: 1 - i * 0.15 }}
              animate={{ opacity: [0.4 - i * 0.07, 0.9 - i * 0.1, 0.4 - i * 0.07] }}
              transition={{ duration: 1.4, repeat: Infinity, ease: 'easeInOut', delay: i * 0.18 }}
            />
          ))}
        </div>

        {/* Status line */}
        <motion.div
          className="flex items-center gap-2 mt-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Loader2 size={11} className="animate-spin" style={{ color: 'var(--accent-primary)' }} />
          <span className="text-[11px] font-mono tracking-wide uppercase" style={{ color: 'var(--text-muted)' }}>
            {statusText}
          </span>
        </motion.div>
      </div>
    </motion.div>
  )
}
