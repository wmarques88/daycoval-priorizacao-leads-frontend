/**
 * LoginPage.test.tsx — testes unitários para src/components/LoginPage.tsx
 *
 * Cobre:
 *  - Renderização do formulário (campos, botão)
 *  - Login bem-sucedido aciona onLogin com token e username
 *  - Credenciais erradas exibem mensagem de erro
 *  - Estado de loading desabilita o botão durante a chamada
 */
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import LoginPage from '../components/LoginPage'

// Moca o módulo de API para evitar chamadas HTTP reais
vi.mock('../api/client', () => ({
  login: vi.fn(),
}))

import { login } from '../api/client'

const mockLogin = vi.mocked(login)

describe('LoginPage', () => {
  const onLogin = vi.fn()

  beforeEach(() => {
    vi.clearAllMocks()
    localStorage.clear()
  })

  // ── Renderização ──────────────────────────────────────────────────────────

  it('renders username and password fields', () => {
    render(<LoginPage onLogin={onLogin} />)
    expect(screen.getByPlaceholderText('daycoval')).toBeInTheDocument()
    expect(screen.getByPlaceholderText('••••••••')).toBeInTheDocument()
  })

  it('renders a submit button labeled "Entrar"', () => {
    render(<LoginPage onLogin={onLogin} />)
    expect(screen.getByRole('button', { name: /entrar/i })).toBeInTheDocument()
  })

  it('renders the Daycoval title', () => {
    render(<LoginPage onLogin={onLogin} />)
    expect(screen.getByText('Daycoval')).toBeInTheDocument()
  })

  // ── Login bem-sucedido ────────────────────────────────────────────────────

  it('calls onLogin with token and username on success', async () => {
    mockLogin.mockResolvedValueOnce('tok-abc-123')

    render(<LoginPage onLogin={onLogin} />)
    await userEvent.type(screen.getByPlaceholderText('daycoval'), 'daycoval')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'daycoval123')
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(onLogin).toHaveBeenCalledWith('tok-abc-123', 'daycoval')
    })
  })

  it('saves token and username to localStorage on success', async () => {
    mockLogin.mockResolvedValueOnce('tok-abc-123')

    render(<LoginPage onLogin={onLogin} />)
    await userEvent.type(screen.getByPlaceholderText('daycoval'), 'daycoval')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'daycoval123')
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(localStorage.getItem('token')).toBe('tok-abc-123')
      expect(localStorage.getItem('username')).toBe('daycoval')
    })
  })

  // ── Login com erro ────────────────────────────────────────────────────────

  it('shows error message when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Unauthorized'))

    render(<LoginPage onLogin={onLogin} />)
    await userEvent.type(screen.getByPlaceholderText('daycoval'), 'errado')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'senhaerrada')
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(screen.getByText(/usuário ou senha incorretos/i)).toBeInTheDocument()
    })
  })

  it('does not call onLogin when login fails', async () => {
    mockLogin.mockRejectedValueOnce(new Error('Unauthorized'))

    render(<LoginPage onLogin={onLogin} />)
    fireEvent.click(screen.getByRole('button', { name: /entrar/i }))

    await waitFor(() => {
      expect(onLogin).not.toHaveBeenCalled()
    })
  })

  // ── Controle de estado de loading ──────────────────────────────────────────

  it('disables submit button while loading', async () => {
    // Promessa que nunca resolve para manter o estado loading
    mockLogin.mockReturnValueOnce(new Promise(() => {}))

    render(<LoginPage onLogin={onLogin} />)
    await userEvent.type(screen.getByPlaceholderText('daycoval'), 'daycoval')
    await userEvent.type(screen.getByPlaceholderText('••••••••'), 'daycoval123')
    fireEvent.click(screen.getByRole('button', { name: 'Entrar' }))

    await waitFor(() => {
      // O botão fica disabled e mostra 'Entrando…' durante o loading
      const btn = screen.getByRole('button', { name: 'Entrando…' })
      expect(btn).toBeDisabled()
    })
  })
})
