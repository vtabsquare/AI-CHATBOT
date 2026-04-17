import { useState } from 'react'
import { motion } from 'framer-motion'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, ShieldCheck, Key, Lock } from 'lucide-react'
import bgImage from '../assets/auth_bg.png'

export default function ForceChangePassword({ token, onPasswordChanged }) {
  const [currentPw,  setCurrentPw]  = useState('')
  const [newPw,      setNewPw]      = useState('')
  const [confirmPw,  setConfirmPw]  = useState('')
  
  const [showCurrentPw, setShowCurrentPw] = useState(false)
  const [showNewPw, setShowNewPw] = useState(false)
  const [showConfirmPw, setShowConfirmPw] = useState(false)

  const [error,      setError]      = useState('')
  const [success,    setSuccess]    = useState(false)
  const [loading,    setLoading]    = useState(false)

  const navigate = useNavigate()

  // Password strength calculation
  const strength = (() => {
    if (!newPw) return { score: 0, label: '', color: '' }
    let score = 0
    if (newPw.length >= 6)  score++
    if (newPw.length >= 10) score++
    if (/[A-Z]/.test(newPw)) score++
    if (/[0-9]/.test(newPw)) score++
    if (/[^A-Za-z0-9]/.test(newPw)) score++
    const map = [
      { label: '', color: '' },
      { label: 'Weak', color: '#ef4444' },
      { label: 'Fair', color: '#f97316' },
      { label: 'Good', color: '#2dd4bf' },
      { label: 'Strong', color: '#4d8b7a' },
      { label: 'Unbreakable', color: '#10b981' },
    ]
    return { score, ...map[score] }
  })()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    if (newPw !== confirmPw) { setError('New passwords do not match.'); return }
    if (newPw.length < 6)    { setError('Password must be at least 6 characters.'); return }

    setLoading(true)
    try {
      const res = await fetch('http://localhost:5000/api/auth/change-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ current_password: currentPw, new_password: newPw, confirm_password: confirmPw })
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || 'Failed to change password')

      setSuccess(true)
      setTimeout(() => {
        onPasswordChanged()
        navigate('/login')
      }, 2500)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex items-center justify-center min-h-screen w-full relative overflow-hidden font-sans bg-[#0a2f2a]">
      
      {/* ── Background Image with Overlay ── */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Forest background" 
          className="w-full h-full object-cover scale-105"
        />
        <div className="absolute inset-0 bg-emerald-900/10 backdrop-blur-[3px]"></div>
      </div>

      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="w-full max-w-[420px] rounded-[48px] z-20 nature-glass overflow-hidden relative"
      >
        {/* Leaf Accent */}
        <div className="leaf-accent -top-10 -right-10 w-40 h-40 opacity-[0.05] rotate-180">
          <svg viewBox="0 0 200 200" fill="currentColor"><path d="M100,20 C120,60 180,80 180,140 C180,180 140,180 100,160 C60,180 20,180 20,140 C20,80 80,60 100,20" /></svg>
        </div>

        <div className="px-10 py-12">
          {success ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              className="text-center py-8"
            >
              <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mx-auto mb-6">
                <ShieldCheck size={32} color="#10b981" />
              </div>
              <h2 className="text-2xl font-medium tracking-tight mb-2" style={{ color: 'var(--nature-text)' }}>Security active</h2>
              <p className="text-sm opacity-50" style={{ color: 'var(--nature-text)' }}>Redirecting you to workspace...</p>
            </motion.div>
          ) : (
            <div>
              <h2 className="text-3xl font-medium tracking-tight mb-8" style={{ color: 'var(--nature-text)' }}>Reset password</h2>
              <form onSubmit={handleSubmit} className="flex flex-col gap-6">
                
                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                    <Lock size={18} color="var(--nature-text)" />
                  </div>
                  <input
                    type={showCurrentPw ? 'text' : 'password'}
                    placeholder="Current Password"
                    value={currentPw}
                    onChange={e => setCurrentPw(e.target.value)}
                    className="w-full pl-14 pr-14 p-5 rounded-full outline-none nature-input text-sm transition-all"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowCurrentPw(!showCurrentPw)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-all text-white"
                  >
                    {showCurrentPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                    <Key size={18} color="var(--nature-text)" />
                  </div>
                  <input
                    type={showNewPw ? 'text' : 'password'}
                    placeholder="New Password"
                    value={newPw}
                    onChange={e => setNewPw(e.target.value)}
                    className="w-full pl-14 pr-14 p-5 rounded-full outline-none nature-input text-sm transition-all"
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowNewPw(!showNewPw)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-all text-white"
                  >
                    {showNewPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {newPw && (
                  <div className="px-2">
                    <div className="flex gap-1.5 mb-1.5">
                      {[1,2,3,4,5].map(i => (
                        <div key={i} className="flex-1 h-1 rounded-full transition-all duration-500"
                          style={{ 
                            background: i <= strength.score ? strength.color : 'rgba(255,255,255,0.05)',
                          }} />
                      ))}
                    </div>
                    <div className="text-[10px] font-medium" style={{ color: strength.score > 0 ? strength.color : 'rgba(255,255,255,0.3)' }}>
                      Security: {strength.label || '...'}
                    </div>
                  </div>
                )}

                <div className="relative group">
                  <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                    <Key size={18} color="var(--nature-text)" />
                  </div>
                  <input
                    type={showConfirmPw ? 'text' : 'password'}
                    placeholder="Confirm New Password"
                    value={confirmPw}
                    onChange={e => setConfirmPw(e.target.value)}
                    className="w-full pl-14 pr-14 p-5 rounded-full outline-none nature-input text-sm transition-all"
                    style={{ 
                      borderColor: confirmPw && confirmPw !== newPw ? '#ef4444' : '' 
                    }}
                    required
                  />
                  <button 
                    type="button"
                    onClick={() => setShowConfirmPw(!showConfirmPw)}
                    className="absolute right-6 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-all text-white"
                  >
                    {showConfirmPw ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>

                {error && (
                  <div className="p-3 rounded-2xl bg-red-500/10 border border-red-500/10 text-red-300 text-[11px] font-medium text-center uppercase tracking-wider">
                    {error}
                  </div>
                )}

                <button
                  type="submit"
                  disabled={loading || success}
                  className="w-full mt-2 p-5 rounded-full font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
                  style={{ 
                    backgroundColor: 'var(--nature-accent)',
                    opacity: loading ? 0.7 : 1 
                  }}
                >
                  {loading ? 'Securing...' : 'Set new password'}
                </button>
              </form>
            </div>
          )}
        </div>
      </motion.div>
    </div>
  )
}
