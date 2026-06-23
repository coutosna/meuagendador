import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Lead } from '../crm/entities/lead.entity'
import { Appointment } from '../agenda/entities/appointment.entity'
import { Contact } from '../contacts/entities/contact.entity'
import { Message } from '../messages/entities/message.entity'
import { ReportsController } from './reports.controller'
import { ReportsService } from './reports.service'

@Module({
  imports: [TypeOrmModule.forFeature([Lead, Appointment, Contact, Message])],
  controllers: [ReportsController],
  providers: [ReportsService],
})
export class ReportsModule {}
