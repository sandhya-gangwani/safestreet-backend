// src/incidents/sla.service.ts
import { Injectable, Logger } from '@nestjs/common';
import { Cron, CronExpression } from '@nestjs/schedule';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, LessThan } from 'typeorm';
import { Incident, IncidentStatus } from './incident.entity';
import { IncidentGateway } from '../websocket/websocket.gateway';
import { NotificationsService } from '../notifications/notifications.service';
import { NotificationType } from '../notifications/notifications.entity';

@Injectable()
export class SlaService {
    private readonly logger = new Logger(SlaService.name);

    constructor(
        @InjectRepository(Incident)
        private incidentRepository: Repository<Incident>,
        private incidentGateway: IncidentGateway,
        private notificationsService: NotificationsService,
    ) {}

    @Cron(CronExpression.EVERY_HOUR)
    async checkSlaDeadlines() {
        this.logger.log('Checking SLA deadlines...');

        const now = new Date();
        const twentyPercentWarning = new Date(now.getTime() + 0.2 * 60 * 60 * 1000); // 20% of 1 hour

        // Find incidents approaching SLA (within 20%)
        const approachingIncidents = await this.incidentRepository.find({
            where: {
                slaDeadline: LessThan(twentyPercentWarning),
                status: IncidentStatus.PENDING,
                slaBreached: false,
            },
            relations: ['department', 'assignedTo'],
        });

        for (const incident of approachingIncidents) {
            this.logger.warn(`SLA approaching for incident ${incident.id}`);
            
            // Notify supervisors
            await this.incidentGateway.notifySlaAlert({
                ...incident,
                breached: false,
                warning: true,
            });

            // Create notification for assigned worker
            if (incident.assignedToId) {
                await this.notificationsService.create(
                    incident.assignedToId,
                    NotificationType.SLA_ALERT,
                    `SLA warning for incident ${incident.id}`,
                    `Incident "${incident.title}" is approaching its SLA deadline`,
                    incident.id,
                    { deadline: incident.slaDeadline },
                );
            }
        }

        // Find breached SLAs
        const breachedIncidents = await this.incidentRepository.find({
            where: {
                slaDeadline: LessThan(now),
                status: IncidentStatus.PENDING,
                slaBreached: false,
            },
            relations: ['department', 'assignedTo'],
        });

        for (const incident of breachedIncidents) {
            incident.slaBreached = true;
            await this.incidentRepository.save(incident);

            this.logger.error(`SLA breached for incident ${incident.id}`);
            
            // Notify supervisors
            await this.incidentGateway.notifySlaAlert({
                ...incident,
                breached: true,
            });

            // Create notification for supervisors
            const supervisors = await this.getSupervisors(incident.departmentId);
            for (const supervisor of supervisors) {
                await this.notificationsService.create(
                    supervisor.id,
                    NotificationType.SLA_ALERT,
                    `SLA BREACHED: Incident ${incident.id}`,
                    `Incident "${incident.title}" has breached its SLA deadline`,
                    incident.id,
                    { deadline: incident.slaDeadline },
                );
            }
        }
    }

    private async getSupervisors(departmentId: string): Promise<any[]> {
        // This should query users with SUPERVISOR role
        // Implementation depends on your User module
        return [];
    }

    @Cron('0 0 * * *') // Daily at midnight
    async generateSlaReport() {
        this.logger.log('Generating SLA report...');

        const startOfMonth = new Date();
        startOfMonth.setDate(1);
        startOfMonth.setHours(0, 0, 0, 0);

        const endOfMonth = new Date();
        endOfMonth.setMonth(endOfMonth.getMonth() + 1);
        endOfMonth.setDate(0);
        endOfMonth.setHours(23, 59, 59, 999);

        const stats = await this.incidentRepository
            .createQueryBuilder('incident')
            .select('incident.departmentId')
            .addSelect('COUNT(*) as total')
            .addSelect('COUNT(CASE WHEN incident.slaBreached = true THEN 1 END) as breached')
            .where('incident.createdAt BETWEEN :start AND :end', {
                start: startOfMonth,
                end: endOfMonth,
            })
            .groupBy('incident.departmentId')
            .getRawMany();

        this.logger.log('Monthly SLA Report:', stats);
    }
}