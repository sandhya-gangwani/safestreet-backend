/* eslint-disable prettier/prettier */
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    CreateDateColumn,
    UpdateDateColumn,
    OneToMany,
} from 'typeorm';
import { Incident } from '../incidents/incident.entity';

export enum UserRole {
    ADMIN = 'admin',
    DISPATCHER = 'dispatcher',
    WORKER = 'worker',
    CITIZEN = 'citizen',
}

@Entity('users')
export class User {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    email: string;

    @Column()
    password: string;

    @Column()
    fullName: string;

    @Column({
        type: 'enum',
        enum: UserRole,
        default: UserRole.CITIZEN,
    })
    role: UserRole;

    @Column({ nullable: true })
    departmentId: string;

    @Column({ default: true })
    isActive: boolean;

    @CreateDateColumn()
    createdAt: Date;

    @UpdateDateColumn()
    updatedAt: Date;

    @OneToMany(() => Incident, (incident: Incident) => incident.reporter)
    incidents: Incident[];
}