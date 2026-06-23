import { Injectable, ConflictException, UnauthorizedException, NotFoundException } from '@nestjs/common'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { JwtService } from '@nestjs/jwt'
import { ConfigService } from '@nestjs/config'
import { User, UserRole } from '../users/entities/user.entity'
import { Tenant, TenantStatus, TenantPlan } from '../tenants/entities/tenant.entity'
import { RegisterDto, LoginDto } from './dto/auth.dto'

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private readonly userRepo: Repository<User>,
    @InjectRepository(Tenant)
    private readonly tenantRepo: Repository<Tenant>,
    private readonly jwtService: JwtService,
    private readonly config: ConfigService,
  ) {}

  async register(dto: RegisterDto) {
    const existingSlug = await this.tenantRepo.findOne({ where: { slug: dto.companySlug } })
    if (existingSlug) {
      throw new ConflictException('Este slug já está em uso. Escolha outro nome de empresa.')
    }

    const tenant = this.tenantRepo.create({
      name: dto.companyName,
      slug: dto.companySlug.toLowerCase().replace(/\s+/g, '-'),
      plan: TenantPlan.FREE,
      status: TenantStatus.TRIAL,
      timezone: 'America/Sao_Paulo',
    })
    await this.tenantRepo.save(tenant)

    const user = this.userRepo.create({
      tenantId: tenant.id,
      name: dto.userName,
      email: dto.email,
      passwordHash: dto.password,
      role: UserRole.OWNER,
      isActive: true,
    })
    await this.userRepo.save(user)

    return this.generateTokens(user, tenant)
  }

  async login(dto: LoginDto) {
    const user = await this.userRepo
      .createQueryBuilder('user')
      .addSelect('user.passwordHash')
      .leftJoinAndSelect('user.tenant', 'tenant')
      .where('user.email = :email', { email: dto.email })
      .andWhere('user.isActive = true')
      .getOne()

    if (!user) throw new UnauthorizedException('Credenciais inválidas')

    const valid = await user.validatePassword(dto.password)
    if (!valid) throw new UnauthorizedException('Credenciais inválidas')

    await this.userRepo.update(user.id, { lastLoginAt: new Date() })

    return this.generateTokens(user, user.tenant)
  }

  async refreshToken(userId: string) {
    const user = await this.userRepo.findOne({
      where: { id: userId },
      relations: ['tenant'],
    })

    if (!user) throw new UnauthorizedException()

    return this.generateTokens(user, user.tenant)
  }

  async getMe(userId: string) {
    return this.userRepo.findOne({
      where: { id: userId },
      relations: ['tenant'],
    })
  }

  private generateTokens(user: User, tenant: Tenant) {
    const payload = {
      sub: user.id,
      tenantId: tenant.id,
      role: user.role,
      email: user.email,
    }

    const accessToken = this.jwtService.sign(payload, {
      secret: this.config.get('JWT_SECRET'),
      expiresIn: this.config.get('JWT_EXPIRES_IN') || '15m',
    })

    const refreshToken = this.jwtService.sign(
      { sub: user.id },
      {
        secret: this.config.get('JWT_REFRESH_SECRET'),
        expiresIn: this.config.get('JWT_REFRESH_EXPIRES_IN') || '7d',
      },
    )

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        avatarUrl: user.avatarUrl,
        tenant: {
          id: tenant.id,
          name: tenant.name,
          slug: tenant.slug,
          plan: tenant.plan,
          status: tenant.status,
        },
      },
    }
  }
}
