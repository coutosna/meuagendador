import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository, ILike } from 'typeorm'
import { Contact } from './entities/contact.entity'

@Injectable()
export class ContactsService {
  constructor(@InjectRepository(Contact) private readonly repo: Repository<Contact>) {}

  findAll(tenantId: string, search?: string, page = 1, limit = 20) {
    const where: any = { tenantId }
    if (search) where.name = ILike(`%${search}%`)
    return this.repo.findAndCount({
      where,
      order: { createdAt: 'DESC' },
      skip: (page - 1) * limit,
      take: limit,
    })
  }

  findOne(tenantId: string, id: string) {
    return this.repo.findOne({ where: { id, tenantId } })
  }

  create(tenantId: string, dto: Partial<Contact>) {
    return this.repo.save(this.repo.create({ ...dto, tenantId }))
  }

  async update(tenantId: string, id: string, dto: Partial<Contact>) {
    const contact = await this.findOne(tenantId, id)
    if (!contact) throw new NotFoundException()
    Object.assign(contact, dto)
    return this.repo.save(contact)
  }

  async remove(tenantId: string, id: string) {
    await this.repo.softDelete({ id, tenantId })
  }
}
