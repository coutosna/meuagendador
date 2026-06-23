import { Controller, Get, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { ReportsService } from './reports.service'

@Controller('reports')
@UseGuards(JwtAuthGuard)
export class ReportsController {
  constructor(private readonly service: ReportsService) {}

  @Get('leads') getLeads(@CurrentUser() u: any, @Query('from') from: string, @Query('to') to: string) {
    return this.service.getLeadsReport(u.tenantId, from, to)
  }

  @Get('appointments') getAppointments(@CurrentUser() u: any, @Query('from') from: string, @Query('to') to: string) {
    return this.service.getAppointmentsReport(u.tenantId, from, to)
  }
}
