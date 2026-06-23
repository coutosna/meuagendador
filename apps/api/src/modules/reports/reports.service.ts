import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Lead } from '../crm/entities/lead.entity'
import { Appointment } from '../agenda/entities/appointment.entity'
import { Contact } from '../contacts/entities/contact.entity'

@Injectable()
export class ReportsService {
  constructor(
    @InjectRepository(Lead) private leadRepo: Repository<Lead>,
    @InjectRepository(Appointment) private appointmentRepo: Repository<Appointment>,
    @InjectRepository(Contact) private contactRepo: Repository<Contact>,
  ) {}

  async getLeadsReport(tenantId: string, from: string, to: string) {
    return this.leadRepo.createQueryBuilder('l')
      .where('l.tenantId = :tenantId', { tenantId })
      .andWhere('l.createdAt BETWEEN :from AND :to', { from, to })
      .leftJoinAndSelect('l.stage', 'stage')
      .leftJoinAndSelect('l.contact', 'contact')
      .orderBy('l.createdAt', 'DESC')
      .getMany()
  }

  async getAppointmentsReport(tenantId: string, from: string, to: string) {
    return this.appointmentRepo.createQueryBuilder('a')
      .where('a.tenantId = :tenantId', { tenantId })
      .andWhere('a.scheduledAt BETWEEN :from AND :to', { from, to })
      .leftJoinAndSelect('a.contact', 'contact')
      .leftJoinAndSelect('a.service', 'service')
      .orderBy('a.scheduledAt', 'ASC')
      .getMany()
  }
}
