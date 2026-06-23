import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Tenant } from './entities/tenant.entity'

@Injectable()
export class TenantsService {
  constructor(@InjectRepository(Tenant) private readonly repo: Repository<Tenant>) {}

  findById(id: string) { return this.repo.findOne({ where: { id } }) }
  update(id: string, dto: Partial<Tenant>) { return this.repo.update(id, dto) }
}
