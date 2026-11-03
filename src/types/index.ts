export type RoleType = 'STUDENT' | 'STAFF_USER' | 'MAINTENANCE_STAFF' | 'ADMIN';

export type ComplaintStatus = 'OPEN' | 'ASSIGNED' | 'IN_PROGRESS' | 'RESOLVED' | 'CLOSED' | 'ESCALATED';

export type ComplaintPriority = 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';

export type StaffAvailability = 'AVAILABLE' | 'BUSY' | 'ON_LEAVE';

export interface UserSession {
  userId: number;
  fullName: string;
  email: string;
  roleName: RoleType;
  staffId?: number | null;
  specialization?: string | null;
}

export interface Complaint {
  complaint_id: number;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  created_at: string;
  resolved_at: string | null;
  sla_due_at: string | null;
  sla_status: 'ON_TRACK' | 'BREACHED' | 'RESOLVED';
  duration_hours?: number;
  reporter_id: number;
  reporter_name: string;
  reporter_email: string;
  category_id: number;
  category_name: string;
  department_id: number;
  department_name: string;
  location_id: number;
  building: string;
  floor: string;
  room: string;
  zone: string | null;
  assigned_staff_id?: number | null;
  assigned_staff_name?: string | null;
  assigned_staff_email?: string | null;
  assigned_specialization?: string | null;
}

export interface StatusHistoryItem {
  history_id: number;
  complaint_id: number;
  old_status: ComplaintStatus | null;
  new_status: ComplaintStatus;
  changed_by: number | null;
  changer_name?: string | null;
  remarks: string | null;
  changed_at: string;
}

export interface CommentItem {
  comment_id: number;
  complaint_id: number;
  author_id: number;
  author_name: string;
  author_role: RoleType;
  body: string;
  created_at: string;
}

export interface SimilarComplaint {
  complaint_id: number;
  title: string;
  description: string;
  status: ComplaintStatus;
  priority: ComplaintPriority;
  category_name: string;
  department_name: string;
  building: string;
  room: string;
  similarity: number;
}

export interface DepartmentWorkload {
  department_id: number;
  department_name: string;
  total_complaints: number;
  open_count: number;
  assigned_count: number;
  in_progress_count: number;
  resolved_count: number;
  sla_breached_count: number;
  avg_resolution_hours: number | null;
}

export interface LocationHotspot {
  location_id: number;
  building: string;
  floor: string;
  room: string;
  zone: string | null;
  total_complaints: number;
  active_complaints: number;
  critical_complaints: number;
}

export interface StaffMetric {
  staff_id: number;
  user_id: number;
  staff_name: string;
  staff_email: string;
  specialization: string;
  availability_status: StaffAvailability;
  lifetime_assigned: number;
  active_tasks: number;
  completed_tasks: number;
  avg_task_turnaround_hours: number | null;
}

