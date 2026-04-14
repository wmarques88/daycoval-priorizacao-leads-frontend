import axios from 'axios'
import type { DataInfo, Session } from '../types'

const BASE = '/api'

const http = axios.create({ baseURL: BASE })

// Attach JWT from localStorage on every request
http.interceptors.request.use((config) => {
  const token = localStorage.getItem('token')
  if (token) config.headers.Authorization = `Bearer ${token}`
  return config
})

// On 401, clear stale token and force login page
// On 429, surface a friendly rate-limit message
http.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      localStorage.removeItem('token')
      localStorage.removeItem('username')
      window.location.href = '/'
    }
    if (error.response?.status === 429) {
      error.friendlyMessage =
        'O serviço está temporariamente sobrecarregado. Aguarde alguns segundos e tente novamente.'
    }
    return Promise.reject(error)
  },
)

// Auth

export async function login(username: string, password: string): Promise<string> {
  const form = new URLSearchParams()
  form.append('username', username)
  form.append('password', password)
  const { data } = await http.post<{ access_token: string; token_type: string }>(
    '/auth/login',
    form,
    { headers: { 'Content-Type': 'application/x-www-form-urlencoded' } },
  )
  return data.access_token
}

// Sessions

export async function getSessions(): Promise<Session[]> {
  const { data } = await http.get<Session[]>('/sessions')
  return data
}

export async function createSession(name?: string): Promise<Session> {
  const { data } = await http.post<Session>('/sessions', { name })
  return data
}

export async function deleteSession(sessionId: string): Promise<void> {
  await http.delete(`/sessions/${sessionId}`)
}

// Chat

export async function sendMessage(sessionId: string, message: string): Promise<string> {
  const { data } = await http.post<{ reply: string; session_id: string; turn: number }>(
    `/sessions/${sessionId}/chat`,
    { message },
  )
  return data.reply
}

export async function getSessionMessages(
  sessionId: string,
): Promise<Array<{ role: 'user' | 'agent'; content: string; timestamp: string }>> {
  const { data } = await http.get(`/sessions/${sessionId}/messages`)
  return data
}

// Data info

export async function getDataInfo(): Promise<DataInfo> {
  const { data } = await http.get<DataInfo>('/data-info')
  return data
}
