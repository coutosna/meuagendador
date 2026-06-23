import { Injectable, NestMiddleware } from '@nestjs/common'
import { Request, Response, NextFunction } from 'express'
import { JwtService } from '@nestjs/jwt'

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(private readonly jwtService: JwtService) {}

  use(req: Request, res: Response, next: NextFunction) {
    const authHeader = req.headers.authorization
    if (authHeader?.startsWith('Bearer ')) {
      try {
        const token = authHeader.slice(7)
        const payload = this.jwtService.decode(token) as any
        if (payload?.tenantId) {
          req['tenantId'] = payload.tenantId
          req['userId'] = payload.sub
          req['userRole'] = payload.role
        }
      } catch {}
    }
    next()
  }
}
