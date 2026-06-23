import { Module, Global } from '@nestjs/common'
import { WebhooksController } from './webhooks.controller'
import { N8nWebhookService } from './n8n-webhook.service'

@Global()
@Module({
  controllers: [WebhooksController],
  providers: [N8nWebhookService],
  exports: [N8nWebhookService],
})
export class WebhooksModule {}
