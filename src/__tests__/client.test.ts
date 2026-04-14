/**
 * client.test.ts — testes unitários para src/api/client.ts
 *
 * Mocka o axios para testar:
 *  - login: POST correto, retorno do access_token
 *  - interceptor 401: limpa localStorage e redireciona
 *  - interceptor 429: adiciona friendlyMessage
 *  - interceptor de request: anexa Authorization header
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import axios from 'axios'

// ---------------------------------------------------------------------------
// Mocks
// ---------------------------------------------------------------------------

vi.mock('axios', () => {
  const mockInstance = {
    post: vi.fn(),
    get: vi.fn(),
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
  }
  return {
    default: {
      create: vi.fn(() => mockInstance),
      ...mockInstance,
    },
  }
})

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getResponseInterceptors() {
  const createMock = vi.mocked(axios.create)
  const instance = createMock.mock.results[0]?.value
  if (!instance) return { onFulfilled: undefined, onRejected: undefined }
  const useCall = instance.interceptors.response.use.mock.calls[0]
  return {
    onFulfilled: useCall?.[0] as ((r: unknown) => unknown) | undefined,
    onRejected: useCall?.[1] as ((e: unknown) => Promise<never>) | undefined,
  }
}

function getRequestInterceptors() {
  const createMock = vi.mocked(axios.create)
  const instance = createMock.mock.results[0]?.value
  if (!instance) return undefined
  return instance.interceptors.request.use.mock.calls[0]?.[0] as ((c: Record<string, unknown>) => Record<string, unknown>) | undefined
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe('login()', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.clear()
  })

  it('calls POST /auth/login with form-encoded body', async () => {
    const { login } = await import('../api/client')
    const createMock = vi.mocked(axios.create)
    const instance = createMock.mock.results[0]?.value
    instance.post.mockResolvedValueOnce({
      data: { access_token: 'tok123', token_type: 'bearer' },
    })

    const token = await login('daycoval', 'daycoval123')

    expect(instance.post).toHaveBeenCalledWith(
      '/auth/login',
      expect.any(URLSearchParams),
      expect.objectContaining({ headers: { 'Content-Type': 'application/x-www-form-urlencoded' } }),
    )
    expect(token).toBe('tok123')
  })

  it('throws when API returns an error', async () => {
    const { login } = await import('../api/client')
    const instance = vi.mocked(axios.create).mock.results[0]?.value
    instance.post.mockRejectedValueOnce(new Error('Network error'))

    await expect(login('daycoval', 'wrong')).rejects.toThrow('Network error')
  })
})

describe('response interceptor', () => {
  beforeEach(() => {
    vi.resetModules()
    localStorage.setItem('token', 'tok')
    localStorage.setItem('username', 'daycoval')
    Object.defineProperty(window, 'location', {
      value: { href: '/' },
      writable: true,
    })
  })

  afterEach(() => {
    localStorage.clear()
  })

  it('passes through successful responses unchanged', async () => {
    await import('../api/client')
    const { onFulfilled } = getResponseInterceptors()
    const fakeResponse = { data: { foo: 'bar' }, status: 200 }
    expect(onFulfilled?.(fakeResponse)).toEqual(fakeResponse)
  })

  it('clears localStorage and redirects on 401', async () => {
    await import('../api/client')
    const { onRejected } = getResponseInterceptors()

    const error = { response: { status: 401 } }
    await onRejected?.(error).catch(() => {})

    expect(localStorage.getItem('token')).toBeNull()
    expect(localStorage.getItem('username')).toBeNull()
    expect(window.location.href).toBe('/')
  })

  it('adds friendlyMessage on 429', async () => {
    await import('../api/client')
    const { onRejected } = getResponseInterceptors()

    const error: Record<string, unknown> = { response: { status: 429 } }
    await onRejected?.(error).catch(() => {})

    expect((error as { friendlyMessage?: string }).friendlyMessage).toContain('sobrecarregado')
  })
})

describe('request interceptor', () => {
  it('adds Authorization header when token exists in localStorage', async () => {
    localStorage.setItem('token', 'mytoken')
    await import('../api/client')
    const onRequest = getRequestInterceptors()

    const config = { headers: {} } as Record<string, Record<string, string>>
    onRequest?.(config)

    expect(config.headers.Authorization).toBe('Bearer mytoken')
  })

  it('does not add Authorization header when no token', async () => {
    localStorage.removeItem('token')
    await import('../api/client')
    const onRequest = getRequestInterceptors()

    const config = { headers: {} } as Record<string, Record<string, string>>
    onRequest?.(config)

    expect(config.headers.Authorization).toBeUndefined()
  })
})
