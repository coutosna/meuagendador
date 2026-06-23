'use client'
import { useEffect, useState } from 'react'
import { Header } from '@/components/layout/Header'
import { Search, Plus, Phone, Tag, CheckCircle2, Filter } from 'lucide-react'
import api from '@/lib/api'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

export default function ContactsPage() {
  const [contacts, setContacts] = useState<any[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  const [total, setTotal] = useState(0)

  useEffect(() => {
    const t = setTimeout(loadContacts, 300)
    return () => clearTimeout(t)
  }, [search])

  const loadContacts = async () => {
    setLoading(true)
    try {
      const { data } = await api.get(`/contacts?search=${search}&limit=50`)
      setContacts(data.data || [])
      setTotal(data.meta?.total || 0)
    } catch {
      setContacts([])
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-full">
      <Header
        title="Contatos"
        subtitle={`${total} contatos cadastrados`}
        actions={
          <button className="flex items-center gap-2 px-4 py-2 bg-primary hover:bg-primary/90 text-white text-sm font-medium rounded-xl transition-all shadow-lg shadow-primary/25">
            <Plus className="w-4 h-4" />
            Novo Contato
          </button>
        }
      />
      <div className="p-6 space-y-4">
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar por nome ou telefone..."
              className="w-full pl-9 pr-4 py-3 bg-card border border-border rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary/50"
            />
          </div>
          <button className="px-4 py-3 bg-card border border-border rounded-xl text-sm text-muted-foreground hover:text-foreground flex items-center gap-2 transition-all">
            <Filter className="w-4 h-4" />
            Filtros
          </button>
        </div>

        <div className="bg-card border border-border rounded-2xl overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Contato</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Telefone</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Tags</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Status</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Origem</th>
                <th className="text-left px-6 py-4 text-xs font-semibold text-muted-foreground uppercase tracking-wider">Cadastrado</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border">
              {loading ? (
                <tr><td colSpan={6} className="text-center py-12 text-muted-foreground text-sm">Carregando...</td></tr>
              ) : contacts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="text-center py-12">
                    <p className="text-muted-foreground text-sm">Nenhum contato encontrado</p>
                    <p className="text-muted-foreground/60 text-xs mt-1">Os contatos aparecem automaticamente quando chegam mensagens pelo WhatsApp</p>
                  </td>
                </tr>
              ) : contacts.map((c) => (
                <tr key={c.id} className="hover:bg-secondary/30 transition-colors cursor-pointer">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm font-bold flex-shrink-0">
                        {c.name?.charAt(0)?.toUpperCase() || '?'}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-foreground">{c.name || 'Sem nome'}</p>
                        <p className="text-xs text-muted-foreground">{c.email || ''}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-sm text-foreground">
                      <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                      {c.phone}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {(c.tags || []).map((tag: string) => (
                        <span key={tag} className="flex items-center gap-1 px-2 py-0.5 bg-primary/10 text-primary text-xs rounded-full">
                          <Tag className="w-2.5 h-2.5" />
                          {tag}
                        </span>
                      ))}
                      {(!c.tags || c.tags.length === 0) && <span className="text-xs text-muted-foreground">—</span>}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {c.isQualified ? (
                      <span className="flex items-center gap-1 text-xs text-emerald-400 font-medium">
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Qualificado
                      </span>
                    ) : (
                      <span className="text-xs text-muted-foreground">Novo</span>
                    )}
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs px-2 py-1 bg-secondary rounded-lg text-muted-foreground capitalize">
                      {c.source || 'manual'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <span className="text-xs text-muted-foreground">
                      {c.createdAt ? format(new Date(c.createdAt), 'dd/MM/yy', { locale: ptBR }) : '—'}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
