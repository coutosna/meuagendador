import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { AiService } from '../modules/ai/ai.service'
import { Contact } from '../modules/contacts/entities/contact.entity'
import { Conversation, ConversationStatus } from '../modules/conversations/entities/conversation.entity'
import { Message, MessageSenderType, MessageType } from '../modules/messages/entities/message.entity'
import { Lead } from '../modules/crm/entities/lead.entity'
import { ConversationGateway } from '../modules/conversations/conversation.gateway'
import { N8nWebhookService } from '../modules/webhooks/n8n-webhook.service'

@Processor('ai:process')
export class AiResponseProcessor {
  private readonly logger = new Logger('AiResponseProcessor')

  constructor(
    private readonly aiService: AiService,
    private readonly gateway: ConversationGateway,
    @InjectRepository(Contact) private readonly contactRepo: Repository<Contact>,
    @InjectRepository(Conversation) private readonly conversationRepo: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectQueue('whatsapp:outbound') private readonly outboundQueue: Queue,
    @InjectQueue('crm:update') private readonly crmQueue: Queue,
    @InjectQueue('agenda:confirmation') private readonly agendaQueue: Queue,
    private readonly n8n: N8nWebhookService,
  ) {}

  @Process('generate-response')
  async handleGenerateResponse(job: Job<{
    tenantId: string
    conversationId: string
    contactId: string
    instanceName: string
    phone: string
    userMessage: string
  }>) {
    const { tenantId, conversationId, contactId, instanceName, phone, userMessage } = job.data

    try {
      this.gateway.emitAiTyping(tenantId, conversationId)

      const aiResponse = await this.aiService.processMessage(tenantId, conversationId, userMessage)

      if (!aiResponse.content) return

      const botMessage = this.messageRepo.create({
        tenantId,
        conversationId,
        senderType: MessageSenderType.BOT,
        content: aiResponse.content,
        type: MessageType.TEXT,
      })
      await this.messageRepo.save(botMessage)

      await this.conversationRepo.update(conversationId, {
        lastMessage: aiResponse.content,
        lastMessageAt: new Date(),
      })

      this.gateway.emitNewMessage(tenantId, conversationId, botMessage)

      await this.outboundQueue.add('send-message', {
        instanceName,
        phone,
        content: aiResponse.content,
        messageId: botMessage.id,
      }, { delay: 1500 })

      const contact = await this.contactRepo.findOne({ where: { id: contactId } })

      // Notify n8n of incoming message
      await this.n8n.emit(tenantId, 'message.received', {
        conversation: { id: conversationId, status: 'open', botEnabled: true },
        contact: { id: contactId, name: contact?.name, phone: contact?.phone },
        message: { content: userMessage, type: 'text', senderType: 'contact' },
      })

      if (aiResponse.action === 'qualify' && aiResponse.qualificationData) {
        await this.crmQueue.add('create-lead', {
          tenantId,
          contactId,
          conversationId,
          qualificationData: aiResponse.qualificationData,
        })

        await this.contactRepo.update(contactId, {
          isQualified: true,
          qualificationData: aiResponse.qualificationData,
        })

        await this.n8n.emit(tenantId, 'lead.qualified', {
          lead: { title: `Lead - ${contact?.name}` },
          contact: { id: contactId, name: contact?.name, phone: contact?.phone },
          qualificationData: aiResponse.qualificationData,
        })
      }

      if (aiResponse.action === 'schedule') {
        await this.agendaQueue.add('suggest-schedule', {
          tenantId,
          contactId,
          conversationId,
          scheduleSuggestion: aiResponse.scheduleSuggestion,
        })
      }

      if (aiResponse.action === 'handoff') {
        await this.conversationRepo.update(conversationId, {
          status: ConversationStatus.PENDING,
          botEnabled: false,
        })
        this.gateway.emitConversationUpdate(tenantId, { id: conversationId, status: ConversationStatus.PENDING })

        await this.n8n.emit(tenantId, 'conversation.handoff', {
          conversation: { id: conversationId },
          contact: { id: contactId, name: contact?.name, phone: contact?.phone },
          lastMessage: userMessage,
        })
      }

    } catch (error) {
      this.logger.error(`Erro ao processar resposta IA para conversa ${conversationId}:`, error)
    }
  }
}
