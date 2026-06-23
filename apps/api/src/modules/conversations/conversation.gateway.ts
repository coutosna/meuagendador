import {
  WebSocketGateway, WebSocketServer, SubscribeMessage,
  MessageBody, ConnectedSocket, OnGatewayConnection, OnGatewayDisconnect,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'
import { JwtService } from '@nestjs/jwt'
import { Logger } from '@nestjs/common'

@WebSocketGateway({
  cors: { origin: process.env.FRONTEND_URL || 'http://localhost:3000', credentials: true },
  namespace: '/',
})
export class ConversationGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server

  private readonly logger = new Logger('ConversationGateway')
  private clientTenantMap = new Map<string, string>()

  constructor(private readonly jwtService: JwtService) {}

  async handleConnection(client: Socket) {
    try {
      const token = client.handshake.auth.token || client.handshake.headers.authorization?.slice(7)
      if (!token) { client.disconnect(); return }

      const payload = this.jwtService.verify(token, { secret: process.env.JWT_SECRET }) as any
      this.clientTenantMap.set(client.id, payload.tenantId)
      client.join(`tenant:${payload.tenantId}`)
      this.logger.log(`Client connected: ${client.id} → tenant ${payload.tenantId}`)
    } catch {
      client.disconnect()
    }
  }

  handleDisconnect(client: Socket) {
    this.clientTenantMap.delete(client.id)
    this.logger.log(`Client disconnected: ${client.id}`)
  }

  @SubscribeMessage('join_conversation')
  handleJoinConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.join(`conversation:${data.conversationId}`)
  }

  @SubscribeMessage('leave_conversation')
  handleLeaveConversation(@ConnectedSocket() client: Socket, @MessageBody() data: { conversationId: string }) {
    client.leave(`conversation:${data.conversationId}`)
  }

  emitToTenant(tenantId: string, event: string, data: any) {
    this.server.to(`tenant:${tenantId}`).emit(event, data)
  }

  emitToConversation(conversationId: string, event: string, data: any) {
    this.server.to(`conversation:${conversationId}`).emit(event, data)
  }

  emitNewMessage(tenantId: string, conversationId: string, message: any) {
    this.emitToTenant(tenantId, 'message:new', { conversationId, message })
    this.emitToConversation(conversationId, 'message:new', { message })
  }

  emitConversationUpdate(tenantId: string, conversation: any) {
    this.emitToTenant(tenantId, 'conversation:updated', conversation)
  }

  emitAiTyping(tenantId: string, conversationId: string) {
    this.emitToTenant(tenantId, 'ai:typing', { conversationId })
  }

  emitLeadStageChange(tenantId: string, leadId: string, stageId: string) {
    this.emitToTenant(tenantId, 'lead:stage_changed', { leadId, stageId })
  }
}
