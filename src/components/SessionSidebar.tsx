import { Plus, Trash2, MessageSquare, LogOut } from 'lucide-react'
import type { Session } from '../types'

interface Props {
  sessions: Session[]
  activeSessionId: string | null
  onSelect: (sessionId: string) => void
  onCreate: () => void
  onDelete: (sessionId: string) => void
  onLogout: () => void
  username: string
}

function formatDate(iso: string): string {
  try {
    return new Date(iso).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      hour: '2-digit',
      minute: '2-digit',
    })
  } catch {
    return iso.slice(0, 16)
  }
}

export default function SessionSidebar({
  sessions,
  activeSessionId,
  onSelect,
  onCreate,
  onDelete,
  onLogout,
  username,
}: Props) {
  return (
    <aside className="w-64 bg-daycoval-navy flex flex-col h-full">
      {/* Header */}
      <div className="p-4 border-b border-daycoval-navy-dark">
        <div className="flex items-center gap-2 mb-3">
          <div className="w-7 h-7 rounded-lg bg-daycoval-orange flex items-center justify-center">
            <span className="text-white text-xs font-bold">D</span>
          </div>
          <span className="text-white font-semibold text-sm">Daycoval Leads</span>
        </div>
        <button
          onClick={onCreate}
          className="w-full flex items-center gap-2 bg-white hover:bg-daycoval-navy-50 text-daycoval-navy rounded-lg px-3 py-2 text-sm font-semibold transition-colors"
        >
          <Plus size={14} />
          Nova Sessão
        </button>
      </div>

      {/* Sessions list */}
      <div className="flex-1 overflow-y-auto py-2">
        {sessions.length === 0 && (
          <p className="text-daycoval-navy-100 text-xs text-center mt-6 px-4">
            Nenhuma sessão ainda. Clique em "Nova Sessão" para começar.
          </p>
        )}
        {sessions.map((s) => (
          <div
            key={s.session_id}
            onClick={() => onSelect(s.session_id)}
            className={`group flex items-start gap-2 px-3 py-2.5 mx-2 rounded-lg cursor-pointer transition-colors ${
              activeSessionId === s.session_id
                ? 'bg-daycoval-navy-dark text-white'
                : 'text-daycoval-navy-100 hover:bg-daycoval-navy-dark hover:text-white'
            }`}
          >
            <MessageSquare size={14} className="mt-0.5 shrink-0" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium truncate">{s.name}</p>
              <p className="text-xs text-daycoval-navy-50 mt-0.5 opacity-70">
                {formatDate(s.updated_at)} · {s.turn_count} turnos
              </p>
            </div>
            <button
              onClick={(e) => {
                e.stopPropagation()
                onDelete(s.session_id)
              }}
              className="opacity-0 group-hover:opacity-100 text-daycoval-navy-100 hover:text-red-400 transition-all shrink-0 mt-0.5"
            >
              <Trash2 size={12} />
            </button>
          </div>
        ))}
      </div>

      {/* Footer — user + logout */}
      <div className="p-3 border-t border-daycoval-navy-dark flex items-center justify-between">
        <span className="text-daycoval-navy-100 text-xs">{username}</span>
        <button
          onClick={onLogout}
          className="text-daycoval-navy-100 hover:text-white transition-colors"
          title="Sair"
        >
          <LogOut size={14} />
        </button>
      </div>
    </aside>
  )
}
