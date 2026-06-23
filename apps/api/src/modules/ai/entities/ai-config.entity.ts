import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn,
} from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'

export enum AiProvider {
  OPENAI = 'openai',
  ANTHROPIC = 'anthropic',
}

@Entity('ai_configs')
export class AiConfig {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ unique: true })
  tenantId: string

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant

  @Column({ type: 'enum', enum: AiProvider, default: AiProvider.OPENAI })
  provider: AiProvider

  @Column({ default: 'gpt-4o-mini' })
  model: string

  @Column({ type: 'text', nullable: true })
  systemPrompt: string

  @Column({ type: 'text', nullable: true })
  personality: string

  @Column({ type: 'jsonb', nullable: true })
  companyInfo: {
    name?: string
    services?: string[]
    prices?: string
    address?: string
    extra?: string
  }

  @Column({ type: 'jsonb', nullable: true })
  businessHours: {
    [day: string]: { open: string; close: string; enabled: boolean }
  }

  @Column({ type: 'jsonb', nullable: true })
  qualificationQuestions: string[]

  @Column({ default: false })
  autoSchedule: boolean

  @Column({ default: true })
  isActive: boolean

  @Column({ type: 'decimal', precision: 3, scale: 2, default: 0.7 })
  temperature: number

  @Column({ default: 2000 })
  maxTokens: number

  @Column({ nullable: true })
  handoffKeyword: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
