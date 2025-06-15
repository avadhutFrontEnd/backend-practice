import mongoose, { Schema } from 'mongoose';
import { IUser, IAuditLog } from '../types/user';

const userSchema = new Schema<IUser>({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 2,
    maxlength: 50
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  bio: {
    type: String,
    maxlength: 500,
    trim: true
  },
  company: {
    type: String,
    maxlength: 100,
    trim: true
  },
  profilePicture: {
    type: String,
    default: null
  },
  isDeleted: {
    type: Boolean,
    default: false
  },
  lastProfileUpdate: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true,
  toJSON: { 
    virtuals: true,
    transform: function(doc, ret) {
      delete ret.__v;
      return ret;
    }
  }
});

// Compound index for efficient queries
userSchema.index({ email: 1, isDeleted: 1 });
userSchema.index({ lastProfileUpdate: -1 });

const auditLogSchema = new Schema<IAuditLog>({
  userId: {
    type: String,
    required: true,
    index: true
  },
  action: {
    type: String,
    enum: ['CREATE', 'UPDATE', 'DELETE'],
    required: true
  },
  changes: {
    type: Schema.Types.Mixed,
    required: true
  },
  changedBy: {
    type: String,
    required: true
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true
  },
  ipAddress: String,
  userAgent: String
}, {
  timestamps: false
});

// TTL index for audit logs (optional - remove old logs after 2 years)
auditLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 63072000 });

export const User = mongoose.model<IUser>('User', userSchema);
export const AuditLog = mongoose.model<IAuditLog>('AuditLog', auditLogSchema);