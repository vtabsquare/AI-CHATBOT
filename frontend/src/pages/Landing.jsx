import { motion } from 'framer-motion'
import { Link } from 'react-router-dom'
import { Sparkles, ShieldCheck, Zap, BarChart3, ArrowRight, Check, Leaf } from 'lucide-react'
import bgImage from '../assets/auth_bg.png'

const features = [
  {
    icon: <Zap size={20} className="text-emerald-400" />,
    title: 'Instant Deployment',
    desc: 'Embed your secure AI assistant in seconds with a single line of code.',
    color: 'rgba(16, 185, 129, 0.1)',
  },
  {
    icon: <ShieldCheck size={20} className="text-emerald-500" />,
    title: 'Isolated Vaults',
    desc: 'Every business has its own private knowledge vault for maximum security.',
    color: 'rgba(16, 185, 129, 0.1)',
  },
  {
     icon: <BarChart3 size={20} className="text-emerald-300" />,
     title: 'Real-Time Wisdom',
     desc: 'Combine local RAG knowledge with live internet search for the ultimate answers.',
     color: 'rgba(16, 185, 129, 0.1)',
  },
]

const trustedBadges = ['Encrypted', 'Isolated', 'Fast', 'Scalable']

export default function Landing() {
  return (
    <div className="min-h-screen w-full relative overflow-hidden flex flex-col font-sans bg-[#0a2f2a]">
      
      {/* ── Background Image with Overlay ── */}
      <div className="absolute inset-0 z-0">
        <img 
          src={bgImage} 
          alt="Forest background" 
          className="w-full h-full object-cover scale-110 opacity-60"
        />
        <div className="absolute inset-0 bg-gradient-to-b from-[#0a2f2a]/20 via-transparent to-[#0a2f2a]/60 backdrop-blur-[1px]"></div>
      </div>

      {/* Nav */}
      <nav className="relative w-full max-w-6xl mx-auto px-8 py-4 flex justify-between items-center z-50">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full flex items-center justify-center nature-glass shadow-lg">
             <Leaf size={20} className="text-emerald-400" />
          </div>
          <span className="text-xl font-medium tracking-tight" style={{ color: 'var(--nature-text)' }}>AI<span className="text-emerald-400 ml-0.5">Workspace</span></span>
        </div>

        <Link
          to="/login"
          className="px-6 py-2 rounded-full text-sm font-medium transition-all hover:scale-105 active:scale-95 nature-glass border border-white/10"
          style={{ color: 'var(--nature-text)' }}
        >
          Sign in →
        </Link>
      </nav>

      {/* Hero */}
      <div className="flex flex-col items-center justify-start text-center px-4 relative z-10 max-w-5xl mx-auto w-full pt-0 mb-6">

        <motion.div
           initial={{ opacity: 0, y: 20 }}
           animate={{ opacity: 1, y: 0 }}
           transition={{ duration: 0.8 }}
           className="inline-flex items-center gap-2 px-5 py-2 rounded-full nature-glass text-[11px] font-medium tracking-widest uppercase mb-4 border border-white/5"
           style={{ color: 'var(--nature-accent)' }}
        >
          <Sparkles size={12} className="text-emerald-400" />
          Powered by Llama 3 Pro
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.9, delay: 0.1 }}
          className="text-5xl md:text-7xl font-semibold mb-3 leading-[1.05] tracking-tight"
          style={{ color: 'var(--nature-text)' }}
        >
          The Future of <br />
          <span className="text-transparent bg-clip-text" style={{ backgroundImage: 'linear-gradient(to right, #52ffca, #10b981, #a7ffd0)' }}>
            Customer Intelligence
          </span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-base md:text-lg mb-6 max-w-2xl mx-auto font-medium opacity-60 leading-relaxed"
          style={{ color: 'var(--nature-text)' }}
        >
          Professional AI assistants that feel as natural as your brand.
          Securely isolated, instantly deployed, and deeply intuitive.
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.3 }}
          className="flex flex-col md:flex-row items-center gap-6"
        >
          <Link
            to="/login"
            className="group inline-flex items-center gap-3 px-10 py-4 rounded-full text-base font-medium text-white shadow-2xl transition-all hover:scale-105 active:scale-95"
            style={{ backgroundColor: '#064e3b' }}
          >
            Get started
            <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </Link>
          
          <div className="flex items-center gap-4">
             {trustedBadges.map((b) => (
                <span key={b} className="flex items-center gap-1.5 text-[12px] font-medium opacity-80" style={{ color: 'var(--nature-text)' }}>
                  <Check size={14} className="text-emerald-400" /> {b}
                </span>
             ))}
          </div>
        </motion.div>

        {/* Feature Grid */}
        <motion.div
          initial={{ opacity: 0, y: 40 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1, delay: 0.5 }}
          className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mt-4"
        >
          {features.map((f, i) => (
            <motion.div
              key={i}
              whileHover={{ y: -5 }}
              className="p-6 rounded-[32px] text-left nature-glass border border-white/5 transition-all"
            >
              <div className="w-10 h-10 rounded-2xl flex items-center justify-center mb-5"
                style={{ background: f.color }}>
                {f.icon}
              </div>
              <h3 className="font-medium text-base mb-2" style={{ color: 'var(--nature-text)' }}>{f.title}</h3>
              <p className="text-xs leading-relaxed opacity-50" style={{ color: 'var(--nature-text)' }}>{f.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </div>

      <div className="relative z-10 text-center pb-10 text-[11px] font-medium uppercase tracking-[0.2em] opacity-30 mt-12" style={{ color: 'var(--nature-text)' }}>
        © 2026 AI Workspace Platform. Purely Professional.
      </div>
    </div>
  )
}
