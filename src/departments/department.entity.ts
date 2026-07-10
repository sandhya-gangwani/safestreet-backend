/* eslint-disable prettier/prettier */
import {
    Entity,
    Column,
    PrimaryGeneratedColumn,
    OneToMany,
} from 'typeorm';
import { Incident } from '../incidents/incident.entity';

@Entity('departments')
export class Department {
    @PrimaryGeneratedColumn('uuid')
    id: string;

    @Column({ unique: true })
    name: string;

    @Column({ nullable: true })
    description: string;

    @Column({ nullable: true })
    email: string;

    @Column({ nullable: true })
    phone: string;

    @OneToMany(() => Incident, (incident: Incident) => incident.department)
    incidents: Incident[];
}