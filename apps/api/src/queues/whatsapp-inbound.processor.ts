import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { Contact } from '../modules/contacts/entities/contact.entity'
import { Conversation, ConversationStatus } from '../modules/conversations/entities/conversation.entity'
import { Message, MessageSenderType, MessageType } from '../modules/messages/entities/message.entity'
import { AiConfig } from '../modules/ai/entities/ai-config.entity'
import { ConversationGateway } from '../modules/conversations/conversation.gateway'

@Processor('whatsapp:inbound')
export class WhatsappInboundProcessor {
  private readonly logger = new Logger('WhatsappInboundProcessor')

  constructor(
    @InjectRepository(Contact) private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Conversation) private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    @InjectRepository(AiConfig) private readonly aiConfigRepo: Repository<AiConfig>,
    @InjectQueue('ai:process') private readonly aiQueue: Queue,
    private readonly gateway: ConversationGateway,
  ) {}

  @Process('process-message')
  async handle(job: Job<{ instanceName: string; message: any; tenantId: string }>) {
    const { instanceName, message, tenantId } = job.data

    try {
      const phone = message.key.remoteJid.replace('@s.whatsapp.net', '').replace('@g.us', '')
      const content = message.message?.conversation || message.message?.extendedTextMessage?.text || ''
      const externalId = message.key.id
      const pushName = message.pushName || ''

      if (!content && !message.message?.audioMessage && !message.message?.imageMessage) return

      let contact = await this.contactRepo.findOne({ where: { tenantId, phone } })
      if (!contact) {
        contact = await this.contactRepo.save(
          this.contactRepo.create({ tenantId, phone, name: pushName || phone, source: 'whatsapp' }),
        )
      } else if (!contact.name && pushName) {
        await this.contactRepo.update(contact.id, { name: pushName })
      }

      let conversation = await this.conversationRepo.findOne({
        where: { tenantId, contactId: contact.id, status: ConversationStatus.OPEN },
        order: { createdAt: 'DESC' },
      })

      if (!conversation) {
        conversation = await this.conversationRepo.save(
          this.conversationRepo.create({
            tenantId,
            contactId: contact.id,
            instanceId: instanceName,
            status: ConversationStatus.OPEN,
            botEnabled: true,
            lastMessage: content,
            lastMessageAt: new Date(),
          }),
        )
        this.gateway.emitToTenant(tenantId, 'conversation:new', { ...conversation, contact })
      }

      const existingMsg = await this.messageRepo.findOne({ where: { externalId, tenantId } })
      if (existingMsg) return

      const msgType = message.message?.audioMessage
        ? MessageType.AUDIO
        : message.message?.imageMessage
        ? MessageType.IMAGE
        : MessageType.TEXT

      const savedMessage = await this.messageRepo.save(
        this.messageRepo.create({
          tenantId,
          conversationId: conversation.id,
          senderType: MessageSenderType.CONTACT,
          content,
          type: msgType,
          externalId,
          sentAt: new Date(Number(message.messageTimestamp) * 1000),
        }),
      )

      await this.conversationRepo.update(conversation.id, {
        lastMessage: content || `[${msgType}]`,
        lastMessageAt: new Date(),
        unreadCount: () => 'unread_count + 1',
      })

      this.gateway.emitNewMessage(tenantId, conversation.id, savedMessage)

      if (conversation.botEnabled) {
        const aiConfig = await this.aiConfigRepo.findOne({ where: { tenantId, isActive: true } })
        if (aiConfig) {
          await this.aiQueue.add('generate-response', {
            tenantId,
            conversationId: conversation.id,
            contactId: contact.id,
            instanceName,
            phone,
            userMessage: content,
          })
        }
      }
    } catch (error) {
      this.logger.error('Erro ao processar mensagem inbound:', error)
    }
  }
}
