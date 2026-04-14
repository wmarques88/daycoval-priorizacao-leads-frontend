/**
 * App.test.tsx — testes unitários para src/App.tsx
 *
 * Cobre:
 *  - Renderiza LoginPage quando não há auth
 *  - Restaura sessão do localStorage ao montar (token + username → ChatPage)
 *  - Volta para LoginPage após logout
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '@testing-library/react'
import App from '../App'

// Moca os componentes filhos para testes isolados
vi.mock('../components/LoginPage', () => ({
  default: ({ onLogin }: { onLogin: (t: string, u: string) => void }) => (
    <div data-testid="login-page">
      <button onClick={() => onLogin('fake-token', 'daycoval')}>mock-login</button>
    </div>
  ),
}))

vi.mock('../components/ChatPage', () => ({
  default: ({ username, onLogout }: { username: string; onLogout: () => void }) => (
    <div data-testid="chat-page">
      <span>{username}</span>
      <button onClick={onLogout}>mock-logout</button>
    </div>
  ),
}))

describe('App', () => {
  beforeEach(() => {
    localStorage.clear()
  })

  it('shows LoginPage when no auth in localStorage', () => {
    render(<App />)
    expect(screen.getByTestId('login-page')).toBeInTheDocument()
    expect(screen.queryByTestId('chat-page')).not.toBeInTheDocument()
  })

  it('restores session from localStorage and shows ChatPage', () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('username', 'daycoval')

    render(<App />)

    expect(screen.getByTestId('chat-page')).toBeInTheDocument()
    expect(screen.getByText('daycoval')).toBeInTheDocument()
    expect(screen.queryByTestId('login-page')).not.toBeInTheDocument()
  })

  it('does not show ChatPage if only token is stored (no username)', () => {
    localStorage.setItem('token', 'stored-token')
    // sem username

    render(<App />)

    expect(screen.getByTestId('login-page')).toBeInTheDocument()
  })

  it('shows ChatPage after login', async () => {
    render(<App />)

    // Simula clique no botão de login do mock
    screen.getByText('mock-login').click()

    await waitFor(() => {
      expect(screen.getByTestId('chat-page')).toBeInTheDocument()
    })
  })

  it('returns to LoginPage after logout', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('username', 'daycoval')

    render(<App />)
    expect(screen.getByTestId('chat-page')).toBeInTheDocument()

    screen.getByText('mock-logout').click()

    await waitFor(() => {
      expect(screen.getByTestId('login-page')).toBeInTheDocument()
    })
  })

  it('clears localStorage on logout', async () => {
    localStorage.setItem('token', 'stored-token')
    localStorage.setItem('username', 'daycoval')

    render(<App />)
    screen.getByText('mock-logout').click()

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBeNull()
      expect(localStorage.getItem('username')).toBeNull()
    })
  })
})
