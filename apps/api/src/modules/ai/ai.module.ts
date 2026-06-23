import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { AiConfig } from './entities/ai-config.entity'
import { Message } from '../messages/entities/message.entity'
import { Service, AvailabilitySlot, Appointment } from '../agenda/entities/appointment.entity'
import { AiController } from './ai.controller'
import { AiService } from './ai.service'

@Module({
  imports: [TypeOrmModule.forFeature([AiConfig, Message, Service, AvailabilitySlot, Appointment])],
  controllers: [AiController],
  providers: [AiService],
  exports: [AiService],
})
export class AiModule {}
