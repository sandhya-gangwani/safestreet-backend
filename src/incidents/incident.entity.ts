/* eslint-disable prettier/prettier */
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    ManyToOne,
    JoinColumn,
} from 'typeorm';
import { User } from '../users/user.entity';
import { Department } from '../departments/department.entity';

export enum IncidentCategory {
    ROAD_DAMAGE = 'road_damage',
    FLOODING = 'flooding',
    POWER_OUTAGE = 'power_outage',
    WATER_ISSUE = 'water_issue',
    GARBAGE = 'garbage',
    STREET_LIGHT = 'street_light',
    OTHER = 'other',
}

export enum IncidentPriority {
    CRITICAL = 'critical',
    HIGH = 'high',
    STANDARD = 'standard',
}

export enum IncidentStatus {
    PENDING = 'pending',
    ASSIGNED = 'assigned',
    IN_PROGRESS = 'in_progress',
    RESOLVED = 'resolved',
    CLOSED = 'closed',
}

@Entity('incidents')
export class Incident {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column()
    title: string;

    @Column('text')
    description: string;

    @Column({
        type: 'enum',
        enum: IncidentCategory,
        default: IncidentCategory.OTHER,
    })
    category: IncidentCategory;

    @Column({
        type: 'enum',
        enum: IncidentPriority,
        default: IncidentPriority.STANDARD,
    })
    priority: IncidentPriority;

    @Column({
        type: 'enum',
        enum: IncidentStatus,
        default: IncidentStatus.PENDING,
    })
    status: IncidentStatus;

    @Column('float')
    latitude: number;

    @Column('float')
    longitude: number;

    @Column({ nullable: true })
    address: string;

    @Column({ nullable: true })
    assignedToId: string;

    @Column({ nullable: true })
    resolvedNotes: string;

    @Column({ nullable: true })
    resolvedAt: Date;

    @Column({ default: 0 })
    viewCount: number;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @ManyToOne(() => User, (user: User) => user.incidents)
    @JoinColumn({ name: 'reporterId' })
    reporter: User;

    @Column()
    reporterId: string;

    @ManyToOne(() => Department, (department: Department) => department.incidents)
    @JoinColumn({ name: 'departmentId' })
    department: Department;

    @Column({ nullable: true })
    departmentId: string;
}