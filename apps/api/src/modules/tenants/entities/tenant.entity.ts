import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  DeleteDateColumn, OneToMany, OneToOne,
} from 'typeorm'

export enum TenantPlan {
  FREE = 'free',
  STARTER = 'starter',
  PRO = 'pro',
  ENTERPRISE = 'enterprise',
}

export enum TenantStatus {
  ACTIVE = 'active',
  SUSPENDED = 'suspended',
  TRIAL = 'trial',
}

@Entity('tenants')
export class Tenant {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column({ length: 255 })
  name: string

  @Column({ length: 100, unique: true })
  slug: string

  @Column({ type: 'enum', enum: TenantPlan, default: TenantPlan.FREE })
  plan: TenantPlan

  @Column({ type: 'enum', enum: TenantStatus, default: TenantStatus.TRIAL })
  status: TenantStatus

  @Column({ type: 'jsonb', nullable: true })
  settings: Record<string, any>

  @Column({ nullable: true })
  logoUrl: string

  @Column({ nullable: true })
  phone: string

  @Column({ nullable: true })
  email: string

  @Column({ nullable: true })
  website: string

  @Column({ nullable: true, length: 20 })
  timezone: string

  @CreateDateColumn()
  createdAt: Date

  @DeleteDateColumn()
  deletedAt: Date
}
