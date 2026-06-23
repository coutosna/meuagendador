import { Controller, Get, Post, Patch, Delete, Body, Param, Query, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { ContactsService } from './contacts.service'

@Controller('contacts')
@UseGuards(JwtAuthGuard)
export class ContactsController {
  constructor(private readonly service: ContactsService) {}

  @Get()
  async findAll(@CurrentUser() u: any, @Query('search') search: string, @Query('page') page: number, @Query('limit') limit: number) {
    const [data, total] = await this.service.findAll(u.tenantId, search, page, limit)
    return { data, meta: { total, page: +page || 1, limit: +limit || 20 } }
  }

  @Post()
  create(@CurrentUser() u: any, @Body() dto: any) { return this.service.create(u.tenantId, dto) }

  @Get(':id')
  findOne(@CurrentUser() u: any, @Param('id') id: string) { return this.service.findOne(u.tenantId, id) }

  @Patch(':id')
  update(@CurrentUser() u: any, @Param('id') id: string, @Body() dto: any) { return this.service.update(u.tenantId, id, dto) }

  @Delete(':id')
  remove(@CurrentUser() u: any, @Param('id') id: string) { return this.service.remove(u.tenantId, id) }
}
