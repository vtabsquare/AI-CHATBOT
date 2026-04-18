/**
 * ChatBox.jsx — Main Dashboard
 * SaaS 2.0: Admin Metrics | Onboarding Management | Client Catalogue | Reviews | Bot Identity
 */

import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

import Sidebar        from '../components/Sidebar'
import ChatArea       from '../components/ChatArea'
import ChatInput      from '../components/ChatInput'
import UploadModal    from '../components/UploadModal'
import SearchModal    from '../components/SearchModal'
import CreateBotModal from '../components/CreateBotModal'
import TrainingStats   from '../pages/TrainingStats'

const API_BASE = 'https://ai-chatbot-lpap.onrender.com/api'

// ── Status badge helper ───────────────────────────────────────────────────────
function StatusBadge({ status }) {
  const map = {
    pending:  { label: '⏳ Pending',  cls: 'bg-amber-800/10 text-amber-500 border-amber-500/20' },
    approved: { label: '✅ Approved', cls: 'bg-emerald-800/10 text-emerald-500 border-emerald-500/20' },
    rejected: { label: '❌ Rejected', cls: 'bg-red-800/10 text-red-500 border-red-500/20' },
  }
  const { label, cls } = map[status] || map['pending']
  return (
    <span className={`px-4 py-1.5 rounded-full text-[10px] font-black uppercase tracking-widest border ${cls}`}>
      {label}
    </span>
  )
}

// ── Star Rating display ───────────────────────────────────────────────────────
function Stars({ rating }) {
  return (
    <span className="text-amber-400 text-sm">
      {'★'.repeat(rating)}{'☆'.repeat(5 - rating)}
    </span>
  )
}

export default function ChatBox({ token, user, onLogout, isDarkMode: propIsDarkMode, onToggleTheme: propOnToggleTheme, initialView = 'chat' }) {
  // ── Session Safety Guard: Prevent White Screen on Refresh crashes ─────────
  if (!user && token) {
    return (
      <div className="min-h-screen bg-[#061a15] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin mb-6"></div>
        <h2 className="text-xl font-bold text-white mb-2">Restoring Secure Session...</h2>
        <p className="text-emerald-500/60 text-sm font-medium">Re-hydrating your workspace environment from local cluster</p>
      </div>
    )
  }

  if (!user) return null

  // ── Retry Helper ────────────────────────────────────────────────────────
  const sleep = (ms) => new Promise(res => setTimeout(res, ms))

  const authFetch = async (url, options = {}, retries = 5) => {
    try {
      const res = await fetch(url, {
        ...options,
        headers: { ...options.headers, 'Authorization': `Bearer ${token}` }
      })
      
      if (res.status === 401) { 
        console.warn("[Auth] Session expired or invalid token")
        onLogout()
        return null 
      }

      // ── Smart Retry for Supabase 'Waking Up' ──
      // Use .clone() so the backend doesn't 'consume' the data before the app can use it!
      if (res.status === 500 && retries > 0) {
        const body = await res.clone().json().catch(() => ({}))
        if (body.retry_suggested) {
          console.warn(`[Supabase] Database waking up. Retrying in 4s... (${retries} left)`)
          await sleep(4000)
          return authFetch(url, options, retries - 1)
        }
      }

      return res
    } catch (err) {
      if (retries > 0) {
        console.warn(`[Network] Connection slow. Retrying in 2.5s... (${retries} left)`)
        await sleep(2500)
        return authFetch(url, options, retries - 1)
      }
      console.error("[Network] Fetch failed after retries:", err)
      return null
    }
  }

  // ── Workspace state ──────────────────────────────────────────────────────
  const [workspaces,   setWorkspaces]   = useState([])
  const [activeWsId,   setActiveWsId]   = useState(null)
  const [isInitialLoading, setIsInitialLoading] = useState(true)
  const [isSubmitting,     setIsSubmitting]     = useState(false)

  // ── Sidebar + mobile ─────────────────────────────────────────────────────
  const [isSidebarCollapsed, setSidebarCollapsed] = useState(false)
  const [isMobile, setIsMobile] = useState(window.innerWidth < 768)
  useEffect(() => {
    const onResize = () => { const m = window.innerWidth < 768; setIsMobile(m); if (m) setSidebarCollapsed(true) }
    window.addEventListener('resize', onResize)
    return () => window.removeEventListener('resize', onResize)
  }, [])

  // ── UI state ─────────────────────────────────────────────────────────────
  const [isDarkMode,           setIsDarkMode]           = useState(propIsDarkMode ?? true)
  const [uploadModalOpen,      setUploadModalOpen]      = useState(false)
  const [uploadTab,            setUploadTab]            = useState('file')
  const [searchOpen,           setSearchOpen]           = useState(false)
  const [isCreateBotModalOpen, setIsCreateBotModalOpen] = useState(false)
  const [view, setView] = useState(initialView) // chat | catalogue | qa | reviews | settings | onboarding | training

  useEffect(() => {
    const onKey = (e) => { if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setSearchOpen(true) } }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  // ── Chat state ───────────────────────────────────────────────────────────
  const [chats,        setChats]        = useState({})
  const [activeChatId, setActiveChatId] = useState(null)
  const [messages,     setMessages]     = useState({})
  const [isTyping,     setIsTyping]     = useState(false)
  const [knowledgeItems, setKnowledgeItems] = useState({})

  // ── SaaS 2.0 state ───────────────────────────────────────────────────────
  const [adminMetrics,       setAdminMetrics]       = useState({ total_clients: 0, new_today: 0, retention: 0 })
  const [onboardingRequests, setOnboardingRequests] = useState([])
  const [customQA,           setCustomQA]           = useState([])
  const [analytics,          setAnalytics]          = useState({ 
    total_questions: 0, 
    unique_questions: 0, 
    unique_question_list: [], 
    total_question_list: [], 
    review_count: 0 
  })
  const [reviews,            setReviews]            = useState([])
  const [botPersona,         setBotPersona]         = useState({ 
    bot_name: 'AI Assistant', 
    bot_greeting: 'How can I help you today?',
    theme_primary: '#2dd4bf',
    theme_secondary: '#064e40',
    theme_bg: 'glass',
    theme_font: 'Inter',
    bot_avatar_url: '/static/bot_avatar.png',
    url: ''
  })
  const [editReq,            setEditReq]            = useState(null) // onboarding request being edited
  const [catalogueFilter,    setCatalogueFilter]    = useState('unique') // unique | total
  const [metricPanel,        setMetricPanel]        = useState(null) // null | 'total_clients' | 'new_today' | 'retention'

  const [catalogueDays,      setCatalogueDays]      = useState('all')
  const [reviewDays,         setReviewDays]         = useState('all')
  const [onboardingDays,     setOnboardingDays]     = useState('all')
  const [leads,              setLeads]              = useState([])
  const [leadsDays,          setLeadsDays]          = useState('all')
  const [copySuccess,        setCopySuccess]        = useState(false)

  // ── QA form state ────────────────────────────────────────────────────────
  const newQRef = useRef(null)
  const newARef = useRef(null)

  // ── INIT: Fetch all dashboard data in a single 'Bulk' payload ──────────────
  useEffect(() => {
    let retryCount = 0;
    const maxRetries = 3;

    const init = async () => {
      setIsInitialLoading(true)
      try {
        // Use the new Bulk Init API
        const r = await authFetch(`${API_BASE}/dashboard/init${activeWsId ? `?ws_id=${activeWsId}` : ''}`)
        if (!r || !r.ok) {
          if (retryCount < maxRetries) {
            retryCount++;
            setTimeout(init, 2000);
            return;
          }
          setIsInitialLoading(false);
          return;
        }
        
        const bundle = await r.json()
        
        // Populate Workspaces
        if (bundle.workspaces) {
          setWorkspaces(bundle.workspaces)
          if (bundle.active_ws_id) {
            setActiveWsId(bundle.active_ws_id)
          }
        }

        // Populate Admin Data
        if (bundle.admin_data) {
          if (bundle.admin_data.metrics) setAdminMetrics(bundle.admin_data.metrics)
          if (bundle.admin_data.onboarding) setOnboardingRequests(bundle.admin_data.onboarding)
        }

        // Populate Workspace specific data (Initial Bundle)
        if (bundle.workspace_data) {
          const wsId = bundle.active_ws_id
          const d = bundle.workspace_data
          if (d.threads) {
            setChats(p => ({ ...p, [wsId]: d.threads }))
            if (d.threads.length > 0 && !activeChatId) setActiveChatId(d.threads[0].id)
          }
          if (d.knowledge) setKnowledgeItems(p => ({ ...p, [wsId]: d.knowledge }))
          if (d.persona) setBotPersona(d.persona)
          if (d.qa) setCustomQA(d.qa)
          if (d.reviews) setReviews(d.reviews)
          if (d.leads) setLeads(d.leads)
          if (d.analytics) setAnalytics(d.analytics)
        }

      } catch (err) {
        console.error("[INIT ERROR]", err);
        if (retryCount < maxRetries) {
          retryCount++;
          setTimeout(init, 2000);
        }
      } finally {
        setIsInitialLoading(false)
      }
    }
    init()
  }, []) // Only run once on mount

  // ── RE-FETCH: Only triggered when user MANUALLY switches workspaces ──────
  // We use a ref to skip the very first run (which is handled by Init)
  const isFirstRun = useRef(true)

  useEffect(() => {
    if (isFirstRun.current) {
      isFirstRun.current = false
      return
    }
    if (!activeWsId) return
    
    const fetchWsData = async () => {
      // 1. Fetch Chat Threads
      authFetch(`${API_BASE}/chat_threads/${activeWsId}`)
        .then(r => r?.ok ? r.json() : null)
        .then(d => { if(d) setChats(p => ({ ...p, [activeWsId]: d })) })

      // 2. Fetch Knowledge
      authFetch(`${API_BASE}/knowledge/${activeWsId}`)
        .then(r => r?.ok ? r.json() : null)
        .then(d => { if(d) setKnowledgeItems(p => ({ ...p, [activeWsId]: d })) })

      // 3. Fetch Widget Config
      authFetch(`${API_BASE}/widget/config/${activeWsId}`)
        .then(r => r?.ok ? r.json() : null)
        .then(d => { if(d) setBotPersona(d) })

      // 4. Fetch Q&A Suggestions
      authFetch(`${API_BASE}/client/qa?ws_id=${activeWsId}`)
        .then(r => r?.ok ? r.json() : null)
        .then(d => { if(d) setCustomQA(d) })

      // 5. Fetch Reviews
      authFetch(`${API_BASE}/client/reviews?ws_id=${activeWsId}`)
        .then(r => r?.ok ? r.json() : null)
        .then(d => { if(d) setReviews(d) })

      // 6. Fetch Leads
      authFetch(`${API_BASE}/client/leads?ws_id=${activeWsId}`)
        .then(r => r?.ok ? r.json() : null)
        .then(d => { if(d) setLeads(d) })

      // 7. Fetch Analytics
      authFetch(`${API_BASE}/client/analytics?ws_id=${activeWsId}&days=${catalogueDays}`)
        .then(r => r?.json())
        .then(data => { if (data) setAnalytics(data) })
    }
    fetchWsData()
  }, [activeWsId])

  // Split effect for days filter (so it doesn't re-fetch everything only for analytics)
  useEffect(() => {
    if (isFirstRun.current || !activeWsId) return
    authFetch(`${API_BASE}/client/analytics?ws_id=${activeWsId}&days=${catalogueDays}`)
      .then(r => r?.json())
      .then(data => { if (data) setAnalytics(data) })
  }, [catalogueDays])

  // ── Fetch messages when active chat changes ──────────────────────────────
  useEffect(() => {
    if (!activeChatId) return
    authFetch(`${API_BASE}/chat_messages/${activeChatId}`)
      .then(r => r?.json())
      .then(data => {
        if (!data) return
        setMessages(prev => ({
          ...prev,
          [activeChatId]: data.map((m, i) => ({ id: i.toString(), role: m.role, content: m.content, timestamp: Date.now() }))
        }))
      })
  }, [activeChatId])

  // ── Derived ──────────────────────────────────────────────────────────────
  const activeWsChats  = chats[activeWsId] || []
  const activeMessages = activeChatId ? (messages[activeChatId] || []) : []
  const activeKnowledge = knowledgeItems[activeWsId] || []

  const filterByDays = (list, daysStr) => {
    if (daysStr === 'all') return list
    const past = new Date()
    if (daysStr === 'today') {
      past.setHours(0, 0, 0, 0)
    } else if (daysStr.endsWith('m')) {
      const months = parseInt(daysStr, 10)
      past.setMonth(past.getMonth() - months)
    } else {
      past.setDate(past.getDate() - parseInt(daysStr, 10))
    }
    return list.filter(item => new Date(item.created_at || item.timestamp) >= past)
  }
  const filteredReviews = filterByDays(reviews, reviewDays)
  const filteredOnboarding = filterByDays(onboardingRequests || [], onboardingDays)
  const filteredLeads = filterByDays(leads || [], leadsDays)

  // ── Workspace handlers ────────────────────────────────────────────────────
  const handleSelectWorkspace = (id) => {
    setActiveWsId(id)
    const wsChats = chats[id] || []
    setActiveChatId(wsChats.length > 0 ? wsChats[0].id : null)
  }
  const handleDeleteWorkspace = async (id) => {
    await authFetch(`${API_BASE}/workspace/${id}`, { method: 'DELETE' })
    const updated = workspaces.filter(w => w.id !== id)
    setWorkspaces(updated)
    if (activeWsId === id && updated.length > 0) handleSelectWorkspace(updated[0].id)
  }
  const handleRenameWorkspace = async (id, newName) => {
    await authFetch(`${API_BASE}/workspace/${id}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName })
    })
    setWorkspaces(prev => prev.map(w => w.id === id ? { ...w, name: newName } : w))
  }

  // ── Onboarding handlers ──────────────────────────────────────────────────
  const handleDeleteOnboarding = async (reqId) => {
    if (!confirm('Are you sure you want to delete this onboarding request?')) return
    const r = await authFetch(`${API_BASE}/admin/onboarding/${reqId}`, { method: 'DELETE' })
    if (r?.ok) setOnboardingRequests(prev => prev.filter(req => req.id !== reqId))
  }

  const handleResendOnboarding = async (reqId, formData) => {
    const r = await authFetch(`${API_BASE}/admin/onboarding/${reqId}/resend`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(formData)
    })
    if (r?.ok) {
      const updated = await r.json()
      const listRes = await authFetch(`${API_BASE}/admin/onboarding/all`)
      if (listRes) setOnboardingRequests(await listRes.json())
      setEditReq(null)
      alert('✅ ' + (updated.message || 'Request updated & email re-sent'))
    }
  }

  // ── Chat handlers ─────────────────────────────────────────────────────────
  const handleCreateChat = async () => {
    const r = await authFetch(`${API_BASE}/chat_thread`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ workspace_id: activeWsId, title: 'New Chat' })
    })
    const newChat = await r.json()
    setChats(prev => ({ ...prev, [activeWsId]: [newChat, ...(prev[activeWsId] || [])] }))
    setMessages(prev => ({ ...prev, [newChat.id]: [] }))
    setActiveChatId(newChat.id)
  }
  const handleRenameChat = async (chatId, newTitle) => {
    await authFetch(`${API_BASE}/chat_thread/${chatId}`, {
      method: 'PUT', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title: newTitle })
    })
    setChats(prev => ({ ...prev, [activeWsId]: prev[activeWsId].map(c => c.id === chatId ? { ...c, title: newTitle } : c) }))
  }
  const handleDeleteChat = async (chatId) => {
    await authFetch(`${API_BASE}/chat_thread/${chatId}`, { method: 'DELETE' })
    setChats(prev => {
      const list = prev[activeWsId].filter(c => c.id !== chatId)
      if (activeChatId === chatId) setActiveChatId(list.length > 0 ? list[0].id : null)
      return { ...prev, [activeWsId]: list }
    })
  }

  // ── Send message ──────────────────────────────────────────────────────────
  const handleSend = async (text) => {
    let targetChatId = activeChatId
    if (!targetChatId) {
      if (!activeWsId) return
      const r = await authFetch(`${API_BASE}/chat_thread`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: activeWsId, title: text.substring(0, 30) + '...' })
      })
      const newChat = await r.json()
      targetChatId = newChat.id
      setChats(prev => ({ ...prev, [activeWsId]: [newChat, ...(prev[activeWsId] || [])] }))
      setActiveChatId(targetChatId)
    }
    const userMsg = { id: Date.now().toString(), role: 'user', content: text, timestamp: Date.now() }
    setMessages(prev => ({ ...prev, [targetChatId]: [...(prev[targetChatId] || []), userMsg] }))
    setIsTyping(true)
    try {
      const res = await authFetch(`${API_BASE}/chat`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: activeWsId, chat_id: targetChatId, message: text })
      })
      const data = await res.json()
      const aiMsg = { id: (Date.now() + 1).toString(), role: 'ai', content: data.response || data.error || 'Error', timestamp: Date.now() }
      setMessages(prev => ({ ...prev, [targetChatId]: [...(prev[targetChatId] || []), aiMsg] }))
    } catch (e) { console.error(e) } finally { setIsTyping(false) }
  }

  // ── Knowledge handlers ────────────────────────────────────────────────────
  const handleAddKnowledge = async (item) => {
    if (item.type === 'url') {
      const r = await authFetch(`${API_BASE}/scrape`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ workspace_id: activeWsId, url: item.rawUrl }) })
      const data = await r.json()
      if (data.items) {
        setKnowledgeItems(prev => ({ ...prev, [activeWsId]: [...(prev[activeWsId] || []), ...data.items] }))
        alert(`✅ Success! We found and indexed ${data.count} pages from the website.`)
      } else if (data.id) {
        setKnowledgeItems(prev => ({ ...prev, [activeWsId]: [...(prev[activeWsId] || []), data] }))
      }
    } else if (item.type === 'file' && item.rawFile) {
      const formData = new FormData()
      formData.append('file', item.rawFile)
      formData.append('workspace_id', activeWsId)
      const r = await authFetch(`${API_BASE}/upload_file`, { method: 'POST', body: formData })
      const data = await r.json()
      if (data.id) setKnowledgeItems(prev => ({ ...prev, [activeWsId]: [...(prev[activeWsId] || []), data] }))
    }
  }
  const handleRemoveKnowledge = async (itemId) => {
    await authFetch(`${API_BASE}/knowledge/${itemId}`, { method: 'DELETE' })
    setKnowledgeItems(prev => ({ ...prev, [activeWsId]: prev[activeWsId].filter(i => i.id !== itemId) }))
  }

  // ── QA handlers ──────────────────────────────────────────────────────────
  const handleAddQA = async () => {
    const q = newQRef.current?.value?.trim()
    const a = newARef.current?.value?.trim()
    if (!q || !a) return
    await authFetch(`${API_BASE}/client/qa`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ question: q, answer: a })
    })
    const r = await authFetch(`${API_BASE}/client/qa?ws_id=${activeWsId}`)
    if (r) setCustomQA(await r.json())
    if (newQRef.current) newQRef.current.value = ''
    if (newARef.current) newARef.current.value = ''
  }
  const handleDeleteQA = async (id) => {
    await authFetch(`${API_BASE}/client/qa/${id}`, { method: 'DELETE' })
    setCustomQA(prev => prev.filter(q => q.id !== id))
  }
  const handleDeleteLead = async (id) => {
    if (!confirm('Permanently delete this user record? This will also remove their associated reviews and feedback.')) return
    const leadToDelete = leads.find(l => l.id === id)
    const emailToSync = leadToDelete ? leadToDelete.email : null
    await authFetch(`${API_BASE}/client/lead/${id}`, { method: 'DELETE' })
    setLeads(prev => prev.filter(l => l.id !== id))
    if (emailToSync) {
      setReviews(prev => prev.filter(r => r.user_email !== emailToSync))
    }
  }

  // ── CSS shorthand helpers ─────────────────────────────────────────────────
  const cardCls   = "p-7 rounded-[24px] transition-all bg-surface border border-subtle hover:border-medium shadow-glass"
  const inputCls  = `w-full ${isDarkMode ? 'bg-[#11332c]' : 'bg-white'} border-subtle border px-4 py-3 rounded-2xl outline-none` +
                    " focus:ring-1 ring-emerald-500/50 text-sm focus:border-emerald-400 text-primary transition-all shadow-inner"
  const selectCls = "bg-surface border border-subtle px-4 py-2 rounded-xl text-xs font-bold text-primary " +
                    "outline-none cursor-pointer hover:border-medium transition-all shadow-sm focus:ring-1 ring-emerald-500/30"
  const tabBtnCls = (v) => `px-4 py-2 rounded-xl text-xs font-bold transition-all ${
    view === v
      ? isDarkMode ? 'bg-[#064e40] text-[#10b981] shadow-lg shadow-emerald-500/10 border border-emerald-500/20' 
                   : 'bg-emerald-50 text-emerald-700 shadow-md border border-emerald-200'
      : 'text-muted hover:text-primary hover:bg-surface'
  }`

  // ── RENDER ────────────────────────────────────────────────────────────────
  return (
    <div
      className={`flex h-screen w-full overflow-hidden font-sans ${isDarkMode ? 'theme-dark' : 'theme-light'}`}
      style={{ background: 'var(--bg-base)', color: 'var(--text-primary)' }}
    >
      {/* ── Initial Loading Overlay ── */}
      <AnimatePresence>
        {isInitialLoading && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[9999] flex flex-col items-center justify-center nature-glass backdrop-blur-xl"
          >
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
              className="w-16 h-16 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full mb-6"
            />
            <h3 className="text-xl font-bold text-primary tracking-tight">Waking up Intelligence...</h3>
            <p className="text-muted text-sm mt-2 opacity-60">Handshaking with Supabase Secure Cluster</p>
          </motion.div>
        )}
      </AnimatePresence>

      <Sidebar
        user={user} onLogout={onLogout}
        workspaces={workspaces} activeWsId={activeWsId}
        onSelectWs={(id) => { handleSelectWorkspace(id); if (isMobile) setSidebarCollapsed(true) }}
        onCreateWs={() => setIsCreateBotModalOpen(true)}
        onDeleteWs={handleDeleteWorkspace} onRenameWs={handleRenameWorkspace}
        chats={activeWsChats} activeChatId={activeChatId}
        onSelectChat={(id) => { setActiveChatId(id); if (isMobile) setSidebarCollapsed(true) }}
        onCreateChat={handleCreateChat} onRenameChat={handleRenameChat} onDeleteChat={handleDeleteChat}
        collapsed={isSidebarCollapsed} onToggle={() => setSidebarCollapsed(s => !s)}
        isDarkMode={isDarkMode} onToggleTheme={() => setIsDarkMode(d => !d)}
      />

      {/* ── Main Panel ── */}
      <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden" style={{ background: 'var(--bg-base)' }}>

        {/* ── Admin Metrics Bar ── */}
        {user.role === 'admin' && (() => {
          const metricDefs = [
            { key: 'total_clients', label: 'Total Clients', value: adminMetrics.total_clients, color: '#059669', bg: isDarkMode ? 'rgba(16,185,129,0.06)' : 'rgba(5,150,105,0.08)', border: isDarkMode ? 'rgba(16,185,129,0.1)' : 'rgba(5,150,105,0.15)' },
            { key: 'new_today',     label: 'New Today',     value: `+${adminMetrics.new_today}`, color: isDarkMode ? '#2dd4bf' : '#0d9488', bg: isDarkMode ? 'rgba(45,212,191,0.06)' : 'rgba(13,148,136,0.08)', border: isDarkMode ? 'rgba(45,212,191,0.1)' : 'rgba(13,148,136,0.15)' },
            { key: 'retention',     label: 'Retention',     value: `${adminMetrics.retention}%`, color: isDarkMode ? '#86efac' : '#15803d', bg: isDarkMode ? 'rgba(134,239,172,0.06)' : 'rgba(21,128,61,0.08)', border: isDarkMode ? 'rgba(134,239,172,0.1)' : 'rgba(21,128,61,0.15)' },
          ]
          const today = new Date().toLocaleDateString()
          const panelClients = {
            total_clients: onboardingRequests,
            new_today:     onboardingRequests.filter(r => new Date(r.created_at).toLocaleDateString() === today),
            retention:     onboardingRequests.filter(r => r.status === 'approved'),
          }
          return (
            <div className="flex-shrink-0 border-b border-subtle bg-surface">
              <div className="px-6 py-3 flex gap-3 flex-wrap">
                {metricDefs.map(m => (
                  <button
                    key={m.key}
                    onClick={() => setMetricPanel(metricPanel === m.key ? null : m.key)}
                    className="flex flex-col px-4 py-2 rounded-xl flex-shrink-0 text-left transition-all hover:scale-105 active:scale-95"
                    style={{
                      background: m.bg,
                      border: `1px solid ${metricPanel === m.key ? m.color : m.border}`,
                      cursor: 'pointer',
                      boxShadow: metricPanel === m.key ? `0 0 10px ${m.bg}` : 'none',
                    }}
                  >
                    <span className="text-[8px] font-black uppercase tracking-[0.18em]" style={{ color: m.color, opacity: 0.85 }}>{m.label}</span>
                    <span className="text-lg font-black mt-0.5 leading-none" style={{ color: m.color }}>{m.value}</span>
                  </button>
                ))}
              </div>

              {/* ── Metric Detail Panel ── */}
              {metricPanel && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  exit={{ opacity: 0, height: 0 }}
                  className="mx-6 mb-4 rounded-2xl overflow-hidden border"
                  style={{
                    background: isDarkMode ? 'rgba(255,255,255,0.03)' : 'var(--bg-elevated)',
                    border: isDarkMode ? '1px solid rgba(255,255,255,0.08)' : '1px solid var(--border-subtle)',
                    color: 'var(--text-secondary)'
                  }}
                >
                  <div className="flex items-center justify-between px-5 py-3 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
                    <span className="text-xs font-black uppercase tracking-widest" style={{ color: 'var(--text-muted)' }}>
                      {metricDefs.find(d => d.key === metricPanel)?.label} — Client Details
                    </span>
                    <button onClick={() => setMetricPanel(null)} className="text-xs px-3 py-1 rounded-full hover:bg-white/10 transition-colors" style={{ color: 'var(--text-muted)' }}>✕ Close</button>
                  </div>
                  <div className="max-h-48 overflow-y-auto divide-y" style={{ divideColor: 'var(--border-subtle)' }}>
                    {(panelClients[metricPanel] || []).length === 0 ? (
                      <p className="text-center py-6 text-sm" style={{ color: 'var(--text-muted)' }}>No clients for this metric.</p>
                    ) : (
                      (panelClients[metricPanel] || []).map(req => (
                        <div key={req.id} className="flex items-center gap-4 px-5 py-3 hover:bg-white/[0.03] transition-colors">
                          <div className="w-8 h-8 rounded-full flex-shrink-0 flex items-center justify-center text-xs font-black text-white"
                            style={{ background: 'linear-gradient(135deg, #8b5cf6, #d946ef)' }}>
                            {(req.ceo_name || req.workspace_name || '?')[0].toUpperCase()}
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>{req.workspace_name}</div>
                            <div className="text-xs" style={{ color: 'var(--text-muted)' }}>{req.ceo_name} · {req.email}</div>
                          </div>
                          <StatusBadge status={req.status} />
                        </div>
                      ))
                    )}
                  </div>
                </motion.div>
              )}
            </div>
          )
        })()}

        {/* ── Tab Bar ── */}
        <div className="px-6 py-2.5 flex gap-1 flex-shrink-0 flex-wrap items-center border-b" style={{ background: 'var(--bg-surface)', borderColor: 'var(--border-subtle)' }}>
          <button id="tab-chat" onClick={() => setView('chat')} className={tabBtnCls('chat')}>Chat</button>
          
          {user?.role === 'client' && (
            <>
              <button id="tab-knowledge" onClick={() => setView('knowledge')} className={tabBtnCls('knowledge')}>Knowledge Base</button>
              <button id="tab-catalogue" onClick={() => setView('catalogue')} className={tabBtnCls('catalogue')}>Catalogue</button>
              <button id="tab-qa" onClick={() => setView('qa')} className={tabBtnCls('qa')}>Auto Q&A</button>
              <button id="tab-reviews" onClick={() => setView('reviews')} className={tabBtnCls('reviews')}>User Details</button>
            </>
          )}

          <button id="tab-settings" onClick={() => setView('settings')} className={tabBtnCls('settings')}>Bot Settings</button>
          
          {user?.role === 'admin' && (
            <button id="tab-onboarding" onClick={() => setView('onboarding')} className={tabBtnCls('onboarding')}>Onboarding</button>
          )}

          <button id="tab-training" onClick={() => setView('training')} className={tabBtnCls('training')}>Intelligence Status</button>
        </div>

        {/* ── CHAT VIEW ── */}
        {view === 'chat' && (
          <>
            <ChatArea messages={activeMessages} isTyping={isTyping} onPromptClick={handleSend} activeKnowledge={activeKnowledge} botName={botPersona.bot_name || 'AI'} isDarkMode={isDarkMode} />
            <ChatInput user={user} onSend={handleSend} isTyping={isTyping}
              onOpenUpload={(tab) => { setUploadTab(tab); setUploadModalOpen(true) }}
              activeContext={activeKnowledge}
              botName={botPersona.bot_name || 'AI'}
              isDarkMode={isDarkMode}
            />
          </>
        )}

        {/* ── CATALOGUE VIEW ── */}
        {view === 'catalogue' && (
          <div className="flex-1 p-10 overflow-y-auto">
            <div className="flex justify-between items-center pb-6 mb-8 border-b border-subtle">
              <div>
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Bot Analytics</div>
                <h2 className="text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-xl">📊</span>
                  Performance Catalogue
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 hidden md:block">Filter Period:</span>
                <select value={catalogueDays} onChange={(e) => setCatalogueDays(e.target.value)} className={selectCls}>
                  <option value="today">Present Day</option>
                  <option value="3">Last 3 Days</option>
                  <option value="7">Last 7 Days</option>
                  <option value="10">Last 10 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="2m">Last 2 Months</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="9m">Last 9 Months</option>
                  <option value="12m">Last 12 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
            
            {/* Stats Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
              {[
                { id: 'total', label: 'Total Questions Asked', value: analytics?.total_questions || 0, color: 'text-primary' },
                { id: 'unique', label: 'Unique Questions', value: analytics?.unique_questions || 0, color: 'text-emerald-400' }
              ].map(stat => (
                <div 
                  key={stat.id} 
                  onClick={() => setCatalogueFilter(stat.id)}
                  className={`${cardCls} cursor-pointer transition-all group ${catalogueFilter === stat.id ? 'ring-1 ring-emerald-500 bg-emerald-500/5' : 'hover:bg-accent-glow'}`}
                >
                  <div className="text-[10px] font-black group-hover:text-emerald-400 text-slate-500 uppercase tracking-widest mb-2 transition-colors">
                    {stat.label}
                  </div>
                  <div className={`text-5xl font-bold ${stat.color}`}>{stat.value}</div>
                </div>
              ))}
            </div>

            {/* Questions List */}
            <div className={cardCls}>
              <h3 className="text-sm font-bold text-primary mb-5 uppercase tracking-wider">
                {catalogueFilter === 'unique' ? 'Unique Questions Asked by Users' : 'Full Question History'}
              </h3>
              {(catalogueFilter === 'unique' ? analytics.unique_question_list : analytics.total_question_list)?.length === 0 ? (
                <p className="text-slate-500 text-sm">No questions yet. Share your widget to start collecting insights.</p>
              ) : (
                <div className="space-y-2 max-h-96 overflow-y-auto custom-scrollbar pr-2">
                  {(catalogueFilter === 'unique' ? analytics.unique_question_list : analytics.total_question_list)?.map((q, i) => (
                    <div key={i} className="flex items-start gap-4 p-4 rounded-2xl bg-surface border border-subtle hover:border-emerald-500/50 transition-all shadow-sm">
                      <span className="text-emerald-500/50 text-[10px] font-black mt-1 uppercase tracking-tighter">
                        {String(i + 1).padStart(2, '0')}
                      </span>
                      <span className="text-secondary text-sm leading-relaxed">{q}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ── AUTO Q&A VIEW ── */}
        {view === 'qa' && (
          <div className="flex-1 p-10 overflow-y-auto">
            <h2 className="text-3xl font-bold text-primary mb-8">🤖 Custom Bot Questions</h2>
            <p className="text-slate-400 text-sm mb-6">
              These questions will appear as quick-link chips in your chatbot. Users can tap them to get instant answers.
            </p>

            {/* Add Form */}
            <div className={`${cardCls} mb-8`}>
              <h3 className="text-sm font-bold text-primary mb-5 uppercase tracking-wider">Inject New Bot Question</h3>
              <div className="flex flex-col gap-4">
                <div>
                  <label className="text-xs text-muted font-black uppercase tracking-widest block mb-2">Customer Question (becomes a chip in bot)</label>
                  <input ref={newQRef} placeholder="e.g. What are your business hours?" className={inputCls} />
                </div>
                 <button 
                  disabled={isSubmitting}
                  onClick={async () => {
                   const q = newQRef.current.value.trim();
                   if (!q) return;
                   setIsSubmitting(true)
                   const r = await authFetch(`${API_BASE}/client/qa`, {
                     method: 'POST',
                     headers: { 'Content-Type': 'application/json' },
                     body: JSON.stringify({ workspace_id: activeWsId, question: q, answer: "[Dynamic Retrieval Enabled]" })
                   });
                   setIsSubmitting(false)
                   if (r?.ok) {
                     const newItem = await r.json();
                     setCustomQA(p => [newItem, ...p]);
                     newQRef.current.value = '';
                   }
                }} className="self-start px-8 py-3 bg-emerald-600 hover:bg-emerald-500 text-white rounded-xl font-black transition-all shadow-lg shadow-emerald-500/20 active:scale-95">
                  {isSubmitting ? "Syncing Logic..." : "Add to Bot Suggestions ✓"}
                </button>
              </div>
            </div>

            {/* Question List */}
            <div className="space-y-4">
              {customQA.length === 0 ? (
                <div className="text-center py-12 text-muted border-2 border-dashed border-subtle rounded-3xl">No custom questions yet.</div>
              ) : (
                customQA.map(qa => (
                  <div key={qa.id} className="p-6 rounded-2xl bg-surface border border-subtle flex justify-between items-center gap-4 group hover:border-emerald-500/50 transition-all shadow-sm">
                    <div className="flex-1">
                      <div className="text-primary text-sm font-bold flex items-center gap-3">
                        <span className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center text-[10px]">Q</span>
                        {qa.question}
                      </div>
                      <div className="text-[10px] text-muted mt-1 uppercase tracking-widest font-bold pl-9">⚡ Live Website + Internet Retrieval Active</div>
                    </div>
                    <button onClick={() => handleDeleteQA(qa.id)}
                      className="text-red-400 opacity-0 group-hover:opacity-100 transition-opacity text-xs font-bold px-3 py-1.5 rounded-lg hover:bg-red-500/10">
                      Remove
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ── USER DETAILS VIEW ── */}
        {view === 'reviews' && (
          <div className="flex-1 p-10 overflow-y-auto">
            <div className="flex justify-between items-center pb-6 mb-8 border-b border-subtle">
              <div>
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-[0.2em] mb-1">Customer Insights</div>
                <h2 className="text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-xl">👤</span>
                  User Details & Feedback
                </h2>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[10px] font-bold text-slate-500 hidden md:block">Timeframe:</span>
                <select value={reviewDays} onChange={(e) => { setReviewDays(e.target.value); setLeadsDays(e.target.value); }} className={selectCls}>
                  <option value="today">Present Day</option>
                  <option value="3">Last 3 Days</option>
                  <option value="7">Last 7 Days</option>
                  <option value="10">Last 10 Days</option>
                  <option value="30">Last 30 Days</option>
                  <option value="2m">Last 2 Months</option>
                  <option value="6m">Last 6 Months</option>
                  <option value="9m">Last 9 Months</option>
                  <option value="12m">Last 12 Months</option>
                  <option value="all">All Time</option>
                </select>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              <div className={`${cardCls} relative overflow-hidden group`}>
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 opacity-70">Total Users Identified</div>
                <div className="text-5xl font-black text-primary">{filteredLeads.length}</div>
              </div>
              <div className={`${cardCls} relative overflow-hidden group`}>
                <div className="text-[10px] font-black text-amber-500 uppercase tracking-widest mb-1 opacity-70">Feedback Collected</div>
                <div className="text-5xl font-black text-amber-400">{reviews.length}</div>
              </div>
            </div>

            {filteredLeads.length === 0 ? (
              <div className="text-center py-20 border-2 border-dashed border-subtle rounded-[40px] text-slate-500">
                <div className="text-6xl mb-4 opacity-50">✨</div>
                <p className="font-black text-primary text-xl">Pristine Record</p>
                <p className="text-sm mt-1 max-w-sm mx-auto">Customer details will appear here automatically when they identify themselves via the bot.</p>
              </div>
            ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {filteredLeads.map(lead => {
                  const review = reviews.find(r => r.user_email === lead.email);
                  return (
                    <div key={lead.id} className={`${cardCls} !p-0 overflow-hidden flex flex-col border-medium hover:border-amber-500/30 transition-all shadow-xl scale-[0.98] hover:scale-100`}>
                      <div className="p-6 bg-surface/50 border-b border-subtle flex justify-between items-start">
                        <div className="flex items-center gap-4">
                          <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg text-white shadow-lg ${isDarkMode ? 'bg-[#061a15]' : 'bg-slate-200 !text-slate-800'}`}>
                            {lead.name[0].toUpperCase()}
                          </div>
                          <div>
                            <div className="text-lg font-black tracking-tight text-primary">{lead.name}</div>
                            <div className="text-[11px] font-bold text-amber-400 uppercase tracking-widest">{lead.entity_type}</div>
                          </div>
                        </div>
                        <button onClick={() => handleDeleteLead(lead.id)} className="p-2.5 rounded-xl hover:bg-red-500/10 text-red-400/30 hover:text-red-400 transition-all">
                          <span className="text-lg">🗑️</span>
                        </button>
                      </div>

                      <div className="p-4 grid grid-cols-1 gap-y-4 border-b border-subtle">
                         <div>
                           <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 opacity-60">Email Address</div>
                           <div className="text-[11px] font-bold text-primary truncate">{lead.email}</div>
                         </div>
                         <div className="flex justify-between items-baseline gap-2">
                           <div>
                             <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 opacity-60">Location</div>
                             <div className="text-[11px] font-bold text-primary truncate">{lead.location}</div>
                           </div>
                           {lead.entity_type === 'organization' && (
                             <div className="text-right">
                               <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-1 opacity-60">Organization</div>
                               <div className="text-[11px] font-bold text-emerald-400 truncate">{lead.org_name}</div>
                             </div>
                           )}
                         </div>
                      </div>

                      <div className={`p-4 flex-1 ${isDarkMode ? 'bg-white/[0.02]' : 'bg-slate-100/50'}`}>
                        <div className="text-[9px] font-black text-muted uppercase tracking-widest mb-2 opacity-60">Customer Feedback</div>
                        {review ? (
                          <div className="animate-in fade-in slide-in-from-bottom-2">
                            <div className="flex gap-0.5 mb-1.5">
                              {[...Array(5)].map((_, i) => (
                                <span key={i} className={`text-xs ${i < review.rating ? 'text-amber-400' : 'text-slate-700'}`}>★</span>
                              ))}
                            </div>
                            <div className="text-[13px] font-medium italic leading-relaxed text-secondary opacity-90">
                              "{review.comment}"
                            </div>
                          </div>
                        ) : (
                          <div className="text-[10px] font-bold text-muted italic opacity-40">No reviews given 💬</div>
                        )}
                      </div>
                      
                      <div className="px-4 py-2.5 border-t border-subtle bg-base/30 text-[8px] font-bold text-muted flex justify-between items-center bg-black/10">
                         <span className="opacity-50">ID: {lead.id}</span>
                         <span className="text-amber-500/60 uppercase tracking-tighter">📅 Captured: {new Date(lead.created_at).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })} at {new Date(lead.created_at).toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' })}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* ── INTELLIGENCE VIEW ── */}
        {view === 'knowledge' && (
          <div className="flex-1 p-10 overflow-y-auto">
            
            {/* ── WEBSITE INTEGRATION ── */}
            <div className={`${cardCls} bg-emerald-500/5 border-emerald-500/20 shadow-2xl overflow-hidden group mb-10`}>
                <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 text-xs font-black text-emerald-400 uppercase tracking-[0.2em] mb-3">
                      <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] bg-emerald-500/20">W</span>
                      Website Integration
                    </div>
                    <h3 className="text-lg font-black text-primary mb-2">Deploy your Chatbot</h3>
                    <p className="text-slate-500 text-xs leading-relaxed max-w-lg">
                      Copy the code snippet below and paste it into the <code className="text-emerald-500 font-bold bg-white/5 px-2 py-0.5 rounded">&lt;head&gt;</code> or <code className="text-emerald-500 font-bold bg-white/5 px-2 py-0.5 rounded">&lt;body&gt;</code> of your website.
                    </p>
                  </div>
                  
                  <button
                    onClick={() => {
                      const backendUrl = window.location.origin.replace(':5173', ':5000');
                      const scriptStr = `<script src="${backendUrl}/static/widget.js" data-business-id="${activeWsId}"></script>`;
                      navigator.clipboard.writeText(scriptStr);
                      setCopySuccess(true);
                      setTimeout(() => setCopySuccess(false), 2000);
                    }}
                    className={`flex items-center gap-2 px-8 py-3.5 rounded-2xl font-black text-xs uppercase tracking-widest transition-all ${
                      copySuccess ? 'bg-emerald-500 text-white' : 'bg-white/10 hover:bg-white/20 text-primary border border-white/10'
                    }`}
                  >
                    {copySuccess ? '✅ Copied to Clipboard!' : '📋 Copy Widget Script'}
                  </button>
                </div>

                <div className="mt-6 p-5 rounded-2xl bg-black/40 border border-white/5 font-mono text-[10px] md:text-sm text-emerald-400/80 break-all leading-relaxed shadow-inner select-all">
                  <span className="text-slate-500">&lt;</span>
                  <span className="text-emerald-400">script</span>
                  <span className="text-slate-400"> src=</span>
                  <span className="text-amber-300">"{window.location.origin.replace(':5173', ':5000')}/static/widget.js"</span>
                  <span className="text-slate-400"> data-business-id=</span>
                  <span className="text-amber-300">"{activeWsId}"</span>
                  <span className="text-slate-500">&gt;&lt;/</span>
                  <span className="text-emerald-400">script</span>
                  <span className="text-slate-500">&gt;</span>
                </div>
              </div>

            <div className="flex justify-between items-center pb-6 mb-8 border-b border-subtle">
              <div>
                <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.2em] mb-1">Training Data</div>
                <h2 className="text-3xl font-black text-primary flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-xl">🧠</span>
                  AI Knowledge Base
                </h2>
              </div>
              <button 
                onClick={() => { setUploadTab('url'); setUploadModalOpen(true); }}
                className="px-6 py-2.5 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white font-black text-xs transition-all shadow-lg active:scale-95 flex items-center gap-2"
              >
                <span>+</span> Add New Knowledge
              </button>
            </div>

            <div className="space-y-4">
              {activeKnowledge.length === 0 ? (
                <div className="text-center py-20 border-2 border-dashed border-subtle rounded-[40px] text-slate-500">
                  <div className="text-6xl mb-4 opacity-30">📚</div>
                  <p className="font-black text-primary text-xl">Your AI is empty</p>
                  <p className="text-sm mt-1 max-w-sm mx-auto">Upload a File or paste a Website URL to start training your bot.</p>
                </div>
              ) : (
                <div className="grid grid-cols-1 gap-4">
                  {activeKnowledge.map((item) => (
                    <div key={item.id} className="p-6 rounded-2xl bg-surface border border-subtle flex items-center justify-between group hover:border-emerald-500/50 transition-all shadow-sm">
                      <div className="flex items-center gap-5">
                        <div className={`w-12 h-12 rounded-2xl flex items-center justify-center text-xl shadow-inner ${
                          item.type === 'url' ? 'bg-blue-500/10 text-blue-400' : 'bg-amber-500/10 text-amber-500'
                        }`}>
                          {item.type === 'url' ? '🌐' : '📄'}
                        </div>
                        <div>
                          <div className="text-primary font-black text-sm tracking-tight">{item.name}</div>
                          <div className="flex items-center gap-3 mt-1">
                            <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500/60">{item.type}</span>
                            <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">Added: {new Date(item.created_at || item.timestamp).toLocaleDateString()}</span>
                          </div>
                        </div>
                      </div>
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to remove "${item.name}" from AI memory?`)) {
                            handleRemoveKnowledge(item.id);
                          }
                        }}
                        className="p-3 rounded-xl hover:bg-red-500/10 text-red-400 opacity-0 group-hover:opacity-100 transition-all flex items-center gap-2 font-black text-[10px] uppercase tracking-widest"
                      >
                        🗑️ Remove Knowledge
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {activeKnowledge.length > 0 && (
              <div className="mt-8 p-6 rounded-2xl bg-emerald-500/5 border border-emerald-500/10">
                <p className="text-xs text-emerald-500/80 font-bold flex items-center gap-2">
                  <span className="text-lg">ℹ️</span> 
                  Your bot uses all resources listed above to answer customer questions accurately.
                </p>
              </div>
            )}
          </div>
        )}

        {/* ── BOT SETTINGS VIEW ── */}
        {view === 'settings' && (
          <div className="flex-1 p-6 lg:p-8 overflow-y-auto">
            <div className="mb-8">
              <h2 className="text-2xl font-black text-primary">Bot Identity</h2>
              <p className="text-slate-500 text-sm mt-1">Customize how your chatbot introduces itself to customers.</p>
            </div>
            
            <div className="max-w-4xl mx-auto space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                <div className={cardCls}>
                  <label className="flex items-center gap-2 text-xs font-black text-secondary uppercase tracking-widest block mb-4">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] bg-emerald-500/20 text-emerald-500">B</span>
                    Bot Name
                  </label>
                  <input
                    value={botPersona.bot_name || ''}
                    onChange={(e) => setBotPersona({ ...botPersona, bot_name: e.target.value })}
                    className={inputCls}
                  />
                </div>
                <div className={cardCls}>
                   <label className="flex items-center gap-2 text-xs font-black text-secondary uppercase tracking-widest block mb-4">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] bg-emerald-500/20 text-emerald-500">🔗</span>
                    Target Website URL
                  </label>
                  <div className="flex gap-2">
                    <input
                      value={botPersona.url || ''}
                      placeholder="https://example.com"
                      onChange={(e) => setBotPersona({ ...botPersona, url: e.target.value })}
                      className={inputCls}
                    />
                    <button 
                      onClick={async () => {
                        if (!botPersona.url) return alert('Enter a URL first')
                        const r = await authFetch(`${API_BASE}/admin/detect-colors`, {
                          method: 'POST', headers: { 'Content-Type': 'application/json' },
                          body: JSON.stringify({ url: botPersona.url })
                        })
                        if (r?.ok) {
                          const data = await r.json()
                          setBotPersona(p => ({ ...p, theme_primary: data.primary }))
                          alert('✨ Colors detected and applied!')
                        }
                      }}
                      className="px-3 bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 rounded-xl hover:bg-emerald-500/20 transition-all text-[10px] font-black uppercase tracking-tighter"
                    >
                      Detect
                    </button>
                  </div>
                </div>
                <div className={cardCls}>
                  <label className="flex items-center gap-2 text-xs font-black text-secondary uppercase tracking-widest block mb-4">
                    <span className="w-5 h-5 rounded-md flex items-center justify-center text-[10px] bg-emerald-500/20 text-emerald-400">G</span>
                    Greeting Message
                  </label>
                  <textarea
                    value={botPersona.bot_greeting || ''}
                    onChange={(e) => setBotPersona({ ...botPersona, bot_greeting: e.target.value })}
                    className={inputCls + " h-[68px] resize-none"}
                  />
                </div>
              </div>

              {/* ── BRANDING SECTION ── */}
              <div className="mb-0">
                <h3 className="text-sm font-black text-primary uppercase tracking-[0.2em] mb-4 opacity-50">Branding & Aesthetics</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
                  <div className={cardCls}>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Primary Accent</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={botPersona.theme_primary} onChange={(e) => setBotPersona({...botPersona, theme_primary: e.target.value})} className="w-10 h-10 rounded-full border-none cursor-pointer bg-transparent" />
                      <input type="text" value={botPersona.theme_primary} onChange={(e) => setBotPersona({...botPersona, theme_primary: e.target.value})} className={inputCls + " text-xs py-2"} />
                    </div>
                  </div>
                  <div className={cardCls}>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Secondary Accent</label>
                    <div className="flex items-center gap-3">
                      <input type="color" value={botPersona.theme_secondary} onChange={(e) => setBotPersona({...botPersona, theme_secondary: e.target.value})} className="w-10 h-10 rounded-full border-none cursor-pointer bg-transparent" />
                      <input type="text" value={botPersona.theme_secondary} onChange={(e) => setBotPersona({...botPersona, theme_secondary: e.target.value})} className={inputCls + " text-xs py-2"} />
                    </div>
                  </div>
                  <div className={cardCls}>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Background Style</label>
                    <select value={botPersona.theme_bg} onChange={(e) => setBotPersona({...botPersona, theme_bg: e.target.value})} className={selectCls + " w-full h-[46px]"}>
                      <option value="glass">Modern Glass</option>
                      <option value="solid">Solid Clean</option>
                      <option value="dark">Deep Space</option>
                    </select>
                  </div>
                  <div className={cardCls}>
                    <label className="text-[10px] font-black text-secondary uppercase tracking-widest block mb-2">Icon URL</label>
                    <input value={botPersona.bot_avatar_url} onChange={(e) => setBotPersona({...botPersona, bot_avatar_url: e.target.value})} className={inputCls + " text-xs py-2"} />
                  </div>
                </div>
              </div>

              <div className="flex flex-col items-center gap-8 py-4">
                <div className="nature-glass p-7 rounded-[40px] border border-subtle w-full max-w-xl shadow-2xl relative overflow-hidden transition-all duration-500" 
                  style={{ 
                    background: botPersona.theme_bg === 'dark' ? '#0f172a' : botPersona.theme_bg === 'solid' ? (isDarkMode ? '#1e293b' : '#fff') : (isDarkMode ? 'var(--nature-glass)' : 'rgba(255,255,255,0.8)'),
                    fontFamily: botPersona.theme_font === 'Inter' ? "'Inter', sans-serif" : 'inherit',
                    borderColor: `${botPersona.theme_primary}33`
                  }}>
                  <div className="flex items-start gap-4">
                    <img src={botPersona.bot_avatar_url || '/static/bot_avatar.png'} alt="Bot" className="w-10 h-10 rounded-full shadow-lg border-2" style={{ borderColor: botPersona.theme_primary }} />
                    <div className="flex-1 bg-elevated border border-subtle rounded-3xl rounded-tl-sm px-6 py-4 text-sm text-primary shadow-sm leading-relaxed" style={{ background: isDarkMode ? '#111827' : '#f9fafb' }}>
                      <div className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: botPersona.theme_primary }}>{botPersona.bot_name || 'AI Assistant'}</div>
                      Hi! I am <strong style={{ color: botPersona.theme_primary }}>{botPersona.bot_name || '[Bot Name]'}</strong>, {botPersona.bot_greeting || '[greeting will appear here]'}
                    </div>
                  </div>
                </div>
                <button
                  onClick={async () => {
                    const r = await authFetch(`${API_BASE}/client/persona`, {
                      method: 'POST', headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify(botPersona)
                    })
                    if (r?.ok) alert('✅ Bot identity and branding updated!')
                  }}
                  className="w-full max-w-md py-4 rounded-3xl text-white font-black text-sm uppercase tracking-widest transition-all shadow-2xl active:scale-95"
                  style={{ background: `linear-gradient(135deg, ${botPersona.theme_secondary}, ${botPersona.theme_primary})` }}
                >
                  Save Bot Branding
                </button>
              </div>
            </div>
          </div>
        )}

        {/* ── TRAINING VIEW ── */}
        {view === 'training' && (
          <div className="flex-1 overflow-y-auto">
            <TrainingStats wsId={activeWsId} token={token} isDarkMode={isDarkMode} />
          </div>
        )}

        {/* ── ONBOARDING VIEW (Admin Only) ── */}
        {view === 'onboarding' && user.role === 'admin' && (
          <div className="flex-1 p-8 overflow-y-auto">
            <div className="flex justify-between items-center pb-6 mb-8 border-b border-subtle">
              <div>
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-1">Growth Panel</div>
                <h2 className="text-2xl font-black text-primary flex items-center gap-3">
                  <span className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-xl">🌱</span>
                  Client Onboarding
                </h2>
              </div>
              <div className="flex items-center gap-4">
                <select value={onboardingDays} onChange={(e) => setOnboardingDays(e.target.value)} className={selectCls}>
                  <option value="all">All Time</option>
                  <option value="today">Today</option>
                </select>
                <button
                  onClick={() => setIsCreateBotModalOpen(true)}
                  className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-white font-black text-xs shadow-lg"
                  style={{ background: 'linear-gradient(135deg, #059669, #10b981)' }}
                >
                  New Client
                </button>
              </div>
            </div>

            <div className="space-y-4">
              {filteredOnboarding.length === 0 ? (
                <div className="p-16 text-center border-2 border-dashed border-subtle rounded-[40px] text-slate-500 font-bold">
                  No onboarding requests yet.
                </div>
              ) : (
                filteredOnboarding.map(req => {
                  return (
                    <div key={req.id} className="p-6 rounded-[22px] bg-surface border border-subtle flex justify-between items-center group hover:border-emerald-500/50 transition-all shadow-sm">
                      <div>
                        <div className="text-lg font-black text-primary">{req.workspace_name}</div>
                        <div className="text-xs text-muted mt-1">{req.ceo_name} · {req.email}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <StatusBadge status={req.status} />
                        <button onClick={() => handleDeleteOnboarding(req.id)} className="p-3 rounded-xl hover:bg-red-500/10 text-red-400 opacity-60 group-hover:opacity-100 transition-all">🗑️</button>
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </div>
        )}

      </div>

      <UploadModal isOpen={uploadModalOpen} onClose={() => setUploadModalOpen(false)} defaultTab={uploadTab} onAddKnowledge={handleAddKnowledge} />
      <SearchModal isOpen={searchOpen} onClose={() => setSearchOpen(false)} workspaces={workspaces} chats={chats}
        onSelectWorkspace={(id) => { handleSelectWorkspace(id); setSearchOpen(false) }}
        onSelectChat={(wsId, chatId) => { handleSelectWorkspace(wsId); setActiveChatId(chatId); setSearchOpen(false) }}
      />
      <CreateBotModal isOpen={isCreateBotModalOpen} onClose={() => setIsCreateBotModalOpen(false)} />
    </div>
  )
}
