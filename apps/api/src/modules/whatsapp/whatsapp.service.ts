import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { EvolutionApiService } from './evolution-api.service'
import { Contact } from '../contacts/entities/contact.entity'
import { Conversation, ConversationStatus } from '../conversations/entities/conversation.entity'
import { Message, MessageSenderType, MessageType } from '../messages/entities/message.entity'

export interface WhatsappInstance {
  id: string
  tenantId: string
  instanceName: string
  phone: string
  status: 'connecting' | 'connected' | 'disconnected'
  qrCode?: string
  connectedAt?: Date
  createdAt: Date
}

@Injectable()
export class WhatsappService {
  private instances: Map<string, WhatsappInstance> = new Map()

  constructor(
    private readonly evolutionApi: EvolutionApiService,
    @InjectRepository(Contact) private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Conversation) private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    @InjectQueue('whatsapp:inbound') private readonly inboundQueue: Queue,
    @InjectQueue('whatsapp:outbound') private readonly outboundQueue: Queue,
  ) {}

  async createInstance(tenantId: string, instanceName: string, appUrl: string) {
    const webhookUrl = `${appUrl}/api/v1/whatsapp/webhook/${instanceName}`
    const result = await this.evolutionApi.createInstance(instanceName, webhookUrl)

    const instance: WhatsappInstance = {
      id: require('uuid').v4(),
      tenantId,
      instanceName,
      phone: '',
      status: 'connecting',
      qrCode: result.qrcode?.base64,
      createdAt: new Date(),
    }

    this.instances.set(`${tenantId}:${instanceName}`, instance)
    return instance
  }

  async getInstanceQr(tenantId: string, instanceName: string) {
    const result = await this.evolutionApi.getQrCode(instanceName)
    const key = `${tenantId}:${instanceName}`
    const instance = this.instances.get(key)
    if (instance) {
      instance.qrCode = result.base64
      this.instances.set(key, instance)
    }
    return { qrCode: result.base64, status: result.status }
  }

  getInstances(tenantId: string): WhatsappInstance[] {
    return Array.from(this.instances.values()).filter((i) => i.tenantId === tenantId)
  }

  async processWebhook(instanceName: string, payload: any) {
    if (payload.event === 'messages.upsert') {
      for (const msg of payload.data?.messages || []) {
        if (msg.key?.fromMe) continue

        await this.inboundQueue.add('process-message', {
          instanceName,
          message: msg,
        })
      }
    }

    if (payload.event === 'connection.update') {
      const status = payload.data?.state === 'open' ? 'connected' : 'disconnected'
      const phone = payload.data?.instance?.wuid?.replace('@s.whatsapp.net', '') || ''

      for (const [key, instance] of this.instances.entries()) {
        if (instance.instanceName === instanceName) {
          instance.status = status
          if (phone) instance.phone = phone
          if (status === 'connected') instance.connectedAt = new Date()
          this.instances.set(key, instance)
        }
      }
    }
  }

  async sendMessage(tenantId: string, conversationId: string, content: string, userId: string) {
    const conversation = await this.conversationRepo.findOne({
      where: { id: conversationId, tenantId },
      relations: ['contact'],
    })

    if (!conversation) throw new NotFoundException('Conversa não encontrada')

    const instances = this.getInstances(tenantId)
    const instance = instances.find((i) => i.status === 'connected')
    if (!instance) throw new NotFoundException('Nenhuma instância WhatsApp conectada')

    const message = this.messageRepo.create({
      tenantId,
      conversationId,
      senderType: MessageSenderType.USER,
      senderId: userId,
      content,
      type: MessageType.TEXT,
    })
    await this.messageRepo.save(message)

    await this.outboundQueue.add('send-message', {
      instanceName: instance.instanceName,
      phone: conversation.contact.phone,
      content,
      messageId: message.id,
    })

    await this.conversationRepo.update(conversationId, {
      lastMessage: content,
      lastMessageAt: new Date(),
    })

    return message
  }
}
