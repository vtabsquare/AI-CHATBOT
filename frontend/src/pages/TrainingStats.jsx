/**
 * TrainingStats.jsx — Enterprise Training & Intelligence Monitoring
 * Feature: Knowledge Gap Detection | Sync Health | Recent Intel Fragments
 */

import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { 
  BrainCircuit, 
  Globe, 
  Clock, 
  ChevronRight, 
  CheckCircle2, 
  AlertCircle,
  RefreshCw,
  Search
} from 'lucide-react'

const API_BASE = window.location.origin.replace(':5173', ':5000') + '/api'

const StatCard = ({ icon, label, value, sub, color }) => {
  const colors = {
    emerald: 'from-emerald-500/10 to-emerald-500/5 text-emerald-500 border-emerald-500/20',
    blue: 'from-blue-500/10 to-blue-500/5 text-blue-400 border-blue-500/20',
    purple: 'from-purple-500/10 to-purple-500/5 text-purple-400 border-purple-500/20',
    amber: 'from-amber-500/10 to-amber-500/5 text-amber-500 border-amber-500/20'
  }
  return (
    <div className={`p-6 rounded-[32px] bg-gradient-to-br border shadow-xl ${colors[color] || colors.emerald}`}>
      <div className="flex items-center gap-4 mb-4">
        <div className="p-3 rounded-2xl bg-white/5">{icon}</div>
        <div className="text-[10px] font-black uppercase tracking-widest opacity-70">{label}</div>
      </div>
      <div className="text-4xl font-black mb-1">{value}</div>
      <div className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">{sub}</div>
    </div>
  )
}

const TrainingStats = ({ wsId, token, isDarkMode }) => {
  const [stats, setStats] = useState(null)
  const [loading, setLoading] = useState(true)
  const [gaps, setGaps] = useState({ status: 'loading', gaps: [] })
  const [syncingGaps, setSyncingGaps] = useState(false)

  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: { ...options.headers, 'Authorization': `Bearer ${token}` }
    })
  }

  const loadData = async () => {
    try {
      const res = await authFetch(`${API_BASE}/admin/training-stats/${wsId}`)
      if (res.ok) {
        const d = await res.json()
        setStats(d)
      }
      
      // Check for website gaps
      const gapRes = await authFetch(`${API_BASE}/admin/check-updates/${wsId}`)
      if (gapRes.ok) {
        setGaps(await gapRes.json())
      }
    } catch (e) {
      console.error(e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (wsId && token) loadData()
  }, [wsId, token])

  const handleSyncGap = async (url) => {
    setSyncingGaps(true)
    try {
      const r = await authFetch(`${API_BASE}/scrape`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ workspace_id: wsId, url })
      })
      if (r.ok) {
        // Just refresh everything to be safe
        loadData()
      }
    } catch (err) {
      console.error(err)
    } finally {
      setSyncingGaps(false)
    }
  }

  if (loading && !stats) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      <p className="text-xs font-black text-muted uppercase tracking-widest animate-pulse">Synchronizing Intelligence...</p>
    </div>
  )

  if (!stats) return null

  return (
    <div className="p-8 lg:p-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
             <BrainCircuit size={20} />
           </div>
           <h1 className="text-3xl font-black text-primary">Intelligence & Training</h1>
        </div>
        <p className="text-slate-500 text-sm">Real-time status of your bot's knowledge base and website synchronization.</p>
      </div>

      {/* Hero Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
        <StatCard 
          icon={<Globe size={24}/>} 
          label="Unique Sources" 
          value={stats.unique_sources} 
          sub="Website pages & Files"
          color="emerald"
        />
        <StatCard 
          icon={<BrainCircuit size={24}/>} 
          label="Knowledge Chunks" 
          value={stats.total_chunks} 
          sub="Information fragments"
          color="blue"
        />
        <StatCard 
          icon={<Clock size={24}/>} 
          label="Last Sync" 
          value={stats.last_sync !== 'Never' ? new Date(stats.last_sync).toLocaleDateString() : 'Never'} 
          sub="Bot Brain Up-to-date"
          color="purple"
        />
        <div className={`p-6 rounded-[32px] border shadow-xl flex flex-col justify-between ${
          gaps.status === 'url_missing' ? 'bg-slate-500/5 text-slate-500 border-slate-500/20' :
          gaps.gap_count > 0 ? 'from-amber-400/20 to-amber-400/5 text-amber-500 border-amber-500/20 bg-gradient-to-br transition-all' :
          'from-emerald-500/10 to-emerald-500/5 text-emerald-500 border-emerald-500/20 bg-gradient-to-br transition-all'
        }`}>
          <div className="flex items-center gap-3 mb-4">
            <div className={`p-2.5 rounded-xl ${gaps.gap_count > 0 ? 'bg-amber-500/20 text-amber-500' : 'bg-emerald-500/20 text-emerald-500'}`}>
              {gaps.gap_count > 0 ? <AlertCircle size={20} /> : <CheckCircle2 size={20} />}
            </div>
            <div className="text-[10px] font-black uppercase tracking-widest opacity-70">Sync Health</div>
          </div>
          <div>
            <div className="text-2xl font-black mb-1">
              {gaps.status === 'url_missing' ? 'No Site set' :
               gaps.gap_count > 0 ? `${gaps.gap_count} Gaps` : 'Healthy'}
            </div>
            <div className="text-[10px] font-bold opacity-50 uppercase tracking-tighter">
              {gaps.status === 'url_missing' ? 'Set URL in settings' :
               gaps.gap_count > 0 ? 'Updates recommended' : 'Fully Synchronized'}
            </div>
          </div>
        </div>
      </div>

      {/* Recently Learned Intel */}
      {stats.recent_intel && stats.recent_intel.length > 0 && (
        <div className="mb-12">
          <div className="flex items-center gap-3 mb-6">
            <h2 className="text-xl font-black text-primary">Recently Injected Intel</h2>
            <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest animate-pulse border border-emerald-500/20">
              Live Learning Active
            </span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {stats.recent_intel.map((intel) => (
              <motion.div 
                key={intel.id}
                whileHover={{ y: -5 }}
                className="p-6 rounded-[32px] bg-surface-glass border border-subtle shadow-2xl backdrop-blur-xl relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 p-4 opacity-5 group-hover:opacity-10 transition-opacity">
                  <BrainCircuit size={48} />
                </div>
                <div className="flex items-center justify-between mb-4">
                  <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest bg-emerald-500/5 px-2 py-0.5 rounded-md border border-emerald-500/10">
                    {intel.type} Source
                  </span>
                  <span className="text-[10px] font-bold text-muted uppercase tracking-tighter">{new Date(intel.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                </div>
                <div className="text-xs font-bold text-primary/80 line-clamp-4 leading-relaxed italic mb-6 relative z-10">
                  "{intel.snippet}"
                </div>
                <div className="pt-4 border-t border-white/5 flex items-center gap-2 overflow-hidden">
                   <div className="w-5 h-5 rounded-lg bg-emerald-500/20 flex items-center justify-center text-emerald-500 flex-shrink-0">
                     <Globe size={10} />
                   </div>
                   <div className="text-[10px] font-black text-muted truncate select-all">{intel.name}</div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      )}

      {/* Unmapped Website Intelligence (Gaps) */}
      {gaps.gap_count > 0 && (
        <div className="mb-12 animate-in fade-in slide-in-from-bottom-5">
           <div className="flex items-center justify-between mb-6">
              <div className="flex items-center gap-3">
                <h2 className="text-xl font-black text-primary flex items-center gap-2">
                  <span className="text-amber-500 animate-pulse"><AlertCircle size={20}/></span>
                  Potential New Intelligence Detected
                </h2>
                <div className="px-3 py-1 rounded-full bg-amber-500/10 text-amber-500 text-[9px] font-black uppercase tracking-widest">Knowledge Lag Detected</div>
              </div>
              <p className="text-[10px] font-black text-muted hidden lg:block uppercase tracking-widest opacity-50">Discovery from: {gaps.root_url}</p>
           </div>
           
           <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
             {gaps.gaps.map((url, idx) => (
                <div key={idx} className="nature-glass p-5 rounded-3xl border border-amber-500/20 flex items-center justify-between group hover:border-amber-500 transition-all shadow-lg bg-amber-500/[0.02]">
                  <div className="flex items-center gap-3 flex-1 min-w-0">
                    <div className="w-10 h-10 rounded-2xl bg-amber-500/10 flex items-center justify-center text-amber-500">
                      <Search size={16} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="text-xs font-black text-primary truncate">{url}</div>
                      <div className="text-[9px] font-bold text-amber-500/60 uppercase tracking-tighter">New page discovered</div>
                    </div>
                  </div>
                  <button 
                    disabled={syncingGaps}
                    onClick={() => handleSyncGap(url)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl bg-amber-500 hover:bg-amber-400 text-white font-black text-[9px] uppercase tracking-widest transition-all shadow-lg shadow-amber-500/20 active:scale-95 disabled:opacity-50"
                  >
                    <RefreshCw size={12} className={syncingGaps ? 'animate-spin' : ''} />
                    {syncingGaps ? 'Syncing...' : 'Inject Intel'}
                  </button>
                </div>
             ))}
           </div>
        </div>
      )}

      {/* Pages Read Table */}
      <div className="rounded-3xl border border-subtle overflow-hidden bg-surface-glass backdrop-blur-xl">
        <div className="px-8 py-6 border-b border-subtle flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={16}/></div>
             <h3 className="text-sm font-black text-primary uppercase tracking-widest">Verified Knowledge Base</h3>
          </div>
          <div className="text-[10px] font-bold text-emerald-500 flex items-center gap-2 uppercase tracking-widest">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
            Intelligence Active
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
             <thead className="bg-white/[0.02] border-b border-subtle">
               <tr>
                 <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Category</th>
                 <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Source Entity</th>
                 <th className="px-8 py-4 text-right text-[10px] font-black text-muted uppercase tracking-widest">Health</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-white/5">
               {stats.raw_items.map((item, i) => (
                 <motion.tr 
                   initial={{ opacity: 0, y: 10 }}
                   animate={{ opacity: 1, y: 0 }}
                   transition={{ delay: i * 0.05 }}
                   key={item.id} 
                   className="hover:bg-white/[0.02] transition-colors group"
                 >
                   <td className="px-8 py-5">
                      <span className={`px-2.5 py-1 rounded-md text-[9px] font-black uppercase tracking-widest ${
                        item.type === 'url' ? 'bg-blue-500/10 text-blue-400 border border-blue-500/20' : 'bg-amber-500/10 text-amber-500 border border-amber-500/20'
                      }`}>
                        {item.type}
                      </span>
                   </td>
                   <td className="px-8 py-5">
                     <div className="flex flex-col">
                        <span className="text-xs font-black text-primary truncate max-w-md group-hover:text-emerald-500 transition-colors">{item.name}</span>
                        <span className="text-[9px] font-bold text-muted uppercase mt-0.5 tracking-tighter opacity-50 italic">Captured: {new Date(item.created_at).toLocaleDateString()}</span>
                     </div>
                   </td>
                   <td className="px-8 py-5 text-right">
                     <span className="text-[10px] font-black text-emerald-500 flex items-center justify-end gap-2 uppercase tracking-widest">
                       <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                       Injected
                     </span>
                   </td>
                 </motion.tr>
               ))}
             </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default TrainingStats
