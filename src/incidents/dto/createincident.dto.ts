// src/incidents/dto/create-incident.dto.ts
import { 
    IsString, 
    IsNumber, 
    IsEnum, 
    IsOptional, 
    Min, 
    Max, 
    MinLength, 
    MaxLength,
    IsUUID,
} from 'class-validator';
import { IncidentCategory, IncidentPriority } from '../incident.entity';

export class CreateIncidentDto {
    @IsString()
    @MinLength(3, { message: 'Title must be at least 3 characters' })
    @MaxLength(200, { message: 'Title must not exceed 200 characters' })
    title: string;

    @IsString()
    @MinLength(10, { message: 'Description must be at least 10 characters' })
    @MaxLength(2000, { message: 'Description must not exceed 2000 characters' })
    description: string;

    @IsEnum(IncidentCategory, { message: 'Invalid category' })
    category: IncidentCategory;

    @IsOptional()
    @IsEnum(IncidentPriority, { message: 'Invalid priority' })
    priority?: IncidentPriority;

    @IsNumber()
    @Min(-90)
    @Max(90)
    latitude: number;

    @IsNumber()
    @Min(-180)
    @Max(180)
    longitude: number;

    @IsOptional()
    @IsString()
    address?: string;

    @IsOptional()
    @IsUUID()
    departmentId?: string;
}