'use client'
import { useEffect, useState, useRef } from 'react'
import {
  Send, Bot, User, Phone, Search, MoreVertical, BotOff,
  CheckCheck, Clock, Sparkles, Circle, ChevronRight, X,
} from 'lucide-react'
import api from '@/lib/api'
import { format, formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { cn } from '@/lib/utils'
import { MOCK_CONVERSATIONS, MOCK_MESSAGES } from '@/lib/mock'

interface Conversation {
  id: string
  status: string
  lastMessage: string
  lastMessageAt: string
  unreadCount: number
  botEnabled: boolean
  contact: { id: string; name: string; phone: string; avatarUrl?: string }
  assignedUser?: any
}

interface Message {
  id: string
  content: string
  senderType: 'contact' | 'user' | 'bot' | 'system'
  type: string
  createdAt: string
  status: string
}

const AVATAR_COLORS = [
  ['#6366f1', '#4f46e5'],
  ['#8b5cf6', '#7c3aed'],
  ['#ec4899', '#db2777'],
  ['#f59e0b', '#d97706'],
  ['#10b981', '#059669'],
  ['#3b82f6', '#2563eb'],
]

function avatarColor(name: string) {
  const idx = name ? name.charCodeAt(0) % AVATAR_COLORS.length : 0
  return AVATAR_COLORS[idx]
}

const STATUS_CONFIG: Record<string, { label: string; color: string; bg: string }> = {
  open:     { label: 'Aberta',    color: '#34d399', bg: 'rgba(52,211,153,0.12)'  },
  pending:  { label: 'Pendente',  color: '#fbbf24', bg: 'rgba(251,191,36,0.12)'  },
  resolved: { label: 'Resolvida', color: '#6b7280', bg: 'rgba(107,114,128,0.12)' },
}

const FILTERS = [
  { val: 'all',      label: 'Todas'     },
  { val: 'open',     label: 'Abertas'   },
  { val: 'pending',  label: 'Pendentes' },
  { val: 'resolved', label: 'Resolvidas'},
]

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected]           = useState<Conversation | null>(null)
  const [messages, setMessages]           = useState<Message[]>([])
  const [messageText, setMessageText]     = useState('')
  const [sending, setSending]             = useState(false)
  const [search, setSearch]               = useState('')
  const [filter, setFilter]               = useState('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    loadConversations()
    const t = setInterval(loadConversations, 5000)
    return () => clearInterval(t)
  }, [])

  useEffect(() => {
    if (!selected) return
    loadMessages(selected.id)
    const t = setInterval(() => loadMessages(selected.id), 3000)
    return () => clearInterval(t)
  }, [selected?.id])

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  const loadConversations = async () => {
    try {
      const { data } = await api.get('/conversations?limit=50')
      setConversations(data.data || [])
    } catch { setConversations(MOCK_CONVERSATIONS as any) }
  }

  const loadMessages = async (id: string) => {
    try {
      const { data } = await api.get(`/conversations/${id}/messages`)
      setMessages(data || [])
    } catch { setMessages(MOCK_MESSAGES[id] || []) }
  }

  const sendMessage = async () => {
    if (!selected || !messageText.trim() || sending) return
    setSending(true)
    try {
      await api.post('/whatsapp/instances/default/send', {
        conversationId: selected.id,
        content: messageText,
      })
      setMessageText('')
      await loadMessages(selected.id)
    } catch {} finally { setSending(false) }
  }

  const toggleBot = async (id: string) => {
    await api.post(`/conversations/${id}/toggle-bot`)
    await loadConversations()
  }

  const filtered = conversations.filter((c) => {
    const matchSearch = !search
      || c.contact.name?.toLowerCase().includes(search.toLowerCase())
      || c.contact.phone.includes(search)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    open:    conversations.filter(c => c.status === 'open').length,
    pending: conversations.filter(c => c.status === 'pending').length,
  }

  return (
    <div className="h-[calc(100vh-3.5rem)] flex overflow-hidden">

      {/* ── Sidebar ──────────────────────────────────────────────── */}
      <div className="w-[320px] flex-shrink-0 flex flex-col border-r border-border" style={{ background: 'hsl(0 0% 5%)' }}>

        {/* Header sidebar */}
        <div className="px-5 pt-5 pb-4 space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-foreground">Conversas</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Inbox do WhatsApp</p>
            </div>
            <div className="flex items-center gap-1.5">
              {counts.pending > 0 && (
                <span className="px-2 py-0.5 rounded-full text-xs font-bold" style={{ background: 'rgba(251,191,36,0.15)', color: '#fbbf24' }}>
                  {counts.pending} pendente{counts.pending > 1 ? 's' : ''}
                </span>
              )}
            </div>
          </div>

          {/* Search */}
          <div className="relative">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar conversa..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm text-foreground placeholder-muted-foreground focus:outline-none focus:ring-1 focus:ring-primary/50 transition-all"
              style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 13%)' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>

          {/* Filters */}
          <div className="flex gap-1">
            {FILTERS.map(({ val, label }) => (
              <button
                key={val}
                onClick={() => setFilter(val)}
                className={cn(
                  'flex-1 py-1.5 text-xs rounded-lg font-semibold transition-all',
                  filter === val
                    ? 'text-white'
                    : 'text-muted-foreground hover:text-foreground',
                )}
                style={filter === val ? { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' } : { background: 'hsl(0 0% 9%)' }}
              >
                {label}
              </button>
            ))}
          </div>
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'hsl(0 0% 9%)' }}>
                <Phone className="w-6 h-6 text-muted-foreground/40" />
              </div>
              <p className="text-sm font-medium text-muted-foreground">Nenhuma conversa</p>
              <p className="text-xs text-muted-foreground/60 mt-1">Tente outro filtro</p>
            </div>
          ) : (
            filtered.map((conv) => {
              const isActive  = selected?.id === conv.id
              const [c1, c2]  = avatarColor(conv.contact.name || '')
              const st        = STATUS_CONFIG[conv.status] || STATUS_CONFIG.open
              const timeAgo   = conv.lastMessageAt
                ? formatDistanceToNow(new Date(conv.lastMessageAt), { addSuffix: true, locale: ptBR })
                : ''

              return (
                <button
                  key={conv.id}
                  onClick={() => setSelected(conv)}
                  className={cn(
                    'w-full px-4 py-3.5 flex items-start gap-3 text-left transition-all relative',
                    isActive ? '' : 'hover:bg-white/[0.03]',
                  )}
                  style={isActive ? { background: 'linear-gradient(90deg, rgba(99,102,241,0.15) 0%, rgba(99,102,241,0.04) 100%)', borderRight: '2px solid #6366f1' } : {}}
                >
                  {/* Avatar */}
                  <div className="relative flex-shrink-0 mt-0.5">
                    <div
                      className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}
                    >
                      {conv.contact.name?.charAt(0)?.toUpperCase() || '?'}
                    </div>
                    <span
                      className="absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2"
                      style={{ backgroundColor: st.color, borderColor: 'hsl(0 0% 5%)' }}
                    />
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between mb-0.5">
                      <p className="text-sm font-semibold text-foreground truncate">{conv.contact.name || conv.contact.phone}</p>
                      <span className="text-[10px] text-muted-foreground/60 flex-shrink-0 ml-2">
                        {conv.lastMessageAt ? format(new Date(conv.lastMessageAt), 'HH:mm') : ''}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground truncate">{conv.lastMessage || 'Sem mensagens'}</p>
                    <div className="flex items-center gap-1.5 mt-1.5">
                      <span className="text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                      {conv.botEnabled && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold px-1.5 py-0.5 rounded-full" style={{ color: '#818cf8', background: 'rgba(129,140,248,0.12)' }}>
                          <Sparkles className="w-2.5 h-2.5" /> IA
                        </span>
                      )}
                      {conv.unreadCount > 0 && (
                        <span className="ml-auto bg-primary text-white text-[10px] font-bold rounded-full min-w-[18px] h-[18px] flex items-center justify-center px-1">
                          {conv.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              )
            })
          )}
        </div>
      </div>

      {/* ── Chat Area ────────────────────────────────────────────── */}
      {selected ? (
        <div className="flex-1 flex flex-col" style={{ background: 'hsl(0 0% 4%)' }}>

          {/* Chat Header */}
          <div className="px-6 py-4 border-b border-border flex items-center gap-4" style={{ background: 'hsl(0 0% 6%)' }}>
            {(() => {
              const [c1, c2] = avatarColor(selected.contact.name || '')
              const st = STATUS_CONFIG[selected.status] || STATUS_CONFIG.open
              return (
                <>
                  <div className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold flex-shrink-0"
                    style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                    {selected.contact.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-semibold text-foreground">{selected.contact.name || selected.contact.phone}</p>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground">{selected.contact.phone}</p>
                  </div>
                </>
              )
            })()}

            <div className="flex items-center gap-2">
              <button
                onClick={() => toggleBot(selected.id)}
                className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-semibold transition-all"
                style={selected.botEnabled
                  ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
                  : { background: 'hsl(0 0% 9%)', color: 'hsl(0 0% 48%)', border: '1px solid hsl(0 0% 13%)' }
                }
              >
                {selected.botEnabled ? <Sparkles className="w-3.5 h-3.5" /> : <BotOff className="w-3.5 h-3.5" />}
                {selected.botEnabled ? 'IA Ativa' : 'IA Pausada'}
              </button>
              <button className="w-9 h-9 rounded-xl flex items-center justify-center text-muted-foreground hover:text-foreground transition-all" style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 13%)' }}>
                <MoreVertical className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-5">
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-center">
                <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ background: 'hsl(0 0% 9%)' }}>
                  <BubbleIcon className="w-8 h-8 text-muted-foreground/30" />
                </div>
                <p className="text-muted-foreground text-sm">Sem mensagens nesta conversa</p>
              </div>
            ) : messages.map((msg) => {
              const isContact = msg.senderType === 'contact'
              const isBot     = msg.senderType === 'bot'
              const [c1, c2]  = avatarColor(selected.contact.name || '')

              return (
                <div key={msg.id} className={cn('flex gap-3', isContact ? 'justify-start' : 'justify-end')}>
                  {isContact && (
                    <div className="w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-1 text-white text-xs font-bold"
                      style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
                      {selected.contact.name?.charAt(0)?.toUpperCase()}
                    </div>
                  )}

                  <div className="max-w-sm lg:max-w-md">
                    <div
                      className="px-4 py-3 rounded-2xl text-sm leading-relaxed whitespace-pre-wrap"
                      style={
                        isContact
                          ? { background: 'hsl(0 0% 10%)', color: 'hsl(0 0% 90%)', borderRadius: '4px 18px 18px 18px', border: '1px solid hsl(0 0% 14%)' }
                          : isBot
                          ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.18),rgba(139,92,246,0.18))', color: 'hsl(0 0% 90%)', borderRadius: '18px 4px 18px 18px', border: '1px solid rgba(99,102,241,0.25)' }
                          : { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', borderRadius: '18px 4px 18px 18px' }
                      }
                    >
                      {msg.content}
                    </div>
                    <div className={cn('flex items-center gap-1.5 mt-1', isContact ? '' : 'justify-end')}>
                      {isBot && (
                        <span className="flex items-center gap-0.5 text-[10px] font-semibold" style={{ color: '#818cf8' }}>
                          <Sparkles className="w-2.5 h-2.5" /> IA
                        </span>
                      )}
                      <span className="text-[10px] text-muted-foreground/50">
                        {msg.createdAt ? format(new Date(msg.createdAt), 'HH:mm') : ''}
                      </span>
                      {!isContact && <CheckCheck className="w-3 h-3" style={{ color: '#818cf8' }} />}
                    </div>
                  </div>
                </div>
              )
            })}
            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div className="p-4 border-t border-border" style={{ background: 'hsl(0 0% 6%)' }}>
            <div
              className="flex items-center gap-3 px-4 py-2.5 rounded-2xl focus-within:ring-1 focus-within:ring-primary/50 transition-all"
              style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 14%)' }}
            >
              <input
                value={messageText}
                onChange={(e) => setMessageText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                placeholder="Digite uma mensagem..."
                className="flex-1 bg-transparent text-foreground placeholder-muted-foreground/50 text-sm focus:outline-none"
              />
              <button
                onClick={sendMessage}
                disabled={!messageText.trim() || sending}
                className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all flex-shrink-0 disabled:opacity-30"
                style={{ background: messageText.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'hsl(0 0% 13%)' }}
              >
                {sending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
              </button>
            </div>
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center" style={{ background: 'hsl(0 0% 4%)' }}>
          <div className="text-center">
            <div
              className="w-20 h-20 rounded-3xl flex items-center justify-center mx-auto mb-5"
              style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.15),rgba(139,92,246,0.1))', border: '1px solid rgba(99,102,241,0.2)' }}
            >
              <BubbleIcon className="w-9 h-9" style={{ color: '#6366f1' }} />
            </div>
            <p className="text-base font-semibold text-foreground mb-1">Nenhuma conversa selecionada</p>
            <p className="text-sm text-muted-foreground">Escolha uma conversa na lista ao lado</p>
            <div className="flex items-center justify-center gap-1.5 mt-4 text-xs text-muted-foreground/50">
              <ChevronRight className="w-3.5 h-3.5 -ml-1" />
              Selecione para começar
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function BubbleIcon({ className, style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <svg className={className} style={style} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
    </svg>
  )
}
