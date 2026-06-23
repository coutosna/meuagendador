import { Controller, Get, Post, Patch, Param, Body, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { ConversationsService } from './conversations.service'
import { WhatsappService } from '../whatsapp/whatsapp.service'

@Controller('conversations')
@UseGuards(JwtAuthGuard)
export class ConversationsController {
  constructor(
    private readonly service: ConversationsService,
    // WhatsappService injected via module
  ) {}

  @Get()
  async findAll(@CurrentUser() u: any, @Query('status') status: any, @Query('page') page: number, @Query('limit') limit: number) {
    const [data, total] = await this.service.findAll(u.tenantId, status, +page || 1, +limit || 20)
    return { data, meta: { total, page: +page || 1 } }
  }

  @Get(':id')
  findOne(@CurrentUser() u: any, @Param('id') id: string) { return this.service.findOne(u.tenantId, id) }

  @Get(':id/messages')
  getMessages(@CurrentUser() u: any, @Param('id') id: string, @Query('cursor') cursor: string) {
    return this.service.getMessages(u.tenantId, id, cursor)
  }

  @Patch(':id')
  update(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(u.tenantId, id, dto)
  }

  @Post(':id/toggle-bot')
  toggleBot(@CurrentUser() u: any, @Param('id') id: string) { return this.service.toggleBot(u.tenantId, id) }

  @Post(':id/read')
  markRead(@CurrentUser() u: any, @Param('id') id: string) { return this.service.markAsRead(u.tenantId, id) }
}
