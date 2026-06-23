'use client'
import { useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Smartphone, CheckCircle2, AlertCircle, RefreshCw, Copy, ExternalLink } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

export default function SettingsPage() {
  const [instanceName, setInstanceName] = useState('')
  const [qrCode, setQrCode] = useState('')
  const [creating, setCreating] = useState(false)
  const [status, setStatus] = useState<'idle' | 'connecting' | 'connected'>('idle')

  const apiUrl = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api/v1'

  const handleConnect = async () => {
    if (!instanceName.trim()) { toast.error('Digite um nome para a instância'); return }
    setCreating(true)
    try {
      const { data } = await api.post('/whatsapp/instances', { instanceName })
      if (data.qrCode) {
        setQrCode(data.qrCode)
        setStatus('connecting')
        toast.success('Instância criada! Escaneie o QR Code')
      }
    } catch (e: any) {
      toast.error(e.response?.data?.message || 'Erro ao criar instância. Verifique se a Evolution API está rodando.')
    } finally {
      setCreating(false)
    }
  }

  const handleRefreshQr = async () => {
    try {
      const { data } = await api.get(`/whatsapp/instances/${instanceName}/qr`)
      if (data.qrCode) setQrCode(data.qrCode)
      toast.success('QR Code atualizado')
    } catch { toast.error('Erro ao atualizar QR Code') }
  }

  const copy = (text: string) => {
    navigator.clipboard.writeText(text)
    toast.success('Copiado!')
  }

  const n8nDocs = [
    { event: 'message.received', desc: 'Nova mensagem do WhatsApp recebida', payload: '{ tenantId, contact, conversation, message }' },
    { event: 'lead.qualified', desc: 'Lead qualificado pela IA', payload: '{ tenantId, lead, contact, qualificationData }' },
    { event: 'appointment.created', desc: 'Novo agendamento criado', payload: '{ tenantId, appointment, contact, service }' },
    { event: 'appointment.confirmed', desc: 'Agendamento confirmado', payload: '{ tenantId, appointment, contact }' },
    { event: 'appointment.cancelled', desc: 'Agendamento cancelado', payload: '{ tenantId, appointment, contact, reason }' },
    { event: 'conversation.handoff', desc: 'IA pediu intervenção humana', payload: '{ tenantId, conversation, contact }' },
  ]

  return (
    <div className="min-h-full">
      <Header title="Configurações" subtitle="WhatsApp, integrações e n8n" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {/* WhatsApp Connection */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-10 h-10 rounded-xl bg-emerald-500/20 flex items-center justify-center">
                <Smartphone className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <h3 className="font-semibold text-foreground">Conectar WhatsApp</h3>
                <p className="text-xs text-muted-foreground">Via Evolution API</p>
              </div>
              {status !== 'idle' && (
                <div className="ml-auto">
                  {status === 'connected' ? (
                    <span className="flex items-center gap-1.5 text-xs text-emerald-400 font-medium">
                      <CheckCircle2 className="w-4 h-4" /> Conectado
                    </span>
                  ) : (
                    <span className="flex items-center gap-1.5 text-xs text-amber-400 font-medium">
                      <AlertCircle className="w-4 h-4" /> Aguardando scan
                    </span>
                  )}
                </div>
              )}
            </div>

            {!qrCode ? (
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-foreground mb-2">Nome da instância</label>
                  <input
                    value={instanceName}
                    onChange={(e) => setInstanceName(e.target.value.replace(/\s+/g, '-').toLowerCase())}
                    placeholder="ex: minha-empresa-01"
                    className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 text-sm"
                  />
                </div>
                <button onClick={handleConnect} disabled={creating}
                  className="w-full py-3 bg-emerald-500 hover:bg-emerald-600 disabled:opacity-60 text-white font-semibold rounded-xl transition-all">
                  {creating ? 'Gerando QR Code...' : 'Gerar QR Code'}
                </button>
              </div>
            ) : (
              <div className="flex flex-col items-center">
                <div className="bg-white rounded-2xl p-3 mb-4 shadow-lg">
                  <img src={qrCode.startsWith('data:') ? qrCode : `data:image/png;base64,${qrCode}`} alt="QR Code WhatsApp" className="w-52 h-52" />
                </div>
                <p className="text-sm text-foreground font-medium mb-1">Como conectar:</p>
                <ol className="text-xs text-muted-foreground text-center space-y-1 mb-4">
                  <li>1. Abra o WhatsApp no celular</li>
                  <li>2. Vá em Dispositivos conectados</li>
                  <li>3. Toque em "Conectar dispositivo"</li>
                  <li>4. Escaneie este QR Code</li>
                </ol>
                <button onClick={handleRefreshQr}
                  className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-muted text-foreground text-sm rounded-xl transition-all border border-border">
                  <RefreshCw className="w-4 h-4" />
                  Atualizar QR Code
                </button>
              </div>
            )}
          </div>

          {/* API Info */}
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-2">Endpoints da API</h3>
            <p className="text-xs text-muted-foreground mb-4">Use estes endpoints para integrar com o n8n</p>
            <div className="space-y-2">
              <div className="bg-secondary rounded-xl p-3">
                <p className="text-xs text-muted-foreground mb-1">Base URL</p>
                <div className="flex items-center justify-between gap-2">
                  <p className="text-xs font-mono text-primary truncate">{apiUrl}</p>
                  <button onClick={() => copy(apiUrl)} className="text-muted-foreground hover:text-foreground flex-shrink-0">
                    <Copy className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
              {[
                { label: 'Conversas', path: '/conversations' },
                { label: 'Contatos', path: '/contacts' },
                { label: 'Leads CRM', path: '/crm/leads' },
                { label: 'Agendamentos', path: '/agenda/appointments' },
                { label: 'Config IA', path: '/ai/config' },
                { label: 'Dashboard', path: '/dashboard/overview' },
              ].map((ep) => (
                <div key={ep.path} className="flex items-center justify-between px-3 py-2 bg-secondary/50 rounded-lg">
                  <span className="text-xs text-foreground">{ep.label}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-mono text-muted-foreground">{ep.path}</span>
                    <button onClick={() => copy(`${apiUrl}${ep.path}`)} className="text-muted-foreground hover:text-foreground">
                      <Copy className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* n8n Documentation */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-semibold text-foreground">Documentação para o n8n</h3>
              <p className="text-sm text-muted-foreground">Eventos que o sistema dispara via webhook para o Giovanni configurar no n8n</p>
            </div>
          </div>
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            {n8nDocs.map((doc) => (
              <div key={doc.event} className="bg-secondary border border-border rounded-xl p-4">
                <div className="flex items-start justify-between mb-2">
                  <span className="text-xs font-mono font-bold text-primary px-2 py-0.5 bg-primary/10 rounded-lg">{doc.event}</span>
                  <button onClick={() => copy(doc.event)} className="text-muted-foreground hover:text-foreground">
                    <Copy className="w-3 h-3" />
                  </button>
                </div>
                <p className="text-sm text-foreground mb-2">{doc.desc}</p>
                <div className="bg-background rounded-lg p-2">
                  <p className="text-xs font-mono text-muted-foreground">{doc.payload}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}
