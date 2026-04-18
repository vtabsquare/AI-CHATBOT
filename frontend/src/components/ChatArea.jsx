import { motion, AnimatePresence } from 'framer-motion'
import { useRef, useEffect } from 'react'
import { Sparkles, Bot } from 'lucide-react'
import ChatMessage from './ChatMessage'
import TypingIndicator from './TypingIndicator'
import LoadingSkeleton from './LoadingSkeleton'

export default function ChatArea({ messages, isTyping, isLoading, onPromptClick, activeKnowledge = [], botName = 'AI', isDarkMode = true, customQA = [] }) {
  const bottomRef = useRef(null)

  // Use custom QA questions if available, otherwise fallback to defaults
  const displayPrompts = customQA.length > 0 
    ? customQA.map(qa => qa.question) 
    : [
        'What services do you offer?',
        'How can I get started?',
        'Tell me about your pricing.',
        'What makes you unique?',
      ]


  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  const isEmpty = messages.length === 0

  return (
    <div
      className="flex-1 overflow-y-auto"
      style={{ scrollBehavior: 'smooth' }}
    >
      {isLoading ? (
        <div className="pt-6"><LoadingSkeleton /></div>
      ) : isEmpty ? (
        /* ── Welcome state ── */
        <motion.div
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15, duration: 0.5 }}
          className="flex flex-col items-center justify-center h-full px-4 text-center"
        >
          {/* Bot Avatar */}
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
            className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5 shadow-2xl"
            style={{ background: 'linear-gradient(135deg, #064e40, #10b981)', boxShadow: '0 8px 32px rgba(16,185,129,0.4)' }}
          >
            <Bot size={32} color="white" />
          </motion.div>

          <h2 className="text-2xl font-black text-primary mb-1">Hi, I'm <span className="text-transparent bg-clip-text bg-gradient-to-r from-emerald-400 to-teal-400">{botName}</span></h2>
          <p className="text-slate-500 text-sm mb-8 max-w-xs">Ask me anything about our products, services, or company. I'm here to help.</p>

          {/* Suggestion chips */}
          <div className="flex flex-wrap gap-2 justify-center max-w-sm">
            {displayPrompts.map((p, i) => (
              <motion.button
                key={i}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 + i * 0.07 }}
                onClick={() => onPromptClick(p)}
                className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300"
                style={{
                  background: 'rgba(255,255,255,0.03)',
                  border: '1px solid rgba(255,255,255,0.08)',
                  color: 'var(--text-secondary)'
                }}
              >
                <Sparkles size={11} className="text-emerald-400" />
                {p}
              </motion.button>
            ))}
          </div>
        </motion.div>
      ) : (
        /* ── Messages ── */
        <div className="pt-8 pb-2">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <ChatMessage key={msg.id} message={msg} isDarkMode={isDarkMode} />
            ))}
          </AnimatePresence>
          <AnimatePresence>
            {isTyping && <TypingIndicator isDarkMode={isDarkMode} />}
          </AnimatePresence>
        </div>
      )}
      <div ref={bottomRef} />
    </div>
  )
}
