import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User, UserRole } from './entities/user.entity'

@Injectable()
export class UsersService {
  constructor(@InjectRepository(User) private readonly repo: Repository<User>) {}

  findAll(tenantId: string) {
    return this.repo.find({ where: { tenantId }, order: { createdAt: 'DESC' } })
  }

  findById(tenantId: string, id: string) {
    return this.repo.findOne({ where: { id, tenantId } })
  }

  async invite(tenantId: string, dto: { name: string; email: string; role: UserRole }) {
    const user = this.repo.create({
      tenantId,
      name: dto.name,
      email: dto.email,
      role: dto.role,
      passwordHash: Math.random().toString(36).slice(-12),
      isActive: true,
    })
    return this.repo.save(user)
  }

  update(tenantId: string, id: string, dto: Partial<User>) {
    return this.repo.update({ id, tenantId }, dto)
  }

  async remove(tenantId: string, id: string) {
    await this.repo.softDelete({ id, tenantId })
  }
}
