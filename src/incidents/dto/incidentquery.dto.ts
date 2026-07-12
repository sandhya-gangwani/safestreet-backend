// src/incidents/dto/incident-query.dto.ts
import { IsOptional, IsEnum, IsNumber, Min, Max } from 'class-validator';
import { IncidentStatus, IncidentPriority, IncidentCategory } from '../incident.entity';

export class IncidentQueryDto {
    @IsOptional()
    @IsEnum(IncidentStatus)
    status?: IncidentStatus;

    @IsOptional()
    @IsEnum(IncidentPriority)
    priority?: IncidentPriority;

    @IsOptional()
    @IsEnum(IncidentCategory)
    category?: IncidentCategory;

    @IsOptional()
    departmentId?: string;

    @IsOptional()
    assignedToId?: string;

    @IsOptional()
    startDate?: string;

    @IsOptional()
    endDate?: string;

    @IsOptional()
    @IsNumber()
    @Min(1)
    page?: number = 1;

    @IsOptional()
    @IsNumber()
    @Min(1)
    @Max(100)
    limit?: number = 10;

    @IsOptional()
    sortBy?: string = 'createdAt';

    @IsOptional()
    order?: 'ASC' | 'DESC' = 'DESC';
}