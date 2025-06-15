import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { User, AuditLog } from '../models/userModel';
import { IUpdateProfileRequest, IPaginationQuery } from '../types/user';
import Joi from 'joi';
import mongoose from 'mongoose';

// Validation schemas
const updateProfileSchema = Joi.object({
  name: Joi.string().min(2).max(50).trim(),
  email: Joi.string().email().lowercase().trim(),
  bio: Joi.string().max(500).trim().allow(''),
  company: Joi.string().max(100).trim().allow('')
});

const paginationSchema = Joi.object({
  page: Joi.string().pattern(/^\d+$/).default('1'),
  limit: Joi.string().pattern(/^\d+$/).default('10'),
  sortBy: Joi.string().valid('timestamp', 'action').default('timestamp'),
  sortOrder: Joi.string().valid('asc', 'desc').default('desc')
});

class UserController {
  // Get user profile
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const user = await User.findById(req.user?.id).select('-__v');
      
      if (!user || user.isDeleted) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      res.status(200).json({
        success: true,
        data: user
      });
    } catch (error) {
      console.error('Get profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error'
      });
    }
  }

  // Update user profile with audit trail
  async updateProfile(req: AuthRequest, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        // Validate input
        const { error, value } = updateProfileSchema.validate(req.body);
        if (error) {
          throw new Error(`Validation error: ${error.details[0].message}`);
        }

        const updates: IUpdateProfileRequest = value;
        const userId = req.user?.id;

        // Get current user data
        const currentUser = await User.findById(userId).session(session);
        if (!currentUser || currentUser.isDeleted) {
          throw new Error('User not found');
        }

        // Check email uniqueness if email is being updated
        if (updates.email && updates.email !== currentUser.email) {
          const existingUser = await User.findOne({ 
            email: updates.email, 
            isDeleted: false,
            _id: { $ne: userId }
          }).session(session);
          
          if (existingUser) {
            throw new Error('Email already exists');
          }
        }

        // Track changes for audit log
        const changes: Record<string, { old: any; new: any }> = {};
        Object.keys(updates).forEach(key => {
          const typedKey = key as keyof IUpdateProfileRequest;
          if (updates[typedKey] !== undefined && updates[typedKey] !== currentUser[typedKey]) {
            changes[key] = {
              old: currentUser[typedKey],
              new: updates[typedKey]
            };
          }
        });

        // Only update if there are actual changes
        if (Object.keys(changes).length === 0 && !req.file) {
          throw new Error('No changes detected');
        }

        // Handle profile picture from multer
        if (req.file) {
          updates.profilePicture = `/uploads/profiles/${req.file.filename}`;
          changes.profilePicture = {
            old: currentUser.profilePicture,
            new: updates.profilePicture
          };
        }

        // Update user
        const updatedUser = await User.findByIdAndUpdate(
          userId,
          { 
            ...updates, 
            lastProfileUpdate: new Date() 
          },
          { 
            new: true, 
            runValidators: true,
            session 
          }
        ).select('-__v');

        // Create audit log
        await AuditLog.create([{
          userId: userId!,
          action: 'UPDATE',
          changes,
          changedBy: userId!,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }], { session });

        res.status(200).json({
          success: true,
          message: 'Profile updated successfully',
          data: updatedUser
        });
      });
    } catch (error: any) {
      console.error('Update profile error:', error);
      
      // Clean up uploaded file if transaction failed
      if (req.file) {
        const fs = require('fs').promises;
        try {
          await fs.unlink(req.file.path);
        } catch (unlinkError) {
          console.error('File cleanup error:', unlinkError);
        }
      }

      if (error.message.includes('Validation error') || 
          error.message.includes('Email already exists') ||
          error.message.includes('No changes detected')) {
        res.status(400).json({
          success: false,
          message: error.message
        });
      } else {
        res.status(500).json({
          success: false,
          message: 'Failed to update profile'
        });
      }
    } finally {
      await session.endSession();
    }
  }

  // Soft delete user
  async deleteProfile(req: AuthRequest, res: Response): Promise<void> {
    const session = await mongoose.startSession();
    
    try {
      await session.withTransaction(async () => {
        const userId = req.user?.id;
        
        const user = await User.findByIdAndUpdate(
          userId,
          { isDeleted: true },
          { new: true, session }
        );

        if (!user) {
          throw new Error('User not found');
        }

        // Create audit log
        await AuditLog.create([{
          userId: userId!,
          action: 'DELETE',
          changes: { isDeleted: { old: false, new: true } },
          changedBy: userId!,
          ipAddress: req.ip,
          userAgent: req.get('User-Agent')
        }], { session });

        res.status(200).json({
          success: true,
          message: 'Profile deleted successfully'
        });
      });
    } catch (error) {
      console.error('Delete profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete profile'
      });
    } finally {
      await session.endSession();
    }
  }

  // Get audit logs with pagination
  async getAuditLogs(req: AuthRequest, res: Response): Promise<void> {
    try {
      const { error, value } = paginationSchema.validate(req.query);
      if (error) {
        res.status(400).json({
          success: false,
          message: `Validation error: ${error.details[0].message}`
        });
        return;
      }

      const { page, limit, sortBy, sortOrder }: IPaginationQuery = value;
      const skip = (parseInt(page!) - 1) * parseInt(limit!);
      const sort: Record<string, 1 | -1> = { [sortBy!]: sortOrder === 'desc' ? -1 : 1 }; // Explicitly type sort

      // Get total count for pagination
      const totalCount = await AuditLog.countDocuments({ userId: req.user?.id });
      
      // Get audit logs
      const auditLogs = await AuditLog.find({ userId: req.user?.id })
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit!))
        .select('-__v');

      const totalPages = Math.ceil(totalCount / parseInt(limit!));

      res.status(200).json({
        success: true,
        data: {
          auditLogs,
          pagination: {
            currentPage: parseInt(page!),
            totalPages,
            totalCount,
            hasNextPage: parseInt(page!) < totalPages,
            hasPrevPage: parseInt(page!) > 1
          }
        }
      });
    } catch (error) {
      console.error('Get audit logs error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to fetch audit logs'
      });
    }
  }
}

export default new UserController();