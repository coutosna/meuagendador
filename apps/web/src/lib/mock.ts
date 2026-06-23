// Mock data para testar o front sem API rodando
export const MOCK_USER = {
  id: 'mock-user-1',
  name: 'João Silva',
  email: 'joao@clinicaexemplo.com',
  role: 'owner',
  tenantId: 'mock-tenant-1',
}

export const MOCK_TENANT = {
  id: 'mock-tenant-1',
  name: 'Clínica Exemplo',
  plan: 'pro',
}

export const MOCK_OVERVIEW = {
  contacts: { total: 142, today: 5 },
  leads: { total: 89, qualified: 34, won: 12, conversionRate: 13 },
  appointments: { today: 8, month: 67 },
  conversations: { total: 156, open: 23 },
}

export const MOCK_FINANCIAL = {
  revenueMonth: 8450.00,
  revenuePrevMonth: 6200.00,
  revenueGrowth: 36,
  avgTicket: 126.12,
  completedCount: 67,
  byService: [
    { name: 'Corte + Barba', count: 28, revenue: 3360, color: '#6366f1' },
    { name: 'Barba', count: 22, revenue: 1980, color: '#8b5cf6' },
    { name: 'Corte', count: 17, revenue: 1700, color: '#ec4899' },
    { name: 'Hidratação', count: 8, revenue: 1200, color: '#f59e0b' },
  ],
  daily: [
    { day: 'Seg', date: '12/06', revenue: 850 },
    { day: 'Ter', date: '13/06', revenue: 1200 },
    { day: 'Qua', date: '14/06', revenue: 650 },
    { day: 'Qui', date: '15/06', revenue: 1400 },
    { day: 'Sex', date: '16/06', revenue: 1800 },
    { day: 'Sáb', date: '17/06', revenue: 2200 },
    { day: 'Dom', date: '18/06', revenue: 350 },
  ],
}

const today = new Date()
const d = (h: number, m = 0) => new Date(today.getFullYear(), today.getMonth(), today.getDate(), h, m).toISOString()

export const MOCK_TODAY_APPOINTMENTS = [
  { id: '1', scheduledAt: d(9, 0),  status: 'confirmed', contact: { name: 'Maria Santos' },  service: { name: 'Corte + Barba', price: 120 } },
  { id: '2', scheduledAt: d(10, 0), status: 'pending',   contact: { name: 'Pedro Alves' },   service: { name: 'Barba', price: 45 } },
  { id: '3', scheduledAt: d(11, 0), status: 'confirmed', contact: { name: 'Lucas Ferreira' }, service: { name: 'Corte', price: 35 } },
  { id: '4', scheduledAt: d(14, 0), status: 'pending',   contact: { name: 'Ana Costa' },     service: { name: 'Hidratação', price: 80 } },
  { id: '5', scheduledAt: d(15, 30),status: 'confirmed', contact: { name: 'Carlos Lima' },   service: { name: 'Corte + Barba', price: 120 } },
]

export const MOCK_SERVICES = [
  { id: '1', name: 'Corte + Barba', duration: 60, price: 120, color: '#6366f1', description: 'Corte completo com acabamento na barba', isActive: true },
  { id: '2', name: 'Barba', duration: 30, price: 45, color: '#8b5cf6', description: 'Modelagem e acabamento da barba', isActive: true },
  { id: '3', name: 'Corte', duration: 30, price: 35, color: '#ec4899', description: 'Corte simples', isActive: true },
  { id: '4', name: 'Hidratação', duration: 45, price: 80, color: '#f59e0b', description: 'Hidratação capilar profunda', isActive: true },
]

export const MOCK_CONVERSATIONS = [
  { id: '1', status: 'open', botEnabled: true, lastMessage: 'Olá, gostaria de agendar um corte', lastMessageAt: new Date(Date.now() - 5 * 60000).toISOString(), contact: { name: 'Maria Santos', phone: '5511999990001' } },
  { id: '2', status: 'open', botEnabled: false, lastMessage: 'Qual o horário disponível amanhã?', lastMessageAt: new Date(Date.now() - 15 * 60000).toISOString(), contact: { name: 'Pedro Alves', phone: '5511999990002' } },
  { id: '3', status: 'pending', botEnabled: false, lastMessage: 'Quero falar com um atendente', lastMessageAt: new Date(Date.now() - 32 * 60000).toISOString(), contact: { name: 'Lucas Ferreira', phone: '5511999990003' } },
  { id: '4', status: 'open', botEnabled: true, lastMessage: 'Quanto custa a hidratação?', lastMessageAt: new Date(Date.now() - 60 * 60000).toISOString(), contact: { name: 'Ana Costa', phone: '5511999990004' } },
]

export const MOCK_MESSAGES: Record<string, any[]> = {
  '1': [
    { id: 'm1', senderType: 'contact', content: 'Olá, gostaria de agendar um corte', createdAt: new Date(Date.now() - 10 * 60000).toISOString() },
    { id: 'm2', senderType: 'bot', content: 'Olá, Maria! 😊 Claro, temos horários disponíveis. Para quando você gostaria de agendar?\n\nTemos disponíveis:\n• Hoje: 14:00, 15:30\n• Amanhã: 09:00, 10:30, 14:00', createdAt: new Date(Date.now() - 9 * 60000).toISOString() },
    { id: 'm3', senderType: 'contact', content: 'Amanhã às 9h seria perfeito!', createdAt: new Date(Date.now() - 5 * 60000).toISOString() },
    { id: 'm4', senderType: 'bot', content: 'Ótimo! Agendamento confirmado para amanhã às 09:00 ✅\n\nServiço: Corte\nHorário: 09:00\n\nTe aguardamos! Qualquer dúvida é só chamar 😊', createdAt: new Date(Date.now() - 4 * 60000).toISOString() },
  ],
  '2': [
    { id: 'm5', senderType: 'contact', content: 'Qual o horário disponível amanhã?', createdAt: new Date(Date.now() - 20 * 60000).toISOString() },
    { id: 'm6', senderType: 'bot', content: 'Olá, Pedro! 👋 Amanhã temos os seguintes horários disponíveis:\n• 09:00 — Corte + Barba (60min)\n• 10:30 — Barba (30min)\n• 14:00 — Corte (30min)\n• 15:30 — Corte + Barba (60min)\n\nQual você prefere?', createdAt: new Date(Date.now() - 15 * 60000).toISOString() },
  ],
  '3': [
    { id: 'm7', senderType: 'contact', content: 'Preciso cancelar meu horário', createdAt: new Date(Date.now() - 40 * 60000).toISOString() },
    { id: 'm8', senderType: 'bot', content: 'Entendi! Vou passar para um atendente que poderá te ajudar com o cancelamento.', createdAt: new Date(Date.now() - 38 * 60000).toISOString() },
    { id: 'm9', senderType: 'contact', content: 'Quero falar com um atendente', createdAt: new Date(Date.now() - 32 * 60000).toISOString() },
  ],
  '4': [
    { id: 'm10', senderType: 'contact', content: 'Quanto custa a hidratação?', createdAt: new Date(Date.now() - 65 * 60000).toISOString() },
    { id: 'm11', senderType: 'bot', content: 'Olá! A hidratação capilar custa R$ 80,00 e dura aproximadamente 45 minutos. 💆‍♀️\n\nGostaria de agendar?', createdAt: new Date(Date.now() - 60 * 60000).toISOString() },
  ],
}

export const MOCK_LEADS = [
  { id: 'l1', title: 'Lead - Maria Santos', value: 120, notes: 'Interessada em corte + barba', contact: { name: 'Maria Santos', phone: '5511999990001' } },
  { id: 'l2', title: 'Lead - Pedro Alves', value: 45, notes: 'Quer agendar barba', contact: { name: 'Pedro Alves', phone: '5511999990002' } },
  { id: 'l3', title: 'Lead - Lucas Ferreira', value: 35, notes: 'Primeiro corte', contact: { name: 'Lucas Ferreira', phone: '5511999990003' } },
]

export const IS_MOCK = true
