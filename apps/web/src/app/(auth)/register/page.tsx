'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { Zap, ArrowRight, Check } from 'lucide-react'
import { useAuthStore } from '@/store/useAuthStore'

const steps = ['Empresa', 'Conta', 'Senha']

export default function RegisterPage() {
  const [step, setStep] = useState(0)
  const [form, setForm] = useState({
    companyName: '',
    companySlug: '',
    userName: '',
    email: '',
    password: '',
    confirmPassword: '',
  })
  const [error, setError] = useState('')
  const { register, isLoading } = useAuthStore()
  const router = useRouter()

  const update = (field: string, value: string) => {
    setForm((f) => ({ ...f, [field]: value }))
    if (field === 'companyName') {
      setForm((f) => ({
        ...f,
        companyName: value,
        companySlug: value.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      }))
    }
  }

  const handleNext = (e: React.FormEvent) => {
    e.preventDefault()
    if (step < 2) { setStep(s => s + 1); return }
    handleSubmit()
  }

  const handleSubmit = async () => {
    if (form.password !== form.confirmPassword) { setError('Senhas não coincidem'); return }
    try {
      await register({
        companyName: form.companyName,
        companySlug: form.companySlug,
        userName: form.userName,
        email: form.email,
        password: form.password,
      })
      router.push('/dashboard')
    } catch (err: any) {
      setError(err.response?.data?.message || 'Erro ao criar conta')
    }
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] bg-primary/5 rounded-full blur-3xl pointer-events-none" />

      <div className="w-full max-w-md relative">
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 rounded-2xl bg-primary/20 border border-primary/30 mb-4">
            <Zap className="w-7 h-7 text-primary" />
          </div>
          <h1 className="text-2xl font-bold text-foreground">Criar sua conta</h1>
          <p className="text-muted-foreground mt-1">14 dias grátis, sem cartão</p>
        </div>

        {/* Steps */}
        <div className="flex items-center justify-center gap-2 mb-8">
          {steps.map((s, i) => (
            <div key={s} className="flex items-center gap-2">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold border-2 transition-all ${
                i < step ? 'bg-primary border-primary text-white' :
                i === step ? 'border-primary text-primary' :
                'border-border text-muted-foreground'
              }`}>
                {i < step ? <Check className="w-3 h-3" /> : i + 1}
              </div>
              <span className={`text-xs ${i === step ? 'text-primary' : 'text-muted-foreground'}`}>{s}</span>
              {i < steps.length - 1 && <div className={`w-8 h-px ${i < step ? 'bg-primary' : 'bg-border'}`} />}
            </div>
          ))}
        </div>

        <div className="bg-card border border-border rounded-2xl p-8 shadow-xl">
          <form onSubmit={handleNext} className="space-y-5">
            {step === 0 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome da empresa</label>
                  <input
                    value={form.companyName}
                    onChange={(e) => update('companyName', e.target.value)}
                    placeholder="Ex: Clínica São João"
                    required
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">URL da plataforma</label>
                  <div className="flex items-center gap-0">
                    <span className="px-3 py-3 bg-muted border border-border border-r-0 rounded-l-xl text-xs text-muted-foreground whitespace-nowrap">meuagendador.ai/</span>
                    <input
                      value={form.companySlug}
                      onChange={(e) => update('companySlug', e.target.value)}
                      placeholder="clinica-sao-joao"
                      required
                      className="flex-1 px-4 py-3 bg-secondary border border-border rounded-r-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                    />
                  </div>
                </div>
              </>
            )}

            {step === 1 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Seu nome</label>
                  <input
                    value={form.userName}
                    onChange={(e) => update('userName', e.target.value)}
                    placeholder="João Silva"
                    required
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Email</label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => update('email', e.target.value)}
                    placeholder="joao@empresa.com"
                    required
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </>
            )}

            {step === 2 && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Senha</label>
                  <input
                    type="password"
                    value={form.password}
                    onChange={(e) => update('password', e.target.value)}
                    placeholder="Mínimo 8 caracteres"
                    required
                    minLength={8}
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Confirmar senha</label>
                  <input
                    type="password"
                    value={form.confirmPassword}
                    onChange={(e) => update('confirmPassword', e.target.value)}
                    placeholder="Confirme sua senha"
                    required
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all"
                  />
                </div>
              </>
            )}

            {error && (
              <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3 text-sm text-destructive">
                {error}
              </div>
            )}

            <div className="flex gap-3">
              {step > 0 && (
                <button type="button" onClick={() => setStep(s => s - 1)}
                  className="flex-1 py-3 bg-secondary hover:bg-muted text-foreground font-semibold rounded-xl transition-all">
                  Voltar
                </button>
              )}
              <button type="submit" disabled={isLoading}
                className="flex-1 py-3 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white font-semibold rounded-xl transition-all shadow-lg shadow-primary/25 flex items-center justify-center gap-2">
                {step < 2 ? (
                  <><span>Próximo</span><ArrowRight className="w-4 h-4" /></>
                ) : isLoading ? 'Criando...' : 'Criar conta'}
              </button>
            </div>
          </form>

          <p className="text-center text-sm text-muted-foreground mt-6">
            Já tem conta?{' '}
            <Link href="/login" className="text-primary hover:underline font-medium">Entrar</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
