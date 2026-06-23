'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Bot, Save, TestTube, Clock, Building, Zap, ToggleLeft, ToggleRight } from 'lucide-react'
import api from '@/lib/api'
import { toast } from 'sonner'

const defaultHours = {
  monday: { enabled: true, open: '08:00', close: '18:00' },
  tuesday: { enabled: true, open: '08:00', close: '18:00' },
  wednesday: { enabled: true, open: '08:00', close: '18:00' },
  thursday: { enabled: true, open: '08:00', close: '18:00' },
  friday: { enabled: true, open: '08:00', close: '18:00' },
  saturday: { enabled: false, open: '08:00', close: '12:00' },
  sunday: { enabled: false, open: '08:00', close: '12:00' },
}

const dayLabels: Record<string, string> = {
  monday: 'Segunda', tuesday: 'Terça', wednesday: 'Quarta',
  thursday: 'Quinta', friday: 'Sexta', saturday: 'Sábado', sunday: 'Domingo',
}

export default function IaPage() {
  const [config, setConfig] = useState<any>({
    provider: 'openai',
    model: 'gpt-4o-mini',
    systemPrompt: '',
    personality: 'Simpático, profissional e objetivo. Responda de forma natural e humanizada.',
    companyInfo: { name: '', services: [], prices: '', address: '', extra: '' },
    businessHours: defaultHours,
    qualificationQuestions: ['Qual seu nome?', 'Qual serviço você procura?', 'Qual é a melhor data para você?'],
    autoSchedule: false,
    isActive: true,
    temperature: 0.7,
  })
  const [testMsg, setTestMsg] = useState('')
  const [testResp, setTestResp] = useState('')
  const [testing, setTesting] = useState(false)
  const [saving, setSaving] = useState(false)
  const [servicesText, setServicesText] = useState('')

  useEffect(() => {
    api.get('/ai/config').then(({ data }) => {
      if (data) {
        setConfig(data)
        setServicesText(data.companyInfo?.services?.join('\n') || '')
      }
    }).catch(() => {})
  }, [])

  const handleSave = async () => {
    setSaving(true)
    try {
      const payload = {
        ...config,
        companyInfo: {
          ...config.companyInfo,
          services: servicesText.split('\n').filter(Boolean),
        },
      }
      await api.put('/ai/config', payload)
      toast.success('Configuração da IA salva com sucesso!')
    } catch {
      toast.error('Erro ao salvar configuração')
    } finally {
      setSaving(false)
    }
  }

  const handleTest = async () => {
    if (!testMsg.trim()) return
    setTesting(true)
    setTestResp('')
    try {
      const { data } = await api.post('/ai/test', { message: testMsg })
      setTestResp(data.content || 'Sem resposta')
    } catch {
      setTestResp('Erro ao testar IA. Verifique se a chave da API está configurada.')
    } finally {
      setTesting(false)
    }
  }

  const updateHours = (day: string, field: string, value: any) => {
    setConfig((c: any) => ({
      ...c,
      businessHours: {
        ...c.businessHours,
        [day]: { ...c.businessHours[day], [field]: value },
      },
    }))
  }

  return (
    <div className="min-h-full">
      <Header
        title="Inteligência Artificial"
        subtitle="Configure o comportamento do assistente de atendimento"
        actions={
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 disabled:opacity-60 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-primary/25">
            <Save className="w-4 h-4" />
            {saving ? 'Salvando...' : 'Salvar configurações'}
          </button>
        }
      />

      <div className="p-6 grid grid-cols-1 xl:grid-cols-2 gap-6">
        {/* Status card */}
        <div className="xl:col-span-2 bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-primary/20 flex items-center justify-center">
                <Bot className="w-6 h-6 text-primary" />
              </div>
              <div>
                <h3 className="font-bold text-foreground">Assistente IA</h3>
                <p className="text-sm text-muted-foreground">Atende automaticamente seus leads pelo WhatsApp</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <span className={`text-sm font-medium ${config.isActive ? 'text-emerald-400' : 'text-muted-foreground'}`}>
                {config.isActive ? 'Ativo' : 'Inativo'}
              </span>
              <button onClick={() => setConfig((c: any) => ({ ...c, isActive: !c.isActive }))}
                className={`w-12 h-6 rounded-full transition-all relative ${config.isActive ? 'bg-primary' : 'bg-secondary border border-border'}`}>
                <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-all ${config.isActive ? 'left-6' : 'left-0.5'}`} />
              </button>
            </div>
          </div>
        </div>

        {/* Empresa info */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Building className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Informações da Empresa</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Nome da empresa</label>
              <input
                value={config.companyInfo?.name || ''}
                onChange={(e) => setConfig((c: any) => ({ ...c, companyInfo: { ...c.companyInfo, name: e.target.value } }))}
                placeholder="Ex: Clínica Bem Estar"
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Serviços oferecidos (um por linha)</label>
              <textarea
                value={servicesText}
                onChange={(e) => setServicesText(e.target.value)}
                placeholder={"Consulta médica\nExame de sangue\nVacinação"}
                rows={4}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Valores / Preços</label>
              <input
                value={config.companyInfo?.prices || ''}
                onChange={(e) => setConfig((c: any) => ({ ...c, companyInfo: { ...c.companyInfo, prices: e.target.value } }))}
                placeholder="Ex: Consulta a partir de R$ 150,00"
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Endereço / Localização</label>
              <input
                value={config.companyInfo?.address || ''}
                onChange={(e) => setConfig((c: any) => ({ ...c, companyInfo: { ...c.companyInfo, address: e.target.value } }))}
                placeholder="Ex: Rua das Flores, 123 - Centro - SP"
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm"
              />
            </div>
          </div>
        </div>

        {/* Personality */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Zap className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Personalidade & Prompt</h3>
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Personalidade da IA</label>
              <textarea
                value={config.personality || ''}
                onChange={(e) => setConfig((c: any) => ({ ...c, personality: e.target.value }))}
                placeholder="Ex: Seja simpático, profissional e objetivo..."
                rows={3}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">Instruções adicionais (System Prompt)</label>
              <textarea
                value={config.systemPrompt || ''}
                onChange={(e) => setConfig((c: any) => ({ ...c, systemPrompt: e.target.value }))}
                placeholder="Instruções específicas para o comportamento da IA..."
                rows={5}
                className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-foreground mb-2">
                Temperatura: {config.temperature} (0 = mais preciso, 1 = mais criativo)
              </label>
              <input
                type="range"
                min={0} max={1} step={0.1}
                value={config.temperature}
                onChange={(e) => setConfig((c: any) => ({ ...c, temperature: parseFloat(e.target.value) }))}
                className="w-full accent-primary"
              />
            </div>
          </div>
        </div>

        {/* Business Hours */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <Clock className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Horários de Atendimento</h3>
          </div>
          <div className="space-y-3">
            {Object.entries(config.businessHours || defaultHours).map(([day, hours]: [string, any]) => (
              <div key={day} className="flex items-center gap-3">
                <button
                  onClick={() => updateHours(day, 'enabled', !hours.enabled)}
                  className={`w-10 h-5 rounded-full transition-all relative flex-shrink-0 ${hours.enabled ? 'bg-primary' : 'bg-secondary border border-border'}`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 bg-white rounded-full shadow transition-all ${hours.enabled ? 'left-5' : 'left-0.5'}`} />
                </button>
                <span className={`w-20 text-sm ${hours.enabled ? 'text-foreground' : 'text-muted-foreground'}`}>{dayLabels[day]}</span>
                {hours.enabled ? (
                  <div className="flex items-center gap-2 flex-1">
                    <input
                      type="time"
                      value={hours.open}
                      onChange={(e) => updateHours(day, 'open', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                    <span className="text-xs text-muted-foreground">até</span>
                    <input
                      type="time"
                      value={hours.close}
                      onChange={(e) => updateHours(day, 'close', e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-secondary border border-border rounded-lg text-xs text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                ) : (
                  <span className="text-xs text-muted-foreground">Fechado</span>
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Test sandbox */}
        <div className="bg-card border border-border rounded-2xl p-6">
          <div className="flex items-center gap-3 mb-6">
            <TestTube className="w-5 h-5 text-primary" />
            <h3 className="font-semibold text-foreground">Testar IA</h3>
          </div>
          <div className="space-y-4">
            <textarea
              value={testMsg}
              onChange={(e) => setTestMsg(e.target.value)}
              placeholder="Digite uma mensagem de teste como se fosse um lead..."
              rows={3}
              className="w-full px-4 py-3 bg-secondary border border-border rounded-xl text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all text-sm resize-none"
            />
            <button
              onClick={handleTest}
              disabled={testing || !testMsg.trim()}
              className="flex items-center gap-2 px-4 py-2 bg-secondary hover:bg-muted disabled:opacity-60 text-foreground text-sm font-medium rounded-xl transition-all border border-border"
            >
              <TestTube className="w-4 h-4 text-primary" />
              {testing ? 'Testando...' : 'Testar resposta'}
            </button>
            {testResp && (
              <div className="bg-primary/10 border border-primary/20 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-2">
                  <Bot className="w-4 h-4 text-primary" />
                  <span className="text-xs font-semibold text-primary">Resposta da IA</span>
                </div>
                <p className="text-sm text-foreground leading-relaxed">{testResp}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
