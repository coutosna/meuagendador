import { Injectable, Logger } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import OpenAI from 'openai'
import Anthropic from '@anthropic-ai/sdk'
import { ConfigService } from '@nestjs/config'
import { AiConfig, AiProvider } from './entities/ai-config.entity'
import { Message } from '../messages/entities/message.entity'
import { Service, AvailabilitySlot, Appointment } from '../agenda/entities/appointment.entity'
import { format, addDays, startOfDay, endOfDay, addMinutes, isBefore } from 'date-fns'

export interface AiResponse {
  content: string
  action?: 'qualify' | 'schedule' | 'handoff' | 'none'
  qualificationData?: Record<string, any>
  scheduleSuggestion?: { date?: string; time?: string; service?: string }
}

@Injectable()
export class AiService {
  private readonly logger = new Logger('AiService')
  private readonly openai: OpenAI
  private readonly anthropic: Anthropic

  constructor(
    private readonly config: ConfigService,
    @InjectRepository(AiConfig) private readonly aiConfigRepo: Repository<AiConfig>,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    @InjectRepository(Service) private readonly serviceRepo: Repository<Service>,
    @InjectRepository(AvailabilitySlot) private readonly slotRepo: Repository<AvailabilitySlot>,
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
  ) {
    const openaiKey = config.get('OPENAI_API_KEY')
    const anthropicKey = config.get('ANTHROPIC_API_KEY')
    if (openaiKey) this.openai = new OpenAI({ apiKey: openaiKey })
    if (anthropicKey) this.anthropic = new Anthropic({ apiKey: anthropicKey })
  }

  async getConfig(tenantId: string): Promise<AiConfig | null> {
    return this.aiConfigRepo.findOne({ where: { tenantId, isActive: true } })
  }

  async upsertConfig(tenantId: string, dto: Partial<AiConfig>): Promise<AiConfig> {
    let config = await this.aiConfigRepo.findOne({ where: { tenantId } })
    if (config) {
      Object.assign(config, dto)
    } else {
      config = this.aiConfigRepo.create({ ...dto, tenantId })
    }
    return this.aiConfigRepo.save(config)
  }

  async processMessage(
    tenantId: string,
    conversationId: string,
    userMessage: string,
  ): Promise<AiResponse> {
    const config = await this.getConfig(tenantId)
    if (!config) return { content: '', action: 'none' }

    if (!this.isWithinBusinessHours(config.businessHours)) {
      return { content: this.buildOutOfHoursMessage(config), action: 'none' }
    }

    const [history, availableSlots, services] = await Promise.all([
      this.getConversationHistory(conversationId, 20),
      this.getUpcomingSlots(tenantId, 3),
      this.serviceRepo.find({ where: { tenantId, isActive: true } }),
    ])

    const systemPrompt = this.buildSystemPrompt(config, services, availableSlots)

    try {
      if (config.provider === AiProvider.ANTHROPIC) {
        return await this.callAnthropic(config, systemPrompt, history, userMessage)
      }
      return await this.callOpenAI(config, systemPrompt, history, userMessage)
    } catch (error) {
      this.logger.error('Erro ao chamar IA:', error)
      return { content: 'Olá! Estou tendo dificuldades técnicas. Um atendente irá te ajudar em breve.', action: 'handoff' }
    }
  }

  private async callOpenAI(config: AiConfig, systemPrompt: string, history: any[], userMessage: string): Promise<AiResponse> {
    const messages = [
      { role: 'system' as const, content: systemPrompt },
      ...history,
      { role: 'user' as const, content: userMessage },
    ]

    const response = await this.openai.chat.completions.create({
      model: config.model || 'gpt-4o-mini',
      messages,
      temperature: Number(config.temperature) || 0.7,
      max_tokens: config.maxTokens || 1000,
      response_format: { type: 'json_object' },
    })

    return this.parseAiResponse(response.choices[0].message.content || '{}')
  }

  private async callAnthropic(config: AiConfig, systemPrompt: string, history: any[], userMessage: string): Promise<AiResponse> {
    const response = await this.anthropic.messages.create({
      model: config.model || 'claude-haiku-4-5-20251001',
      max_tokens: config.maxTokens || 1000,
      system: systemPrompt,
      messages: [...history, { role: 'user', content: userMessage }],
    })

    const raw = response.content[0].type === 'text' ? response.content[0].text : '{}'
    return this.parseAiResponse(raw)
  }

  private buildSystemPrompt(config: AiConfig, services: Service[], availableSlots: { date: string; slots: string[] }[]): string {
    const company = config.companyInfo || {}

    const servicesBlock = services.length > 0
      ? services.map((s) => `  • ${s.name} — ${s.duration}min${s.price ? ` — R$ ${Number(s.price).toFixed(2)}` : ''}`).join('\n')
      : (company.services?.join(', ') || 'Não informado')

    const slotsBlock = availableSlots.length > 0
      ? availableSlots.map((d) =>
          `  ${d.date}: ${d.slots.length > 0 ? d.slots.join(', ') : 'Sem horários disponíveis'}`
        ).join('\n')
      : '  Consulte disponibilidade diretamente.'

    return `Você é um assistente de atendimento virtual da empresa "${company.name || 'nossa empresa'}".

${config.personality ? `Personalidade: ${config.personality}` : ''}

SERVIÇOS DISPONÍVEIS:
${servicesBlock}

PRÓXIMOS HORÁRIOS DISPONÍVEIS NA AGENDA:
${slotsBlock}

${company.address ? `ENDEREÇO: ${company.address}` : ''}
${company.extra ? `INFORMAÇÕES ADICIONAIS: ${company.extra}` : ''}

${config.systemPrompt || ''}

INSTRUÇÕES IMPORTANTES:
1. Responda SEMPRE em JSON: {"content": "sua resposta", "action": "none|qualify|schedule|handoff", "qualificationData": {}, "scheduleSuggestion": {"date": "YYYY-MM-DD", "time": "HH:mm", "service": "nome do serviço"}}
2. Use "qualify" quando coletar dados suficientes do lead (nome, interesse, contato)
3. Use "schedule" quando o cliente confirmar data e horário — use EXATAMENTE os horários da agenda acima
4. Use "handoff" quando não conseguir resolver ou cliente pedir atendente humano
5. Use "none" para respostas normais
6. NUNCA sugira horários que não estejam na lista acima
7. Se cliente perguntar sobre horários, mostre os disponíveis da lista
8. Seja simpático, profissional e objetivo`
  }

  private async getUpcomingSlots(tenantId: string, daysAhead: number): Promise<{ date: string; slots: string[] }[]> {
    const result: { date: string; slots: string[] }[] = []
    const today = new Date()

    for (let i = 0; i < daysAhead; i++) {
      const targetDate = addDays(today, i)
      const dateStr = format(targetDate, 'yyyy-MM-dd')
      const dayOfWeek = targetDate.getDay()

      const [availSlots, existing] = await Promise.all([
        this.slotRepo.find({ where: { tenantId, dayOfWeek, isActive: true } }),
        this.appointmentRepo.find({
          where: { tenantId, scheduledAt: Between(startOfDay(targetDate), endOfDay(targetDate)) },
        }),
      ])

      const slots: string[] = []
      for (const slot of availSlots) {
        let current = new Date(`${dateStr}T${slot.startTime}`)
        const end = new Date(`${dateStr}T${slot.endTime}`)
        while (isBefore(addMinutes(current, 30), end)) {
          const slotTime = format(current, 'HH:mm')
          const occupied = existing.some((a) => format(a.scheduledAt, 'HH:mm') === slotTime)
          if (!occupied) slots.push(slotTime)
          current = addMinutes(current, 30)
        }
      }

      const label = i === 0 ? `Hoje (${dateStr})` : i === 1 ? `Amanhã (${dateStr})` : dateStr
      result.push({ date: label, slots: slots.slice(0, 6) }) // max 6 slots per day in prompt
    }

    return result
  }

  private parseAiResponse(raw: string): AiResponse {
    try {
      const parsed = JSON.parse(raw)
      return {
        content: parsed.content || raw,
        action: parsed.action || 'none',
        qualificationData: parsed.qualificationData,
        scheduleSuggestion: parsed.scheduleSuggestion,
      }
    } catch {
      return { content: raw, action: 'none' }
    }
  }

  private async getConversationHistory(conversationId: string, limit: number) {
    const messages = await this.messageRepo.find({
      where: { conversationId },
      order: { createdAt: 'DESC' },
      take: limit,
    })

    return messages.reverse().map((m) => ({
      role: m.senderType === 'contact' ? 'user' : 'assistant',
      content: m.content || '',
    }))
  }

  private isWithinBusinessHours(hours: any): boolean {
    if (!hours) return true
    const now = new Date()
    const days = ['sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday']
    const todayConfig = hours[days[now.getDay()]]
    if (!todayConfig?.enabled) return false
    const currentTime = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`
    return currentTime >= todayConfig.open && currentTime <= todayConfig.close
  }

  private buildOutOfHoursMessage(config: AiConfig): string {
    return `Olá! Nosso atendimento está fora do horário. Por favor, entre em contato durante nosso horário comercial. Sua mensagem foi registrada e retornaremos em breve! 😊`
  }

  async testPrompt(tenantId: string, message: string): Promise<AiResponse> {
    return this.processMessage(tenantId, 'test', message)
  }
}
