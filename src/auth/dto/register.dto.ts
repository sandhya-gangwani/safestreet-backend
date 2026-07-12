// src/auth/dto/register.dto.ts
import { IsEmail, IsString,Matches, MinLength, IsOptional, IsEnum, IsUUID } from 'class-validator';
import { UserRole } from '../../users/user.entity';

export class RegisterDto {
  @IsEmail({}, { message: 'Please provide a valid email address' })
  email: string = '';

  @IsString()
  @MinLength(6, { message: 'Password must be at least 6 characters long' })
  @Matches(/^(?=.*[A-Za-z])(?=.*\d)/, {
    message: 'Password must contain at least one letter and one number',
  })
  password: string = '';

  @IsString()
  fullName: string='';

  @IsOptional()
  @IsEnum(UserRole)
  role?: UserRole;

  @IsOptional()
  @IsString()
  phone?: string;

  @IsOptional()
  @IsUUID()
  departmentId?: string;
}