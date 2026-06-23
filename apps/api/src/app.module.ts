import { Module, MiddlewareConsumer, NestModule } from '@nestjs/common'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { TypeOrmModule } from '@nestjs/typeorm'
import { ThrottlerModule } from '@nestjs/throttler'
import { BullModule } from '@nestjs/bull'
import { ScheduleModule } from '@nestjs/schedule'

import { AuthModule } from './modules/auth/auth.module'
import { TenantsModule } from './modules/tenants/tenants.module'
import { UsersModule } from './modules/users/users.module'
import { ContactsModule } from './modules/contacts/contacts.module'
import { ConversationsModule } from './modules/conversations/conversations.module'
import { MessagesModule } from './modules/messages/messages.module'
import { WhatsappModule } from './modules/whatsapp/whatsapp.module'
import { AiModule } from './modules/ai/ai.module'
import { CrmModule } from './modules/crm/crm.module'
import { AgendaModule } from './modules/agenda/agenda.module'
import { DashboardModule } from './modules/dashboard/dashboard.module'
import { ReportsModule } from './modules/reports/reports.module'
import { TemplatesModule } from './modules/templates/templates.module'
import { BillingModule } from './modules/billing/billing.module'
import { WebhooksModule } from './modules/webhooks/webhooks.module'
import { TenantMiddleware } from './common/middlewares/tenant.middleware'

@Module({
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),

    TypeOrmModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        type: 'postgres',
        url: config.get('DATABASE_URL'),
        entities: [__dirname + '/**/*.entity{.ts,.js}'],
        migrations: [__dirname + '/database/migrations/*{.ts,.js}'],
        synchronize: config.get('NODE_ENV') === 'development',
        logging: config.get('NODE_ENV') === 'development',
        ssl: config.get('NODE_ENV') === 'production' ? { rejectUnauthorized: false } : false,
      }),
      inject: [ConfigService],
    }),

    BullModule.forRootAsync({
      imports: [ConfigModule],
      useFactory: (config: ConfigService) => ({
        redis: config.get('REDIS_URL'),
      }),
      inject: [ConfigService],
    }),

    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    ScheduleModule.forRoot(),

    AuthModule,
    TenantsModule,
    UsersModule,
    ContactsModule,
    ConversationsModule,
    MessagesModule,
    WhatsappModule,
    AiModule,
    CrmModule,
    AgendaModule,
    DashboardModule,
    ReportsModule,
    TemplatesModule,
    BillingModule,
    WebhooksModule,
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantMiddleware).forRoutes('*')
  }
}
