import { useState, useRef, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Send, Paperclip, Link, Loader2, FileText, Globe } from 'lucide-react'

export default function ChatInput({ user, onSend, onOpenUpload, isTyping, activeContext = [], botName = 'AI', isDarkMode = true }) {
  const [value, setValue] = useState('')
  const [isFocused, setIsFocused] = useState(false)
  const textareaRef = useRef(null)
  const MAX_ROWS = 5

  const adjustHeight = () => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    const lineHeight = 22
    const maxHeight = lineHeight * MAX_ROWS
    el.style.height = Math.min(el.scrollHeight, maxHeight) + 'px'
    el.style.overflowY = el.scrollHeight > maxHeight ? 'auto' : 'hidden'
  }

  useEffect(() => { adjustHeight() }, [value])

  const handleSend = () => {
    const trimmed = value.trim()
    if (!trimmed || isTyping) return
    onSend(trimmed)
    setValue('')
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const canSend = value.trim().length > 0 && !isTyping

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.15 }}
      className="px-6 py-6"
      style={{ background: 'transparent' }}
    >
      <div className="max-w-4xl mx-auto flex flex-col gap-3">
        
        {/* ChatGPT Style Input Box */}
        <div
          className="relative flex items-end gap-2 px-3 py-3 rounded-[26px] transition-all min-h-[56px]"
          style={{
            background: 'var(--bg-elevated)',
            border: `1px solid ${isFocused ? 'rgba(16,185,129,0.45)' : 'var(--border-subtle)'}`,
            boxShadow: isFocused
              ? `0 0 0 3px rgba(16,185,129,0.15), ${isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 30px rgba(10,46,40,0.08)'}`
              : (isDarkMode ? '0 8px 32px rgba(0,0,0,0.4)' : '0 8px 30px rgba(10,46,40,0.06)')
          }}
        >
          {/* Textarea */}
          <textarea
            ref={textareaRef}
            value={value}
            onChange={e => setValue(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => setIsFocused(true)}
            onBlur={() => setIsFocused(false)}
            placeholder={`Ask ${botName} anything...`}
            rows={1}
            className="flex-1 resize-none bg-transparent outline-none px-3 py-1 text-[15px] self-center"
            style={{
              color: 'var(--text-primary)',
              lineHeight: '22px',
              maxHeight: `${22 * 10}px`, // Extends up to 10 rows
            }}
          />

          {/* Integrated Send button (Right Side) */}
          <motion.button
            whileHover={canSend ? { scale: 1.05 } : {}}
            whileTap={canSend ? { scale: 0.95 } : {}}
            onClick={handleSend}
            disabled={!canSend}
            className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center transition-all self-end mb-0.5"
            style={{
              background: canSend ? 'var(--accent-primary)' : 'rgba(255,255,255,0.05)',
              color: canSend ? '#fff' : 'var(--text-muted)',
              boxShadow: canSend ? '0 0 15px rgba(16,185,129,0.3)' : 'none',
            }}
          >
            <AnimatePresence mode="wait">
              {isTyping ? (
                <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Loader2 size={16} className="animate-spin" />
                </motion.div>
              ) : (
                <motion.div key="send" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                  <Send size={15} />
                </motion.div>
              )}
            </AnimatePresence>
          </motion.button>
        </div>

        <p className="text-center text-[10px] mt-2 font-medium" style={{ color: 'var(--text-muted)' }}>
          {botName} can make mistakes. Verify important info.
        </p>
      </div>
    </motion.div>
  )
}
