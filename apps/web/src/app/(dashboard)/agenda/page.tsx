'use client'
import { useEffect, useState } from 'react'
import {
  ChevronLeft, ChevronRight, Plus, Clock, CheckCircle2, XCircle,
  AlertCircle, Scissors, DollarSign, Trash2, Edit2, Check, X,
  Calendar, Sparkles, Timer,
} from 'lucide-react'
import api from '@/lib/api'
import { MOCK_SERVICES, MOCK_TODAY_APPOINTMENTS } from '@/lib/mock'
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameDay, isToday, addMonths, subMonths, parseISO, getDay,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

const weekDays = ['DOM', 'SEG', 'TER', 'QUA', 'QUI', 'SEX', 'SÁB']
const DAY_NAMES = ['Domingo', 'Segunda', 'Terça', 'Quarta', 'Quinta', 'Sexta', 'Sábado']
const COLORS = ['#6366f1', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#3b82f6', '#ef4444', '#14b8a6']

const AVATAR_COLORS = [
  ['#6366f1','#4f46e5'], ['#8b5cf6','#7c3aed'], ['#ec4899','#db2777'],
  ['#f59e0b','#d97706'], ['#10b981','#059669'], ['#3b82f6','#2563eb'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

const STATUS: Record<string, { label: string; color: string; bg: string; border: string }> = {
  pending:   { label: 'Pendente',   color: '#fbbf24', bg: 'rgba(251,191,36,0.12)',  border: 'rgba(251,191,36,0.25)'  },
  confirmed: { label: 'Confirmado', color: '#34d399', bg: 'rgba(52,211,153,0.12)',  border: 'rgba(52,211,153,0.25)'  },
  completed: { label: 'Concluído',  color: '#6b7280', bg: 'rgba(107,114,128,0.12)', border: 'rgba(107,114,128,0.2)'  },
  cancelled: { label: 'Cancelado',  color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
  no_show:   { label: 'Não veio',   color: '#fb7185', bg: 'rgba(251,113,133,0.12)', border: 'rgba(251,113,133,0.25)' },
}

// ────────────────────────── AGENDA TAB ──────────────────────────────────────
function AgendaTab() {
  const [currentDate, setCurrentDate] = useState(new Date())
  const [selectedDay, setSelectedDay] = useState(new Date())
  const [appointments, setAppointments] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  const monthStart = startOfMonth(currentDate)
  const monthEnd   = endOfMonth(currentDate)
  const days       = eachDayOfInterval({ start: monthStart, end: monthEnd })
  const startPad   = getDay(monthStart)

  useEffect(() => { load() }, [currentDate])

  const load = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/agenda/appointments?from=${format(monthStart,'yyyy-MM-dd')}&to=${format(monthEnd,'yyyy-MM-dd')}`)
      setAppointments(data || [])
    } catch { setAppointments(MOCK_TODAY_APPOINTMENTS) }
    finally { setLoading(false) }
  }

  const dayAppts     = appointments.filter(a => isSameDay(parseISO(a.scheduledAt), selectedDay))
  const getDayAppts  = (d: Date) => appointments.filter(a => isSameDay(parseISO(a.scheduledAt), d))

  const handleStatus = async (id: string, action: 'confirm'|'cancel'|'complete') => {
    try {
      await api.post(`/agenda/appointments/${id}/${action}`)
      toast.success('Status atualizado!')
      load()
    } catch { toast.error('Erro ao atualizar') }
  }

  const totalToday = dayAppts.reduce((s, a) => s + (Number(a.service?.price) || 0), 0)

  return (
    <div className="flex gap-0 h-[calc(100vh-8.5rem)]">

      {/* ── Calendar ── */}
      <div className="flex-1 p-6 overflow-y-auto">
        <div className="bg-card border border-border rounded-2xl p-6 h-full flex flex-col" style={{ background: 'hsl(0 0% 6%)' }}>
          {/* Month nav */}
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setCurrentDate(subMonths(currentDate, 1))}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
              style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 13%)' }}>
              <ChevronLeft className="w-4 h-4" />
            </button>
            <h2 className="font-bold text-lg text-foreground capitalize">
              {format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })}
            </h2>
            <div className="flex items-center gap-2">
              <button onClick={() => { setCurrentDate(new Date()); setSelectedDay(new Date()) }}
                className="px-3 py-1.5 text-xs font-semibold rounded-lg text-muted-foreground hover:text-foreground transition-all"
                style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 13%)' }}>
                Hoje
              </button>
              <button onClick={() => setCurrentDate(addMonths(currentDate, 1))}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 13%)' }}>
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Week headers */}
          <div className="grid grid-cols-7 mb-3">
            {weekDays.map((d) => (
              <div key={d} className="text-center text-[11px] font-bold text-muted-foreground/60 tracking-widest py-1">{d}</div>
            ))}
          </div>

          {/* Days */}
          <div className="grid grid-cols-7 gap-1.5 flex-1">
            {Array.from({ length: startPad }).map((_, i) => <div key={`pad-${i}`} />)}
            {days.map((day) => {
              const appts      = getDayAppts(day)
              const isSelected = isSameDay(day, selectedDay)
              const isTodayDay = isToday(day)
              const colors     = appts.slice(0, 3).map(a => a.service?.color || '#6366f1')

              return (
                <button key={day.toISOString()} onClick={() => setSelectedDay(day)}
                  className="aspect-square flex flex-col items-center justify-center rounded-xl text-sm font-medium transition-all relative group"
                  style={
                    isSelected
                      ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', boxShadow: '0 4px 20px rgba(99,102,241,0.4)' }
                      : isTodayDay
                      ? { background: 'rgba(99,102,241,0.12)', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
                      : { color: 'hsl(0 0% 70%)' }
                  }
                >
                  <span className={cn(!isSelected && !isTodayDay && 'group-hover:text-foreground transition-colors')}>
                    {day.getDate()}
                  </span>
                  {appts.length > 0 && (
                    <div className="flex gap-0.5 mt-0.5">
                      {colors.map((c, i) => (
                        <span key={i} className="w-1 h-1 rounded-full" style={{ backgroundColor: isSelected ? 'rgba(255,255,255,0.7)' : c }} />
                      ))}
                    </div>
                  )}
                </button>
              )
            })}
          </div>
        </div>
      </div>

      {/* ── Day detail ── */}
      <div className="w-[380px] flex-shrink-0 border-l border-border flex flex-col overflow-hidden" style={{ background: 'hsl(0 0% 5%)' }}>
        {/* Header */}
        <div className="px-6 py-5 border-b border-border">
          <div className="flex items-start justify-between">
            <div>
              <h3 className="font-bold text-foreground text-base">
                {format(selectedDay, "dd 'de' MMMM", { locale: ptBR })}
              </h3>
              <p className="text-xs text-muted-foreground mt-0.5">
                {dayAppts.length === 0 ? 'Nenhum compromisso' : `${dayAppts.length} compromisso${dayAppts.length > 1 ? 's' : ''}`}
              </p>
            </div>
            {dayAppts.length > 0 && (
              <div className="text-right">
                <p className="text-xs text-muted-foreground">Total do dia</p>
                <p className="text-sm font-bold text-emerald-400">R$ {totalToday.toFixed(2)}</p>
              </div>
            )}
          </div>

          {/* Mini stats */}
          {dayAppts.length > 0 && (
            <div className="flex gap-2 mt-4">
              {Object.entries(
                dayAppts.reduce((acc: any, a) => { acc[a.status] = (acc[a.status]||0)+1; return acc }, {})
              ).map(([st, count]) => {
                const cfg = STATUS[st] || STATUS.pending
                return (
                  <span key={st} className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: cfg.color, background: cfg.bg }}>
                    {count as number}× {cfg.label}
                  </span>
                )
              })}
            </div>
          )}
        </div>

        {/* Appointment list */}
        <div className="flex-1 overflow-y-auto p-4 space-y-3">
          {dayAppts.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                <Clock className="w-7 h-7" style={{ color: '#6366f1' }} />
              </div>
              <p className="text-sm font-semibold text-foreground mb-1">Agenda livre</p>
              <p className="text-xs text-muted-foreground/60">Nenhum compromisso para este dia</p>
            </div>
          ) : (
            dayAppts.map((appt) => {
              const st       = STATUS[appt.status] || STATUS.pending
              const [c1, c2] = avatarColor(appt.contact?.name || '')
              const svcColor = appt.service?.color || '#6366f1'

              return (
                <div key={appt.id}
                  className="rounded-2xl p-4 transition-all"
                  style={{ background: 'hsl(0 0% 8%)', border: `1px solid ${st.border}` }}
                >
                  {/* Time + status */}
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <div className="w-1.5 h-6 rounded-full" style={{ backgroundColor: svcColor }} />
                      <div>
                        <span className="text-sm font-bold text-foreground">
                          {format(parseISO(appt.scheduledAt), 'HH:mm')}
                        </span>
                        <span className="text-xs text-muted-foreground ml-1.5">
                          {appt.service?.duration || 30}min
                        </span>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold px-2 py-1 rounded-lg" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                  </div>

                  {/* Contact */}
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                      style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                      {appt.contact?.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-foreground">{appt.contact?.name}</p>
                      <p className="text-xs text-muted-foreground">{appt.service?.name || 'Serviço'}</p>
                    </div>
                    {appt.service?.price && (
                      <span className="text-sm font-bold text-emerald-400 flex-shrink-0">
                        R$ {Number(appt.service.price).toFixed(0)}
                      </span>
                    )}
                  </div>

                  {/* Actions */}
                  {appt.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleStatus(appt.id, 'confirm')}
                        className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
                        style={{ background: 'rgba(52,211,153,0.12)', color: '#34d399', border: '1px solid rgba(52,211,153,0.25)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(52,211,153,0.12)')}>
                        ✓ Confirmar
                      </button>
                      <button onClick={() => handleStatus(appt.id, 'cancel')}
                        className="flex-1 py-2 text-xs font-semibold rounded-xl transition-all"
                        style={{ background: 'rgba(251,113,133,0.12)', color: '#fb7185', border: '1px solid rgba(251,113,133,0.25)' }}
                        onMouseEnter={e => (e.currentTarget.style.background = 'rgba(251,113,133,0.2)')}
                        onMouseLeave={e => (e.currentTarget.style.background = 'rgba(251,113,133,0.12)')}>
                        ✕ Cancelar
                      </button>
                    </div>
                  )}
                  {appt.status === 'confirmed' && (
                    <button onClick={() => handleStatus(appt.id, 'complete')}
                      className="w-full py-2 text-xs font-semibold rounded-xl transition-all"
                      style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }}>
                      Marcar como concluído
                    </button>
                  )}
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}

// ────────────────────────── SERVIÇOS TAB ────────────────────────────────────
function ServicosTab() {
  const [services, setServices] = useState<any[]>([])
  const [editing, setEditing]   = useState<any>(null)
  const [form, setForm]         = useState({ name: '', description: '', duration: 30, price: '', color: COLORS[0] })

  useEffect(() => { load() }, [])

  const load = async () => {
    try { const { data } = await api.get('/agenda/services'); setServices(data || []) }
    catch { setServices(MOCK_SERVICES) }
  }

  const startNew = () => { setEditing({}); setForm({ name:'', description:'', duration:30, price:'', color:COLORS[0] }) }
  const startEdit = (svc: any) => { setEditing(svc); setForm({ name:svc.name, description:svc.description||'', duration:svc.duration, price:String(svc.price||''), color:svc.color||COLORS[0] }) }

  const save = async () => {
    if (!form.name.trim()) return toast.error('Nome é obrigatório')
    const payload = { ...form, price: form.price ? parseFloat(form.price) : null, duration: Number(form.duration) }
    try {
      editing?.id ? await api.patch(`/agenda/services/${editing.id}`, payload) : await api.post('/agenda/services', payload)
      toast.success(editing?.id ? 'Serviço atualizado!' : 'Serviço criado!')
      setEditing(null); load()
    } catch { toast.error('Erro ao salvar') }
  }

  const remove = async (id: string) => {
    try { await api.delete(`/agenda/services/${id}`); toast.success('Removido'); load() }
    catch { toast.error('Erro ao remover') }
  }

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Serviços</h3>
          <p className="text-sm text-muted-foreground mt-0.5">Configure os serviços do estabelecimento</p>
        </div>
        <button onClick={startNew}
          className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all"
          style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow: '0 4px 16px rgba(99,102,241,0.35)' }}>
          <Plus className="w-4 h-4" /> Novo Serviço
        </button>
      </div>

      {editing !== null && (
        <div className="rounded-2xl p-6 mb-6" style={{ background: 'hsl(0 0% 7%)', border: '1px solid rgba(99,102,241,0.3)' }}>
          <h4 className="font-semibold text-foreground mb-5 flex items-center gap-2">
            <Scissors className="w-4 h-4 text-primary" />
            {editing.id ? 'Editar serviço' : 'Novo serviço'}
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Nome do serviço *</label>
              <input value={form.name} onChange={e => setForm({...form, name: e.target.value})}
                placeholder="ex: Corte + Barba, Consulta..."
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all"
                style={{ background:'hsl(0 0% 10%)', border:'1px solid hsl(0 0% 15%)' }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Duração (min)</label>
              <input type="number" value={form.duration} min={5} step={5}
                onChange={e => setForm({...form, duration: Number(e.target.value)})}
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-foreground focus:outline-none transition-all"
                style={{ background:'hsl(0 0% 10%)', border:'1px solid hsl(0 0% 15%)' }} />
            </div>
            <div>
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Valor (R$)</label>
              <input type="number" value={form.price} min={0} step={0.01}
                onChange={e => setForm({...form, price: e.target.value})}
                placeholder="0,00"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all"
                style={{ background:'hsl(0 0% 10%)', border:'1px solid hsl(0 0% 15%)' }} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-1.5 block">Descrição</label>
              <input value={form.description} onChange={e => setForm({...form, description: e.target.value})}
                placeholder="Detalhes do serviço (opcional)"
                className="w-full rounded-xl px-3.5 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none transition-all"
                style={{ background:'hsl(0 0% 10%)', border:'1px solid hsl(0 0% 15%)' }} />
            </div>
            <div className="col-span-2">
              <label className="text-xs font-semibold text-muted-foreground mb-2 block">Cor de identificação</label>
              <div className="flex gap-2">
                {COLORS.map(c => (
                  <button key={c} onClick={() => setForm({...form, color: c})}
                    className="w-8 h-8 rounded-lg transition-all relative"
                    style={{ backgroundColor: c, boxShadow: form.color === c ? `0 0 0 3px hsl(0 0% 7%), 0 0 0 5px ${c}` : 'none' }} />
                ))}
              </div>
            </div>
          </div>
          <div className="flex gap-3 mt-5">
            <button onClick={save}
              className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all"
              style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
              <Check className="w-4 h-4" /> Salvar
            </button>
            <button onClick={() => setEditing(null)}
              className="flex items-center gap-2 px-4 py-2.5 text-muted-foreground text-sm font-medium rounded-xl transition-all hover:text-foreground"
              style={{ background:'hsl(0 0% 10%)', border:'1px solid hsl(0 0% 15%)' }}>
              <X className="w-4 h-4" /> Cancelar
            </button>
          </div>
        </div>
      )}

      {services.length === 0 ? (
        <div className="rounded-2xl p-12 text-center" style={{ background:'hsl(0 0% 7%)', border:'1px solid hsl(0 0% 12%)' }}>
          <div className="w-14 h-14 rounded-2xl mx-auto mb-4 flex items-center justify-center"
            style={{ background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)' }}>
            <Scissors className="w-6 h-6" style={{ color:'#6366f1' }} />
          </div>
          <p className="text-sm font-semibold text-foreground mb-1">Nenhum serviço cadastrado</p>
          <p className="text-xs text-muted-foreground">Adicione serviços para a IA poder sugerir agendamentos</p>
        </div>
      ) : (
        <div className="space-y-2">
          {services.map(svc => (
            <div key={svc.id}
              className="rounded-2xl p-4 flex items-center gap-4 group transition-all"
              style={{ background:'hsl(0 0% 7%)', border:'1px solid hsl(0 0% 12%)' }}>
              {/* Color dot */}
              <div className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                style={{ background: `${svc.color || '#6366f1'}22`, border: `1px solid ${svc.color || '#6366f1'}44` }}>
                <Scissors className="w-4 h-4" style={{ color: svc.color || '#6366f1' }} />
              </div>

              <div className="flex-1 min-w-0">
                <p className="text-sm font-semibold text-foreground">{svc.name}</p>
                {svc.description && <p className="text-xs text-muted-foreground truncate mt-0.5">{svc.description}</p>}
              </div>

              <div className="flex items-center gap-3 text-xs flex-shrink-0">
                <div className="flex items-center gap-1.5 text-muted-foreground">
                  <Timer className="w-3.5 h-3.5" />
                  <span>{svc.duration}min</span>
                </div>
                {svc.price && (
                  <div className="flex items-center gap-1 font-bold" style={{ color:'#34d399' }}>
                    <span>R$ {Number(svc.price).toFixed(2)}</span>
                  </div>
                )}
              </div>

              <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-all">
                <button onClick={() => startEdit(svc)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-foreground transition-all"
                  style={{ background:'hsl(0 0% 10%)' }}>
                  <Edit2 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => remove(svc.id)}
                  className="w-8 h-8 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-400 transition-all"
                  style={{ background:'hsl(0 0% 10%)' }}>
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

// ────────────────────────── DISPONIBILIDADE TAB ──────────────────────────────
function DisponibilidadeTab() {
  type Block    = { id?: string; startTime: string; endTime: string; isActive: boolean }
  type DayState = { enabled: boolean; blocks: Block[] }

  const [schedule, setSchedule] = useState<Record<number,DayState>>(
    Object.fromEntries(Array.from({length:7},(_,i) => [i,{
      enabled: i>=1 && i<=6,
      blocks: [{ startTime:'08:00', endTime:'18:00', isActive:true }],
    }]))
  )
  const [saving, setSaving] = useState(false)

  useEffect(() => { load() }, [])

  const load = async () => {
    try {
      const { data } = await api.get('/agenda/availability')
      if (!data?.length) return
      const grouped: Record<number,Block[]> = {}
      for (const s of data) {
        if (!grouped[s.dayOfWeek]) grouped[s.dayOfWeek] = []
        grouped[s.dayOfWeek].push({ id:s.id, startTime:s.startTime, endTime:s.endTime, isActive:s.isActive })
      }
      setSchedule(prev => {
        const next = {...prev}
        for (let d=0;d<7;d++) {
          next[d] = grouped[d] ? { enabled:true, blocks:grouped[d] } : { enabled:false, blocks:[{startTime:'08:00',endTime:'18:00',isActive:true}] }
        }
        return next
      })
    } catch {}
  }

  const toggleDay  = (d: number) => setSchedule(p => ({...p,[d]:{...p[d],enabled:!p[d].enabled}}))
  const addBlock   = (d: number) => setSchedule(p => ({...p,[d]:{...p[d],blocks:[...p[d].blocks,{startTime:'08:00',endTime:'18:00',isActive:true}]}}))
  const removeBlock= (d: number, i: number) => setSchedule(p => ({...p,[d]:{...p[d],blocks:p[d].blocks.filter((_,idx)=>idx!==i)}}))
  const updateBlock= (d: number, i: number, field: 'startTime'|'endTime', v: string) => setSchedule(p => {
    const blocks=[...p[d].blocks]; blocks[i]={...blocks[i],[field]:v}; return {...p,[d]:{...p[d],blocks}}
  })

  const save = async () => {
    setSaving(true)
    const slots: any[] = []
    for (let d=0;d<7;d++) {
      if (!schedule[d].enabled) continue
      for (const b of schedule[d].blocks) slots.push({dayOfWeek:d,startTime:b.startTime,endTime:b.endTime,isActive:true})
    }
    try { await api.post('/agenda/availability',{slots}); toast.success('Disponibilidade salva!') }
    catch { toast.error('Erro ao salvar') }
    setSaving(false)
  }

  const enabledCount = Object.values(schedule).filter(d => d.enabled).length

  return (
    <div className="p-6 max-w-2xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-bold text-foreground">Disponibilidade</h3>
          <p className="text-sm text-muted-foreground mt-0.5">
            {enabledCount} dia{enabledCount !== 1 ? 's' : ''} ativo{enabledCount !== 1 ? 's' : ''} por semana
          </p>
        </div>
        <button onClick={save} disabled={saving}
          className="flex items-center gap-2 px-5 py-2.5 text-white text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
          style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }}>
          <Check className="w-4 h-4" />
          {saving ? 'Salvando...' : 'Salvar'}
        </button>
      </div>

      <div className="space-y-2">
        {Array.from({length:7},(_,d) => (
          <div key={d} className="rounded-2xl p-4 transition-all"
            style={{
              background: schedule[d].enabled ? 'hsl(0 0% 7%)' : 'hsl(0 0% 6%)',
              border: schedule[d].enabled ? '1px solid hsl(0 0% 14%)' : '1px solid hsl(0 0% 10%)',
              opacity: schedule[d].enabled ? 1 : 0.55,
            }}>
            <div className="flex items-center gap-4">
              {/* Toggle */}
              <button onClick={() => toggleDay(d)}
                className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
                style={{ background: schedule[d].enabled ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'hsl(0 0% 14%)' }}>
                <span className="absolute top-0.5 w-4 h-4 bg-white rounded-full transition-all shadow"
                  style={{ left: schedule[d].enabled ? '22px' : '2px' }} />
              </button>

              {/* Day name */}
              <span className="text-sm font-semibold text-foreground w-20">{DAY_NAMES[d]}</span>

              {/* Blocks */}
              {schedule[d].enabled ? (
                <div className="flex-1 space-y-2">
                  {schedule[d].blocks.map((block, idx) => (
                    <div key={idx} className="flex items-center gap-2">
                      <input type="time" value={block.startTime}
                        onChange={e => updateBlock(d,idx,'startTime',e.target.value)}
                        className="rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        style={{ background:'hsl(0 0% 10%)', border:'1px solid hsl(0 0% 15%)' }} />
                      <span className="text-xs text-muted-foreground">→</span>
                      <input type="time" value={block.endTime}
                        onChange={e => updateBlock(d,idx,'endTime',e.target.value)}
                        className="rounded-lg px-2.5 py-1.5 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
                        style={{ background:'hsl(0 0% 10%)', border:'1px solid hsl(0 0% 15%)' }} />
                      {schedule[d].blocks.length > 1 && (
                        <button onClick={() => removeBlock(d,idx)}
                          className="w-7 h-7 rounded-lg flex items-center justify-center text-muted-foreground hover:text-rose-400 transition-all"
                          style={{ background:'hsl(0 0% 10%)' }}>
                          <X className="w-3.5 h-3.5" />
                        </button>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <span className="text-xs text-muted-foreground/50">Fechado</span>
              )}

              {schedule[d].enabled && (
                <button onClick={() => addBlock(d)}
                  className="flex items-center gap-1 text-xs font-semibold px-2.5 py-1.5 rounded-lg transition-all flex-shrink-0"
                  style={{ color:'#818cf8', background:'rgba(99,102,241,0.1)', border:'1px solid rgba(99,102,241,0.2)' }}>
                  <Plus className="w-3 h-3" /> Bloco
                </button>
              )}
            </div>
          </div>
        ))}
      </div>

      <div className="mt-5 flex items-start gap-3 rounded-xl p-4"
        style={{ background:'rgba(99,102,241,0.06)', border:'1px solid rgba(99,102,241,0.15)' }}>
        <Sparkles className="w-4 h-4 mt-0.5 flex-shrink-0" style={{ color:'#818cf8' }} />
        <p className="text-xs text-muted-foreground leading-relaxed">
          A IA vai usar esses horários para sugerir agendamentos automaticamente via WhatsApp — nunca vai oferecer horários fora dessa janela.
        </p>
      </div>
    </div>
  )
}

// ────────────────────────── MAIN PAGE ───────────────────────────────────────
const TABS = [
  { id: 'agenda',          label: 'Agenda',          icon: Calendar  },
  { id: 'servicos',        label: 'Serviços',         icon: Scissors  },
  { id: 'disponibilidade', label: 'Disponibilidade',  icon: Clock     },
]

export default function AgendaPage() {
  const [activeTab, setActiveTab] = useState('agenda')

  return (
    <div className="h-[calc(100vh-3.5rem)] flex flex-col">
      {/* Page header */}
      <div className="px-6 py-4 border-b border-border flex items-center justify-between flex-shrink-0" style={{ background:'hsl(0 0% 5%)' }}>
        <div>
          <h1 className="text-base font-bold text-foreground">Agenda</h1>
          <p className="text-xs text-muted-foreground mt-0.5">Agendamentos, serviços e disponibilidade</p>
        </div>
        {activeTab === 'agenda' && (
          <button className="flex items-center gap-2 px-4 py-2 text-white text-sm font-semibold rounded-xl transition-all"
            style={{ background:'linear-gradient(135deg,#6366f1,#8b5cf6)', boxShadow:'0 4px 16px rgba(99,102,241,0.35)' }}>
            <Plus className="w-4 h-4" /> Novo Compromisso
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="px-6 border-b border-border flex-shrink-0" style={{ background:'hsl(0 0% 5%)' }}>
        <div className="flex gap-0">
          {TABS.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setActiveTab(id)}
              className="flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-all"
              style={activeTab === id
                ? { borderColor:'#6366f1', color:'#818cf8' }
                : { borderColor:'transparent', color:'hsl(0 0% 45%)' }}>
              <Icon className="w-4 h-4" />
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-hidden" style={{ background:'hsl(0 0% 4%)' }}>
        {activeTab === 'agenda'          && <AgendaTab />}
        {activeTab === 'servicos'        && <div className="overflow-y-auto h-full"><ServicosTab /></div>}
        {activeTab === 'disponibilidade' && <div className="overflow-y-auto h-full"><DisponibilidadeTab /></div>}
      </div>
    </div>
  )
}
