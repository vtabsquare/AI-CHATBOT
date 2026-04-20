import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Calendar, 
  Mail, 
  User, 
  Clock, 
  Trash2, 
  CheckCircle2, 
  AlertCircle,
  MessageSquare,
  Search,
  ChevronRight
} from 'lucide-react'

const API_BASE = 'https://ai-chatbot-lpap.onrender.com/api'

const MeetingLeads = ({ wsId, token }) => {
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')

  const authFetch = (url, options = {}) => {
    return fetch(url, {
      ...options,
      headers: { 
        ...options.headers, 
        'Authorization': `Bearer ${token}` 
      }
    })
  }

  const loadBookings = async () => {
    try {
      const res = await authFetch(`${API_BASE}/admin/bookings?ws_id=${wsId}`)
      if (res.ok) {
        const data = await res.json()
        setBookings(data)
      }
    } catch (e) {
      console.error("Failed to load bookings", e)
    } finally {
      setLoading(false)
    }
  }

  const deleteBooking = async (id) => {
    if (!window.confirm("Are you sure you want to remove this request?")) return
    try {
      const res = await authFetch(`${API_BASE}/admin/bookings/${id}`, { method: 'DELETE' })
      if (res.ok) {
        setBookings(bookings.filter(b => b.id !== id))
      }
    } catch (e) {
      alert("Failed to delete booking")
    }
  }

  useEffect(() => {
    if (wsId && token) loadBookings()
  }, [wsId, token])

  const filteredBookings = bookings.filter(b => 
    b.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    b.email.toLowerCase().includes(searchQuery.toLowerCase())
  )

  if (loading) return (
    <div className="flex flex-col items-center justify-center p-20 gap-4">
      <div className="w-12 h-12 border-4 border-emerald-500/20 border-t-emerald-500 rounded-full animate-spin"></div>
      <p className="text-xs font-black text-muted uppercase tracking-widest animate-pulse">Syncing Meeting Requests...</p>
    </div>
  )

  return (
    <div className="p-8 lg:p-12">
      {/* Header */}
      <div className="mb-12">
        <div className="flex items-center gap-3 mb-2">
           <div className="w-10 h-10 rounded-2xl bg-emerald-500/10 flex items-center justify-center text-emerald-500">
             <Calendar size={20} />
           </div>
           <h1 className="text-3xl font-black text-primary">Meeting Requests</h1>
        </div>
        <p className="text-secondary text-sm">Review and follow up with high-intent leads who requested a call via the chatbot.</p>
      </div>

      {/* Stats Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <div className="p-6 rounded-[32px] bg-gradient-to-br from-emerald-500/10 to-emerald-500/5 text-emerald-500 border border-emerald-500/20 shadow-xl">
           <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Total Requests</div>
           <div className="text-4xl font-black">{bookings.length}</div>
        </div>
        <div className="p-6 rounded-[32px] bg-gradient-to-br from-blue-500/10 to-blue-500/5 text-blue-400 border border-blue-500/20 shadow-xl">
           <div className="text-[10px] font-black uppercase tracking-widest opacity-70 mb-1">Response Rate</div>
           <div className="text-4xl font-black">100%</div>
        </div>
        <div className="p-6 rounded-[32px] nature-glass border border-subtle relative overflow-hidden">
           <div className="relative z-10">
             <div className="text-[10px] font-black text-muted uppercase tracking-widest mb-1">Search Leads</div>
             <div className="flex items-center gap-2 mt-2">
                <Search size={14} className="text-muted" />
                <input 
                  type="text" 
                  placeholder="Filter by name or email..." 
                  className="bg-transparent border-none text-xs font-bold text-primary outline-none w-full"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
             </div>
           </div>
        </div>
      </div>

      {/* Leads Table */}
      <div className="rounded-3xl border border-subtle overflow-hidden bg-surface-glass backdrop-blur-xl shadow-2xl">
        <div className="px-8 py-6 border-b border-subtle flex items-center justify-between bg-white/5">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-xl bg-emerald-500/10 text-emerald-500 flex items-center justify-center"><CheckCircle2 size={16}/></div>
             <h3 className="text-sm font-black text-primary uppercase tracking-widest">Client Meeting Registry</h3>
          </div>
        </div>
        
        <div className="overflow-x-auto">
          {filteredBookings.length === 0 ? (
            <div className="p-20 text-center flex flex-col items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-muted/10 flex items-center justify-center text-secondary">
                <MessageSquare size={32} />
              </div>
              <div>
                <p className="text-sm font-black text-primary">No meeting requests found</p>
                <p className="text-[10px] font-bold text-muted uppercase tracking-widest mt-1">High-intent leads will appear here automatically</p>
              </div>
            </div>
          ) : (
            <table className="w-full text-left border-collapse">
               <thead className="bg-white/[0.02] border-b border-subtle">
                 <tr>
                   <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Contact Info</th>
                   <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Requested Schedule</th>
                   <th className="px-8 py-4 text-[10px] font-black text-muted uppercase tracking-widest">Status</th>
                   <th className="px-8 py-4 text-right text-[10px] font-black text-muted uppercase tracking-widest">Actions</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 <AnimatePresence>
                   {filteredBookings.map((booking, i) => (
                     <motion.tr 
                       layout
                       initial={{ opacity: 0, x: -20 }}
                       animate={{ opacity: 1, x: 0 }}
                       exit={{ opacity: 0, x: 20 }}
                       transition={{ delay: i * 0.05 }}
                       key={booking.id} 
                       className="hover:bg-white/[0.02] transition-colors group"
                     >
                       <td className="px-8 py-6">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2">
                               <div className="w-6 h-6 rounded-lg bg-emerald-500/10 text-emerald-500 flex items-center justify-center flex-shrink-0">
                                 <User size={12} />
                               </div>
                               <span className="text-sm font-black text-primary group-hover:text-emerald-500 transition-colors">{booking.name}</span>
                            </div>
                            <div className="flex items-center gap-2 pl-8">
                               <Mail size={10} className="text-muted" />
                               <span className="text-[10px] font-bold text-muted select-all">{booking.email}</span>
                            </div>
                         </div>
                       </td>
                       <td className="px-8 py-6">
                         <div className="flex flex-col gap-1">
                            <div className="flex items-center gap-2 text-blue-400">
                               <Calendar size={12} />
                               <span className="text-xs font-black">{booking.requested_date}</span>
                            </div>
                            <div className="flex items-center gap-2 text-purple-400">
                               <Clock size={12} />
                               <span className="text-[11px] font-bold uppercase">{booking.requested_time}</span>
                            </div>
                         </div>
                       </td>
                       <td className="px-8 py-6">
                          <span className="px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-black uppercase tracking-widest border border-emerald-500/20">
                            Awaiting Follow-up
                          </span>
                       </td>
                       <td className="px-8 py-6 text-right">
                          <button 
                            onClick={() => deleteBooking(booking.id)}
                            className="p-3 rounded-2xl bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white transition-all active:scale-90 border border-red-500/20"
                          >
                            <Trash2 size={16} />
                          </button>
                       </td>
                     </motion.tr>
                   ))}
                 </AnimatePresence>
               </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Footer Instructions */}
      <div className="mt-8 p-6 nature-glass border border-subtle rounded-3xl flex items-start gap-4">
         <div className="w-10 h-10 rounded-2xl bg-blue-500/10 text-blue-400 flex items-center justify-center flex-shrink-0">
           <AlertCircle size={20} />
         </div>
         <div>
            <h4 className="text-xs font-black text-primary uppercase tracking-widest mb-1">Next Step Strategy</h4>
            <p className="text-[10px] font-bold text-muted uppercase tracking-tighter leading-relaxed">
              We recommend reaching out via email within <span className="text-emerald-500">2 hours</span> of the request. 
              These leads have interacted with your bot and are already familiar with your business services.
            </p>
         </div>
      </div>
    </div>
  )
}

export default MeetingLeads
