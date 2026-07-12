// src/websocket/websocket.gateway.ts
import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  OnGatewayConnection,
  OnGatewayDisconnect,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Injectable } from '@nestjs/common';

@WebSocketGateway({
  cors: {
    origin: '*',
    credentials: true,
  },
  namespace: 'incidents',
})
@Injectable()
export class IncidentGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer()
  server: Server;

  private connectedUsers: Map<string, string> = new Map();

  async handleConnection(client: Socket) {
    console.log(`Client connected: ${client.id}`);
    this.connectedUsers.set(client.id, 'connected');
    client.emit('connected', { message: 'Connected to SafeStreet WebSocket' });
  }

  handleDisconnect(client: Socket) {
    this.connectedUsers.delete(client.id);
    console.log(`Client disconnected: ${client.id}`);
  }

  @SubscribeMessage('subscribe-incident')
  async handleSubscribeIncident(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { incidentId: string },
  ) {
    client.join(`incident:${data.incidentId}`);
    client.emit('subscribed', { incidentId: data.incidentId });
  }

  @SubscribeMessage('unsubscribe-incident')
  handleUnsubscribeIncident(
    @ConnectedSocket() client: Socket,
    @MessageBody() data: { incidentId: string },
  ) {
    client.leave(`incident:${data.incidentId}`);
    client.emit('unsubscribed', { incidentId: data.incidentId });
  }

  async notifyIncidentUpdate(incidentId: string, update: any) {
    this.server.to(`incident:${incidentId}`).emit('incident-update', {
      incidentId,
      update,
      timestamp: new Date(),
    });
  }

  async notifyNewIncident(incident: any) {
    this.server.emit('new-incident', {
      incidentId: incident.id,
      title: incident.title,
      category: incident.category,
    });
  }

  async notifySlaAlert(incident: any) {
    this.server.emit('sla-alert', {
      incidentId: incident.id,
      breached: incident.slaBreached,
    });
  }

  async notifyResolution(incident: any, message: string) {
    this.server.emit('incident-resolved', {
      incidentId: incident.id,
      message,
    });
  }
}