import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'
import { Contact } from '../../contacts/entities/contact.entity'
import { Pipeline, PipelineStage } from './pipeline.entity'
import { User } from '../../users/entities/user.entity'

@Entity('leads')
@Index(['tenantId', 'stageId'])
export class Lead {
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

  @Column()
  pipelineId: string

  @ManyToOne(() => Pipeline)
  @JoinColumn({ name: 'pipelineId' })
  pipeline: Pipeline

  @Column()
  stageId: string

  @ManyToOne(() => PipelineStage)
  @JoinColumn({ name: 'stageId' })
  stage: PipelineStage

  @Column({ nullable: true })
  assignedUserId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser: User

  @Column({ length: 255 })
  title: string

  @Column({ type: 'decimal', precision: 10, scale: 2, nullable: true })
  value: number

  @Column({ default: 0 })
  probability: number

  @Column({ type: 'text', nullable: true })
  notes: string

  @Column({ nullable: true })
  lostReason: string

  @Column({ nullable: true })
  conversationId: string

  @Column({ nullable: true })
  qualifiedAt: Date

  @Column({ nullable: true })
  closedAt: Date

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

@Entity('lead_history')
export class LeadHistory {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  leadId: string

  @Column()
  tenantId: string

  @Column({ nullable: true })
  fromStageId: string

  @Column()
  toStageId: string

  @Column({ nullable: true })
  changedById: string

  @Column({ nullable: true, type: 'text' })
  reason: string

  @CreateDateColumn()
  createdAt: Date
}
