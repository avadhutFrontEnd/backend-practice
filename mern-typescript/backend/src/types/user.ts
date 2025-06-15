import { Document } from 'mongoose';

export interface IUser extends Document {
  _id: string;
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

export interface IAuditLog extends Document {
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
  profilePicture?: string;
}

export interface IPaginationQuery {
  page?: string;
  limit?: string;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}