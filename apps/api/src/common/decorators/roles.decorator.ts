import { SetMetadata } from '@nestjs/common'

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  AGENT = 'agent',
  VIEWER = 'viewer',
}

export const ROLES_KEY = 'roles'
export const Roles = (...roles: UserRole[]) => SetMetadata(ROLES_KEY, roles)
