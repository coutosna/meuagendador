import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'
import { Contact } from '../../contacts/entities/contact.entity'
import { User } from '../../users/entities/user.entity'

export enum AppointmentStatus {
  PENDING = 'pending',
  CONFIRMED = 'confirmed',
  COMPLETED = 'completed',
  CANCELLED = 'cancelled',
  NO_SHOW = 'no_show',
}

@Entity('services')
export class Service {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @Column({ length: 255 })
  name: string

  @Column({ type: 'text', nullable: true })
  description: string

  @Column({ default: 60 })
  duration: number

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  price: number

  @Column({ length: 7, default: '#6366f1' })
  color: string

  @Column({ default: true })
  isActive: boolean

  @CreateDateColumn()
  createdAt: Date
}

@Entity('availability_slots')
export class AvailabilitySlot {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @Column({ nullable: true })
  userId: string

  @Column({ type: 'int' })
  dayOfWeek: number

  @Column({ type: 'time' })
  startTime: string

  @Column({ type: 'time' })
  endTime: string

  @Column({ default: true })
  isActive: boolean
}

@Entity('appointments')
@Index(['tenantId', 'scheduledAt'])
export class Appointment {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant

  @Column()
  contactId: string

  @ManyToOne(() => Contact)
  @JoinColumn({ name: 'contactId' })
  contact: Contact

  @Column({ nullable: true })
  serviceId: string

  @ManyToOne(() => Service, { nullable: true })
  @JoinColumn({ name: 'serviceId' })
  service: Service

  @Column({ nullable: true })
  assignedUserId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser: User

  @Column({ nullable: true })
  leadId: string

  @Column({ nullable: true })
  conversationId: string

  @Column()
  scheduledAt: Date

  @Column({ default: 60 })
  duration: number

  @Column({ type: 'enum', enum: AppointmentStatus, default: AppointmentStatus.PENDING })
  status: AppointmentStatus

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ nullable: true })
  confirmationSentAt: Date

  @Column({ nullable: true })
  reminderSentAt: Date

  @Column({ nullable: true })
  cancelledAt: Date

  @Column({ nullable: true })
  cancelReason: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
