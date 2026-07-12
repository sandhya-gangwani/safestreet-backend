// src/departments/departments.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { DepartmentsController } from './department.controller';
import { DepartmentsService } from './department.service';
import { Department } from './department.entity';

@Module({
    imports: [TypeOrmModule.forFeature([Department])],
    controllers: [DepartmentsController],
    providers: [DepartmentsService],
    exports: [DepartmentsService],
})
export class DepartmentsModule {}