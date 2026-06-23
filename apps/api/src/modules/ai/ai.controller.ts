import { Controller, Get, Put, Post, Body, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { AiService } from './ai.service'

@Controller('ai')
@UseGuards(JwtAuthGuard)
export class AiController {
  constructor(private readonly service: AiService) {}

  @Get('config')
  getConfig(@CurrentUser() u: any) { return this.service.getConfig(u.tenantId) }

  @Put('config')
  upsertConfig(@CurrentUser() u: any, @Body() dto: any) { return this.service.upsertConfig(u.tenantId, dto) }

  @Post('test')
  testPrompt(@CurrentUser() u: any, @Body() dto: { message: string }) {
    return this.service.testPrompt(u.tenantId, dto.message)
  }
}
