import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Link, useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Mail, Lock } from 'lucide-react'
import bgImage from '../assets/auth_bg.png'

export default function Login({ onLogin }) {
  const [email, setEmail] = useState(() => localStorage.getItem('vtab_remember_email') || '')
  const [password, setPassword] = useState('')
  const [rememberMe, setRememberMe] = useState(() => !!localStorage.getItem('vtab_remember_email'))
  const [showPassword, setShowPassword] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const res = await fetch('https://ai-chatbot-lpap.onrender.com/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password })
      })
      const data = await res.json()
      
      if (!res.ok) {
        throw new Error(data.error || 'Login Failed')
      }
      
      if (rememberMe) {
        localStorage.setItem('vtab_remember_email', email)
      } else {
        localStorage.removeItem('vtab_remember_email')
      }
      
      onLogin(data.token, data.user)

      if (data.user?.must_change_password) {
        navigate('/change-password')
      } else {
        navigate('/dashboard')
      }
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
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="w-full max-w-[420px] p-10 rounded-[48px] z-20 relative nature-glass overflow-hidden"
      >
        {/* Leaf Accents */}
        <div className="leaf-accent -bottom-10 -left-10 w-48 h-48 opacity-[0.08]">
          <svg viewBox="0 0 200 200" fill="currentColor"><path d="M100,20 C120,60 180,80 180,140 C180,180 140,180 100,160 C60,180 20,180 20,140 C20,80 80,60 100,20" /></svg>
        </div>
        <div className="leaf-accent -top-10 -right-10 w-32 h-32 opacity-[0.05] rotate-180">
          <svg viewBox="0 0 200 200" fill="currentColor"><path d="M100,20 C120,60 180,80 180,140 C180,180 140,180 100,160 C60,180 20,180 20,140 C20,80 80,60 100,20" /></svg>
        </div>

        {/* Header Section */}
        <div className="mb-10">
          <h2 className="text-3xl font-medium tracking-tight" style={{ color: 'var(--nature-text)' }}>Sign in</h2>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-5">
          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                <Mail size={18} color="var(--nature-text)" />
              </div>
              <input
                type="email"
                placeholder="Email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full pl-14 p-5 rounded-full outline-none nature-input text-sm transition-all"
                required
              />
            </div>
          </div>

          <div className="space-y-1">
            <div className="relative group">
              <div className="absolute inset-y-0 left-6 flex items-center pointer-events-none opacity-40 group-focus-within:opacity-100 transition-opacity">
                <Lock size={18} color="var(--nature-text)" />
              </div>
              <input
                type={showPassword ? 'text' : 'password'}
                placeholder="Password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full pl-14 pr-14 p-5 rounded-full outline-none nature-input text-sm transition-all"
                required
              />
              <button 
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-6 top-1/2 -translate-y-1/2 p-1 opacity-40 hover:opacity-100 transition-all"
                style={{ color: 'var(--nature-text)' }}
              >
                {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>
            <div className="flex justify-between items-center px-1">
              <label className="flex items-center gap-2 cursor-pointer group">
                <div 
                  onClick={() => setRememberMe(!rememberMe)}
                  className={`w-4 h-4 rounded border transition-all flex items-center justify-center ${
                    rememberMe ? 'bg-emerald-500 border-emerald-500' : 'border-white/20 group-hover:border-white/40'
                  }`}
                >
                  {rememberMe && <div className="w-1.5 h-1.5 bg-white rounded-full" />}
                </div>
                <span className="text-[11px] font-medium opacity-60 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--nature-text)' }}>
                  Remember me
                </span>
              </label>
              <Link to="/forgot-password" 
                className="text-[11px] font-medium opacity-70 hover:opacity-100 transition-opacity"
                style={{ color: 'var(--nature-text)' }}>
                Forgot password?
              </Link>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full mt-2 p-5 rounded-full font-medium text-white transition-all hover:brightness-110 active:scale-[0.98] shadow-lg"
            style={{ 
              backgroundColor: 'var(--nature-accent)',
              opacity: loading ? 0.7 : 1,
            }}
          >
            {loading ? 'Processing...' : 'Sign in'}
          </button>

          <p className="text-[11px] text-center opacity-40 mt-2" style={{ color: 'var(--nature-text)', lineHeight: '1.6' }}>
            By signing in, you accept our <span className="underline cursor-pointer">Privacy Policy</span><br />and <span className="underline cursor-pointer">Terms of Service</span>
          </p>
        </form>
      </motion.div>

      <AnimatePresence>
        {error && (
          <motion.div 
            initial={{ opacity: 0, y: 50, scale: 0.9, x: '-50%' }}
            animate={{ opacity: 1, y: 0, scale: 1, x: '-50%' }}
            exit={{ opacity: 0, y: 20, scale: 0.9, x: '-50%' }}
            onAnimationComplete={() => setTimeout(() => setError(''), 3500)}
            className="fixed bottom-10 left-1/2 z-[100] px-8 py-4 rounded-2xl bg-black/80 backdrop-blur-xl border border-red-500/20 shadow-2xl flex items-center gap-3"
          >
            <div className="w-1.5 h-1.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.8)]" />
            <p className="text-red-300 text-sm font-semibold tracking-wide">{error}</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
