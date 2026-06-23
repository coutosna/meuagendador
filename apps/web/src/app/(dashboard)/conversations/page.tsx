'use client'
import { useEffect, useState, useRef } from 'react'
import {
  Send, Search, MoreVertical, BotOff, CheckCheck, Clock,
  Sparkles, X, Phone, MessageCircle, Zap, UserCheck,
  Archive, Filter, ChevronDown, Paperclip, Smile,
} from 'lucide-react'
import api from '@/lib/api'
import { format, formatDistanceToNow, isToday, isYesterday } from 'date-fns'
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
  ['#6366f1','#4f46e5'], ['#8b5cf6','#7c3aed'], ['#ec4899','#db2777'],
  ['#f59e0b','#d97706'], ['#10b981','#059669'], ['#3b82f6','#2563eb'],
  ['#14b8a6','#0d9488'], ['#f97316','#ea580c'],
]
const avatarColor = (name: string) => AVATAR_COLORS[(name?.charCodeAt(0) || 0) % AVATAR_COLORS.length]

const STATUS: Record<string, { label: string; color: string; bg: string; dot: string }> = {
  open:     { label: 'Aberta',    color: '#34d399', bg: 'rgba(52,211,153,0.15)',  dot: '#34d399' },
  pending:  { label: 'Pendente',  color: '#fbbf24', bg: 'rgba(251,191,36,0.15)',  dot: '#fbbf24' },
  resolved: { label: 'Resolvida', color: '#94a3b8', bg: 'rgba(148,163,184,0.12)', dot: '#94a3b8' },
}

const FILTERS = [
  { val: 'all',      label: 'Todas',     icon: MessageCircle },
  { val: 'open',     label: 'Abertas',   icon: Zap           },
  { val: 'pending',  label: 'Pendentes', icon: Clock         },
  { val: 'resolved', label: 'Resolvidas',icon: UserCheck     },
]

function formatTime(dateStr: string) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  if (isToday(d)) return format(d, 'HH:mm')
  if (isYesterday(d)) return 'Ontem'
  return format(d, 'dd/MM')
}

export default function ConversationsPage() {
  const [conversations, setConversations] = useState<Conversation[]>([])
  const [selected, setSelected]           = useState<Conversation | null>(null)
  const [messages, setMessages]           = useState<Message[]>([])
  const [messageText, setMessageText]     = useState('')
  const [sending, setSending]             = useState(false)
  const [search, setSearch]               = useState('')
  const [filter, setFilter]               = useState('all')
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const inputRef       = useRef<HTMLTextAreaElement>(null)

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
    try { const { data } = await api.get('/conversations?limit=50'); setConversations(data.data || []) }
    catch { setConversations(MOCK_CONVERSATIONS as any) }
  }

  const loadMessages = async (id: string) => {
    try { const { data } = await api.get(`/conversations/${id}/messages`); setMessages(data || []) }
    catch { setMessages(MOCK_MESSAGES[id] || []) }
  }

  const sendMessage = async () => {
    if (!selected || !messageText.trim() || sending) return
    setSending(true)
    try {
      await api.post('/whatsapp/instances/default/send', { conversationId: selected.id, content: messageText })
      setMessageText('')
      await loadMessages(selected.id)
    } catch {} finally { setSending(false) }
  }

  const toggleBot = async (id: string) => {
    await api.post(`/conversations/${id}/toggle-bot`)
    await loadConversations()
  }

  const filtered = conversations.filter(c => {
    const matchSearch = !search || c.contact.name?.toLowerCase().includes(search.toLowerCase()) || c.contact.phone.includes(search)
    const matchFilter = filter === 'all' || c.status === filter
    return matchSearch && matchFilter
  })

  const counts = {
    all:      conversations.length,
    open:     conversations.filter(c => c.status === 'open').length,
    pending:  conversations.filter(c => c.status === 'pending').length,
    resolved: conversations.filter(c => c.status === 'resolved').length,
  }

  return (
    <div className="flex h-[calc(100vh-3.5rem)] overflow-hidden" style={{ background: 'hsl(0 0% 4%)' }}>

      {/* ═══════════════ SIDEBAR ═══════════════ */}
      <div className="w-[340px] flex-shrink-0 flex flex-col border-r border-white/[0.06]" style={{ background: 'hsl(0 0% 5%)' }}>

        {/* Header */}
        <div className="px-5 pt-5 pb-3">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h1 className="text-base font-bold text-white">Conversas</h1>
              <p className="text-xs mt-0.5" style={{ color: 'hsl(0 0% 40%)' }}>
                {counts.open} abertas · {counts.pending} pendentes
              </p>
            </div>
            <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 14%)' }}>
              <Filter className="w-3.5 h-3.5" style={{ color: 'hsl(0 0% 45%)' }} />
            </button>
          </div>

          {/* Search */}
          <div className="relative mb-3">
            <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2" style={{ color: 'hsl(0 0% 35%)' }} />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar conversa ou número..."
              className="w-full pl-9 pr-9 py-2.5 text-sm rounded-xl focus:outline-none transition-all"
              style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 13%)', color: 'hsl(0 0% 85%)', caretColor: '#6366f1' }}
            />
            {search && (
              <button onClick={() => setSearch('')} className="absolute right-3 top-1/2 -translate-y-1/2">
                <X className="w-3.5 h-3.5" style={{ color: 'hsl(0 0% 40%)' }} />
              </button>
            )}
          </div>

          {/* Filter tabs */}
          <div className="flex gap-1">
            {FILTERS.map(({ val, label }) => {
              const count = counts[val as keyof typeof counts]
              const active = filter === val
              return (
                <button key={val} onClick={() => setFilter(val)}
                  className="flex-1 flex flex-col items-center py-2 rounded-xl text-xs font-semibold transition-all relative"
                  style={active
                    ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.25),rgba(139,92,246,0.15))', color: '#818cf8', border: '1px solid rgba(99,102,241,0.3)' }
                    : { background: 'hsl(0 0% 8%)', color: 'hsl(0 0% 38%)', border: '1px solid transparent' }
                  }>
                  <span>{label}</span>
                  {count > 0 && (
                    <span className="text-[10px] font-bold mt-0.5" style={{ color: active ? '#a5b4fc' : 'hsl(0 0% 30%)' }}>
                      {count}
                    </span>
                  )}
                </button>
              )
            })}
          </div>
        </div>

        {/* Conversation list */}
        <div className="flex-1 overflow-y-auto">
          {filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full p-8 text-center">
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center mb-3" style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 13%)' }}>
                <MessageCircle className="w-6 h-6" style={{ color: 'hsl(0 0% 25%)' }} />
              </div>
              <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 45%)' }}>Nenhuma conversa</p>
            </div>
          ) : filtered.map(conv => {
            const active   = selected?.id === conv.id
            const [c1, c2] = avatarColor(conv.contact.name || '')
            const st       = STATUS[conv.status] || STATUS.open

            return (
              <button key={conv.id} onClick={() => setSelected(conv)}
                className="w-full px-4 py-3.5 flex items-start gap-3 text-left transition-all relative group"
                style={active
                  ? { background: 'linear-gradient(90deg, rgba(99,102,241,0.12) 0%, rgba(99,102,241,0.03) 100%)', borderRight: '2px solid #6366f1' }
                  : {}
                }
                onMouseEnter={e => { if (!active) e.currentTarget.style.background = 'rgba(255,255,255,0.025)' }}
                onMouseLeave={e => { if (!active) e.currentTarget.style.background = '' }}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className="w-11 h-11 rounded-full flex items-center justify-center text-white text-sm font-bold shadow-lg"
                    style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                    {conv.contact.name?.charAt(0)?.toUpperCase() || '?'}
                  </div>
                  <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 rounded-full border-2 flex-shrink-0"
                    style={{ backgroundColor: st.dot, borderColor: 'hsl(0 0% 5%)' }} />
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-baseline justify-between mb-1">
                    <p className="text-sm font-semibold truncate" style={{ color: active ? 'white' : 'hsl(0 0% 88%)' }}>
                      {conv.contact.name || conv.contact.phone}
                    </p>
                    <span className="text-[10px] flex-shrink-0 ml-2 font-medium" style={{ color: 'hsl(0 0% 32%)' }}>
                      {formatTime(conv.lastMessageAt)}
                    </span>
                  </div>
                  <p className="text-xs truncate mb-2" style={{ color: 'hsl(0 0% 38%)' }}>
                    {conv.lastMessage || 'Sem mensagens'}
                  </p>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>
                      {st.label}
                    </span>
                    {conv.botEnabled && (
                      <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: '#a78bfa', background: 'rgba(167,139,250,0.12)' }}>
                        <Sparkles className="w-2.5 h-2.5" />IA
                      </span>
                    )}
                    {conv.unreadCount > 0 && (
                      <span className="ml-auto min-w-[18px] h-[18px] rounded-full flex items-center justify-center text-[10px] font-black text-white px-1"
                        style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                        {conv.unreadCount}
                      </span>
                    )}
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      </div>

      {/* ═══════════════ CHAT AREA ═══════════════ */}
      {selected ? (() => {
        const [c1, c2] = avatarColor(selected.contact.name || '')
        const st = STATUS[selected.status] || STATUS.open
        return (
          <div className="flex-1 flex flex-col min-w-0">

            {/* Chat header */}
            <div className="px-6 py-3.5 border-b border-white/[0.06] flex items-center gap-4 flex-shrink-0" style={{ background: 'hsl(0 0% 6%)' }}>
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-white text-sm font-bold flex-shrink-0"
                style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                {selected.contact.name?.charAt(0)?.toUpperCase()}
              </div>
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <p className="font-semibold text-white text-sm">{selected.contact.name}</p>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: st.color, background: st.bg }}>
                    {st.label}
                  </span>
                </div>
                <p className="text-xs" style={{ color: 'hsl(0 0% 38%)' }}>{selected.contact.phone}</p>
              </div>

              <div className="flex items-center gap-2">
                <button onClick={() => toggleBot(selected.id)}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all"
                  style={selected.botEnabled
                    ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.2))', color: '#a5b4fc', border: '1px solid rgba(99,102,241,0.35)' }
                    : { background: 'hsl(0 0% 9%)', color: 'hsl(0 0% 40%)', border: '1px solid hsl(0 0% 14%)' }
                  }>
                  {selected.botEnabled ? <Sparkles className="w-3.5 h-3.5" /> : <BotOff className="w-3.5 h-3.5" />}
                  {selected.botEnabled ? 'IA Ativa' : 'IA Pausada'}
                </button>
                <button className="w-8 h-8 rounded-lg flex items-center justify-center transition-all" style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 14%)' }}>
                  <MoreVertical className="w-4 h-4" style={{ color: 'hsl(0 0% 40%)' }} />
                </button>
              </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-6 py-5 space-y-4" style={{ background: 'hsl(0 0% 4%)' }}>

              {/* Date separator */}
              <div className="flex items-center gap-3 my-2">
                <div className="flex-1 h-px" style={{ background: 'hsl(0 0% 10%)' }} />
                <span className="text-[10px] font-semibold px-3 py-1 rounded-full" style={{ color: 'hsl(0 0% 35%)', background: 'hsl(0 0% 8%)' }}>
                  Hoje
                </span>
                <div className="flex-1 h-px" style={{ background: 'hsl(0 0% 10%)' }} />
              </div>

              {messages.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-full text-center py-20">
                  <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4"
                    style={{ background: 'rgba(99,102,241,0.08)', border: '1px solid rgba(99,102,241,0.15)' }}>
                    <MessageCircle className="w-7 h-7" style={{ color: '#6366f1' }} />
                  </div>
                  <p className="text-sm font-medium" style={{ color: 'hsl(0 0% 40%)' }}>Sem mensagens ainda</p>
                </div>
              ) : messages.map((msg, idx) => {
                const isContact = msg.senderType === 'contact'
                const isBot     = msg.senderType === 'bot'
                const prevMsg   = messages[idx - 1]
                const showAvatar = !prevMsg || prevMsg.senderType !== msg.senderType

                return (
                  <div key={msg.id} className={cn('flex gap-2.5', isContact ? 'justify-start' : 'justify-end')}>
                    {isContact && (
                      <div className="flex-shrink-0 self-end">
                        {showAvatar ? (
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-white text-xs font-bold"
                            style={{ background: `linear-gradient(135deg,${c1},${c2})` }}>
                            {selected.contact.name?.charAt(0)?.toUpperCase()}
                          </div>
                        ) : <div className="w-7" />}
                      </div>
                    )}

                    <div className="max-w-[68%] group">
                      <div className="px-4 py-2.5 text-sm leading-relaxed whitespace-pre-wrap break-words"
                        style={
                          isContact
                            ? { background: 'hsl(0 0% 10%)', color: 'hsl(0 0% 88%)', borderRadius: '4px 18px 18px 18px', border: '1px solid hsl(0 0% 14%)' }
                            : isBot
                            ? { background: 'linear-gradient(135deg,rgba(99,102,241,0.2),rgba(139,92,246,0.15))', color: 'hsl(0 0% 90%)', borderRadius: '18px 4px 18px 18px', border: '1px solid rgba(99,102,241,0.3)' }
                            : { background: 'linear-gradient(135deg,#6366f1,#8b5cf6)', color: 'white', borderRadius: '18px 4px 18px 18px', boxShadow: '0 4px 16px rgba(99,102,241,0.3)' }
                        }>
                        {msg.content}
                      </div>
                      <div className={cn('flex items-center gap-1.5 mt-1 px-1 opacity-0 group-hover:opacity-100 transition-opacity', isContact ? '' : 'justify-end')}>
                        {isBot && (
                          <span className="flex items-center gap-1 text-[10px] font-semibold" style={{ color: '#a78bfa' }}>
                            <Sparkles className="w-2.5 h-2.5" />IA
                          </span>
                        )}
                        <span className="text-[10px]" style={{ color: 'hsl(0 0% 32%)' }}>
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
            <div className="px-5 py-4 border-t border-white/[0.06] flex-shrink-0" style={{ background: 'hsl(0 0% 6%)' }}>
              <div className="flex items-end gap-3 rounded-2xl px-4 py-3 transition-all"
                style={{ background: 'hsl(0 0% 9%)', border: '1px solid hsl(0 0% 14%)' }}>
                <textarea
                  ref={inputRef}
                  value={messageText}
                  onChange={e => { setMessageText(e.target.value); e.target.style.height = 'auto'; e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px' }}
                  onKeyDown={e => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), sendMessage())}
                  placeholder="Digite uma mensagem... (Enter para enviar)"
                  rows={1}
                  className="flex-1 bg-transparent text-sm focus:outline-none resize-none leading-relaxed"
                  style={{ color: 'hsl(0 0% 88%)', maxHeight: '120px', caretColor: '#6366f1' }}
                />
                <div className="flex items-center gap-2 flex-shrink-0 pb-0.5">
                  <button className="w-7 h-7 flex items-center justify-center rounded-lg transition-all"
                    style={{ color: 'hsl(0 0% 35%)' }}>
                    <Smile className="w-4 h-4" />
                  </button>
                  <button
                    onClick={sendMessage}
                    disabled={!messageText.trim() || sending}
                    className="w-9 h-9 rounded-xl flex items-center justify-center text-white transition-all flex-shrink-0 disabled:opacity-30"
                    style={{ background: messageText.trim() ? 'linear-gradient(135deg,#6366f1,#8b5cf6)' : 'hsl(0 0% 14%)', boxShadow: messageText.trim() ? '0 4px 12px rgba(99,102,241,0.4)' : 'none' }}>
                    {sending ? <Clock className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  </button>
                </div>
              </div>
              <p className="text-[10px] mt-1.5 text-center" style={{ color: 'hsl(0 0% 25%)' }}>
                Enter para enviar · Shift+Enter para nova linha
              </p>
            </div>
          </div>
        )
      })() : (
        /* Empty state */
        <div className="flex-1 flex items-center justify-center" style={{ background: 'hsl(0 0% 4%)' }}>
          <div className="text-center max-w-xs">
            <div className="w-24 h-24 rounded-3xl flex items-center justify-center mx-auto mb-6 relative"
              style={{ background: 'linear-gradient(135deg,rgba(99,102,241,0.12),rgba(139,92,246,0.08))', border: '1px solid rgba(99,102,241,0.2)' }}>
              <MessageCircle className="w-10 h-10" style={{ color: '#6366f1' }} />
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full flex items-center justify-center"
                style={{ background: 'linear-gradient(135deg,#6366f1,#8b5cf6)' }}>
                <Sparkles className="w-3 h-3 text-white" />
              </div>
            </div>
            <h3 className="text-base font-bold text-white mb-2">Inbox do WhatsApp</h3>
            <p className="text-sm leading-relaxed" style={{ color: 'hsl(0 0% 40%)' }}>
              Selecione uma conversa para começar a atender ou aguarde novas mensagens chegarem.
            </p>
            <div className="mt-6 flex items-center justify-center gap-4 text-xs" style={{ color: 'hsl(0 0% 28%)' }}>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-emerald-400" />
                {counts.open} abertas
              </div>
              <div className="flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-amber-400" />
                {counts.pending} pendentes
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
