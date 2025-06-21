export interface IUser {
  id: string;
  name: string;
  email: string;
  bio?: string;
  company?: string;
  profilePicture?: string;
  isDeleted: boolean;
  lastProfileUpdate: Date;
  createdAt: Date;
  updatedAt: Date;
}

export interface IAuditLog {
  id: string;
  userId: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE';
  changes: Record<string, { old: any; new: any }>;
  changedBy: string;
  timestamp: Date;
  ipAddress?: string;
  userAgent?: string;
}

export interface IUpdateProfileRequest {
  name?: string;
  email?: string;
  bio?: string;
  company?: string;
  profilePicture?: string; // Added profilePicture
}

export interface IPaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface IDbUser {
  id: string;
  name: string;
  email: string;
  bio: string | null;
  company: string | null;
  profile_picture: string | null;
  is_deleted: boolean;
  last_profile_update: Date;
  created_at: Date;
  updated_at: Date;
}

export interface IDbAuditLog {
  id: string;
  user_id: string;
  action: string;
  changes: any;
  changed_by: string;
  timestamp: Date;
  ip_address: string | null;
  user_agent: string | null;
}