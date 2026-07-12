// src/incidents/incidents.controller.ts
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
    Request,
    ParseUUIDPipe,
    HttpCode,
    HttpStatus,
} from '@nestjs/common';
import { IncidentsService } from './incident.service';
import { CreateIncidentDto } from './dto/createincident.dto';
import { UpdateIncidentDto } from './dto/updateincident.dto';
import { IncidentQueryDto } from './dto/incidentquery.dto';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';
import { UserRole } from '../users/user.entity';

@Controller('incidents')
@UseGuards(JwtAuthGuard, RolesGuard)
export class IncidentsController {
    constructor(private incidentsService: IncidentsService) {}

    @Post()
    async create(@Body() createIncidentDto: CreateIncidentDto, @Request() req) {
        return this.incidentsService.create(createIncidentDto, req.user.id);
    }

    @Get()
    async findAll(@Query() queryDto: IncidentQueryDto) {
        return this.incidentsService.findAll(queryDto);
    }

    @Get('nearby')
    async findNearby(
        @Query('lat') lat: string,
        @Query('lng') lng: string,
        @Query('radius') radius?: string,
    ) {
        return this.incidentsService.findNearby(
            parseFloat(lat),
            parseFloat(lng),
            radius ? parseFloat(radius) : 50,
        );
    }

    @Get('stats')
    @Roles(UserRole.ADMIN, UserRole.SUPERVISOR)
    async getStats() {
        return this.incidentsService.getStats();
    }

    @Get(':id')
    async findOne(@Param('id', ParseUUIDPipe) id: string) {
        return this.incidentsService.findOne(id);
    }

    @Put(':id')
    async update(
        @Param('id', ParseUUIDPipe) id: string,
        @Body() updateIncidentDto: UpdateIncidentDto,
        @Request() req,
    ) {
        return this.incidentsService.update(id, updateIncidentDto, req.user.id);
    }

    @Post(':id/assign')
    @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
    async assignToWorker(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('workerId') workerId: string,
        @Request() req,
    ) {
        return this.incidentsService.assignToWorker(id, workerId, req.user.id);
    }

    @Post(':id/resolve')
    @Roles(UserRole.WORKER, UserRole.SUPERVISOR, UserRole.ADMIN)
    async resolveIncident(
        @Param('id', ParseUUIDPipe) id: string,
        @Body('notes') notes: string,
        @Request() req,
    ) {
        return this.incidentsService.resolveIncident(id, notes, req.user.id);
    }

    @Post(':id/close')
    @Roles(UserRole.SUPERVISOR, UserRole.ADMIN)
    async closeIncident(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
        return this.incidentsService.closeIncident(id, req.user.id);
    }

    @Delete(':id')
    @Roles(UserRole.ADMIN)
    @HttpCode(HttpStatus.NO_CONTENT)
    async remove(@Param('id', ParseUUIDPipe) id: string) {
        await this.incidentsService.remove(id);
    }
}