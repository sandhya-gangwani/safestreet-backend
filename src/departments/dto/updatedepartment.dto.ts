// src/departments/dto/update-department.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateDepartmentDto } from './createdepartment.dto';
import { IsBoolean, IsOptional } from 'class-validator';

export class UpdateDepartmentDto extends PartialType(CreateDepartmentDto) {
    @IsOptional()
    @IsBoolean()
    isActive?: boolean;
}