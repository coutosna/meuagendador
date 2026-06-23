import { Entity, PrimaryGeneratedColumn, Column, CreateDateColumn, ManyToOne, JoinColumn } from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'

@Entity('message_templates')
export class MessageTemplate {
  @PrimaryGeneratedColumn('uuid') id: string
  @Column() tenantId: string
  @ManyToOne(() => Tenant) @JoinColumn({ name: 'tenantId' }) tenant: Tenant
  @Column({ length: 255 }) name: string
  @Column({ type: 'text' }) content: string
  @Column({ default: 'custom' }) category: string
  @Column({ default: true }) isActive: boolean
  @CreateDateColumn() createdAt: Date
}
