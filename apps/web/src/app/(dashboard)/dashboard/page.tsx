'use client'
import { useEffect, useState } from 'react'
import { ArrowUpRight, ArrowDownRight, Calendar, TrendingUp, Users, MessageSquare } from 'lucide-react'
import {
  AreaChart, Area, XAxis, YAxis, ResponsiveContainer, Tooltip,
  BarChart, Bar, Cell, PieChart, Pie,
} from 'recharts'
import api from '@/lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { MOCK_OVERVIEW, MOCK_FINANCIAL, MOCK_TODAY_APPOINTMENTS } from '@/lib/mock'

const PURPLE = '#7c6fec'

// Sparkline com dados de tendência
const SPARK = [3, 5, 4, 8, 6, 10, 8, 13, 11, 15, 13, 17, 15, 20].map((v, i) => ({ i, v }))

export default function DashboardPage() {
  const [overview, setOverview]   = useState<any>(null)
  const [todayAppts, setTodayAppts] = useState<any[]>([])
  const [financial, setFinancial] = useState<any>(null)
  const [loading, setLoading]     = useState(true)
  const [revenueTab, setRevenueTab] = useState<'realizado'|'projetado'>('realizado')
  const [serviceTab, setServiceTab] = useState<'pago'|'apagar'>('pago')

  useEffect(() => {
    Promise.all([
      api.get('/dashboard/overview'),
      api.get('/dashboard/today'),
      api.get('/dashboard/financial'),
    ]).then(([ov, td, fin]) => {
      setOverview(ov.data)
      setTodayAppts(td.data || [])
      setFinancial(fin.data)
    }).catch(() => {
      setOverview(MOCK_OVERVIEW)
      setTodayAppts(MOCK_TODAY_APPOINTMENTS)
      setFinancial(MOCK_FINANCIAL)
    }).finally(() => setLoading(false))
  }, [])

  const fmt  = (v: number) => v.toLocaleString('pt-BR', { minimumFractionDigits: 2 })
  const fmtK = (v: number) => v >= 1000 ? `R$${(v/1000).toFixed(1)}mil` : `R$${v}`

  if (loading) return (
    <div className="flex items-center justify-center h-full">
      <div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" />
    </div>
  )

  const totalRevenue     = financial?.revenueMonth || 0
  const byService        = financial?.byService || []
  const daily            = financial?.daily || []
  const totalServiceVal  = byService.reduce((s: number, x: any) => s + x.revenue, 0)
  const projected        = daily.map((d: any, i: number) => ({ ...d, projected: Math.round(d.revenue * (1 + 0.06*(i+1))) }))

  const TabBtn = ({ active, onClick, label }: any) => (
    <button onClick={onClick}
      className={`px-2.5 py-1 text-xs rounded-lg font-medium transition-all ${active ? 'bg-secondary text-foreground' : 'text-muted-foreground hover:text-foreground'}`}>
      {label}
    </button>
  )

  // Custom donut label
  const DonutCenter = ({ cx, cy }: any) => (
    <text x={cx} y={cy} textAnchor="middle" dominantBaseline="central">
      <tspan x={cx} dy="-0.5em" fontSize="18" fontWeight="800" fill="white">{fmtK(totalServiceVal)}</tspan>
      <tspan x={cx} dy="1.5em" fontSize="10" fill="hsl(0 0% 45%)" letterSpacing="0.08em">TOTAL</tspan>
    </text>
  )

  return (
    <div className="min-h-full p-5 space-y-4">

      {/* ── Row 1: 3 cols ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Card: Faturamento */}
        <div className="border border-border rounded-2xl overflow-hidden flex flex-col" style={{ background: 'linear-gradient(145deg, hsl(243 60% 12%) 0%, hsl(0 0% 7%) 60%)' }}>
          <div className="px-6 pt-5 pb-2">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Faturamento do período</p>
            <p className="text-xs text-muted-foreground mt-0.5">Receita dos serviços concluídos</p>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-sm text-muted-foreground font-medium">R$</span>
              <span className="text-[2.6rem] font-black text-foreground leading-none">{fmt(totalRevenue)}</span>
            </div>
            {financial?.revenueGrowth != null && (
              <div className={`flex items-center gap-1 text-xs font-semibold mt-1.5 ${financial.revenueGrowth >= 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                {financial.revenueGrowth >= 0 ? <ArrowUpRight className="w-3 h-3"/> : <ArrowDownRight className="w-3 h-3"/>}
                {Math.abs(financial.revenueGrowth)}% vs mês anterior
              </div>
            )}
          </div>
          {/* Full-width sparkline */}
          <div className="flex-1 min-h-[90px] -mx-px">
            <ResponsiveContainer width="100%" height={90}>
              <AreaChart data={SPARK} margin={{ top: 4, right: 0, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="sparkGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={PURPLE} stopOpacity={0.35}/>
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <Area type="monotone" dataKey="v" stroke={PURPLE} strokeWidth={2} fill="url(#sparkGrad)" dot={false}/>
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Card: Distribuição */}
        <div className="bg-card border border-border rounded-2xl p-5 flex flex-col">
          <div className="flex items-center justify-between mb-4">
            <p className="text-base font-bold text-foreground">Distribuição por serviço</p>
            <div className="flex gap-1">
              <TabBtn active={serviceTab==='pago'}   onClick={() => setServiceTab('pago')}   label="Pago"/>
              <TabBtn active={serviceTab==='apagar'} onClick={() => setServiceTab('apagar')} label="A Pagar"/>
            </div>
          </div>
          <div className="flex items-center gap-3 flex-1">
            {/* Donut */}
            <div className="flex-shrink-0">
              <PieChart width={140} height={140}>
                <Pie
                  data={byService.length ? byService : [{ name:'–', revenue:1, color:'#222' }]}
                  cx={65} cy={65} innerRadius={46} outerRadius={68}
                  dataKey="revenue" startAngle={90} endAngle={-270}
                  labelLine={false}
                  label={byService.length ? DonutCenter : undefined}
                >
                  {(byService.length ? byService : [{color:'#222'}]).map((e: any, i: number) => (
                    <Cell key={i} fill={e.color} strokeWidth={0}/>
                  ))}
                </Pie>
              </PieChart>
            </div>
            {/* Legend */}
            <div className="flex-1 space-y-2.5 min-w-0">
              {byService.slice(0,4).map((svc: any) => {
                const pct = totalServiceVal > 0 ? Math.round(svc.revenue/totalServiceVal*100) : 0
                return (
                  <div key={svc.name}>
                    <div className="flex items-center gap-2 mb-0.5">
                      <span className="w-2 h-2 rounded-full flex-shrink-0" style={{ backgroundColor: svc.color }}/>
                      <span className="text-xs text-muted-foreground flex-1 truncate">{svc.name}</span>
                    </div>
                    <div className="flex items-center justify-between pl-4">
                      <div className="flex-1 h-1 bg-secondary rounded-full mr-2 overflow-hidden">
                        <div className="h-full rounded-full" style={{ width:`${pct}%`, backgroundColor: svc.color }}/>
                      </div>
                      <span className="text-xs font-semibold text-foreground whitespace-nowrap">R$ {(svc.revenue/1000).toFixed(1)}k</span>
                      <span className="text-xs text-muted-foreground ml-1.5 w-8 text-right">{pct}%</span>
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        {/* Card: Fluxo de Receita */}
        <div className="border border-border rounded-2xl overflow-hidden flex flex-col" style={{ background: 'linear-gradient(145deg, hsl(243 60% 12%) 0%, hsl(0 0% 7%) 60%)' }}>
          <div className="px-6 pt-5 pb-2">
            <div className="flex items-center justify-between">
              <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase">Fluxo de Receita</p>
              <div className="flex gap-1">
                <TabBtn active={revenueTab==='realizado'}  onClick={() => setRevenueTab('realizado')}  label="Realizado"/>
                <TabBtn active={revenueTab==='projetado'}  onClick={() => setRevenueTab('projetado')}  label="Projetado"/>
              </div>
            </div>
            <div className="flex items-baseline gap-1 mt-3">
              <span className="text-sm text-muted-foreground font-medium">R$</span>
              <span className="text-[2.6rem] font-black text-foreground leading-none">{fmt(totalRevenue)}</span>
            </div>
          </div>
          <div className="flex-1 min-h-[110px] -mx-px">
            <ResponsiveContainer width="100%" height={110}>
              <AreaChart data={projected} margin={{ top: 4, right: 12, bottom: 0, left: 0 }}>
                <defs>
                  <linearGradient id="flowGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor={PURPLE} stopOpacity={0.5}/>
                    <stop offset="100%" stopColor={PURPLE} stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <XAxis dataKey="date" tick={{ fill:'hsl(0 0% 32%)', fontSize:10 }} axisLine={false} tickLine={false} interval={1}/>
                <YAxis tick={{ fill:'hsl(0 0% 32%)', fontSize:10 }} axisLine={false} tickLine={false}
                  tickFormatter={fmtK} width={52} tickCount={4}/>
                <Tooltip
                  contentStyle={{ background:'hsl(0 0% 7%)', border:'1px solid hsl(0 0% 13%)', borderRadius:'10px', color:'white', fontSize:12 }}
                  formatter={(v: any) => [`R$ ${fmt(v)}`, revenueTab==='realizado' ? 'Realizado' : 'Projetado']}
                />
                <Area type="monotone"
                  dataKey={revenueTab==='realizado' ? 'revenue' : 'projected'}
                  stroke={PURPLE} strokeWidth={2.5} fill="url(#flowGrad)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 2: 3 cols ───────────────────────────────────────────────── */}
      <div className="grid grid-cols-3 gap-4">

        {/* Receitas + A Receber */}
        <div className="flex flex-col gap-4">
          <div className="border border-emerald-500/20 rounded-2xl p-5 flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(152 60% 8%) 0%, hsl(0 0% 7%) 65%)' }}>
            <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-emerald-400 rounded-r-full"/>
            <div className="flex items-center gap-2.5 mb-4 pl-3">
              <div className="w-7 h-7 rounded-lg bg-emerald-500/20 flex items-center justify-center">
                <ArrowUpRight className="w-3.5 h-3.5 text-emerald-400"/>
              </div>
              <span className="text-sm font-bold text-emerald-400">Receitas</span>
            </div>
            <div className="flex items-baseline gap-1 pl-3 mb-1">
              <span className="text-xs text-muted-foreground">R$</span>
              <span className="text-2xl font-black text-foreground">{fmt(totalRevenue)}</span>
            </div>
            <p className="text-xs text-muted-foreground pl-3">{financial?.completedCount || 0} atendimentos concluídos</p>
          </div>

          <div className="border border-primary/20 rounded-2xl p-5 flex-1 relative overflow-hidden" style={{ background: 'linear-gradient(145deg, hsl(243 60% 10%) 0%, hsl(0 0% 7%) 65%)' }}>
            <div className="absolute left-0 top-4 bottom-4 w-[3px] bg-primary rounded-r-full"/>
            <div className="flex items-center gap-2.5 mb-4 pl-3">
              <div className="w-7 h-7 rounded-lg bg-primary/20 flex items-center justify-center">
                <Calendar className="w-3.5 h-3.5 text-primary"/>
              </div>
              <span className="text-sm font-bold text-primary">A Receber</span>
            </div>
            <div className="flex items-baseline gap-1 pl-3 mb-1">
              <span className="text-xs text-muted-foreground">R$</span>
              <span className="text-2xl font-black text-foreground">
                {fmt((overview?.appointments?.month || 0) * (financial?.avgTicket || 0))}
              </span>
            </div>
            <p className="text-xs text-muted-foreground pl-3">{overview?.appointments?.month || 0} agendamentos este mês</p>
          </div>
        </div>

        {/* Agenda de hoje */}
        <div className="bg-card border border-border rounded-2xl p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-base font-bold text-foreground">Agenda de hoje</p>
              <p className="text-xs text-muted-foreground">{format(new Date(), "EEEE, dd 'de' MMMM", { locale: ptBR })}</p>
            </div>
            <span className="text-xs font-semibold text-primary bg-primary/10 px-2.5 py-1 rounded-xl">
              {todayAppts.length} agendamentos
            </span>
          </div>
          <div className="space-y-1">
            {todayAppts.length === 0 ? (
              <div className="py-10 text-center">
                <Calendar className="w-8 h-8 text-muted-foreground/25 mx-auto mb-2"/>
                <p className="text-xs text-muted-foreground">Nenhum agendamento hoje</p>
              </div>
            ) : todayAppts.slice(0,5).map((appt: any) => (
              <div key={appt.id} className="flex items-center gap-3 px-2 py-2 rounded-xl hover:bg-secondary transition-all group">
                <div className="w-8 h-8 rounded-full bg-primary/15 flex items-center justify-center text-primary text-xs font-bold flex-shrink-0">
                  {appt.contact?.name?.charAt(0) || '?'}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold text-foreground truncate">{appt.contact?.name}</p>
                  <p className="text-xs text-muted-foreground truncate">{appt.service?.name}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-bold text-foreground">{format(new Date(appt.scheduledAt), 'HH:mm')}</p>
                  {appt.service?.price && <p className="text-xs font-semibold text-emerald-400">R$ {Number(appt.service.price).toFixed(0)}</p>}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Movimentação diária */}
        <div className="border border-border rounded-2xl overflow-hidden flex flex-col" style={{ background: 'linear-gradient(160deg, hsl(152 50% 7%) 0%, hsl(0 0% 7%) 50%)' }}>
          <div className="px-6 pt-5 pb-4">
            <p className="text-[11px] font-semibold tracking-widest text-muted-foreground uppercase mb-3">Movimentação Diária</p>
            <div className="flex items-baseline gap-1">
              <span className="text-sm text-muted-foreground font-medium">R$</span>
              <span className="text-[2.6rem] font-black text-foreground leading-none">{fmt(totalRevenue)}</span>
            </div>
          </div>
          <div className="flex-1">
            <ResponsiveContainer width="100%" height={170}>
              <BarChart
                data={daily}
                barSize={30}
                barCategoryGap="28%"
                margin={{ top: 0, right: 20, bottom: 0, left: 20 }}
                style={{ outline: 'none' }}
              >
                <defs>
                  <linearGradient id="dg1" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#34d399" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#059669" stopOpacity={0.8}/>
                  </linearGradient>
                  <linearGradient id="dg2" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%"   stopColor="#fb7185" stopOpacity={1}/>
                    <stop offset="100%" stopColor="#be123c" stopOpacity={0.8}/>
                  </linearGradient>
                </defs>
                <XAxis
                  dataKey="day"
                  tick={{ fill:'hsl(0 0% 42%)', fontSize:11, fontWeight:600 }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill:'rgba(255,255,255,0.04)', radius: 6 }}
                  contentStyle={{
                    background:'hsl(0 0% 9%)',
                    border:'1px solid hsl(0 0% 16%)',
                    borderRadius:'12px',
                    color:'white',
                    fontSize:13,
                    padding:'10px 16px',
                    boxShadow:'0 8px 32px rgba(0,0,0,0.4)',
                  }}
                  formatter={(v: any) => [`R$ ${fmt(v)}`, 'Faturamento']}
                  labelStyle={{ color:'hsl(0 0% 55%)', marginBottom:6, fontSize:11, letterSpacing:'0.05em' }}
                />
                <Bar dataKey="revenue" radius={[7, 7, 3, 3]}>
                  {daily.map((d: any, i: number) => (
                    <Cell key={i} fill={d.revenue > 0 ? 'url(#dg1)' : 'url(#dg2)'} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* ── Row 3: KPIs ─────────────────────────────────────────────────── */}
      <div className="grid grid-cols-4 gap-4">
        {[
          { label:'LEADS RECEBIDOS',   value: overview?.contacts?.total || 0,          sub:`+${overview?.contacts?.today||0} hoje`,    icon: Users,         trend:12, grad:'linear-gradient(145deg, hsl(243 60% 10%) 0%, hsl(0 0% 7%) 70%)', border:'border-primary/20',    accent:'#7c6fec' },
          { label:'CONVERSAS ABERTAS', value: overview?.conversations?.open || 0,       sub:`${overview?.conversations?.total||0} total`, icon: MessageSquare, trend:8,  grad:'linear-gradient(145deg, hsl(217 60% 10%) 0%, hsl(0 0% 7%) 70%)', border:'border-blue-500/20',   accent:'#60a5fa' },
          { label:'TICKET MÉDIO',      value:`R$ ${fmt(financial?.avgTicket||0)}`,      sub:'por atendimento',                           icon: TrendingUp,    trend:5,  grad:'linear-gradient(145deg, hsl(152 60% 8%)  0%, hsl(0 0% 7%) 70%)', border:'border-emerald-500/20',accent:'#34d399' },
          { label:'TAXA DE CONVERSÃO', value:`${overview?.leads?.conversionRate||0}%`,  sub:`${overview?.leads?.won||0} fechados`,       icon: TrendingUp,    trend:3,  grad:'linear-gradient(145deg, hsl(38  60% 10%) 0%, hsl(0 0% 7%) 70%)', border:'border-amber-500/20',  accent:'#fbbf24' },
        ].map((item) => (
          <div key={item.label} className={`border ${item.border} rounded-2xl p-5`} style={{ background: item.grad }}>
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] font-bold tracking-widest text-muted-foreground uppercase">{item.label}</p>
              <span className="flex items-center gap-0.5 text-xs text-emerald-400 font-semibold">
                <ArrowUpRight className="w-3 h-3"/>{item.trend}%
              </span>
            </div>
            <p className="text-3xl font-black text-foreground leading-none mb-1.5">{item.value}</p>
            <div className="flex items-center justify-between">
              <p className="text-xs text-muted-foreground">{item.sub}</p>
              <div className="w-6 h-6 rounded-lg flex items-center justify-center" style={{ backgroundColor: item.accent + '22' }}>
                <item.icon className="w-3.5 h-3.5" style={{ color: item.accent }}/>
              </div>
            </div>
          </div>
        ))}
      </div>

    </div>
  )
}
