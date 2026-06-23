import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { TemplatesService } from './templates.service'

@Controller('templates')
@UseGuards(JwtAuthGuard)
export class TemplatesController {
  constructor(private readonly service: TemplatesService) {}
  @Get() findAll(@CurrentUser() u: any) { return this.service.findAll(u.tenantId) }
  @Post() create(@CurrentUser() u: any, @Body() dto: any) { return this.service.create(u.tenantId, dto) }
  @Patch(':id') update(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) { return this.service.update(u.tenantId, id, dto) }
  @Delete(':id') remove(@CurrentUser() u: any, @Param('id') id: string) { return this.service.remove(u.tenantId, id) }
}
