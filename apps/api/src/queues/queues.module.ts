import { Module } from '@nestjs/common'
import { BullModule } from '@nestjs/bull'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Contact } from '../modules/contacts/entities/contact.entity'
import { Conversation } from '../modules/conversations/entities/conversation.entity'
import { Message } from '../modules/messages/entities/message.entity'
import { Lead } from '../modules/crm/entities/lead.entity'
import { AiConfig } from '../modules/ai/entities/ai-config.entity'
import { WhatsappInboundProcessor } from './whatsapp-inbound.processor'
import { WhatsappOutboundProcessor } from './whatsapp-outbound.processor'
import { AiResponseProcessor } from './ai-response.processor'
import { Appointment } from '../modules/agenda/entities/appointment.entity'
import { AiService } from '../modules/ai/ai.service'
import { ConversationGateway } from '../modules/conversations/conversation.gateway'
import { EvolutionApiService } from '../modules/whatsapp/evolution-api.service'
import { AgendaConfirmationProcessor } from './agenda-confirmation.processor'
import { N8nWebhookService } from '../modules/webhooks/n8n-webhook.service'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact, Conversation, Message, Lead, AiConfig, Appointment]),
    BullModule.registerQueue(
      { name: 'whatsapp:inbound' },
      { name: 'whatsapp:outbound' },
      { name: 'ai:process' },
      { name: 'crm:update' },
      { name: 'agenda:confirmation' },
    ),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (c: ConfigService) => ({ secret: c.get('JWT_SECRET') }),
      inject: [ConfigService],
    }),
  ],
  providers: [
    WhatsappInboundProcessor,
    WhatsappOutboundProcessor,
    AiResponseProcessor,
    AgendaConfirmationProcessor,
    AiService,
    ConversationGateway,
    EvolutionApiService,
    N8nWebhookService,
  ],
})
export class QueuesModule {}
