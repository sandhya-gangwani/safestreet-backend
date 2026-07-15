export type Role = 'ADMIN' | 'SUPERVISOR' | 'WORKER' | 'CITIZEN';

export type Category = 
  | 'road_damage' 
  | 'flooding' 
  | 'power_outage' 
  | 'water_issue' 
  | 'garbage' 
  | 'street_light' 
  | 'other';

export type Status = 'pending' | 'assigned' | 'in_progress' | 'resolved' | 'closed';

export type Priority = 'critical' | 'high' | 'standard';

export interface User {
  id: string;
  email: string;
  role: Role;
  departmentId?: string;
}
