'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Plus, MoreVertical, Phone, Calendar, DollarSign } from 'lucide-react'
import api from '@/lib/api'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface Stage {
  id: string
  name: string
  color: string
  position: number
  isWon: boolean
  isLost: boolean
}

interface Lead {
  id: string
  title: string
  value?: number
  probability?: number
  stageId: string
  contact: { name: string; phone: string }
  assignedUser?: { name: string }
  createdAt: string
}

function LeadCard({ lead, onMove, stages }: { lead: Lead; onMove: (leadId: string, stageId: string) => void; stages: Stage[] }) {
  return (
    <div className="bg-background border border-border rounded-xl p-4 cursor-grab active:cursor-grabbing hover:border-primary/30 transition-all group shadow-sm">
      <div className="flex items-start justify-between mb-3">
        <h4 className="text-sm font-semibold text-foreground leading-tight">{lead.title}</h4>
        <div className="relative">
          <button className="w-6 h-6 rounded flex items-center justify-center text-muted-foreground hover:text-foreground opacity-0 group-hover:opacity-100 transition-opacity">
            <MoreVertical className="w-3 h-3" />
          </button>
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <div className="w-6 h-6 rounded-full bg-primary/20 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
          {lead.contact?.name?.charAt(0) || '?'}
        </div>
        <div className="min-w-0">
          <p className="text-xs font-medium text-foreground truncate">{lead.contact?.name}</p>
          <p className="text-xs text-muted-foreground truncate">{lead.contact?.phone}</p>
        </div>
      </div>

      <div className="flex items-center justify-between">
        {lead.value ? (
          <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
            <DollarSign className="w-3 h-3" />
            {lead.value.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })}
          </span>
        ) : <span />}
        {lead.probability !== undefined && lead.probability > 0 && (
          <span className="text-xs text-muted-foreground">{lead.probability}%</span>
        )}
      </div>

      {/* Move buttons */}
      <div className="mt-3 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        {stages.map((s) => s.id !== lead.stageId && (
          <button
            key={s.id}
            onClick={() => onMove(lead.id, s.id)}
            className="flex-1 py-1 text-xs rounded-lg bg-secondary hover:bg-muted text-muted-foreground hover:text-foreground transition-all truncate px-2"
            title={`Mover para ${s.name}`}
          >
            →{s.name.split(' ')[0]}
          </button>
        ))}
      </div>
    </div>
  )
}

export default function CrmPage() {
  const [pipelines, setPipelines] = useState<any[]>([])
  const [leads, setLeads] = useState<Lead[]>([])
  const [stages, setStages] = useState<Stage[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [pRes, lRes] = await Promise.all([
        api.get('/crm/pipelines'),
        api.get('/crm/leads'),
      ])
      const pipelineList = pRes.data || []
      setPipelines(pipelineList)
      const allStages = pipelineList.flatMap((p: any) => p.stages || [])
        .sort((a: Stage, b: Stage) => a.position - b.position)
      setStages(allStages)
      setLeads(lRes.data || [])
    } catch {
      // Create default pipeline if none exists
      try {
        await api.post('/crm/pipelines/default')
        loadData()
      } catch {}
    } finally {
      setLoading(false)
    }
  }

  const moveStage = async (leadId: string, stageId: string) => {
    try {
      await api.patch(`/crm/leads/${leadId}/stage`, { stageId })
      setLeads((prev) => prev.map((l) => l.id === leadId ? { ...l, stageId } : l))
      toast.success('Lead movido!')
    } catch {
      toast.error('Erro ao mover lead')
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-full flex flex-col">
      <Header
        title="CRM"
        subtitle="Pipeline de leads"
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" />
            Novo Lead
          </button>
        }
      />

      <div className="flex-1 overflow-x-auto p-6">
        {stages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">Nenhum pipeline configurado</p>
            <button
              onClick={() => api.post('/crm/pipelines/default').then(loadData)}
              className="px-4 py-2 bg-primary text-white rounded-xl text-sm"
            >
              Criar pipeline padrão
            </button>
          </div>
        ) : (
          <div className="flex gap-4 min-w-max h-full">
            {stages.map((stage) => {
              const stageLeads = leads.filter((l) => l.stageId === stage.id)
              return (
                <div key={stage.id} className="w-72 flex-shrink-0 flex flex-col">
                  {/* Stage header */}
                  <div className="flex items-center justify-between mb-4 px-1">
                    <div className="flex items-center gap-2">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: stage.color }} />
                      <h3 className="font-semibold text-sm text-foreground">{stage.name}</h3>
                      <span className="text-xs text-muted-foreground bg-secondary px-2 py-0.5 rounded-full">
                        {stageLeads.length}
                      </span>
                    </div>
                    <button className="w-6 h-6 rounded-lg bg-secondary hover:bg-muted flex items-center justify-center text-muted-foreground hover:text-foreground transition-all">
                      <Plus className="w-3 h-3" />
                    </button>
                  </div>

                  {/* Leads */}
                  <div className="flex-1 space-y-3 min-h-[200px] rounded-xl bg-secondary/30 border border-border/50 p-3">
                    {stageLeads.length === 0 ? (
                      <div className="flex items-center justify-center h-24 text-xs text-muted-foreground">
                        Sem leads aqui
                      </div>
                    ) : (
                      stageLeads.map((lead) => (
                        <LeadCard key={lead.id} lead={lead} onMove={moveStage} stages={stages} />
                      ))
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
