// src/incidents/incidents.service.ts
import { 
    Injectable, 
    NotFoundException, 
    BadRequestException,
} from '@nestjs/common';
import { Not, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between, FindOptionsWhere } from 'typeorm';
import { Incident, IncidentStatus, IncidentPriority } from './incident.entity';
import { CreateIncidentDto } from './dto/createincident.dto';
import { UpdateIncidentDto } from './dto/updateincident.dto';
import { IncidentGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notifications.entity';

@Injectable()
export class IncidentsService {
    constructor(
        @InjectRepository(Incident)
        private incidentRepository: Repository<Incident>,
        private incidentGateway: IncidentGateway,
        private notificationsService: NotificationsService,
    ) {}

    /**
     * Create a new incident with SLA deadline
     */
    async create(createIncidentDto: CreateIncidentDto, reporterId: string): Promise<Incident> {
        // Calculate SLA deadline based on priority
        const slaDeadline = this.calculateSlaDeadline(
            createIncidentDto.priority || IncidentPriority.STANDARD
        );

        const incident = this.incidentRepository.create({
            ...createIncidentDto,
            reporterId,
            slaDeadline,  // ✅ SLA deadline set
            slaBreached: false,  // ✅ Initially not breached
        });

        const savedIncident = await this.incidentRepository.save(incident);

        // Notify supervisors via WebSocket
        await this.incidentGateway.notifyNewIncident(savedIncident);

        return savedIncident;
    }

    /**
     * Get all incidents with filtering and pagination
     */
    async findAll(filters: {
        status?: string;
        priority?: string;
        category?: string;
        departmentId?: string;
        assignedToId?: string;
        startDate?: string;
        endDate?: string;
        page?: number;
        limit?: number;
        sortBy?: string;
        order?: 'ASC' | 'DESC';
    }): Promise<{ items: Incident[]; total: number; page: number; limit: number }> {
        const page = filters.page || 1;
        const limit = filters.limit || 10;
        const sortBy = filters.sortBy || 'createdAt';
        const order = filters.order || 'DESC';
        
        const where: FindOptionsWhere<Incident> = {};
        
        if (filters.status) where.status = filters.status as any;
        if (filters.priority) where.priority = filters.priority as any;
        if (filters.category) where.category = filters.category as any;
        if (filters.departmentId) where.departmentId = filters.departmentId;
        if (filters.assignedToId) where.assignedToId = filters.assignedToId;
        
        // Date range filter
        if (filters.startDate && filters.endDate) {
            where.createdAt = Between(
                new Date(filters.startDate),
                new Date(filters.endDate),
            );
        }

        const [items, total] = await this.incidentRepository.findAndCount({
            where,
            relations: ['reporter', 'assignedTo', 'department'],
            order: { [sortBy]: order },
            skip: (page - 1) * limit,
            take: limit,
        });

        return {
            items,
            total,
            page,
            limit,
        };
    }

    /**
     * Get incidents by SLA status (breached or not)
     */
    async findBySlaStatus(breached: boolean): Promise<Incident[]> {
        return this.incidentRepository.find({
            where: { 
                slaBreached: breached,
                status: IncidentStatus.PENDING,
            },
            relations: ['reporter', 'assignedTo', 'department'],
            order: { slaDeadline: 'ASC' },
        });
    }

    /**
     * Get incidents approaching SLA deadline (within 20% of SLA)
     */
    async findApproachingSla(): Promise<Incident[]> {
        const now = new Date();
        const incidents = await this.incidentRepository.find({
            where: {
                status: IncidentStatus.PENDING,
                slaBreached: false,
            },
            relations: ['reporter', 'assignedTo', 'department'],
        });

        return incidents.filter(incident => {
            if (!incident.slaDeadline) return false;
            const timeRemaining = incident.slaDeadline.getTime() - now.getTime();
            const totalSlaTime = this.getTotalSlaTime(incident.priority);
            return timeRemaining > 0 && timeRemaining <= totalSlaTime * 0.2;
        });
    }

    /**
     * Get a single incident by ID
     */
    async findOne(id: string): Promise<Incident> {
        const incident = await this.incidentRepository.findOne({
            where: { id },
            relations: ['reporter', 'assignedTo', 'department'],
        });

        if (!incident) {
            throw new NotFoundException(`Incident with ID "${id}" not found`);
        }

        // Increment view count
        incident.viewCount += 1;
        await this.incidentRepository.save(incident);

        return incident;
    }

    /**
     * Find nearby incidents using geospatial query
     */
    async findNearby(lat: number, lng: number, radiusMeters: number = 50): Promise<Incident[]> {
        return this.incidentRepository
            .createQueryBuilder('incident')
            .where(
                `ST_DWithin(
                    ST_MakePoint(incident.longitude, incident.latitude)::geography,
                    ST_MakePoint(:lng, :lat)::geography,
                    :radius
                )`,
                { lat, lng, radius: radiusMeters }
            )
            .andWhere('incident.status NOT IN (:...excludedStatuses)', {
                excludedStatuses: ['resolved', 'closed'],
            })
            .getMany();
    }

    /**
     * Update an incident
     */
    async update(id: string, updateIncidentDto: UpdateIncidentDto, userId: string): Promise<Incident> {
        const incident = await this.findOne(id);
        const previousStatus = incident.status;

        // Update fields
        Object.assign(incident, updateIncidentDto);

        // Handle status changes
        if (updateIncidentDto.status && updateIncidentDto.status !== previousStatus) {
            await this.handleStatusChange(incident, updateIncidentDto.status, userId);
        }

        const updated = await this.incidentRepository.save(incident);

        // Notify via WebSocket
        await this.incidentGateway.notifyIncidentUpdate(incident.id, {
            status: updated.status,
            updatedBy: userId,
            notes: updateIncidentDto.resolvedNotes,
        });

        return updated;
    }

    /**
     * Assign incident to a worker
     */
    async assignToWorker(incidentId: string, workerId: string, supervisorId: string): Promise<Incident> {
        const incident = await this.findOne(incidentId);
        
        if (!incident) {
            throw new NotFoundException('Incident not found');
        }

        incident.assignedToId = workerId;
        incident.status = IncidentStatus.ASSIGNED;
        
        const updated = await this.incidentRepository.save(incident);

        // Notify worker
        await this.notificationsService.create(
            workerId,
            NotificationType.ASSIGNMENT,
            `New incident assigned: ${incident.title}`,
            `You have been assigned to "${incident.title}"`,
            incident.id,
            { assignedBy: supervisorId },
        );

        // Notify via WebSocket
        await this.incidentGateway.notifyIncidentUpdate(incident.id, {
            status: 'ASSIGNED',
            assignedTo: workerId,
            assignedBy: supervisorId,
        });

        return updated;
    }

    /**
     * Resolve an incident
     */
    async resolveIncident(id: string, notes: string, userId: string): Promise<Incident> {
        const incident = await this.findOne(id);
        
        incident.status = IncidentStatus.RESOLVED;
        incident.resolvedNotes = notes;
        incident.resolvedAt = new Date();
        
        const updated = await this.incidentRepository.save(incident);

        // Notify citizen
        await this.notificationsService.create(
            incident.reporterId,
            NotificationType.RESOLUTION,
            `Incident ${incident.id} resolved`,
            `Your incident "${incident.title}" has been resolved.`,
            incident.id,
            { resolution: notes },
        );

        // Notify via WebSocket
        await this.incidentGateway.notifyResolution(incident, notes);

        return updated;
    }

    /**
     * Close an incident (must be resolved first)
     */
    async closeIncident(id: string, userId: string): Promise<Incident> {
        const incident = await this.findOne(id);
        
        if (incident.status !== IncidentStatus.RESOLVED) {
            throw new BadRequestException('Cannot close an incident that is not resolved');
        }

        incident.status = IncidentStatus.CLOSED;
        
        return this.incidentRepository.save(incident);
    }

    /**
     * Delete an incident
     */
    async remove(id: string): Promise<void> {
        const incident = await this.findOne(id);
        await this.incidentRepository.remove(incident);
    }

    /**
     * Get incident statistics
     */
    async getStats(): Promise<any> {
        const total = await this.incidentRepository.count();
        const open = await this.incidentRepository.count({
            where: { status: IncidentStatus.PENDING },
        });
        const inProgress = await this.incidentRepository.count({
            where: { status: IncidentStatus.IN_PROGRESS },
        });
        const resolved = await this.incidentRepository.count({
            where: { status: IncidentStatus.RESOLVED },
        });
        const closed = await this.incidentRepository.count({
            where: { status: IncidentStatus.CLOSED },
        });

        // ✅ SLA Statistics
        const breached = await this.incidentRepository.count({
            where: { slaBreached: true },
        });
        const totalWithSla = await this.incidentRepository.count({
            where: { slaDeadline: Not(IsNull()) },
        });
        const complianceRate = totalWithSla > 0 
            ? ((totalWithSla - breached) / totalWithSla) * 100 
            : 100;

        return {
            total,
            open,
            inProgress,
            resolved,
            closed,
            sla: {
                breached,
                totalWithSla,
                complianceRate: Math.round(complianceRate * 100) / 100,
            },
        };
    }

    /**
     * Check and update SLA status for all incidents
     * Called by cron job
     */
    async checkAndUpdateSla(): Promise<{ breached: number; warned: number }> {
        const now = new Date();
        let breachedCount = 0;
        let warnedCount = 0;

        // Find all open incidents with SLA
        const incidents = await this.incidentRepository.find({
            where: {
                status: IncidentStatus.PENDING,
                slaDeadline: Not(IsNull()),
            },
            relations: ['department', 'assignedTo'],
        });

        for (const incident of incidents) {
            const timeRemaining = incident.slaDeadline.getTime() - now.getTime();
            const totalSlaTime = this.getTotalSlaTime(incident.priority);
            
            // Check if SLA is breached
            if (timeRemaining <= 0 && !incident.slaBreached) {
                incident.slaBreached = true;
                await this.incidentRepository.save(incident);
                breachedCount++;

                // Notify supervisors
                await this.incidentGateway.notifySlaAlert({
                    ...incident,
                    breached: true,
                });

                // Create notification for supervisors
                await this.notificationsService.create(
                    incident.departmentId,
                    NotificationType.SLA_ALERT,
                    `SLA BREACHED: ${incident.title}`,
                    `Incident "${incident.title}" has breached its SLA deadline`,
                    incident.id,
                    { deadline: incident.slaDeadline },
                );
            }
            // Check if approaching SLA (within 20%)
            else if (timeRemaining > 0 && timeRemaining <= totalSlaTime * 0.2) {
                warnedCount++;
                
                // Notify supervisors about approaching SLA
                await this.incidentGateway.notifySlaAlert({
                    ...incident,
                    breached: false,
                    warning: true,
                });

                // Notify assigned worker if exists
                if (incident.assignedToId) {
                    await this.notificationsService.create(
                        incident.assignedToId,
                        NotificationType.SLA_ALERT,
                        `SLA warning: ${incident.title}`,
                        `Incident "${incident.title}" is approaching its SLA deadline`,
                        incident.id,
                        { deadline: incident.slaDeadline },
                    );
                }
            }
        }

        return { breached: breachedCount, warned: warnedCount };
    }

    /**
     * Get SLA compliance report
     */
    async getSlaReport(startDate?: Date, endDate?: Date): Promise<any> {
        const start = startDate || new Date(new Date().setDate(1)); // Start of month
        const end = endDate || new Date();

        const stats = await this.incidentRepository
            .createQueryBuilder('incident')
            .select('incident.departmentId')
            .addSelect('COUNT(*) as total')
            .addSelect('COUNT(CASE WHEN incident.slaBreached = true THEN 1 END) as breached')
            .where('incident.createdAt BETWEEN :start AND :end', { start, end })
            .andWhere('incident.slaDeadline IS NOT NULL')
            .groupBy('incident.departmentId')
            .getRawMany();

        return stats.map(stat => ({
            departmentId: stat.incident_departmentId,
            total: parseInt(stat.total),
            breached: parseInt(stat.breached),
            complianceRate: stat.total > 0 
                ? ((parseInt(stat.total) - parseInt(stat.breached)) / parseInt(stat.total)) * 100
                : 100,
        }));
    }

    // ==================== PRIVATE METHODS ====================

    /**
     * Calculate SLA deadline based on priority
     */
    private calculateSlaDeadline(priority: IncidentPriority): Date {
        const slaHours = {
            [IncidentPriority.CRITICAL]: 24,   // 1 day
            [IncidentPriority.HIGH]: 72,        // 3 days
            [IncidentPriority.STANDARD]: 168,   // 7 days
        };
        const hours = slaHours[priority] || 168;
        return new Date(Date.now() + hours * 60 * 60 * 1000);
    }

    /**
     * Get total SLA time in milliseconds for a priority
     */
    private getTotalSlaTime(priority: IncidentPriority): number {
        const slaHours = {
            [IncidentPriority.CRITICAL]: 24,
            [IncidentPriority.HIGH]: 72,
            [IncidentPriority.STANDARD]: 168,
        };
        const hours = slaHours[priority] || 168;
        return hours * 60 * 60 * 1000;
    }

    /**
     * Handle status change logic
     */
    private async handleStatusChange(incident: Incident, newStatus: IncidentStatus, userId: string) {
        if (newStatus === IncidentStatus.IN_PROGRESS && !incident.assignedToId) {
            throw new BadRequestException('Cannot set IN_PROGRESS without assigning a worker');
        }
    }
}