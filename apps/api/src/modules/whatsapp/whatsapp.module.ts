import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { WhatsappController } from './whatsapp.controller'
import { WhatsappService } from './whatsapp.service'
import { EvolutionApiService } from './evolution-api.service'
import { Contact } from '../contacts/entities/contact.entity'
import { Conversation } from '../conversations/entities/conversation.entity'
import { Message } from '../messages/entities/message.entity'

@Module({
  imports: [
    TypeOrmModule.forFeature([Contact, Conversation, Message]),
    BullModule.registerQueue({ name: 'whatsapp:inbound' }, { name: 'whatsapp:outbound' }),
  ],
  controllers: [WhatsappController],
  providers: [WhatsappService, EvolutionApiService],
  exports: [WhatsappService, EvolutionApiService],
})
export class WhatsappModule {}
