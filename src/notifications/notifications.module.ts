// src/notifications/notifications.module.ts
import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { NotificationsController } from './notifications.controller';
import { NotificationsService } from './notifications.service';
import { Notification } from './notifications.entity';
import { IncidentGateway } from '../websocket/websocket.gateway';
import { User } from '../users/user.entity';

@Module({
  imports: [TypeOrmModule.forFeature([Notification, User])],
  controllers: [NotificationsController],
  providers: [NotificationsService, IncidentGateway],
  exports: [NotificationsService],
})
export class NotificationsModule {}