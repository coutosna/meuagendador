'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { BarChart3, TrendingUp, Calendar, Users } from 'lucide-react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts'
import api from '@/lib/api'
import { format, subDays } from 'date-fns'

const tooltipStyle = {
  contentStyle: { background: 'hsl(222 20% 8%)', border: '1px solid hsl(222 20% 14%)', borderRadius: '8px', color: 'white' },
}

export default function ReportsPage() {
  const [leads, setLeads] = useState<any[]>([])
  const [appointments, setAppointments] = useState<any[]>([])

  useEffect(() => {
    const from = format(subDays(new Date(), 30), 'yyyy-MM-dd')
    const to = format(new Date(), 'yyyy-MM-dd')
    Promise.all([
      api.get(`/reports/leads?from=${from}&to=${to}`),
      api.get(`/reports/appointments?from=${from}&to=${to}`),
    ]).then(([l, a]) => {
      setLeads(l.data || [])
      setAppointments(a.data || [])
    }).catch(() => {})
  }, [])

  const byStage = leads.reduce((acc: any, l: any) => {
    const name = l.stage?.name || 'Sem estágio'
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})
  const stageData = Object.entries(byStage).map(([name, total]) => ({ name, total }))

  const byStatus = appointments.reduce((acc: any, a: any) => {
    const labels: Record<string, string> = { pending: 'Pendente', confirmed: 'Confirmado', completed: 'Concluído', cancelled: 'Cancelado', no_show: 'Não veio' }
    const name = labels[a.status] || a.status
    acc[name] = (acc[name] || 0) + 1
    return acc
  }, {})
  const statusData = Object.entries(byStatus).map(([name, total]) => ({ name, total }))

  return (
    <div className="min-h-full">
      <Header title="Relatórios" subtitle="Análise dos últimos 30 dias" />
      <div className="p-6 space-y-6">
        <div className="grid grid-cols-2 xl:grid-cols-4 gap-4">
          {[
            { label: 'Total de Leads', value: leads.length, icon: Users, color: 'text-primary bg-primary/10' },
            { label: 'Agendamentos', value: appointments.length, icon: Calendar, color: 'text-emerald-400 bg-emerald-400/10' },
            { label: 'Taxa de Comparecimento', value: appointments.length > 0 ? `${Math.round((appointments.filter((a) => a.status === 'completed').length / appointments.length) * 100)}%` : '—', icon: TrendingUp, color: 'text-amber-400 bg-amber-400/10' },
            { label: 'Cancelamentos', value: appointments.filter((a) => a.status === 'cancelled').length, icon: BarChart3, color: 'text-rose-400 bg-rose-400/10' },
          ].map((m) => (
            <div key={m.label} className="bg-card border border-border rounded-2xl p-5">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center mb-3 ${m.color}`}>
                <m.icon className="w-4 h-4" />
              </div>
              <p className="text-2xl font-bold text-foreground">{m.value}</p>
              <p className="text-xs text-muted-foreground mt-1">{m.label}</p>
            </div>
          ))}
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-6">Leads por Etapa do Pipeline</h3>
            {stageData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem dados ainda</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={stageData}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="total" fill="hsl(262 83% 62%)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>

          <div className="bg-card border border-border rounded-2xl p-6">
            <h3 className="font-semibold text-foreground mb-6">Agendamentos por Status</h3>
            {statusData.length === 0 ? (
              <div className="flex items-center justify-center h-40 text-muted-foreground text-sm">Sem dados ainda</div>
            ) : (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={statusData}>
                  <XAxis dataKey="name" tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fill: 'hsl(215 20% 55%)', fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip {...tooltipStyle} />
                  <Bar dataKey="total" fill="#10b981" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
