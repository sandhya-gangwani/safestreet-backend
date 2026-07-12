// src/users/users.service.ts
import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User, UserRole } from './user.entity';

@Injectable()
export class UsersService {
  constructor(
    @InjectRepository(User)
    private userRepository: Repository<User>,
  ) {}

  async findAll() {
    return this.userRepository.find({
      relations: ['department'],
      select: ['id', 'email', 'fullName', 'role', 'phone', 'isActive', 'createdAt', 'departmentId'],
    });
  }

  async findOne(id: string) {
    const user = await this.userRepository.findOne({
      where: { id },
      relations: ['department'],
    });

    if (!user) {
      throw new NotFoundException('User not found');
    }

    const { password_hash, refreshToken, ...result } = user;
    return result;
  }

  async findByRole(role: UserRole) {
    return this.userRepository.find({
      where: { role, isActive: true },
      relations: ['department'],
    });
  }

  async findByDepartment(departmentId: string) {
    return this.userRepository.find({
      where: { departmentId, isActive: true },
      relations: ['department'],
    });
  }

  async updateUser(id: string, updateData: Partial<User>) {
    await this.userRepository.update(id, updateData);
    return this.findOne(id);
  }

  async deactivateUser(id: string) {
    await this.userRepository.update(id, { isActive: false });
    return { message: 'User deactivated successfully' };
  }

  async activateUser(id: string) {
    await this.userRepository.update(id, { isActive: true });
    return { message: 'User activated successfully' };
  }
}