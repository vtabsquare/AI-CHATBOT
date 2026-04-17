import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useNavigate, Link } from 'react-router-dom'
import { Eye, EyeOff, Mail, Shield, Key } from 'lucide-react'
import bgImage from '../assets/auth_bg.png'

export default function ForgotPassword() {
  const [step, setStep] = useState(0) // 0: Request, 1: Verify, 2: New Password
  const [email, setEmail] = useState('')
  const [code, setCode] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showNewPassword, setShowNewPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()

  const handleRequest = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
        const res = await fetch('https://ai-chatbot-lpap.onrender.com/api/auth/reset-password/request', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email })
        })
        if (!res.ok) throw new Error('User not found or error occurred')
        setStep(1)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  
    const handleVerify = async (e) => {
      e.preventDefault()
      setLoading(true)
      setError('')
      try {
        const res = await fetch('https://ai-chatbot-lpap.onrender.com/api/auth/reset-password/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ email, code })
        })
        if (!res.ok) throw new Error('Invalid or expired code')
        setStep(2)
      } catch (err) {
        setError(err.message)
      } finally {
        setLoading(false)
      }
    }
  
    const handleReset = async (e) => {
      e.preventDefault()
      if (newPassword !== confirmPassword) {
        setError('Passwords do not match')
        return
      }
      setLoading(true)
      setError('')
      try {
        const res = await fetch('https://ai-chatbot-lpap.onrender.com/api/auth/reset-password/confirm', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, code, password: newPassword })
      })
      if (!res.ok) throw new Error('Failed to reset password')
      alert('Password updated successfully!')
      navigate('/login')
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

      <AnimatePresence mode="wait">
        <motion.div 
          key={step}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
          className="w-full max-w-[420px] p-10 rounded-[48px] z-20 relative nature-glass overflow-hidden"
        >
          {/* Leaf Decor */}
          <div className="leaf-accent -bottom-10 -right-10 w-40 h-40 opacity-[0.06] rotate-90">
             <svg viewBox="0 0 200 200" fill="currentColor"><path d="M100,20 C120,60 180,80 180,140 C180,180 140,180 100,160 C60,180 20,180 20,140 C20,80 80,60 100,20" /></svg>
          </div>

          {step === 0 && (
            <div>
              <h2 className="text-3xl font-medium tracking-tight mb-8" style={{ color: 'var(--nature-text)' }}>Forgot password?</h2>
              <form onSubmit={handleRequest} className="flex flex-col gap-6">
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                      <Mail size={18} color="var(--nature-text)" />
                    </div>
                    <input
                      type="email"
                      placeholder="Email Address"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full pl-14 p-5 rounded-full outline-none nature-input text-sm transition-all"
                      required
                    />
                 </div>
                 <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-5 rounded-full font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
                    style={{ backgroundColor: 'var(--nature-accent)', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Sending...' : 'Send reset instructions'}
                  </button>
              </form>
            </div>
          )}

          {step === 1 && (
            <div>
              <h2 className="text-3xl font-medium tracking-tight mb-2" style={{ color: 'var(--nature-text)' }}>Verify code</h2>
              <p className="text-xs opacity-50 mb-8" style={{ color: 'var(--nature-text)' }}>Code sent to {email}</p>
              
              <form onSubmit={handleVerify} className="flex flex-col gap-6">
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                      <Shield size={18} color="var(--nature-text)" />
                    </div>
                    <input
                      type="text"
                      maxLength="4"
                      placeholder="Verification Code"
                      value={code}
                      onChange={(e) => setCode(e.target.value)}
                      className="w-full pl-14 p-5 rounded-full outline-none nature-input text-sm text-center tracking-[0.5em] font-bold transition-all"
                      required
                    />
                 </div>
                 <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-5 rounded-full font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
                    style={{ backgroundColor: 'var(--nature-accent)', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Verifying...' : 'Verify identity'}
                  </button>
              </form>
            </div>
          )}

          {step === 2 && (
            <div>
              <h2 className="text-3xl font-medium tracking-tight mb-8" style={{ color: 'var(--nature-text)' }}>Reset password</h2>
              <form onSubmit={handleReset} className="flex flex-col gap-5">
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                      <Key size={18} color="var(--nature-text)" />
                    </div>
                    <input
                      type={showNewPassword ? 'text' : 'password'}
                      placeholder="New Password"
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      className="w-full pl-14 pr-14 p-5 rounded-full outline-none nature-input text-sm transition-all"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowNewPassword(!showNewPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-all text-white"
                    >
                      {showNewPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                 </div>
                 <div className="relative group">
                    <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                      <Key size={18} color="var(--nature-text)" />
                    </div>
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="Confirm Password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full pl-14 pr-14 p-5 rounded-full outline-none nature-input text-sm transition-all"
                      required
                    />
                    <button 
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-6 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-all text-white"
                    >
                      {showConfirmPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                 </div>
                 <button
                    type="submit"
                    disabled={loading}
                    className="w-full p-5 rounded-full font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
                    style={{ backgroundColor: 'var(--nature-accent)', opacity: loading ? 0.7 : 1 }}
                  >
                    {loading ? 'Updating...' : 'Set new password'}
                  </button>
              </form>
            </div>
          )}

          {error && (
            <div className="mt-6 p-3 rounded-2xl bg-red-500/10 border border-red-500/10 text-red-300 text-[11px] font-medium text-center uppercase tracking-wider">
              {error}
            </div>
          )}

          <div className="mt-10 pt-6 border-t border-white/5 text-center">
            <p className="text-[12px] opacity-50" style={{ color: 'var(--nature-text)' }}>
              Remembered your password? <Link to="/login" className="font-bold ml-1 hover:brightness-125 transition-all" style={{ color: 'var(--nature-accent)' }}>Sign in</Link>
            </p>
          </div>
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
