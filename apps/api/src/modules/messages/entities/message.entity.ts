import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  ManyToOne, JoinColumn, Index,
} from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'
import { Conversation } from '../../conversations/entities/conversation.entity'

export enum MessageSenderType {
  CONTACT = 'contact',
  USER = 'user',
  BOT = 'bot',
  SYSTEM = 'system',
}

export enum MessageType {
  TEXT = 'text',
  IMAGE = 'image',
  AUDIO = 'audio',
  VIDEO = 'video',
  DOCUMENT = 'document',
  TEMPLATE = 'template',
  STICKER = 'sticker',
}

export enum MessageStatus {
  SENT = 'sent',
  DELIVERED = 'delivered',
  READ = 'read',
  FAILED = 'failed',
}

@Entity('messages')
@Index(['conversationId', 'createdAt'])
@Index(['externalId'])
export class Message {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant

  @Column()
  conversationId: string

  @ManyToOne(() => Conversation)
  @JoinColumn({ name: 'conversationId' })
  conversation: Conversation

  @Column({ type: 'enum', enum: MessageSenderType })
  senderType: MessageSenderType

  @Column({ nullable: true })
  senderId: string

  @Column({ type: 'text', nullable: true })
  content: string

  @Column({ type: 'enum', enum: MessageType, default: MessageType.TEXT })
  type: MessageType

  @Column({ nullable: true })
  mediaUrl: string

  @Column({ nullable: true })
  mediaMime: string

  @Column({ nullable: true, unique: false })
  externalId: string

  @Column({ type: 'enum', enum: MessageStatus, default: MessageStatus.SENT })
  status: MessageStatus

  @Column({ type: 'jsonb', nullable: true })
  metadata: Record<string, any>

  @Column({ nullable: true })
  sentAt: Date

  @CreateDateColumn()
  createdAt: Date
}
