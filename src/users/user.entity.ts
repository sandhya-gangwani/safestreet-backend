// src/users/user.entity.ts
import { 
  Entity, 
  Column, 
  PrimaryGeneratedColumn, 
  CreateDateColumn, 
  UpdateDateColumn,
  ManyToOne,
  OneToMany,
  BeforeInsert,
  JoinColumn,
} from 'typeorm';
import { Department } from '../departments/department.entity';
import { Incident } from '../incidents/incident.entity';
import * as bcrypt from 'bcrypt';

export enum UserRole {
  CITIZEN = 'citizen',
  WORKER = 'worker',
  SUPERVISOR = 'supervisor',
  ADMIN = 'admin',
}

@Entity('users')
export class User {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ unique: true })
  email: string;

  @Column({ name: 'password_hash' })
  password_hash: string;

  @Column({ name: 'full_name' })
  fullName: string;

  @Column({
    type: 'enum',
    enum: UserRole,
    default: UserRole.CITIZEN,
  })
  role: UserRole;

  @Column({ nullable: true })
  phone: string;

  @Column({ name: 'department_id', nullable: true })
  departmentId: string;

  @ManyToOne(() => Department, department => department.users, { nullable: true })
  @JoinColumn({ name: 'department_id' })
  department: Department;

  @Column({ name: 'is_active', default: true })
  isActive: boolean;

  @Column({ name: 'refresh_token', nullable: true })
  refreshToken: string;

  @CreateDateColumn({ name: 'created_at' })
  createdAt: Date;

  @UpdateDateColumn({ name: 'updated_at' })
  updatedAt: Date;

  @OneToMany(() => Incident, (incident: Incident) => incident.reporter)
  incidents: Incident[];

  @BeforeInsert()
  async hashPassword() {
    if (this.password_hash) {
      this.password_hash = await bcrypt.hash(this.password_hash, 10);
    }
  }

  async validatePassword(password: string): Promise<boolean> {
    return bcrypt.compare(password, this.password_hash);
  }
}