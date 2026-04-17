import { useState, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Upload, Link, FileText, Globe, CheckCircle2, AlertCircle } from 'lucide-react'

function FileDropZone({ onFiles }) {
  const [dragging, setDragging] = useState(false)
  const inputRef = useRef(null)

  const handleDrop = useCallback((e) => {
    e.preventDefault()
    setDragging(false)
    const files = Array.from(e.dataTransfer.files)
    if (files.length) onFiles(files)
  }, [onFiles])

  return (
    <motion.div
      onDragOver={e => { e.preventDefault(); setDragging(true) }}
      onDragLeave={() => setDragging(false)}
      onDrop={handleDrop}
      onClick={() => inputRef.current?.click()}
      animate={{ borderColor: dragging ? 'rgba(124,106,247,0.6)' : 'rgba(255,255,255,0.1)' }}
      className="relative flex flex-col items-center justify-center gap-3 p-8 rounded-2xl cursor-pointer"
      style={{
        border: '2px dashed rgba(255,255,255,0.1)',
        background: dragging ? 'rgba(124,106,247,0.06)' : 'rgba(255,255,255,0.02)',
        transition: 'all 0.2s ease',
      }}
    >
      <input ref={inputRef} type="file" multiple hidden onChange={e => onFiles(Array.from(e.target.files))} />

      <motion.div
        animate={{ scale: dragging ? 1.15 : 1, rotate: dragging ? 10 : 0 }}
        className="w-12 h-12 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(124,106,247,0.15)', border: '1px solid rgba(124,106,247,0.2)' }}
      >
        <Upload size={22} style={{ color: 'var(--accent-primary)' }} />
      </motion.div>

      <div className="text-center">
        <p className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
          {dragging ? 'Drop files here' : 'Drag & drop files'}
        </p>
        <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
          or <span style={{ color: 'var(--accent-primary)' }}>browse</span> · PDF, DOCX, TXT, CSV
        </p>
      </div>
    </motion.div>
  )
}

export default function UploadModal({ isOpen, onClose, onAddKnowledge, defaultTab = 'file' }) {
  const [tab, setTab] = useState(defaultTab)
  const [urlInput, setUrlInput] = useState('')
  const [urlStatus, setUrlStatus] = useState(null) // null | 'success' | 'error'
  const [files, setFiles] = useState([])

  const handleFiles = (incoming) => {
    const mapped = incoming.map(f => ({
      id: Date.now() + Math.random(),
      name: f.name,
      size: f.size > 1024 * 1024 ? `${(f.size / 1024 / 1024).toFixed(1)} MB` : `${Math.round(f.size / 1024)} KB`,
      type: 'file',
      rawFile: f
    }))
    setFiles(prev => [...prev, ...mapped])
    mapped.forEach(f => onAddKnowledge(f))
  }

  const handleAddUrl = () => {
    if (!urlInput.trim()) return
    try {
      new URL(urlInput)
      const item = {
        id: Date.now(),
        name: urlInput,
        type: 'url',
        size: '',
        rawUrl: urlInput
      }
      onAddKnowledge(item)
      setUrlStatus('success')
      setTimeout(() => { setUrlStatus(null); setUrlInput('') }, 1500)
    } catch {
      setUrlStatus('error')
      setTimeout(() => setUrlStatus(null), 2000)
    }
  }

  // Reset on open
  const handleClose = () => { setFiles([]); setUrlInput(''); setUrlStatus(null); onClose() }

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 z-40"
            style={{ background: 'rgba(0,0,0,0.7)', backdropFilter: 'blur(4px)' }}
          />

          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            transition={{ type: 'spring', stiffness: 350, damping: 28 }}
            className="fixed z-50 w-full max-w-lg mx-auto left-0 right-0"
            style={{
              top: '50%',
              transform: 'translateY(-50%)',
              background: 'var(--bg-elevated)',
              border: '1px solid var(--border-medium)',
              borderRadius: '24px',
              boxShadow: 'var(--shadow-elevated)',
              padding: '24px',
            }}
          >
            {/* Header */}
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-base font-semibold" style={{ color: 'var(--text-primary)' }}>
                Add to Knowledge Base
              </h2>
              <motion.button
                whileHover={{ scale: 1.1, rotate: 90 }}
                whileTap={{ scale: 0.95 }}
                onClick={handleClose}
                className="p-1.5 rounded-lg"
                style={{ color: 'var(--text-muted)', background: 'var(--bg-glass)' }}
              >
                <X size={15} />
              </motion.button>
            </div>

            {/* Tabs */}
            <div className="flex gap-1 mb-5 p-1 rounded-xl" style={{ background: 'var(--bg-glass)' }}>
              {[['file', FileText, 'Upload Files'], ['url', Globe, 'Add URL']].map(([t, Icon, label]) => (
                <motion.button
                  key={t}
                  onClick={() => setTab(t)}
                  className="flex-1 flex items-center justify-center gap-2 py-2 rounded-lg text-sm font-medium"
                  animate={{
                    background: tab === t ? 'var(--accent-primary)' : 'transparent',
                    color: tab === t ? '#fff' : 'var(--text-muted)',
                  }}
                  transition={{ duration: 0.2 }}
                >
                  <Icon size={13} />
                  {label}
                </motion.button>
              ))}
            </div>

            {/* Tab content */}
            <AnimatePresence mode="wait">
              {tab === 'file' ? (
                <motion.div
                  key="file"
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 10 }}
                >
                  <FileDropZone onFiles={handleFiles} />
                  {files.length > 0 && (
                    <motion.div className="mt-3 space-y-2" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                      {files.map(f => (
                        <div key={f.id} className="flex items-center gap-2 px-3 py-2 rounded-xl"
                          style={{ background: 'rgba(124,106,247,0.08)', border: '1px solid rgba(124,106,247,0.15)' }}>
                          <CheckCircle2 size={13} style={{ color: '#4ade80' }} />
                          <span className="text-xs flex-1 truncate" style={{ color: 'var(--text-secondary)' }}>{f.name}</span>
                          <span className="text-xs" style={{ color: 'var(--text-muted)' }}>{f.size}</span>
                        </div>
                      ))}
                    </motion.div>
                  )}
                </motion.div>
              ) : (
                <motion.div
                  key="url"
                  initial={{ opacity: 0, x: 10 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -10 }}
                  className="space-y-3"
                >
                  <div className="flex gap-2">
                    <input
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      onKeyDown={e => e.key === 'Enter' && handleAddUrl()}
                      placeholder="https://example.com/article"
                      className="flex-1 px-3 py-2.5 rounded-xl text-sm outline-none"
                      style={{
                        background: 'var(--bg-glass)',
                        border: `1px solid ${urlStatus === 'error' ? 'rgba(248,113,113,0.4)' : urlStatus === 'success' ? 'rgba(74,222,128,0.4)' : 'var(--border-medium)'}`,
                        color: 'var(--text-primary)',
                      }}
                    />
                    <motion.button
                      whileHover={{ scale: 1.04 }}
                      whileTap={{ scale: 0.97 }}
                      onClick={handleAddUrl}
                      className="px-4 py-2 rounded-xl text-sm font-medium"
                      style={{ background: 'var(--accent-primary)', color: '#fff' }}
                    >
                      Add
                    </motion.button>
                  </div>

                  <AnimatePresence>
                    {urlStatus === 'success' && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs" style={{ color: '#4ade80' }}>
                        <CheckCircle2 size={12} /> URL added to knowledge base
                      </motion.p>
                    )}
                    {urlStatus === 'error' && (
                      <motion.p initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                        className="flex items-center gap-1.5 text-xs" style={{ color: '#f87171' }}>
                        <AlertCircle size={12} /> Please enter a valid URL
                      </motion.p>
                    )}
                  </AnimatePresence>

                  <p className="text-xs" style={{ color: 'var(--text-muted)' }}>
                    Paste a webpage, blog post, or documentation URL to add it to your workspace knowledge base.
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  )
}
