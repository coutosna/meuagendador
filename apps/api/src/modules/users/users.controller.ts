import { Controller, Get, Post, Patch, Delete, Body, Param, UseGuards } from '@nestjs/common'
import { JwtAuthGuard } from '../../common/guards/jwt-auth.guard'
import { CurrentUser } from '../../common/decorators/tenant.decorator'
import { UsersService } from './users.service'

@Controller('users')
@UseGuards(JwtAuthGuard)
export class UsersController {
  constructor(private readonly service: UsersService) {}

  @Get()
  findAll(@CurrentUser() user: any) { return this.service.findAll(user.tenantId) }

  @Post()
  invite(@CurrentUser() user: any, @Body() dto: any) { return this.service.invite(user.tenantId, dto) }

  @Get(':id')
  findOne(@CurrentUser() user: any, @Param('id') id: string) { return this.service.findById(user.tenantId, id) }

  @Patch(':id')
  update(@CurrentUser() user: any, @Param('id') id: string, @Body() dto: any) {
    return this.service.update(user.tenantId, id, dto)
  }

  @Delete(':id')
  remove(@CurrentUser() user: any, @Param('id') id: string) { return this.service.remove(user.tenantId, id) }
}
