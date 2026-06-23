import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { DashboardService } from './dashboard.service'

@Controller('dashboard')
@UseGuards(JwtAuthGuard)
export class DashboardController {
  constructor(private readonly service: DashboardService) {}

  @Get('overview')
  overview(@CurrentUser() u: any) { return this.service.getOverview(u.tenantId) }

  @Get('today')
  today(@CurrentUser() u: any) { return this.service.getTodayAppointments(u.tenantId) }

  @Get('financial')
  financial(@CurrentUser() u: any) { return this.service.getFinancial(u.tenantId) }
}
