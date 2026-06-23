import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Conversation, ConversationStatus } from './entities/conversation.entity'
import { Message } from '../messages/entities/message.entity'

@Injectable()
export class ConversationsService {
  constructor(
    @InjectRepository(Conversation) private readonly repo: Repository<Conversation>,
    @InjectRepository(Message) private readonly messageRepo: Repository<Message>,
  ) {}

  findAll(tenantId: string, status?: ConversationStatus, page = 1, limit = 20) {
    const where: any = { tenantId }
    if (status) where.status = status
    return this.repo.findAndCount({
      where,
      relations: ['contact', 'assignedUser'],
      order: { lastMessageAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })
  }

  findOne(tenantId: string, id: string) {
    return this.repo.findOne({ where: { id, tenantId }, relations: ['contact', 'assignedUser'] })
  }

  getMessages(tenantId: string, conversationId: string, cursor?: string, limit = 30) {
    const qb = this.messageRepo
      .createQueryBuilder('m')
      .where('m.tenantId = :tenantId AND m.conversationId = :conversationId', { tenantId, conversationId })
      .orderBy('m.createdAt', 'DESC')
      .take(limit)
    if (cursor) qb.andWhere('m.createdAt < :cursor', { cursor })
    return qb.getMany()
  }

  update(tenantId: string, id: string, dto: Partial<Conversation>) {
    return this.repo.update({ id, tenantId }, dto)
  }

  async toggleBot(tenantId: string, id: string) {
    const conv = await this.findOne(tenantId, id)
    if (!conv) return null
    await this.repo.update(id, { botEnabled: !conv.botEnabled })
    return { botEnabled: !conv.botEnabled }
  }

  async markAsRead(tenantId: string, id: string) {
    await this.repo.update({ id, tenantId }, { unreadCount: 0 })
  }
}
