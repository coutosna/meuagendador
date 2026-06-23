import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { JwtModule } from '@nestjs/jwt'
import { ConfigModule, ConfigService } from '@nestjs/config'
import { BullModule } from '@nestjs/bull'
import { Conversation } from './entities/conversation.entity'
import { Message } from '../messages/entities/message.entity'
import { ConversationsController } from './conversations.controller'
import { ConversationsService } from './conversations.service'
import { ConversationGateway } from './conversation.gateway'

@Module({
  imports: [
    TypeOrmModule.forFeature([Conversation, Message]),
    JwtModule.registerAsync({
      imports: [ConfigModule],
      useFactory: (c: ConfigService) => ({ secret: c.get('JWT_SECRET') }),
      inject: [ConfigService],
    }),
    BullModule.registerQueue({ name: 'whatsapp:outbound' }),
  ],
  controllers: [ConversationsController],
  providers: [ConversationsService, ConversationGateway],
  exports: [ConversationsService, ConversationGateway],
})
export class ConversationsModule {}
