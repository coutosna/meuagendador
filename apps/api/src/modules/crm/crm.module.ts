import { Module } from '@nestjs/common'
import { TypeOrmModule } from '@nestjs/typeorm'
import { Pipeline, PipelineStage } from './entities/pipeline.entity'
import { Lead, LeadHistory } from './entities/lead.entity'
import { CrmController } from './crm.controller'
import { CrmService } from './crm.service'

@Module({
  imports: [TypeOrmModule.forFeature([Pipeline, PipelineStage, Lead, LeadHistory])],
  controllers: [CrmController],
  providers: [CrmService],
  exports: [CrmService],
})
export class CrmModule {}
