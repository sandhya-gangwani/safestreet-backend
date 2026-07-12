// src/auth/auth.service.ts
import { Injectable, UnauthorizedException, BadRequestException } from '@nestjs/common';
import { JwtService } from '@nestjs/jwt';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from '../users/user.entity';
import { LoginDto } from './dto/login.dto';
import { RegisterDto } from './dto/register.dto';

@Injectable()
export class AuthService {  // ✅ Make sure this is exported
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(email: string, password: string): Promise<any> {
    const user = await this.userRepository.findOne({ 
      where: { email },
      relations: ['department'],
    });
    
    if (!user) {
      throw new UnauthorizedException('Invalid credentials');
    }

    const isValid = await user.validatePassword(password);
    if (!isValid) {
      throw new UnauthorizedException('Invalid credentials');
    }

    if (!user.isActive) {
      throw new UnauthorizedException('Account is deactivated');
    }

    const { password_hash, ...result } = user;
    return result;
  }

  async login(loginDto: LoginDto) {
    const user = await this.validateUser(loginDto.email, loginDto.password);
    
    const payload = { 
      sub: user.id, 
      email: user.email, 
      role: user.role,
      departmentId: user.departmentId,
    };

    const accessToken = this.jwtService.sign(payload);
    const refreshToken = this.jwtService.sign(payload, { expiresIn: '7d' });

    await this.userRepository.update(user.id, { refreshToken });

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        fullName: user.fullName,
        role: user.role,
        department: user.department,
      },
    };
  }

  async register(registerDto: RegisterDto) {
    const existingUser = await this.userRepository.findOne({
      where: { email: registerDto.email },
    });

    if (existingUser) {
      throw new BadRequestException('Email already registered');
    }

    const user = this.userRepository.create({
      email: registerDto.email,
      password_hash: registerDto.password,
      fullName: registerDto.fullName,
      role: registerDto.role || UserRole.CITIZEN,
      phone: registerDto.phone,
      departmentId: registerDto.departmentId,
    });

    await this.userRepository.save(user);

    const { password_hash, ...result } = user;
    return result;
  }

  async refreshToken(refreshToken: string) {
    try {
      const payload = this.jwtService.verify(refreshToken);
      const user = await this.userRepository.findOne({
        where: { id: payload.sub, refreshToken },
      });

      if (!user) {
        throw new UnauthorizedException('Invalid refresh token');
      }

      const newPayload = {
        sub: user.id,
        email: user.email,
        role: user.role,
        departmentId: user.departmentId,
      };

      const newAccessToken = this.jwtService.sign(newPayload);

      return { accessToken: newAccessToken };
    } catch (error) {
      throw new UnauthorizedException('Invalid refresh token');
    }
  }

  async logout(userId: string) {
    await this.userRepository.update(userId, { refreshToken: '' });
    return { message: 'Logged out successfully' };
  }

  async getUserProfile(userId: string) {
    const user = await this.userRepository.findOne({
      where: { id: userId },
      relations: ['department'],
    });
    
    if (!user) {
      throw new UnauthorizedException('User not found');
    }

    const { password_hash, refreshToken, ...result } = user;
    return result;
  }
}