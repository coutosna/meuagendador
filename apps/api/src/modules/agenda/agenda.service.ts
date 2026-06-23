import { Injectable, Inject, forwardRef } from '@nestjs/common'
import { N8nWebhookService } from '../webhooks/n8n-webhook.service'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, Between } from 'typeorm'
import { Service, AvailabilitySlot, Appointment, AppointmentStatus } from './entities/appointment.entity'
import { InjectQueue } from '@nestjs/bull'
import { Queue } from 'bull'
import { addDays, startOfDay, endOfDay, format, addMinutes, isBefore } from 'date-fns'

@Injectable()
export class AgendaService {
  constructor(
    @InjectRepository(Service) private readonly serviceRepo: Repository<Service>,
    @InjectRepository(AvailabilitySlot) private readonly slotRepo: Repository<AvailabilitySlot>,
    @InjectRepository(Appointment) private readonly appointmentRepo: Repository<Appointment>,
    @InjectQueue('agenda:confirmation') private readonly confirmQueue: Queue,
    private readonly n8n: N8nWebhookService,
  ) {}

  getServices(tenantId: string) { return this.serviceRepo.find({ where: { tenantId, isActive: true } }) }
  createService(tenantId: string, dto: Partial<Service>) { return this.serviceRepo.save(this.serviceRepo.create({ ...dto, tenantId })) }
  updateService(tenantId: string, id: string, dto: Partial<Service>) { return this.serviceRepo.update({ id, tenantId }, dto) }
  deleteService(tenantId: string, id: string) { return this.serviceRepo.delete({ id, tenantId }) }

  getAvailability(tenantId: string) { return this.slotRepo.find({ where: { tenantId } }) }
  async setAvailability(tenantId: string, slots: any[]) {
    await this.slotRepo.delete({ tenantId })
    const saved: AvailabilitySlot[] = []
    for (const s of slots) {
      const entity = this.slotRepo.create({ dayOfWeek: s.dayOfWeek, startTime: s.startTime, endTime: s.endTime, isActive: s.isActive ?? true, tenantId })
      saved.push(await this.slotRepo.save(entity))
    }
    return saved
  }

  getAppointments(tenantId: string, from?: string, to?: string) {
    const where: any = { tenantId }
    if (from && to) where.scheduledAt = Between(new Date(from), new Date(to))
    return this.appointmentRepo.find({ where, relations: ['contact', 'service', 'assignedUser'], order: { scheduledAt: 'ASC' } })
  }

  async createAppointment(tenantId: string, dto: Partial<Appointment>) {
    const appointment = await this.appointmentRepo.save(this.appointmentRepo.create({ ...dto, tenantId }))
    await this.confirmQueue.add('send-confirmation', { tenantId, appointmentId: appointment.id }, { delay: 2000 })
    const full = await this.getAppointment(tenantId, appointment.id)
    await this.n8n.emit(tenantId, 'appointment.created', {
      appointment: { id: appointment.id, scheduledAt: appointment.scheduledAt, duration: (full as any)?.service?.duration, status: appointment.status, notes: appointment.notes },
      contact: { id: (full as any)?.contact?.id, name: (full as any)?.contact?.name, phone: (full as any)?.contact?.phone },
      service: { id: (full as any)?.service?.id, name: (full as any)?.service?.name, duration: (full as any)?.service?.duration, price: (full as any)?.service?.price },
    })
    return appointment
  }

  getAppointment(tenantId: string, id: string) {
    return this.appointmentRepo.findOne({ where: { id, tenantId }, relations: ['contact', 'service'] })
  }

  async updateStatus(tenantId: string, id: string, status: AppointmentStatus) {
    await this.appointmentRepo.update({ id, tenantId }, { status })
    const appointment = await this.getAppointment(tenantId, id)
    const eventMap: Record<string, any> = {
      [AppointmentStatus.CONFIRMED]: 'appointment.confirmed',
      [AppointmentStatus.CANCELLED]: 'appointment.cancelled',
    }
    if (eventMap[status]) {
      await this.n8n.emit(tenantId, eventMap[status], {
        appointment: { id, scheduledAt: (appointment as any)?.scheduledAt, cancelReason: '' },
        contact: { name: (appointment as any)?.contact?.name, phone: (appointment as any)?.contact?.phone },
      })
    }
    return appointment
  }

  async getAvailableSlots(tenantId: string, date: string, serviceId?: string) {
    const targetDate = new Date(date)
    const dayOfWeek = targetDate.getDay()
    const slots = await this.slotRepo.find({ where: { tenantId, dayOfWeek, isActive: true } })
    const existing = await this.appointmentRepo.find({
      where: { tenantId, scheduledAt: Between(startOfDay(targetDate), endOfDay(targetDate)) },
    })

    const duration = serviceId
      ? (await this.serviceRepo.findOne({ where: { id: serviceId } }))?.duration || 60
      : 60

    const available: string[] = []
    for (const slot of slots) {
      let current = new Date(`${date}T${slot.startTime}`)
      const end = new Date(`${date}T${slot.endTime}`)
      while (isBefore(addMinutes(current, duration), end)) {
        const slotTime = format(current, 'HH:mm')
        const occupied = existing.some((a) => format(a.scheduledAt, 'HH:mm') === slotTime)
        if (!occupied) available.push(slotTime)
        current = addMinutes(current, 30)
      }
    }
    return { date, slots: available }
  }
}
