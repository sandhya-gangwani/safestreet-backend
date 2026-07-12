// src/departments/departments.controller.ts
import {
    Controller,
    Get,
    Post,
    Put,
    Delete,
    Body,
    Param,
    Query,
    UseGuards,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { DepartmentsService } from './department.service';
import { CreateDepartmentDto } from './dto/createdepartment.dto';
import { UpdateDepartmentDto } from './dto/updatedepartment.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('departments')
@UseGuards(JwtAuthGuard, RolesGuard)
export class DepartmentsController {
    constructor(private departmentsService: DepartmentsService) {}

    @Post()
    @Roles(UserRole.ADMIN)
    async create(@Body() createDepartmentDto: CreateDepartmentDto) {
        return this.departmentsService.create(createDepartmentDto);
    }

    @Get()
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    async findAll(@Query('active') active?: string) {
        return this.departmentsService.findAll();
    }

    @Get(':id')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.departmentsService.findOne(id);
    }

    @Get(':id/stats')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    async getStats(@Param('id', ParseUUIDPipe) id: string) {
        return this.departmentsService.getDepartmentStats(id);
    }

    @Put(':id')
    @Roles(UserRole.ADMIN)
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateDepartmentDto: UpdateDepartmentDto,
    ) {
        return this.departmentsService.update(id, updateDepartmentDto);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.departmentsService.remove(id);
    }
}