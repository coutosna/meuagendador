import {
  Entity, PrimaryGeneratedColumn, Column, CreateDateColumn,
  UpdateDateColumn, ManyToOne, JoinColumn, OneToMany,
} from 'typeorm'
import { Tenant } from '../../tenants/entities/tenant.entity'

@Entity('pipelines')
export class Pipeline {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  tenantId: string

  @ManyToOne(() => Tenant)
  @JoinColumn({ name: 'tenantId' })
  tenant: Tenant

  @Column({ length: 255 })
  name: string

  @Column({ default: false })
  isDefault: boolean

  @OneToMany(() => PipelineStage, (stage) => stage.pipeline, { eager: true })
  stages: PipelineStage[]

  @CreateDateColumn()
  createdAt: Date

  @UpdateDateColumn()
  updatedAt: Date
}

@Entity('pipeline_stages')
export class PipelineStage {
  @PrimaryGeneratedColumn('uuid')
  id: string

  @Column()
  pipelineId: string

  @ManyToOne(() => Pipeline, (p) => p.stages)
  @JoinColumn({ name: 'pipelineId' })
  pipeline: Pipeline

  @Column()
  tenantId: string

  @Column({ length: 100 })
  name: string

  @Column({ length: 7, default: '#6366f1' })
  color: string

  @Column({ default: 0 })
  position: number

  @Column({ default: false })
  isWon: boolean

  @Column({ default: false })
  isLost: boolean
}
