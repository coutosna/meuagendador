import { Injectable, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { Pipeline, PipelineStage } from './entities/pipeline.entity'
import { Lead, LeadHistory } from './entities/lead.entity'

@Injectable()
export class CrmService {
  constructor(
    @InjectRepository(Pipeline) private readonly pipelineRepo: Repository<Pipeline>,
    @InjectRepository(PipelineStage) private readonly stageRepo: Repository<PipelineStage>,
    @InjectRepository(Lead) private readonly leadRepo: Repository<Lead>,
    @InjectRepository(LeadHistory) private readonly historyRepo: Repository<LeadHistory>,
  ) {}

  getPipelines(tenantId: string) {
    return this.pipelineRepo.find({ where: { tenantId }, relations: ['stages'], order: { createdAt: 'ASC' } })
  }

  async createDefaultPipeline(tenantId: string) {
    const pipeline = await this.pipelineRepo.save(
      this.pipelineRepo.create({ tenantId, name: 'Pipeline Principal', isDefault: true }),
    )
    const stages = [
      { name: 'Novo Lead', color: '#6366f1', position: 0 },
      { name: 'Qualificado', color: '#8b5cf6', position: 1 },
      { name: 'Agendado', color: '#06b6d4', position: 2 },
      { name: 'Compareceu', color: '#f59e0b', position: 3 },
      { name: 'Fechado', color: '#10b981', position: 4, isWon: true },
      { name: 'Perdido', color: '#ef4444', position: 5, isLost: true },
    ]
    for (const s of stages) {
      await this.stageRepo.save(this.stageRepo.create({ ...s, pipelineId: pipeline.id, tenantId }))
    }
    return pipeline
  }

  getLeads(tenantId: string, pipelineId?: string, stageId?: string) {
    const where: any = { tenantId }
    if (pipelineId) where.pipelineId = pipelineId
    if (stageId) where.stageId = stageId
    return this.leadRepo.find({ where, relations: ['contact', 'stage', 'assignedUser'], order: { createdAt: 'DESC' } })
  }

  getLead(tenantId: string, id: string) {
    return this.leadRepo.findOne({ where: { id, tenantId }, relations: ['contact', 'stage', 'pipeline', 'assignedUser'] })
  }

  async createLead(tenantId: string, dto: Partial<Lead>) {
    const pipeline = await this.pipelineRepo.findOne({ where: { tenantId, isDefault: true }, relations: ['stages'] })
    if (!pipeline) throw new NotFoundException('Pipeline não encontrado')
    const firstStage = pipeline.stages.sort((a, b) => a.position - b.position)[0]
    const lead = this.leadRepo.create({ ...dto, tenantId, pipelineId: pipeline.id, stageId: dto.stageId || firstStage.id })
    return this.leadRepo.save(lead)
  }

  async moveStage(tenantId: string, leadId: string, stageId: string, changedById: string, reason?: string) {
    const lead = await this.getLead(tenantId, leadId)
    if (!lead) throw new NotFoundException('Lead não encontrado')
    const fromStageId = lead.stageId
    await this.leadRepo.update({ id: leadId, tenantId }, { stageId })
    await this.historyRepo.save(this.historyRepo.create({ leadId, tenantId, fromStageId, toStageId: stageId, changedById, reason }))
    return { leadId, stageId, fromStageId }
  }

  getLeadHistory(tenantId: string, leadId: string) {
    return this.historyRepo.find({ where: { leadId, tenantId }, order: { createdAt: 'DESC' } })
  }
}
