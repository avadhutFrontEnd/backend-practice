import { Response } from 'express';
import { AuthRequest } from '../middleware/auth';
import { IUpdateProfileRequest, IPaginationQuery, IDbUser, IDbAuditLog } from '../types/user';
import db from '../config/db';
import Joi from 'joi';

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

// Helper function to convert snake_case to camelCase
const toCamelCase = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(toCamelCase);
  } else if (obj !== null && typeof obj === 'object') {
    return Object.keys(obj).reduce((result, key) => {
      const camelKey = key.replace(/_([a-z])/g, (match, letter) => letter.toUpperCase());
      result[camelKey] = toCamelCase(obj[key]);
      return result;
    }, {} as any);
  }
  return obj;
};

class UserController {
  // Get user profile
  async getProfile(req: AuthRequest, res: Response): Promise<void> {
    try {
      const result = await db.query(
        `SELECT id, name, email, bio, company, profile_picture, is_deleted, 
                last_profile_update, created_at, updated_at 
         FROM users WHERE id = $1 AND is_deleted = FALSE`,
        [req.user?.id]
      );
      
      if (result.rows.length === 0) {
        res.status(404).json({
          success: false,
          message: 'User not found'
        });
        return;
      }

      const user = toCamelCase(result.rows[0]);

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
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');

      // Validate input
      const { error, value } = updateProfileSchema.validate(req.body);
      if (error) {
        throw new Error(`Validation error: ${error.details[0].message}`);
      }

      const updates: IUpdateProfileRequest = value;
      const userId = req.user?.id;

      // Get current user data
      const currentUserResult = await client.query(
        `SELECT id, name, email, bio, company, profile_picture, is_deleted 
         FROM users WHERE id = $1`,
        [userId]
      );

      if (currentUserResult.rows.length === 0 || currentUserResult.rows[0].is_deleted) {
        throw new Error('User not found');
      }

      const currentUser: IDbUser = currentUserResult.rows[0];

      // Check email uniqueness if email is being updated
      if (updates.email && updates.email !== currentUser.email) {
        const existingUserResult = await client.query(
          `SELECT id FROM users 
           WHERE email = $1 AND is_deleted = FALSE AND id != $2`,
          [updates.email, userId]
        );
        
        if (existingUserResult.rows.length > 0) {
          throw new Error('Email already exists');
        }
      }

      // Track changes for audit log
      const changes: Record<string, { old: any; new: any }> = {};
      const fieldMapping = {
        name: 'name',
        email: 'email', 
        bio: 'bio',
        company: 'company',
        profilePicture: 'profile_picture'
      };

      Object.entries(updates).forEach(([key, newValue]) => {
        const dbField = fieldMapping[key as keyof typeof fieldMapping];
        const oldValue = currentUser[dbField as keyof IDbUser];
        
        if (newValue !== undefined && newValue !== oldValue) {
          changes[key] = {
            old: oldValue,
            new: newValue
          };
        }
      });

      // Handle profile picture from multer
      if (req.file) {
        const profilePicturePath = `/uploads/profiles/${req.file.filename}`;
        updates.profilePicture = profilePicturePath;
        changes.profilePicture = {
          old: currentUser.profile_picture,
          new: profilePicturePath
        };
      }

      // Only update if there are actual changes
      if (Object.keys(changes).length === 0 && !req.file) {
        throw new Error('No changes detected');
      }

      // Build dynamic update query
      const updateFields = [];
      const updateValues = [];
      let paramIndex = 1;

      if (updates.name !== undefined) {
        updateFields.push(`name = $${paramIndex++}`);
        updateValues.push(updates.name);
      }
      if (updates.email !== undefined) {
        updateFields.push(`email = $${paramIndex++}`);
        updateValues.push(updates.email);
      }
      if (updates.bio !== undefined) {
        updateFields.push(`bio = $${paramIndex++}`);
        updateValues.push(updates.bio);
      }
      if (updates.company !== undefined) {
        updateFields.push(`company = $${paramIndex++}`);
        updateValues.push(updates.company);
      }
      if (updates.profilePicture !== undefined) {
        updateFields.push(`profile_picture = $${paramIndex++}`);
        updateValues.push(updates.profilePicture);
      }

      updateFields.push(`last_profile_update = CURRENT_TIMESTAMP`);
      updateValues.push(userId);

      const updateQuery = `
        UPDATE users 
        SET ${updateFields.join(', ')}
        WHERE id = $${paramIndex}
        RETURNING id, name, email, bio, company, profile_picture, is_deleted, 
                  last_profile_update, created_at, updated_at
      `;

      const updateResult = await client.query(updateQuery, updateValues);
      const updatedUser = toCamelCase(updateResult.rows[0]);

      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, changes, changed_by, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          'UPDATE',
          JSON.stringify(changes),
          userId,
          req.ip,
          req.get('User-Agent')
        ]
      );

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Profile updated successfully',
        data: updatedUser
      });
    } catch (error: any) {
      await client.query('ROLLBACK');
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
      client.release();
    }
  }

  // Soft delete user
  async deleteProfile(req: AuthRequest, res: Response): Promise<void> {
    const client = await db.getClient();
    
    try {
      await client.query('BEGIN');
      
      const userId = req.user?.id;
      
      const result = await client.query(
        'UPDATE users SET is_deleted = TRUE WHERE id = $1 RETURNING id',
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      // Create audit log
      await client.query(
        `INSERT INTO audit_logs (user_id, action, changes, changed_by, ip_address, user_agent)
         VALUES ($1, $2, $3, $4, $5, $6)`,
        [
          userId,
          'DELETE',
          JSON.stringify({ isDeleted: { old: false, new: true } }),
          userId,
          req.ip,
          req.get('User-Agent')
        ]
      );

      await client.query('COMMIT');

      res.status(200).json({
        success: true,
        message: 'Profile deleted successfully'
      });
    } catch (error) {
      await client.query('ROLLBACK');
      console.error('Delete profile error:', error);
      res.status(500).json({
        success: false,
        message: 'Failed to delete profile'
      });
    } finally {
      client.release();
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
      const offset = (parseInt(page!) - 1) * parseInt(limit!);
      
      // Map sortBy to database column
      const sortColumn = sortBy === 'timestamp' ? 'timestamp' : 'action';
      const sortDirection = sortOrder?.toUpperCase() === 'ASC' ? 'ASC' : 'DESC';

      // Explicitly type sort for clarity
      const sort: Record<string, 'ASC' | 'DESC'> = { [sortColumn]: sortDirection };

      // Get total count for pagination
      const countResult = await db.query(
        'SELECT COUNT(*) as total FROM audit_logs WHERE user_id = $1',
        [req.user?.id]
      );
      const totalCount = parseInt(countResult.rows[0].total);
      
      // Get audit logs
      const auditLogsResult = await db.query(
        `SELECT id, user_id, action, changes, changed_by, timestamp, ip_address, user_agent
         FROM audit_logs 
         WHERE user_id = $1
         ORDER BY ${sortColumn} ${sortDirection}
         LIMIT $2 OFFSET $3`,
        [req.user?.id, parseInt(limit!), offset]
      );

      const auditLogs = toCamelCase(auditLogsResult.rows);
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