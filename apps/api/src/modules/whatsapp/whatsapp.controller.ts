import { Controller, Get, Post, Delete, Param, Body, Req, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { WhatsappService } from './whatsapp.service'
import { ConfigService } from '@nestjs/config'

@Controller('whatsapp')
export class WhatsappController {
  constructor(
    private readonly service: WhatsappService,
    private readonly config: ConfigService,
  ) {}

  @Get('instances')
  @UseGuards(JwtAuthGuard)
  getInstances(@CurrentUser() u: any) { return this.service.getInstances(u.tenantId) }

  @Post('instances')
  @UseGuards(JwtAuthGuard)
  create(@CurrentUser() u: any, @Body() dto: { instanceName: string }) {
    const appUrl = this.config.get('APP_URL') || 'http://localhost:3001'
    return this.service.createInstance(u.tenantId, dto.instanceName, appUrl)
  }

  @Get('instances/:name/qr')
  @UseGuards(JwtAuthGuard)
  getQr(@CurrentUser() u: any, @Param('name') name: string) {
    return this.service.getInstanceQr(u.tenantId, name)
  }

  @Post('webhook/:instanceName')
  async webhook(@Param('instanceName') instanceName: string, @Body() body: any, @Req() req: any) {
    await this.service.processWebhook(instanceName, body)
    return { ok: true }
  }

  @Post('instances/:name/send')
  @UseGuards(JwtAuthGuard)
  send(@CurrentUser() u: any, @Param('name') _name: string, @Body() dto: { conversationId: string; content: string }) {
    return this.service.sendMessage(u.tenantId, dto.conversationId, dto.content, u.id)
  }
}
