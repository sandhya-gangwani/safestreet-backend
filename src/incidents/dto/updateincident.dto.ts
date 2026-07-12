// src/incidents/dto/update-incident.dto.ts
import { PartialType } from '@nestjs/swagger';
import { CreateIncidentDto } from './createincident.dto';
import { IsEnum, IsOptional, IsString, IsUUID } from 'class-validator';
import { IncidentStatus } from '../incident.entity';

export class UpdateIncidentDto extends PartialType(CreateIncidentDto) {
    @IsOptional()
    @IsEnum(IncidentStatus, { message: 'Invalid status' })
    status?: IncidentStatus;

    @IsOptional()
    @IsUUID()
    assignedToId?: string;

    @IsOptional()
    @IsString()
    resolvedNotes?: string;

    @IsOptional()
    @IsUUID()
    departmentId?: string;
}