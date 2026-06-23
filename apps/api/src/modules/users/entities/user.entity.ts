import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, DeleteDateColumn, ManyToOne, JoinColumn, BeforeInsert, BeforeUpdate,
} from 'typeorm'
import * as bcrypt from 'bcryptjs'
import { Tenant } from '../../tenants/entities/tenant.entity'

export enum UserRole {
  OWNER = 'owner',
  ADMIN = 'admin',
  AGENT = 'agent',
  VIEWER = 'viewer',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant

  @Column({ length: 255 })
  name: string

  @Column({ length: 255, unique: false })
  email: string

  @Column({ select: false })
  passwordHash: string

  @Column({ type: 'enum', enum: UserRole, default: UserRole.AGENT })
  role: UserRole

  @Column({ nullable: true })
  avatarUrl: string

  @Column({ default: true })
  isActive: boolean

  @Column({ nullable: true })
  lastLoginAt: Date

  @Column({ nullable: true })
  invitedBy: string

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date

  @DeleteDateColumn()
  deletedAt: Date

  @BeforeInsert()
  @BeforeUpdate()
  async hashPassword() {
    if (this.passwordHash && !this.passwordHash.startsWith('$2')) {
      this.passwordHash = await bcrypt.hash(this.passwordHash, 12)
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.passwordHash)
  }
}
