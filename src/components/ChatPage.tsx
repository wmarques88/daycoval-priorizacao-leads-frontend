import { useState, useEffect, useRef } from 'react'
import { Send, Bot, User } from 'lucide-react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import { sendMessage, getSessions, createSession, deleteSession, getSessionMessages, getDataInfo } from '../api/client'
import SessionSidebar from './SessionSidebar'
import type { DataInfo, Session, Message } from '../types'

interface Props {
  username: string
  onLogout: () => void
}

let _msgCounter = 0
const uid = () => `msg-${++_msgCounter}`

export default function ChatPage({ username, onLogout }: Props) {
  const [sessions, setSessions] = useState<Session[]>([])
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [sessionLoading, setSessionLoading] = useState(false)
  const [dataInfo, setDataInfo] = useState<DataInfo | null>(null)
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLTextAreaElement>(null)

  // Load sessions and dataset info on mount
  useEffect(() => {
    loadSessions()
    getDataInfo().then(setDataInfo).catch(() => {})
  }, [])

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  // Restore focus to input whenever active session changes or loading ends
  useEffect(() => {
    if (!loading) inputRef.current?.focus()
  }, [activeSessionId, loading])

  async function loadSessions() {
    try {
      const data = await getSessions()
      setSessions(data)
    } catch {
      // Silently ignore — session list is non-critical
    }
  }

  async function handleCreateSession() {
    setSessionLoading(true)
    try {
      const session = await createSession()
      setSessions((prev) => [session, ...prev])
      setActiveSessionId(session.session_id)
      setMessages([])
    } finally {
      setSessionLoading(false)
    }
  }

  function handleSelectSession(sessionId: string) {
    if (sessionId === activeSessionId) return
    setActiveSessionId(sessionId)
    setMessages([])
    loadMessages(sessionId)
  }

  async function loadMessages(sessionId: string) {
    try {
      const raw = await getSessionMessages(sessionId)
      const msgs: Message[] = raw.map((m) => ({
        id: uid(),
        role: m.role,
        content: m.content,
        timestamp: new Date(m.timestamp),
      }))
      setMessages(msgs)
    } catch {
      // silently ignore — history is non-critical
    }
  }

  async function handleDeleteSession(sessionId: string) {
    try {
      await deleteSession(sessionId)
      setSessions((prev) => prev.filter((s) => s.session_id !== sessionId))
      if (activeSessionId === sessionId) {
        setActiveSessionId(null)
        setMessages([])
      }
    } catch {
      // Ignore
    }
  }

  async function handleSend() {
    const text = input.trim()
    if (!text || loading) return

    // Resolve session ID — create one if none is active
    let sessionId = activeSessionId
    if (!sessionId) {
      setSessionLoading(true)
      try {
        const newSession = await createSession()
        setSessions((prev) => [newSession, ...prev])
        setActiveSessionId(newSession.session_id)
        sessionId = newSession.session_id
      } catch {
        setSessionLoading(false)
        return
      }
      setSessionLoading(false)
    }

    setInput('')
    inputRef.current?.focus()

    // Append user message immediately
    const userMsg: Message = { id: uid(), role: 'user', content: text, timestamp: new Date() }
    setMessages((prev) => [...prev, userMsg])
    setLoading(true)

    try {
      const reply = await sendMessage(sessionId, text)
      const agentMsg: Message = { id: uid(), role: 'agent', content: reply, timestamp: new Date() }
      setMessages((prev) => [...prev, agentMsg])
      // Refresh session list to update turn count
      loadSessions()
    } catch (err: unknown) {
      const axiosErr = err as { friendlyMessage?: string; response?: { status?: number; data?: { detail?: string } } }
      let detail: string
      if (axiosErr.friendlyMessage) {
        detail = axiosErr.friendlyMessage
      } else {
        const raw = axiosErr.response?.data?.detail ?? ''
        // Don't expose internal stack traces — show a generic message instead
        detail = raw && !raw.includes('<class ') && !raw.includes('Traceback')
          ? raw
          : 'Erro ao contactar o agente. Tente novamente.'
      }
      const errMsg: Message = { id: uid(), role: 'agent', content: `⚠️ ${detail}`, timestamp: new Date() }
      setMessages((prev) => [...prev, errMsg])
    } finally {
      setLoading(false)
      inputRef.current?.focus()
    }
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  const activeSession = sessions.find((s) => s.session_id === activeSessionId)

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Sidebar */}
      <SessionSidebar
        sessions={sessions}
        activeSessionId={activeSessionId}
        onSelect={handleSelectSession}
        onCreate={handleCreateSession}
        onDelete={handleDeleteSession}
        onLogout={onLogout}
        username={username}
      />

      {/* Main area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top bar */}
        <header className="bg-white border-b px-6 py-3 flex items-center gap-3 shrink-0">
          <Bot size={18} className="text-daycoval-navy" />
          <div>
            <p className="text-sm font-semibold text-daycoval-navy">
              {activeSession?.name ?? 'Daycoval Leads Agent'}
            </p>
            {activeSession && (
              <p className="text-xs text-gray-400">{activeSession.turn_count} turnos</p>
            )}
          </div>
        </header>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 chat-messages">
          {messages.length === 0 && !loading && (
            <div className="flex flex-col items-center justify-center h-full text-center gap-3">
              <div className="w-14 h-14 rounded-2xl bg-daycoval-navy-50 flex items-center justify-center">
                <Bot size={28} className="text-daycoval-navy" />
              </div>
              <div>
                <p className="font-medium text-gray-700">Como posso ajudar?</p>
                <p className="text-sm text-gray-400 mt-1 max-w-sm">
                  Pergunte sobre leads prioritários, distribuição de scores, análise temporal ou métricas do modelo.
                </p>
                {dataInfo?.latest_lead_date && (
                  <p className="text-xs text-gray-400 mt-2">
                    Lead mais recente:{' '}
                    <span className="font-medium text-gray-500">
                      {new Date(dataInfo.latest_lead_date).toLocaleString('pt-BR', {
                        day: '2-digit',
                        month: '2-digit',
                        year: 'numeric',
                        hour: '2-digit',
                        minute: '2-digit',
                      })}
                    </span>
                  </p>
                )}
              </div>
              <div className="flex flex-wrap gap-2 justify-center mt-2">
                {[
                  'Quais os top 10 leads hoje?',
                  'Distribua os leads por cluster',
                  'Como está o score AA essa semana?',
                ].map((q) => (
                  <button
                    key={q}
                    onClick={() => { setInput(q); inputRef.current?.focus() }}
                    className="text-xs bg-white border border-gray-200 hover:border-daycoval-navy hover:text-daycoval-navy rounded-full px-3 py-1.5 transition-colors text-gray-600"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
            >
              {msg.role === 'agent' && (
                <div className="w-7 h-7 rounded-lg bg-daycoval-navy-50 flex items-center justify-center shrink-0 mt-0.5">
                  <Bot size={14} className="text-daycoval-navy" />
                </div>
              )}
              <div
                className={`max-w-2xl rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                  msg.role === 'user'
                    ? 'bg-daycoval-navy text-white rounded-tr-sm'
                    : 'bg-white border border-gray-200 text-gray-800 rounded-tl-sm'
                }`}
              >
                {msg.role === 'agent' ? (
                  <div className="markdown-body">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {msg.content}
                    </ReactMarkdown>
                  </div>
                ) : (
                  <p>{msg.content}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="w-7 h-7 rounded-lg bg-gray-200 flex items-center justify-center shrink-0 mt-0.5">
                  <User size={14} className="text-gray-600" />
                </div>
              )}
            </div>
          ))}

          {/* Loading indicator */}
          {loading && (
            <div className="flex gap-3 justify-start">
              <div className="w-7 h-7 rounded-lg bg-daycoval-navy-50 flex items-center justify-center shrink-0">
                <Bot size={14} className="text-daycoval-navy" />
              </div>
              <div className="bg-white border border-gray-200 rounded-2xl rounded-tl-sm px-4 py-3">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-daycoval-navy-mid rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
              </div>
            </div>
          )}

          <div ref={bottomRef} />
        </div>

        {/* Input bar */}
        <div className="bg-white border-t px-6 py-4 shrink-0">
          <div className="flex items-end gap-3 max-w-3xl mx-auto">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={loading || sessionLoading}
              placeholder="Faça uma pergunta sobre os leads… (Enter para enviar)"
              rows={1}
              className="flex-1 resize-none bg-gray-100 rounded-xl px-4 py-3 text-sm focus:outline-none focus:ring-2 focus:ring-daycoval-navy disabled:opacity-50 max-h-32 overflow-auto"
            />
            <button
              onClick={handleSend}
              disabled={!input.trim() || loading || sessionLoading}
              className="bg-daycoval-orange hover:bg-daycoval-orange-dark disabled:bg-daycoval-orange-100 text-white rounded-xl p-3 transition-colors shrink-0"
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-gray-400 text-center mt-2">
            Shift+Enter para nova linha · Enter para enviar
          </p>
        </div>
      </div>
    </div>
  )
}
