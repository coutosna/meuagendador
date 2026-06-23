import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios from 'axios'

export type N8nEventName =
  | 'message.received'
  | 'lead.qualified'
  | 'appointment.created'
  | 'appointment.confirmed'
  | 'appointment.reminder'
  | 'appointment.cancelled'
  | 'conversation.handoff'

@Injectable()
export class N8nWebhookService {
  private readonly logger = new Logger(N8nWebhookService.name)
  private readonly webhookUrl: string | undefined
  private readonly secret: string | undefined

  constructor(private readonly config: ConfigService) {
    this.webhookUrl = this.config.get<string>('N8N_WEBHOOK_URL')
    this.secret = this.config.get<string>('N8N_WEBHOOK_SECRET')
  }

  async emit(tenantId: string, event: N8nEventName, data: Record<string, unknown>) {
    if (!this.webhookUrl) return

    const payload = {
      event,
      tenantId,
      timestamp: new Date().toISOString(),
      data,
    }

    try {
      await axios.post(this.webhookUrl, payload, {
        headers: {
          'Content-Type': 'application/json',
          ...(this.secret ? { 'x-webhook-secret': this.secret } : {}),
        },
        timeout: 5000,
      })
    } catch (error) {
      // Non-critical — log and continue
      this.logger.warn(`Falha ao enviar evento ${event} para n8n: ${(error as Error).message}`)
    }
  }
}
