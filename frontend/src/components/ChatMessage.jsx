import { motion, AnimatePresence } from 'framer-motion'
import { Copy, Check, ThumbsUp, ThumbsDown, Bot } from 'lucide-react'
import { useState, useEffect, useRef } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter'
import { oneDark } from 'react-syntax-highlighter/dist/esm/styles/prism'

/* ── Code block ── */
function CodeBlock({ language, children }) {
  const [copied, setCopied] = useState(false)
  const code = String(children).replace(/\n$/, '')
  return (
    <div className="relative my-4 rounded-xl overflow-hidden" style={{ border: '1px solid rgba(255,255,255,0.1)' }}>
      <div className="flex items-center justify-between px-4 py-2" style={{ background: '#161b22', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
        <span className="text-[11px] font-mono" style={{ color: '#8b949e' }}>{language || 'code'}</span>
        <button
          onClick={() => { navigator.clipboard.writeText(code); setCopied(true); setTimeout(() => setCopied(false), 2000) }}
          className="flex items-center gap-1.5 text-[11px] px-2 py-0.5 rounded-md"
          style={{ color: copied ? '#4ade80' : '#8b949e', background: 'rgba(255,255,255,0.05)' }}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />}
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
      <SyntaxHighlighter
        language={language || 'text'}
        style={oneDark}
        PreTag="div"
        customStyle={{ margin: 0, padding: '1rem 1.25rem', background: '#0d1117', fontSize: '13.5px', lineHeight: '1.65', borderRadius: 0 }}
        codeTagProps={{ style: { fontFamily: '"Fira Code","JetBrains Mono",monospace' } }}
      >
        {code}
      </SyntaxHighlighter>
    </div>
  )
}

/* ── Shared markdown renderer ── */
function MarkdownContent({ text, showCursor }) {
  return (
    <div className="chat-prose">
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          code({ node, inline, className, children, ...props }) {
            const match = /language-(\w+)/.exec(className || '')
            if (!inline && match) return <CodeBlock language={match[1]}>{children}</CodeBlock>
            return (
              <code className="inline-code" style={{ fontFamily: '"Fira Code","JetBrains Mono",monospace' }} {...props}>
                {children}
              </code>
            )
          },
          p: ({ children }) => <p className="chat-p">{children}</p>,
          ul: ({ children }) => <ul className="chat-ul">{children}</ul>,
          ol: ({ children }) => <ol className="chat-ol">{children}</ol>,
          li: ({ children }) => <li className="chat-li">{children}</li>,
          h1: ({ children }) => <h1 className="chat-h1">{children}</h1>,
          h2: ({ children }) => <h2 className="chat-h2">{children}</h2>,
          h3: ({ children }) => <h3 className="chat-h3">{children}</h3>,
          h4: ({ children }) => <h4 className="chat-h4">{children}</h4>,
          strong: ({ children }) => <strong className="chat-strong">{children}</strong>,
          em: ({ children }) => <em className="chat-em">{children}</em>,
          blockquote: ({ children }) => <blockquote className="chat-blockquote">{children}</blockquote>,
          hr: () => <hr className="chat-hr" />,
          table: ({ children }) => <div className="chat-table-wrapper"><table className="chat-table">{children}</table></div>,
          thead: ({ children }) => <thead className="chat-thead">{children}</thead>,
          th: ({ children }) => <th className="chat-th">{children}</th>,
          td: ({ children }) => <td className="chat-td">{children}</td>,
          a: ({ children, href }) => <a href={href} target="_blank" rel="noopener noreferrer" className="chat-link">{children}</a>,
        }}
      >
        {text}
      </ReactMarkdown>
      {showCursor && (
        <motion.span
          animate={{ opacity: [1, 0, 1] }}
          transition={{ duration: 0.8, repeat: Infinity, ease: 'easeInOut' }}
          className="inline-block align-middle ml-0.5 rounded-sm"
          style={{ width: '2px', height: '1.1em', background: 'var(--accent-primary)', verticalAlign: 'text-bottom' }}
        />
      )}
    </div>
  )
}

/* ── Streaming markdown (chunk-by-chunk) ── */
function StreamingMarkdown({ text, onDone }) {
  const [displayed, setDisplayed] = useState('')
  const indexRef = useRef(0)

  useEffect(() => {
    setDisplayed('')
    indexRef.current = 0
    const tick = () => {
      if (indexRef.current >= text.length) { onDone?.(); return }
      indexRef.current = Math.min(indexRef.current + 4, text.length)
      setDisplayed(text.slice(0, indexRef.current))
      setTimeout(tick, 12)
    }
    const t = setTimeout(tick, 30)
    return () => clearTimeout(t)
  }, [text])

  return <MarkdownContent text={displayed} showCursor={displayed.length < text.length} />
}

/* ── Action button ── */
function ActionBtn({ onClick, title, children }) {
  return (
    <motion.button
      whileHover={{ scale: 1.08 }}
      whileTap={{ scale: 0.92 }}
      onClick={onClick}
      title={title}
      className="p-1.5 rounded-lg flex items-center gap-1 text-[11px]"
      style={{ color: 'var(--text-muted)', background: 'transparent' }}
      onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.06)'}
      onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
    >
      {children}
    </motion.button>
  )
}

/* ── Main ── */
export default function ChatMessage({ message, isDarkMode = true }) {
  const isUser = message.role === 'user'
  const [copied, setCopied] = useState(false)
  const [liked, setLiked] = useState(null)
  const [streamDone, setStreamDone] = useState(!message.isStreaming)
  const [isFocused, setIsFocused] = useState(false)
  const botName = "Llama 3"

  const handleCopy = () => {
    navigator.clipboard.writeText(message.content)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  if (isUser) {
    return (
      <motion.div
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.25 }}
        className="flex items-end justify-end gap-3 px-4 md:px-10 mb-6"
      >
        {/* Message bubble */}
        <div
          className="max-w-[68%] px-5 py-3 text-[15.5px] leading-[1.7] whitespace-pre-wrap"
          style={{
            background: isDarkMode ? 'rgba(255,255,255,0.07)' : 'rgba(5,150,105,0.06)',
            border: `1px solid ${isFocused ? 'rgba(16,185,129,0.45)' : 'var(--border-subtle)'}`,
            boxShadow: isDarkMode 
              ? (isFocused ? '0 0 0 3px rgba(16,185,129,0.15), 0 8px 32px rgba(0,0,0,0.4)' : '0 8px 32px rgba(0,0,0,0.4)')
              : (isFocused ? '0 0 0 3px rgba(16,185,129,0.1)' : '0 4px 12px rgba(10,46,40,0.04)'),
            borderRadius: '22px',
            borderBottomRightRadius: '6px',
            color: 'var(--text-primary)',
            fontWeight: 400,
          }}
        >
          {message.content}
        </div>

        {/* User avatar */}
        <div
          className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-semibold"
          style={{
            background: 'linear-gradient(135deg, #064e40, #10b981)',
            color: '#fff',
            flexShrink: 0,
          }}
        >
          U
        </div>
      </motion.div>
    )
  }

  /* AI message */
  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="group flex gap-4 px-4 md:px-10 mb-8"
    >
      {/* AI icon */}
      <div
        className="w-8 h-8 rounded-xl flex-shrink-0 flex items-center justify-center mt-0.5"
        style={{ 
          background: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(16,185,129,0.08)', 
          border: `1px solid ${isDarkMode ? 'rgba(16,185,129,0.2)' : 'rgba(16,185,129,0.15)'}`, 
          flexShrink: 0 
        }}
      >
        <Bot size={15} style={{ color: 'var(--accent-primary)' }} />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0 max-w-3xl">
        {/* Sender label */}
        <div className="text-[11px] font-semibold mb-2 uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
          {botName}
        </div>

        {/* Markdown body */}
        {message.isStreaming && !streamDone ? (
          <StreamingMarkdown text={message.content} onDone={() => setStreamDone(true)} />
        ) : (
          <MarkdownContent text={message.content} showCursor={false} />
        )}

        {/* Action row on hover */}
        {(streamDone || !message.isStreaming) && (
          <div className="flex items-center gap-0.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <ActionBtn onClick={handleCopy} title="Copy response" className="flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-medium border transition-all hover:border-emerald-500/40 hover:bg-emerald-500/10 hover:text-emerald-300">
              {copied ? <><Check size={13} style={{ color: '#4ade80' }} /><span style={{ color: '#4ade80' }}>Copied</span></> : <><Copy size={13} />Copy</>}
            </ActionBtn>
            <ActionBtn onClick={() => setLiked(l => l === 'up' ? null : 'up')} title="Good response">
              <ThumbsUp size={13} style={{ color: liked === 'up' ? '#10b981' : undefined }} />
            </ActionBtn>
            <ActionBtn onClick={() => setLiked(l => l === 'down' ? null : 'down')} title="Bad response">
              <ThumbsDown size={13} style={{ color: liked === 'down' ? '#f87171' : undefined }} />
            </ActionBtn>
          </div>
        )}
      </div>
    </motion.div>
  )
}
