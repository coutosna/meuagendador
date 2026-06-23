import { Controller, Post, Body, Headers, UnauthorizedException } from '@nestjs/common'
import { ConfigService } from '@nestjs/config'
import * as crypto from 'crypto'

@Controller('webhooks')
export class WebhooksController {
  constructor(private readonly config: ConfigService) {}

  @Post('n8n')
  receiveN8n(@Body() body: any, @Headers('x-webhook-secret') secret: string) {
    const expected = this.config.get('N8N_WEBHOOK_SECRET')
    if (expected && secret !== expected) throw new UnauthorizedException()
    return { received: true, event: body.event, timestamp: new Date() }
  }
}
