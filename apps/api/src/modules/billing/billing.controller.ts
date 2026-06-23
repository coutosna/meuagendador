import { Controller, Get, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { BillingService } from './billing.service'

@Controller('billing')
export class BillingController {
  constructor(private readonly service: BillingService) {}
  @Get('plans') getPlans() { return this.service.getPlans() }
}
