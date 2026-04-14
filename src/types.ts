export interface Session {
  session_id: string
  name: string
  created_at: string
  updated_at: string
  turn_count: number
}

export interface Message {
  id: string
  role: 'user' | 'agent'
  content: string
  timestamp: Date
}

export interface AuthState {
  token: string
  username: string
}

export interface DataInfo {
  latest_lead_date: string | null
}
