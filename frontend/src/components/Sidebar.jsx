import { motion, AnimatePresence } from 'framer-motion'
import { Plus, Sparkles, ChevronLeft, ChevronRight, Bot, User, LogOut, Moon, Sun, Search } from 'lucide-react'
import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import WorkspaceItem from './WorkspaceItem'
import ChatItem from './ChatItem'

export default function Sidebar({
  user, onLogout,
  workspaces, activeWsId, onSelectWs, onCreateWs, onRenameWs, onDeleteWs,
  chats, activeChatId, onSelectChat, onCreateChat, onRenameChat, onDeleteChat,
  collapsed, onToggle, isDarkMode, onToggleTheme
}) {
  const [hoveredCreateWs, setHoveredCreateWs] = useState(false)
  const [hoveredCreateChat, setHoveredCreateChat] = useState(false)
  const navigate = useNavigate()

  return (
    <motion.aside
      initial={{ x: -300, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.4, ease: [0.25, 0.46, 0.45, 0.94] }}
      style={{
        width: collapsed ? '64px' : '280px',
        minWidth: collapsed ? '64px' : '280px',
        background: 'var(--bg-surface)',
        borderRight: '1px solid var(--border-subtle)',
        transition: 'width 0.3s cubic-bezier(0.25,0.46,0.45,0.94), min-width 0.3s cubic-bezier(0.25,0.46,0.45,0.94)',
        display: 'flex',
        flexDirection: 'column',
        height: '100%',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* Logo / Brand / Search */}
      <div className="flex items-center justify-between px-4 pt-6 pb-4">
        <div className="flex items-center gap-3">
          <motion.div
            whileHover={{ rotate: 15, scale: 1.1 }}
            className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
            style={{ 
              background: isDarkMode ? 'linear-gradient(135deg, #064e40, #10b981)' : 'linear-gradient(135deg, #10b981, #059669)', 
              boxShadow: isDarkMode ? '0 0 14px rgba(16,185,129,0.3)' : '0 4px 12px rgba(16,185,129,0.2)' 
            }}
          >
            <Bot size={18} color="#fff" />
          </motion.div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -10 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col"
              >
                <span className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>AI Workspace</span>
                <span className="text-[10px] tracking-widest uppercase font-black" style={{ color: 'var(--text-muted)' }}>V1.0 • {user?.role === 'admin' ? 'Admin' : 'Client'}</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {!collapsed && (
          <button
            onClick={() => window.dispatchEvent(new KeyboardEvent('keydown', { key: 'k', metaKey: true }))}
            className={`p-1.5 rounded-lg transition-colors ${isDarkMode ? 'hover:bg-white/5' : 'hover:bg-black/5'}`}
            style={{ color: 'var(--text-muted)' }}
            title="Search (Cmd+K)"
          >
            <Search size={16} />
          </button>
        )}
      </div>

      {/* Primary Action: New Workspace */}
      {user?.role === 'admin' && (
        <div className="px-4 mb-5 mt-1">
          <motion.button
            onClick={onCreateWs}
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            className="w-full flex items-center justify-center gap-2 py-3 rounded-full font-bold text-sm transition-all"
            style={{
              background: isDarkMode ? 'linear-gradient(135deg, #064e40, #10b981)' : 'linear-gradient(135deg, #10b981, #059669)',
              color: '#fff',
              boxShadow: isDarkMode ? '0 4px 20px rgba(16, 185, 129, 0.3)' : '0 8px 24px rgba(16, 185, 129, 0.25)'
            }}
          >
            <Plus size={15} />
            {!collapsed && <span>New Business Bot</span>}
          </motion.button>
        </div>
      )}

      {/* Workspaces Section */}
      <div className="px-3 mb-4">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 mb-2">
            <p className="text-[9px] uppercase tracking-[0.2em] font-black" style={{ color: 'var(--text-muted)' }}>
              Managed Bots
            </p>
          </div>
        )}

        {workspaces.map((ws) => (
          collapsed ? (
            <motion.button
              key={ws.id}
              onClick={() => onSelectWs(ws.id)}
              whileTap={{ scale: 0.95 }}
              title={ws.name}
              className="w-full flex items-center justify-center p-2 rounded-xl mb-1"
              style={{
                background: activeWsId === ws.id ? 'rgba(16,185,129,0.2)' : 'transparent',
                border: `1px solid ${activeWsId === ws.id ? 'rgba(16,185,129,0.3)' : 'transparent'}`,
              }}
            >
              <div className="w-6 h-6 rounded-md flex items-center justify-center text-xs font-bold"
                style={{ background: 'linear-gradient(135deg, var(--accent-primary), var(--accent-secondary))', color: '#fff' }}>
                {ws.name[0]}
              </div>
            </motion.button>
          ) : (
            <div key={ws.id} className="mb-1 block">
              <WorkspaceItem
                workspace={ws}
                isActive={activeWsId === ws.id}
                isAdmin={user?.role === 'admin'}
                onClick={() => onSelectWs(ws.id)}
                onRename={onRenameWs}
                onDelete={onDeleteWs}
              />
            </div>
          )
        ))}
      </div>

      {/* Chat History Section */}
      <div className="flex-1 overflow-y-auto px-3 space-y-1 pb-4">
        {!collapsed && (
          <div className="flex items-center justify-between px-3 mb-2 mt-2">
            <p className="text-[9px] uppercase tracking-[0.2em] font-black truncate pr-2" style={{ color: 'var(--text-muted)' }}>
              Chat History
            </p>
            <button
              onClick={onCreateChat}
              onMouseEnter={() => setHoveredCreateChat(true)}
              onMouseLeave={() => setHoveredCreateChat(false)}
              className="p-1.5 rounded-md transition-colors flex-shrink-0"
              style={{ color: hoveredCreateChat ? 'var(--text-primary)' : 'var(--text-muted)' }}
              title="New Chat"
            >
              <Plus size={14} strokeWidth={2.5} />
            </button>
          </div>
        )}

        {!collapsed && chats.length === 0 && (
          <p className="text-xs px-3 text-center mt-4" style={{ color: 'var(--text-muted)' }}>
            No chats yet.
          </p>
        )}

        {!collapsed && chats.map((chat) => (
          <div key={chat.id} className="mb-1 block">
            <ChatItem
              chat={chat}
              isActive={activeChatId === chat.id}
              onClick={() => onSelectChat(chat.id)}
              onRename={onRenameChat}
              onDelete={onDeleteChat}
            />
          </div>
        ))}
      </div>

      {/* Collapse toggle */}
      <motion.button
        onClick={onToggle}
        whileHover={{ scale: 1.1 }}
        whileTap={{ scale: 0.95 }}
        className="absolute -right-3 top-1/2 -translate-y-1/2 w-6 h-6 rounded-full flex items-center justify-center z-20"
        style={{
          background: 'var(--bg-elevated)',
          border: '1px solid var(--border-medium)',
          color: 'var(--text-secondary)',
          boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
        }}
      >
        {collapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </motion.button>

      {/* User Profile / Sign Out Bottom */}
      <div className="p-3 border-t mt-auto" style={{ borderColor: 'var(--border-subtle)' }}>
        {activeWsId && (
          <motion.button
            whileHover={{ background: 'rgba(255,255,255,0.05)' }}
            whileTap={{ scale: 0.97 }}
            onClick={() => navigate(`/training-status/${activeWsId}`)}
            className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left mb-2 text-emerald-500 hover:text-emerald-400"
          >
             <Sparkles size={16} />
             {!collapsed && <span className="text-xs font-black uppercase tracking-widest">Intelligence Status</span>}
          </motion.button>
        )}
        <motion.button
          whileHover={{ background: 'rgba(255,255,255,0.05)' }}
          whileTap={{ scale: 0.97 }}
          className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors text-left"
        >
          {/* Avatar with initials */}
          <div
            className="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-xs font-black text-white"
            style={{ background: 'linear-gradient(135deg, #064e40, #10b981)', boxShadow: '0 0 10px rgba(16,185,129,0.4)' }}
          >
            {(user?.username || 'G')[0].toUpperCase()}
          </div>
          <AnimatePresence>
            {!collapsed && (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="flex flex-col flex-1 min-w-0"
              >
                <span className="text-sm font-semibold truncate" style={{ color: 'var(--text-primary)' }}>
                  {user?.role === 'client' ? (user?.org_name || user?.username) : (user?.username || 'Guest')}
                </span>
                <span className="text-[10px] truncate font-black uppercase tracking-wider" style={{ color: 'var(--text-muted)' }}>
                  {user?.role === 'admin' ? 'Master Admin' : 'Secure Client Access'}
                </span>
              </motion.div>
            )}
          </AnimatePresence>
          <AnimatePresence>
            {!collapsed && (
              <div className="flex items-center gap-1 transition-opacity">
                <motion.div
                  title={isDarkMode ? "Light Mode" : "Dark Mode"}
                  onClick={(e) => { e.stopPropagation(); onToggleTheme() }}
                  className="p-1.5 rounded-lg transition-colors cursor-pointer"
                  style={{ color: 'var(--text-muted)', background: 'var(--bg-glass-hover)' }}
                  whileHover={{ scale: 1.1 }}
                  whileTap={{ scale: 0.9 }}
                >
                  {isDarkMode ? <Sun size={14} /> : <Moon size={14} />}
                </motion.div>
                <motion.div
                  title="Sign out"
                  onClick={(e) => { e.stopPropagation(); if(onLogout) onLogout(); }}
                  className="p-1.5 rounded-lg opacity-100 hover:bg-white/10 cursor-pointer transition-opacity"
                  style={{ color: 'var(--accent-primary)' }}
                >
                  <LogOut size={16} />
                </motion.div>
              </div>
             )}
          </AnimatePresence>
        </motion.button>
      </div>
    </motion.aside>
  )
}
