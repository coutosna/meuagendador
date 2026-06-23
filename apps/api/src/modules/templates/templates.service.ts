import { Injectable } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { MessageTemplate } from './entities/template.entity'

@Injectable()
export class TemplatesService {
  constructor(@InjectRepository(MessageTemplate) private repo: Repository<MessageTemplate>) {}
  findAll(tenantId: string) { return this.repo.find({ where: { tenantId } }) }
  create(tenantId: string, dto: Partial<MessageTemplate>) { return this.repo.save(this.repo.create({ ...dto, tenantId })) }
  update(tenantId: string, id: string, dto: any) { return this.repo.update({ id, tenantId }, dto) }
  remove(tenantId: string, id: string) { return this.repo.delete({ id, tenantId }) }
}
