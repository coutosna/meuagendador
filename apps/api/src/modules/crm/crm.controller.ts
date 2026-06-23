import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { CrmService } from './crm.service'

@Controller('crm')
@UseGuards(JwtAuthGuard)
export class CrmController {
  constructor(private readonly service: CrmService) {}

  @Get('pipelines')
  getPipelines(@CurrentUser() u: any) { return this.service.getPipelines(u.tenantId) }

  @Post('pipelines/default')
  createDefault(@CurrentUser() u: any) { return this.service.createDefaultPipeline(u.tenantId) }

  @Get('leads')
  getLeads(@CurrentUser() u: any, @Query('pipelineId') pipelineId: string, @Query('stageId') stageId: string) {
    return this.service.getLeads(u.tenantId, pipelineId, stageId)
  }

  @Post('leads')
  createLead(@CurrentUser() u: any, @Body() dto: any) { return this.service.createLead(u.tenantId, dto) }

  @Get('leads/:id')
  getLead(@CurrentUser() u: any, @Param('id') id: string) { return this.service.getLead(u.tenantId, id) }

  @Patch('leads/:id')
  updateLead(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) {
    return this.service['leadRepo'].update({ id, tenantId: u.tenantId }, dto)
  }

  @Patch('leads/:id/stage')
  moveStage(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: { stageId: string; reason?: string }) {
    return this.service.moveStage(u.tenantId, id, dto.stageId, u.id, dto.reason)
  }

  @Get('leads/:id/history')
  getHistory(@CurrentUser() u: any, @Param('id') id: string) { return this.service.getLeadHistory(u.tenantId, id) }
}
