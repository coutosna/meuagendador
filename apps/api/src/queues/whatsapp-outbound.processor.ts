import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { EvolutionApiService } from '../modules/whatsapp/evolution-api.service'
import { Message, MessageStatus } from '../modules/messages/entities/message.entity'

@Processor('whatsapp:outbound')
export class WhatsappOutboundProcessor {
  private readonly logger = new Logger('WhatsappOutboundProcessor')

  constructor(
    private readonly evolutionApi: EvolutionApiService,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
  ) {}

  @Process('send-message')
  async handle(job: Job<{ instanceName: string; phone: string; content: string; messageId: string }>) {
    const { instanceName, phone, content, messageId } = job.data

    try {
      await this.evolutionApi.sendTextMessage(instanceName, phone, content)
      await this.messageRepo.update(messageId, { status: MessageStatus.SENT })
    } catch (error) {
      this.logger.error(`Falha ao enviar mensagem ${messageId}:`, error)
      await this.messageRepo.update(messageId, { status: MessageStatus.FAILED })
      throw error
    }
  }
}
