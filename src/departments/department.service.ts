// src/departments/departments.service.ts
import { Injectable, NotFoundException, ConflictException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Department } from './department.entity';
import { CreateDepartmentDto } from './dto/createdepartment.dto';
import { UpdateDepartmentDto } from './dto/updatedepartment.dto';

@Injectable()
export class DepartmentsService {
    constructor(
        @InjectRepository(Department)
        private departmentRepository: Repository<Department>,
    ) {}

    async create(createDepartmentDto: CreateDepartmentDto): Promise<Department> {
        // Check if department name already exists
        const existing = await this.departmentRepository.findOne({
            where: { name: createDepartmentDto.name },
        });

        if (existing) {
            throw new ConflictException(`Department with name "${createDepartmentDto.name}" already exists`);
        }

        const department = this.departmentRepository.create(createDepartmentDto);
        return this.departmentRepository.save(department);
    }

    async findAll(): Promise<Department[]> {
        return this.departmentRepository.find({
            relations: ['users', 'incidents'],
            // ❌ REMOVED: order by createdAt
            order: { 
                name: 'ASC'  //  Sort by name instead
            },
        });
    }

   

    async findOne(id: string): Promise<Department> {
        const department = await this.departmentRepository.findOne({
            where: { id },
            relations: ['users', 'incidents'],
        });

        if (!department) {
            throw new NotFoundException(`Department with ID "${id}" not found`);
        }

        return department;
    }

    async update(id: string, updateDepartmentDto: UpdateDepartmentDto): Promise<Department> {
        const department = await this.findOne(id);

        // Check if new name conflicts with another department
        if (updateDepartmentDto.name && updateDepartmentDto.name !== department.name) {
            const existing = await this.departmentRepository.findOne({
                where: { name: updateDepartmentDto.name },
            });

            if (existing && existing.id !== id) {
                throw new ConflictException(`Department with name "${updateDepartmentDto.name}" already exists`);
            }
        }

        Object.assign(department, updateDepartmentDto);
        return this.departmentRepository.save(department);
    }

    async remove(id: string): Promise<void> {
        const department = await this.findOne(id);

        // Check if department has users
        if (department.users && department.users.length > 0) {
            throw new ConflictException('Cannot delete department with assigned users.');
        }

        await this.departmentRepository.remove(department);
    }

    async getDepartmentStats(id: string): Promise<any> {
        const department = await this.findOne(id);
        
        const incidentStats = {
            total: department.incidents ? department.incidents.length : 0,
            open: department.incidents ? department.incidents.filter(i => 
                i.status !== 'resolved' && i.status !== 'closed'
            ).length : 0,
            resolved: department.incidents ? department.incidents.filter(i => 
                i.status === 'resolved'
            ).length : 0,
        };

        return {
            department: department.name,
            userCount: department.users ? department.users.length : 0,
            incidentStats,
        };
    }
}