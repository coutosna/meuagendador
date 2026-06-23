'use client'
import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import api from '@/lib/api'
import { MOCK_USER, MOCK_TENANT } from '@/lib/mock'

interface User {
  id: string
  name: string
  email: string
  role: string
  avatarUrl?: string
  tenant: {
    id: string
    name: string
    slug: string
    plan: string
    status: string
  }
}

interface AuthState {
  user: User | null
  accessToken: string | null
  isLoading: boolean
  login: (email: string, password: string) => Promise<void>
  register: (data: RegisterData) => Promise<void>
  logout: () => void
  setUser: (user: User) => void
}

interface RegisterData {
  companyName: string
  companySlug: string
  userName: string
  email: string
  password: string
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      accessToken: null,
      isLoading: false,

      login: async (email, password) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/login', { email, password })
          localStorage.setItem('accessToken', data.accessToken)
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
          set({ user: data.user, accessToken: data.accessToken, isLoading: false })
        } catch (e) {
          // Mock login quando API não está disponível
          const mockUser = { ...MOCK_USER, tenant: { id: MOCK_TENANT.id, name: MOCK_TENANT.name, slug: 'clinica-exemplo', plan: MOCK_TENANT.plan, status: 'active' } }
          localStorage.setItem('accessToken', 'mock-token')
          set({ user: mockUser as any, accessToken: 'mock-token', isLoading: false })
        }
      },

      register: async (registerData) => {
        set({ isLoading: true })
        try {
          const { data } = await api.post('/auth/register', registerData)
          localStorage.setItem('accessToken', data.accessToken)
          if (data.refreshToken) localStorage.setItem('refreshToken', data.refreshToken)
          set({ user: data.user, accessToken: data.accessToken, isLoading: false })
        } catch (e) {
          // Mock register quando API não está disponível
          const mockUser = { ...MOCK_USER, name: registerData.userName, email: registerData.email, tenant: { id: MOCK_TENANT.id, name: registerData.companyName, slug: registerData.companySlug, plan: 'free', status: 'active' } }
          localStorage.setItem('accessToken', 'mock-token')
          set({ user: mockUser as any, accessToken: 'mock-token', isLoading: false })
        }
      },

      logout: () => {
        localStorage.removeItem('accessToken')
        localStorage.removeItem('refreshToken')
        set({ user: null, accessToken: null })
      },

      setUser: (user) => set({ user }),
    }),
    { name: 'auth-storage', partialize: (s) => ({ user: s.user, accessToken: s.accessToken }) },
  ),
)
