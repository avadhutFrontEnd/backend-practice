import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import db from '../config/db';
import { IDbUser } from '../types/user';

export interface AuthRequest extends Request {
  user?: {
    id: string;
    email: string;
  };
}

export const authenticate = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const token = req.header('Authorization')?.replace('Bearer ', '');
    
    if (!token) {
      res.status(401).json({ 
        success: false, 
        message: 'Access denied. No token provided.' 
      });
      return;
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fallback_secret') as any;
    
    const result = await db.query(
      'SELECT id, email, is_deleted FROM users WHERE id = $1',
      [decoded.id]
    );
    
    if (result.rows.length === 0 || result.rows[0].is_deleted) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user not found.' 
      });
      return;
    }

    const user = result.rows[0];
    req.user = { id: user.id, email: user.email };
    next();
  } catch (error) {
    console.error('Authentication error:', error);
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

export const checkProfileUpdateLimit = async (req: AuthRequest, res: Response, next: NextFunction): Promise<void> => {
  try {
    const result = await db.query(
      'SELECT last_profile_update FROM users WHERE id = $1',
      [req.user?.id]
    );
    
    if (result.rows.length > 0 && result.rows[0].last_profile_update) {
      const timeDiff = Date.now() - new Date(result.rows[0].last_profile_update).getTime();
      const minutesDiff = timeDiff / (1000 * 60);
      
      if (minutesDiff < 5) {
        const nextAllowedUpdate = new Date(
          new Date(result.rows[0].last_profile_update).getTime() + 5 * 60 * 1000
        );
        
        res.status(429).json({
          success: false,
          message: 'Please wait 5 minutes between profile updates',
          nextAllowedUpdate
        });
        return;
      }
    }
    next();
  } catch (error) {
    console.error('Profile update limit check error:', error);
    next();
  }
};