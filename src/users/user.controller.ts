// src/users/users.controller.ts
import { 
  Controller, 
  Get, 
  Put, 
  Delete, 
  Param, 
  Body, 
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import { UsersService } from './user.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from './user.entity';

@Controller('users')
@UseGuards(JwtAuthGuard, RolesGuard)
export class UsersController {
  constructor(private usersService: UsersService) {}

  @Get()
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findAll() {
    return this.usersService.findAll();
  }

  @Get('role/:role')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findByRole(@Param('role') role: UserRole) {
    return this.usersService.findByRole(role);
  }

  @Get('department/:departmentId')
  @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
  async findByDepartment(@Param('departmentId') departmentId: string) {
    return this.usersService.findByDepartment(departmentId);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.findOne(id);
  }

  @Put(':id')
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateData: Partial<any>,
  ) {
    return this.usersService.updateUser(id, updateData);
  }

  @Delete(':id/deactivate')
  @Roles(UserRole.ADMIN)
  async deactivate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.deactivateUser(id);
  }

  @Put(':id/activate')
  @Roles(UserRole.ADMIN)
  async activate(@Param('id', ParseUUIDPipe) id: string) {
    return this.usersService.activateUser(id);
  }
}