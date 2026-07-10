/* eslint-disable prettier/prettier */
import { User } from '../users/user.entity';
import { Department } from '../departments/department.entity';
import { Incident } from '../incidents/incident.entity';

export type UserWithRelations = User & {
    incidents: Incident[];
};

export type DepartmentWithRelations = Department & {
    incidents: Incident[];
};

export type IncidentWithRelations = Incident & {
    reporter: User;
    department: Department;
};