// src/departments/dto/create-department.dto.ts
import { IsString, IsEmail, IsOptional, MaxLength, MinLength } from 'class-validator';

export class CreateDepartmentDto {
    @IsString()
    @MinLength(2, { message: 'Department name must be at least 2 characters' })
    @MaxLength(100, { message: 'Department name must not exceed 100 characters' })
    name: string;

    @IsOptional()
    @IsString()
    @MaxLength(500, { message: 'Description must not exceed 500 characters' })
    description?: string;

    @IsOptional()
    @IsEmail({}, { message: 'Please provide a valid email address' })
    email?: string;

    @IsOptional()
    @IsString()
    phone?: string;
}