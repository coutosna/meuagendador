import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'
import { Contact } from '../../contacts/entities/contact.entity'
import { User } from '../../users/entities/user.entity'

export enum ConversationStatus {
  OPEN = 'open',
  PENDING = 'pending',
  RESOLVED = 'resolved',
  BOT = 'bot',
}

export enum ConversationChannel {
  WHATSAPP = 'whatsapp',
}

@Entity('conversations')
@Index(['tenantId', 'status'])
@Index(['tenantId', 'contactId'])
export class Conversation {
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
  instanceId: string

  @Column({ nullable: true })
  assignedUserId: string

  @ManyToOne(() => User, { nullable: true })
  @JoinColumn({ name: 'assignedUserId' })
  assignedUser: User

  @Column({ type: 'enum', enum: ConversationStatus, default: ConversationStatus.BOT })
  status: ConversationStatus

  @Column({ type: 'enum', enum: ConversationChannel, default: ConversationChannel.WHATSAPP })
  channel: ConversationChannel

  @Column({ nullable: true, type: 'text' })
  lastMessage: string

  @Column({ nullable: true })
  lastMessageAt: Date

  @Column({ default: 0 })
  unreadCount: number

  @Column({ default: true })
  botEnabled: boolean

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}
