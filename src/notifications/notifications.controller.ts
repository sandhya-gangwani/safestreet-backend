// src/notifications/notifications.controller.ts
import {
  Controller,
  Get,
  Patch,
  Delete,
  Param,
  Query,
  UseGuards,
  Request,
  ParseUUIDPipe,
} from '@nestjs/common';
import { NotificationsService } from './notifications.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';

@Controller('notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private notificationsService: NotificationsService) {}

  @Get()
  async getNotifications(
    @Request() req,
    @Query('limit') limit?: string,
    @Query('offset') offset?: string,
  ) {
    return this.notificationsService.getNotifications(
      req.user.id,
      limit ? parseInt(limit) : 20,
      offset ? parseInt(offset) : 0,
    );
  }

  @Get('unread-count')
  async getUnreadCount(@Request() req) {
    return { count: await this.notificationsService.getUnreadCount(req.user.id) };
  }

  @Patch(':id/read')
  async markAsRead(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.notificationsService.markAsRead(id, req.user.id);
  }

  @Patch('read-all')
  async markAllAsRead(@Request() req) {
    return this.notificationsService.markAllAsRead(req.user.id);
  }

  @Delete(':id')
  async deleteNotification(@Param('id', ParseUUIDPipe) id: string, @Request() req) {
    return this.notificationsService.deleteNotification(id, req.user.id);
  }
}