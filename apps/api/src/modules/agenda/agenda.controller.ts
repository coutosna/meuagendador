import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { AgendaService } from './agenda.service'
import { AppointmentStatus } from './entities/appointment.entity'

@Controller('agenda')
@UseGuards(JwtAuthGuard)
export class AgendaController {
  constructor(private readonly service: AgendaService) {}

  @Get('services') getServices(@CurrentUser() u: any) { return this.service.getServices(u.tenantId) }
  @Post('services') createService(@CurrentUser() u: any, @Body() dto: any) { return this.service.createService(u.tenantId, dto) }
  @Patch('services/:id') updateService(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) { return this.service.updateService(u.tenantId, id, dto) }
  @Delete('services/:id') deleteService(@CurrentUser() u: any, @Param('id') id: string) { return this.service.deleteService(u.tenantId, id) }

  @Get('availability') getAvailability(@CurrentUser() u: any) { return this.service.getAvailability(u.tenantId) }
  @Post('availability') setAvailability(@CurrentUser() u: any, @Body() dto: { slots: any[] }) { return this.service.setAvailability(u.tenantId, dto.slots) }

  @Get('slots') getSlots(@CurrentUser() u: any, @Query('date') date: string, @Query('serviceId') serviceId: string) {
    return this.service.getAvailableSlots(u.tenantId, date, serviceId)
  }

  @Get('appointments') getAll(@CurrentUser() u: any, @Query('from') from: string, @Query('to') to: string) {
    return this.service.getAppointments(u.tenantId, from, to)
  }

  @Post('appointments') create(@CurrentUser() u: any, @Body() dto: any) { return this.service.createAppointment(u.tenantId, dto) }
  @Get('appointments/:id') getOne(@CurrentUser() u: any, @Param('id') id: string) { return this.service.getAppointment(u.tenantId, id) }
  @Post('appointments/:id/confirm') confirm(@CurrentUser() u: any, @Param('id') id: string) { return this.service.updateStatus(u.tenantId, id, AppointmentStatus.CONFIRMED) }
  @Post('appointments/:id/cancel') cancel(@CurrentUser() u: any, @Param('id') id: string) { return this.service.updateStatus(u.tenantId, id, AppointmentStatus.CANCELLED) }
  @Post('appointments/:id/complete') complete(@CurrentUser() u: any, @Param('id') id: string) { return this.service.updateStatus(u.tenantId, id, AppointmentStatus.COMPLETED) }
}
