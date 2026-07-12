// src/incidents/incidents.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { IncidentsController } from './incident.controller';
import { IncidentsService } from './incident.service';
import { Incident } from './incident.entity';
import { NotificationsModule } from '../notifications/notifications.module';
import { User } from '../users/user.entity';
//  Import IncidentGateway from AppModule
import { IncidentGateway } from '../websocket/websocket.gateway';

@Module({
    imports: [
        TypeOrmModule.forFeature([Incident, User]),
        NotificationsModule,
    ],
    controllers: [IncidentsController],
    providers: [
        IncidentsService,
        IncidentGateway,
    ],
    exports: [IncidentsService],
})
export class IncidentsModule {}