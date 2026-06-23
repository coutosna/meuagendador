import { Process, Processor } from '@nestjs/bull'
import { Logger } from '@nestjs/common'
import { Job } from 'bull'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { Appointment } from '../modules/agenda/entities/appointment.entity'
import { N8nWebhookService } from '../modules/webhooks/n8n-webhook.service'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { addHours, startOfDay, endOfDay } from 'date-fns'
import { Cron, CronExpression } from '@nestjs/schedule'

@Processor('agenda:confirmation')
export class AgendaConfirmationProcessor {
  private readonly logger = new Logger(AgendaConfirmationProcessor.name)

  constructor(
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
    @InjectQueue('whatsapp:outbound') private readonly outboundQueue: Queue,
    private readonly n8n: N8nWebhookService,
  ) {}

  @Process('send-confirmation')
  async handleSendConfirmation(job: Job<{ tenantId: string; appointmentId: string }>) {
    const { tenantId, appointmentId } = job.data
    const appointment = await this.appointmentRepo.findOne({
      where: { id: appointmentId, tenantId },
      relations: ['contact', 'service'],
    })
    if (!appointment) return

    const message = `Olá, ${appointment.contact.name}! Seu agendamento para *${appointment.service.name}* foi confirmado para *${new Date(appointment.scheduledAt).toLocaleDateString('pt-BR')}*. Aguardamos você! 😊`

    await this.outboundQueue.add('send-message', {
      instanceName: tenantId,
      phone: appointment.contact.phone,
      content: message,
    })
  }

  @Cron('0 * * * *') // every hour
  async sendReminders() {
    const now = new Date()
    const in24h = addHours(now, 24)
    const in1h = addHours(now, 1)

    await this.sendRemindersForHours(24, in24h)
    await this.sendRemindersForHours(1, in1h)
  }

  private async sendRemindersForHours(hoursUntil: number, targetTime: Date) {
    const windowStart = new Date(targetTime.getTime() - 5 * 60 * 1000) // ±5 min window
    const windowEnd = new Date(targetTime.getTime() + 5 * 60 * 1000)

    const appointments = await this.appointmentRepo.find({
      where: { scheduledAt: Between(windowStart, windowEnd) },
      relations: ['contact', 'service'],
    })

    for (const appointment of appointments) {
      await this.n8n.emit(appointment.tenantId, 'appointment.reminder', {
        appointment: { id: appointment.id, scheduledAt: appointment.scheduledAt },
        contact: { name: appointment.contact.name, phone: appointment.contact.phone },
        hoursUntil,
      })
    }
  }
}
