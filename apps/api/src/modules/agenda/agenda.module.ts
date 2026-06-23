import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { BullModule } from '@nestjs/bull'
import { Service, AvailabilitySlot, Appointment } from './entities/appointment.entity'
import { AgendaController } from './agenda.controller'
import { AgendaService } from './agenda.service'

@Module({
  imports: [
    TypeOrmModule.forFeature([Service, AvailabilitySlot, Appointment]),
    BullModule.registerQueue({ name: 'agenda:confirmation' }, { name: 'whatsapp:outbound' }),
  ],
  controllers: [AgendaController],
  providers: [AgendaService],
  exports: [AgendaService],
})
export class AgendaModule {}
