import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { X, Bot, Building2, MapPin, Mail, User, Phone, Globe } from 'lucide-react'

export default function CreateBotModal({ isOpen, onClose, onCreate }) {
  const [wsName, setWsName]       = useState('')
  const [orgName, setOrgName]     = useState('')
  const [title, setTitle]         = useState('Mr')
  const [ceoFirst, setCeoFirst]   = useState('')
  const [ceoMiddle, setCeoMiddle] = useState('')
  const [ceoLast, setCeoLast]     = useState('')
  const [countryCode, setCC]      = useState('+91')
  const [contact, setContact]     = useState('')
  const [addr1, setAddr1]         = useState('')
  const [addr2, setAddr2]         = useState('')
  const [addr3, setAddr3]         = useState('')
  const [email, setEmail]         = useState('')
  const [loading, setLoading]     = useState(false)
  const [error, setError]         = useState('')
  const [success, setSuccess]     = useState(false)

  if (!isOpen) return null

  const inputStyle = {
    background: 'var(--bg-elevated)',
    color: 'var(--text-primary)',
    border: '1px solid var(--border-medium)'
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!wsName.trim() || !email.trim() || !ceoFirst.trim() || !ceoLast.trim()) {
      setError("Workspace name, Admin names, and email are required")
      return
    }
    setLoading(true)
    setError('')
    try {
      const r = await fetch('https://ai-chatbot-lpap.onrender.com/api/admin/onboarding', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${localStorage.getItem('saas_token')}`
        },
        body: JSON.stringify({
          workspace_name: wsName,
          org_name:       orgName,
          ceo_title:      title,
          ceo_first_name: ceoFirst,
          ceo_middle_name: ceoMiddle,
          ceo_last_name:  ceoLast,
          country_code:   countryCode,
          contact_details: contact,
          address_line_1: addr1,
          address_line_2: addr2,
          address_line_3: addr3,
          email
        })
      })
      const data = await r.json()
      if (!r.ok) throw new Error(data.error || 'Failed')
      setSuccess(true)
      setTimeout(() => {
        setSuccess(false)
        onClose()
        window.location.reload()
      }, 2000)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          onClick={e => e.stopPropagation()}
          className="w-full max-w-2xl rounded-[32px] shadow-2xl overflow-hidden"
          style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-medium)' }}
        >
          {/* Header */}
          <div className="flex items-center justify-between px-8 py-6 border-b" style={{ borderColor: 'var(--border-subtle)' }}>
            <div>
              <h2 className="text-xl font-black flex items-center gap-3" style={{ color: 'var(--text-primary)' }}>
                <div className="w-10 h-10 rounded-xl bg-emerald-500/10 flex items-center justify-center">
                  <Bot size={22} className="text-emerald-500" />
                </div>
                New Client Registration
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>
                An approval email will be sent to the client
              </p>
            </div>
            <button onClick={onClose} className="p-2 rounded-full hover:bg-white/10 transition-colors text-slate-400">
              <X size={20} />
            </button>
          </div>

          {/* Body */}
          <div className="px-8 py-7 max-h-[82vh] overflow-y-auto custom-scrollbar">
            {success && (
              <div className="mb-6 p-4 rounded-2xl text-emerald-400 text-sm font-bold bg-emerald-500/10 border border-emerald-500/25 text-center flex items-center justify-center gap-2">
                <span>✅</span> Approval request sent successfully!
              </div>
            )}
            {error && (
              <div className="mb-6 p-4 rounded-2xl text-red-400 text-sm font-bold bg-red-500/10 border border-red-500/25">
                ⚠️ {error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-7">
              {/* Section 1: Administrator Profile */}
              <div className="space-y-4">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                  <User size={12} /> 1. Administrator Profile
                </p>
                <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">Title</label>
                    <select
                      value={title} onChange={e => setTitle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none bg-no-repeat bg-[right_1rem_center]"
                      style={inputStyle}
                    >
                      <option value="Mr">Mr.</option>
                      <option value="Ms">Ms.</option>
                      <option value="Mrs">Mrs.</option>
                    </select>
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">First Name *</label>
                    <input type="text" placeholder="John" value={ceoFirst} onChange={e => setCeoFirst(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner" style={inputStyle} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">Middle Name</label>
                    <input type="text" placeholder="D." value={ceoMiddle} onChange={e => setCeoMiddle(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner" style={inputStyle} />
                  </div>
                  <div className="md:col-span-1">
                    <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">Last Name *</label>
                    <input type="text" placeholder="Doe" value={ceoLast} onChange={e => setCeoLast(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner" style={inputStyle} />
                  </div>
                </div>
              </div>

              {/* Section 2: Business & Contact */}
              <div className="space-y-4 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                  <Globe size={12} /> 2. Business & Contact
                </p>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">Organization Name</label>
                    <input type="text" placeholder="e.g. Acme Global Ltd." value={orgName} onChange={e => setOrgName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">Workspace Name *</label>
                    <input type="text" placeholder="e.g. Acme Support Bot" value={wsName} onChange={e => setWsName(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner" style={inputStyle} />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">Email *</label>
                    <input type="email" placeholder="ceo@acme.com" value={email} onChange={e => setEmail(e.target.value)}
                      className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all shadow-inner" style={inputStyle} />
                  </div>
                  <div className="grid grid-cols-[80px_1fr] gap-2">
                    <div>
                      <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">Code</label>
                      <select 
                        value={countryCode} 
                        onChange={e => setCC(e.target.value)}
                        className="w-full px-3 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 appearance-none bg-no-repeat bg-[right_0.5rem_center] cursor-pointer" 
                        style={{
                          ...inputStyle,
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' fill='none' viewBox='0 0 24 24' stroke='currentColor'%3E%3Cpath stroke-linecap='round' stroke-linejoin='round' stroke-width='2' d='M19 9l-7 7-7-7'%3E%3C/path%3E%3C/svg%3E")`,
                          backgroundSize: '1em',
                        }}
                      >
                        <option value="+91">IN (+91)</option>
                        <option value="+1">US (+1)</option>
                        <option value="+44">UK (+44)</option>
                        <option value="+971">UAE (+971)</option>
                        <option value="+65">SG (+65)</option>
                        <option value="+61">AU (+61)</option>
                        <option value="+49">DE (+49)</option>
                        <option value="+33">FR (+33)</option>
                        <option value="+81">JP (+81)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold mb-1.5 uppercase opacity-60">Contact Number</label>
                      <input type="text" placeholder="9876543210" value={contact} onChange={e => setContact(e.target.value)}
                        className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" style={inputStyle} />
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 3: Business Address */}
              <div className="space-y-3 pt-2">
                <p className="text-[10px] font-black uppercase tracking-[0.2em] text-emerald-500 flex items-center gap-2">
                  <MapPin size={12} /> 3. Business Address
                </p>
                <div className="space-y-3">
                  <input type="text" placeholder="Address Line 1" value={addr1} onChange={e => setAddr1(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" style={inputStyle} />
                  <input type="text" placeholder="Address Line 2" value={addr2} onChange={e => setAddr2(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" style={inputStyle} />
                  <input type="text" placeholder="Landmark / City / Pincode" value={addr3} onChange={e => setAddr3(e.target.value)}
                    className="w-full px-4 py-3 rounded-xl text-sm outline-none focus:ring-2 focus:ring-emerald-500/50 transition-all" style={inputStyle} />
                </div>
              </div>

              <div className="pt-2">
                <button
                  type="submit" disabled={loading}
                  className="w-full py-4 rounded-2xl font-black text-sm uppercase tracking-widest text-white border-0 transition-all hover:scale-[1.01] active:scale-[0.99] disabled:opacity-50 shadow-2xl"
                  style={{ background: 'linear-gradient(135deg, #10b981, #064e40)', boxShadow: '0 8px 30px rgba(16,185,129,0.3)' }}
                >
                  {loading ? 'Processing...' : 'Send Approval Request →'}
                </button>
                <p className="text-[10px] text-center mt-4 font-bold opacity-40 uppercase tracking-wider">
                  Approval email with secured links will be sent instantly.
                </p>
              </div>
            </form>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
