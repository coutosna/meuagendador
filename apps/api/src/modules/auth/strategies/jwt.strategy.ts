import { Injectable, UnauthorizedException } from '@nestjs/common'
import { PassportStrategy } from '@nestjs/passport'
import { ExtractJwt, Strategy } from 'passport-jwt'
import { ConfigService } from '@nestjs/config'
import { InjectRepository } from '@nestjs/typeorm'
import { Repository } from 'typeorm'
import { User } from '../../users/entities/user.entity'

@Injectable()
export class JwtStrategy extends PassportStrategy(Strategy) {
  constructor(
    private config: ConfigService,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
  ) {
    super({
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      ignoreExpiration: false,
      secretOrKey: config.get('JWT_SECRET'),
    })
  }

  async validate(payload: { sub: string; tenantId: string; role: string }) {
    const user = await this.userRepository.findOne({
      where: { id: payload.sub, isActive: true },
    })

    if (!user) throw new UnauthorizedException()

    return {
      id: payload.sub,
      tenantId: payload.tenantId,
      role: payload.role,
      email: user.email,
      name: user.name,
    }
  }
}
