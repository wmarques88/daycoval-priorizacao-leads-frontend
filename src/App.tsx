import { useState, useEffect } from 'react'
import LoginPage from './components/LoginPage'
import ChatPage from './components/ChatPage'
import type { AuthState } from './types'

export default function App() {
  const [auth, setAuth] = useState<AuthState | null>(null)

  // Restore session from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('token')
    const username = localStorage.getItem('username')
    if (token && username) setAuth({ token, username })
  }, [])

  function handleLogin(token: string, username: string) {
    setAuth({ token, username })
  }

  function handleLogout() {
    localStorage.removeItem('token')
    localStorage.removeItem('username')
    setAuth(null)
  }

  if (!auth) return <LoginPage onLogin={handleLogin} />
  return <ChatPage username={auth.username} onLogout={handleLogout} />
}
