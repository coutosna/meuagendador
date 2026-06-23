import { Injectable, CanActivate, ExecutionContext, ForbiddenException } from '@nestjs/common'
import { Reflector } from '@nestjs/core'
import { ROLES_KEY, UserRole } from '../decorators/roles.decorator'

@Injectable()
export class RolesGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<UserRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ])

    if (!requiredRoles) return true

    const { user } = context.switchToHttp().getRequest()

    const roleHierarchy: Record<UserRole, number> = {
      [UserRole.OWNER]: 4,
      [UserRole.ADMIN]: 3,
      [UserRole.AGENT]: 2,
      [UserRole.VIEWER]: 1,
    }

    const userLevel = roleHierarchy[user?.role as UserRole] || 0
    const minRequired = Math.min(...requiredRoles.map((r) => roleHierarchy[r]))

    if (userLevel < minRequired) {
      throw new ForbiddenException('Você não tem permissão para esta ação')
    }

    return true
  }
}
