import { Module } from '@nestjs/common';
import { SequelizeModule } from '@nestjs/sequelize';
import { Symptom } from './symptom.model';

@Module({
  imports: [SequelizeModule.forFeature([Symptom])],
  exports: [SequelizeModule],
})
export class SymptomsModule {}
