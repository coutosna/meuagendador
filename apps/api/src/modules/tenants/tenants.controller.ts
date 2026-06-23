import { Controller, Get, Patch, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { TenantsService } from './tenants.service'

@Controller('tenant')
@UseGuards(JwtAuthGuard)
export class TenantsController {
  constructor(private readonly service: TenantsService) {}

  @Get()
  get(@CurrentUser() user: any) { return this.service.findById(user.tenantId) }

  @Patch()
  update(@CurrentUser() user: any, @Body() dto: any) { return this.service.update(user.tenantId, dto) }
}
