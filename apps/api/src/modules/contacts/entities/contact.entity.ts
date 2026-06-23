import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'

@Entity('contacts')
@Index(['tenantId'])
@Index(['tenantId', 'phone'])
export class Contact {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant

  @Column({ length: 255, nullable: true })
  name: string

  @Column({ length: 30 })
  phone: string

  @Column({ length: 255, nullable: true })
  email: string

  @Column({ nullable: true })
  avatarUrl: string

  @Column({ type: 'simple-array', nullable: true })
  tags: string[]

  @Column({ type: 'jsonb', nullable: true })
  customFields: Record<string, any>

  @Column({ length: 100, nullable: true })
  source: string

  @Column({ default: false })
  isQualified: boolean

  @Column({ type: 'jsonb', nullable: true })
  qualificationData: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date
}
