import { Injectable, Logger } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import axios, { AxiosInstance } from 'axios'

@Injectable()
export class EvolutionApiService {
  private readonly logger = new Logger('EvolutionAPI')
  private readonly client: AxiosInstance

  constructor(private readonly config: ConfigService) {
    this.client = axios.create({
      baseURL: config.get('EVOLUTION_API_URL'),
      headers: {
        apikey: config.get('EVOLUTION_API_KEY'),
        'Content-Type': 'application/json',
      },
      timeout: 30000,
    })
  }

  async createInstance(instanceName: string, webhookUrl: string) {
    const { data } = await this.client.post('/instance/create', {
      instanceName,
      qrcode: true,
      webhook: webhookUrl,
      webhookByEvents: true,
      events: [
        'MESSAGES_UPSERT',
        'MESSAGES_UPDATE',
        'CONNECTION_UPDATE',
        'QRCODE_UPDATED',
      ],
    })
    return data
  }

  async getInstanceInfo(instanceName: string) {
    const { data } = await this.client.get(`/instance/fetchInstances?instanceName=${instanceName}`)
    return data
  }

  async getQrCode(instanceName: string) {
    const { data } = await this.client.get(`/instance/connect/${instanceName}`)
    return data
  }

  async deleteInstance(instanceName: string) {
    const { data } = await this.client.delete(`/instance/delete/${instanceName}`)
    return data
  }

  async sendTextMessage(instanceName: string, phone: string, message: string) {
    const { data } = await this.client.post(`/message/sendText/${instanceName}`, {
      number: phone,
      options: { delay: 1000, presence: 'composing' },
      textMessage: { text: message },
    })
    return data
  }

  async sendMediaMessage(instanceName: string, phone: string, mediaUrl: string, caption?: string, mediatype = 'image') {
    const { data } = await this.client.post(`/message/sendMedia/${instanceName}`, {
      number: phone,
      options: { delay: 1000 },
      mediaMessage: { mediatype, media: mediaUrl, caption },
    })
    return data
  }

  async sendTyping(instanceName: string, phone: string, duration = 3000) {
    try {
      await this.client.post(`/message/sendPresence/${instanceName}`, {
        number: phone,
        options: { presence: 'composing', delay: duration },
      })
    } catch {
      // não crítico
    }
  }

  async markAsRead(instanceName: string, phone: string, messageId: string) {
    try {
      await this.client.post(`/chat/markMessageAsRead/${instanceName}`, {
        readMessages: [{ remoteJid: `${phone}@s.whatsapp.net`, id: messageId }],
      })
    } catch {}
  }

  validateWebhookSignature(payload: string, signature: string): boolean {
    const crypto = require('crypto')
    const secret = this.config.get('EVOLUTION_WEBHOOK_SECRET')
    const expected = crypto.createHmac('sha256', secret).update(payload).digest('hex')
    return expected === signature
  }
}
