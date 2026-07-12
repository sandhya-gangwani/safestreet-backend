// src/notifications/notification.entity.ts
import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  ManyToOne,
  CreateDateColumn,
  Index,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Incident } from '../incidents/incident.entity';

export enum NotificationType {
  INCIDENT_UPDATE = 'incident_update',
  SLA_ALERT = 'sla_alert',
  ASSIGNMENT = 'assignment',
  RESOLUTION = 'resolution',
  SYSTEM = 'system',
}

@Entity('notifications')
@Index(['userId', 'createdAt'])
export class Notification {
  @PrimaryGeneratedColumn('uuid')
  id: string='';

  @Column({ name: 'user_id' })
  userId: string;

  @ManyToOne(() => User, { onDelete: 'CASCADE' })
  user: User;

  @Column({ name: 'incident_id', nullable: true })
  incidentId: string;

  @ManyToOne(() => Incident, { nullable: true, onDelete: 'SET NULL' })
  incident: Incident;

  @Column({ type: 'enum', enum: NotificationType })
  type: NotificationType;

  @Column()
  title: string;

  @Column({ type: 'text' })
  message: string;

  @Column({ default: false })
  read: boolean;

  @Column({ type: 'jsonb', nullable: true })
  metadata: any;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;
}