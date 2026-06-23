import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Contact } from '../contacts/entities/contact.entity'
import { Conversation } from '../conversations/entities/conversation.entity'
import { Lead } from '../crm/entities/lead.entity'
import { Appointment, Service } from '../agenda/entities/appointment.entity'
import { Message } from '../messages/entities/message.entity'
import { DashboardController } from './dashboard.controller'
import { DashboardService } from './dashboard.service'

@Module({
  imports: [TypeOrmModule.forFeature([Contact, Conversation, Lead, Appointment, Service, Message])],
  controllers: [DashboardController],
  providers: [DashboardService],
})
export class DashboardModule {}
