import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, MoreThanOrEqual, Between } from 'typeorm'
import { Contact } from '../contacts/entities/contact.entity'
import { Conversation } from '../conversations/entities/conversation.entity'
import { Lead } from '../crm/entities/lead.entity'
import { Appointment, AppointmentStatus, Service } from '../agenda/entities/appointment.entity'
import { startOfDay, subDays, startOfMonth, endOfMonth, subMonths, format } from 'date-fns'

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
    @InjectRepository(Conversation) private conversationRepo: Repository<Conversation>,
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Service) private serviceRepo: Repository<Service>,
  ) {}

  async getOverview(tenantId: string) {
    const today = startOfDay(new Date())
    const monthStart = startOfMonth(new Date())
    const last30 = subDays(new Date(), 30)

    const [
      totalContacts, newContactsToday,
      totalLeads, qualifiedLeads, wonLeads,
      appointmentsToday, appointmentsMonth,
      totalConversations, openConversations,
    ] = await Promise.all([
      this.contactRepo.count({ where: { tenantId } }),
      this.contactRepo.count({ where: { tenantId, createdAt: MoreThanOrEqual(today) } }),
      this.leadRepo.count({ where: { tenantId } }),
      this.leadRepo.count({ where: { tenantId, qualifiedAt: MoreThanOrEqual(last30) } }),
      this.leadRepo.count({ where: { tenantId, stage: { isWon: true } } }),
      this.appointmentRepo.count({ where: { tenantId, scheduledAt: MoreThanOrEqual(today) } }),
      this.appointmentRepo.count({ where: { tenantId, scheduledAt: MoreThanOrEqual(monthStart) } }),
      this.conversationRepo.count({ where: { tenantId } }),
      this.conversationRepo.count({ where: { tenantId, status: 'open' as any } }),
    ])

    const conversionRate = totalLeads > 0 ? Math.round((wonLeads / totalLeads) * 100) : 0

    return {
      contacts: { total: totalContacts, today: newContactsToday },
      leads: { total: totalLeads, qualified: qualifiedLeads, won: wonLeads, conversionRate },
      appointments: { today: appointmentsToday, month: appointmentsMonth },
      conversations: { total: totalConversations, open: openConversations },
    }
  }

  async getFinancial(tenantId: string) {
    const now = new Date()
    const monthStart = startOfMonth(now)
    const monthEnd = endOfMonth(now)
    const prevMonthStart = startOfMonth(subMonths(now, 1))
    const prevMonthEnd = endOfMonth(subMonths(now, 1))

    const completedThisMonth = await this.appointmentRepo.find({
      where: {
        tenantId,
        status: AppointmentStatus.COMPLETED,
        scheduledAt: Between(monthStart, monthEnd),
      },
      relations: ['service'],
    })

    const completedPrevMonth = await this.appointmentRepo.find({
      where: {
        tenantId,
        status: AppointmentStatus.COMPLETED,
        scheduledAt: Between(prevMonthStart, prevMonthEnd),
      },
      relations: ['service'],
    })

    const revenueMonth = completedThisMonth.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)
    const revenuePrevMonth = completedPrevMonth.reduce((sum, a) => sum + Number(a.service?.price || 0), 0)
    const avgTicket = completedThisMonth.length > 0 ? revenueMonth / completedThisMonth.length : 0

    const revenueGrowth = revenuePrevMonth > 0
      ? Math.round(((revenueMonth - revenuePrevMonth) / revenuePrevMonth) * 100)
      : 0

    // Revenue by service
    const byService: Record<string, { name: string; count: number; revenue: number; color: string }> = {}
    for (const appt of completedThisMonth) {
      const svc = appt.service
      if (!svc) continue
      if (!byService[svc.id]) byService[svc.id] = { name: svc.name, count: 0, revenue: 0, color: svc.color }
      byService[svc.id].count++
      byService[svc.id].revenue += Number(svc.price || 0)
    }

    // Daily revenue for chart (last 30 days)
    const last30Start = subDays(now, 29)
    const completedLast30 = await this.appointmentRepo.find({
      where: {
        tenantId,
        status: AppointmentStatus.COMPLETED,
        scheduledAt: Between(last30Start, now),
      },
      relations: ['service'],
    })

    const dailyMap: Record<string, number> = {}
    for (const appt of completedLast30) {
      const day = format(appt.scheduledAt, 'dd/MM')
      dailyMap[day] = (dailyMap[day] || 0) + Number(appt.service?.price || 0)
    }

    // Last 7 days for chart
    const daily = Array.from({ length: 7 }, (_, i) => {
      const d = subDays(now, 6 - i)
      const key = format(d, 'dd/MM')
      return { day: format(d, 'EEE', { locale: undefined }), date: key, revenue: dailyMap[key] || 0 }
    })

    return {
      revenueMonth,
      revenuePrevMonth,
      revenueGrowth,
      avgTicket,
      completedCount: completedThisMonth.length,
      byService: Object.values(byService).sort((a, b) => b.revenue - a.revenue),
      daily,
    }
  }

  async getTodayAppointments(tenantId: string) {
    const today = startOfDay(new Date())
    const tomorrow = startOfDay(subDays(new Date(), -1))
    return this.appointmentRepo.find({
      where: { tenantId, scheduledAt: Between(today, tomorrow) },
      relations: ['contact', 'service'],
      order: { scheduledAt: 'ASC' },
      take: 10,
    })
  }
}
