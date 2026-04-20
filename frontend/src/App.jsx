import { useState, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import ChatBox             from './pages/ChatBox'
import Login               from './pages/Login'
import Landing             from './pages/Landing'
import ForgotPassword      from './pages/ForgotPassword'
import ForceChangePassword from './pages/ForceChangePassword'
import MeetingLeads        from './pages/MeetingLeads'

export default function App() {
  useEffect(() => {
    // ── Early Warmup Ping ──
    // This wakes up the Supabase project as soon as the user opens the site.
    fetch('https://ai-chatbot-lpap.onrender.com/').catch(() => {})
  }, [])
  
  const [token, setToken] = useState(() => {
    const t = localStorage.getItem('saas_token')
    return (t && t !== 'undefined' && t !== 'null') ? t : null
  })
  
  const [user, setUser] = useState(() => {
    try {
      const u = localStorage.getItem('saas_user')
      if (!u || u === 'undefined' || u === 'null') return null
      return JSON.parse(u)
    } catch {
      return null
    }
  })
  
  const [isDarkMode, setIsDarkMode] = useState(() => {
    return localStorage.getItem('saas_theme') !== 'light'
  })

  const toggleTheme = () => {
    setIsDarkMode(prev => {
      const next = !prev
      localStorage.setItem('saas_theme', next ? 'dark' : 'light')
      return next
    })
  }

  const handleLogin = (newToken, newUser) => {
    setToken(newToken)
    setUser(newUser)
    localStorage.setItem('saas_token', newToken)
    localStorage.setItem('saas_user', JSON.stringify(newUser))
  }

  const handleLogout = () => {
    setToken(null)
    setUser(null)
    localStorage.removeItem('saas_token')
    localStorage.removeItem('saas_user')
  }

  // Called after successful forced password change → log them out so they re-login fresh
  const handlePasswordChanged = () => {
    handleLogout()
  }

  return (
    <div className={isDarkMode ? 'theme-dark' : 'theme-light'}>
      <BrowserRouter>
        <Routes>

          {/* Public Landing Page */}
          <Route path="/" element={<Landing />} />

        {/* Auth */}
        <Route path="/login"           element={<Login onLogin={handleLogin} />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />

        {/* Force Change Password — only accessible when logged in with must_change_password flag */}
        <Route
          path="/change-password"
          element={
            token ? (
              <ForceChangePassword token={token} onPasswordChanged={handlePasswordChanged} />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Protected Dashboard — redirect to change-password if flag is still set */}
        <Route
          path="/dashboard"
          element={
            token ? (
              user?.must_change_password ? (
                <Navigate to="/change-password" />
              ) : (
                <ChatBox token={token} user={user} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} />
              )
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Training Stats — Accessible to both Admin and Client */}
        <Route
          path="/training-status/:wsId"
          element={
            token && (user?.role === 'admin' || user?.role === 'client') ? (
              <ChatBox token={token} user={user} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} initialView="training" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Meeting Leads — Admin Only */}
        <Route
          path="/meeting-leads/:wsId"
          element={
            token && user?.role === 'client' ? (
              <ChatBox token={token} user={user} onLogout={handleLogout} isDarkMode={isDarkMode} onToggleTheme={toggleTheme} initialView="bookings" />
            ) : (
              <Navigate to="/login" />
            )
          }
        />

        {/* Catch-all */}
        <Route path="*" element={<Navigate to="/" />} />
      </Routes>
    </BrowserRouter>
    </div>
  )
}
