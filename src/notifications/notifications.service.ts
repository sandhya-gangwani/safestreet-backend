// src/notifications/notifications.service.ts
import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Notification, NotificationType } from './notifications.entity';
import { IncidentGateway } from '../websocket/websocket.gateway';

@Injectable()
export class NotificationsService {
  constructor(
    @InjectRepository(Notification)
    private notificationRepository: Repository<Notification>,
    private incidentGateway: IncidentGateway,
  ) {}

  async create(
    userId: string,
    type: NotificationType,
    title: string,
    message: string,
    incidentId?: string,
    metadata?: any,
  ): Promise<Notification> {
    const notification = this.notificationRepository.create({
      userId,
      type,
      title,
      message,
      incidentId,
      metadata,
    });

    await this.notificationRepository.save(notification);

    // Send real-time notification via WebSocket
    this.incidentGateway.server
      .to(`user:${userId}`)
      .emit('notification', {
        id: notification.id,
        type: notification.type,
        title: notification.title,
        message: notification.message,
        incidentId: notification.incidentId,
        createdAt: notification.createdAt,
      });

    return notification;
  }

  async getNotifications(userId: string, limit: number = 20, offset: number = 0) {
    const [items, total] = await this.notificationRepository.findAndCount({
      where: { userId },
      order: { createdAt: 'DESC' },
      take: limit,
      skip: offset,
      relations: ['incident'],
    });

    return { 
      items, 
      total, 
      unread: await this.getUnreadCount(userId) 
    };
  }

  async markAsRead(notificationId: string, userId: string) {
    await this.notificationRepository.update(
      { id: notificationId, userId },
      { read: true },
    );
    return { success: true };
  }

  async markAllAsRead(userId: string) {
    await this.notificationRepository.update(
      { userId, read: false },
      { read: true },
    );
    return { success: true };
  }

  async getUnreadCount(userId: string): Promise<number> {
    return this.notificationRepository.count({
      where: { userId, read: false },
    });
  }

  async deleteNotification(notificationId: string, userId: string) {
    await this.notificationRepository.delete({ id: notificationId, userId });
    return { success: true };
  }
}