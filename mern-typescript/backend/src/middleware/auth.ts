import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { User } from '../models/userModel';

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
    const user = await User.findById(decoded.id).select('-__v');
    
    if (!user || user.isDeleted) {
      res.status(401).json({ 
        success: false, 
        message: 'Invalid token or user not found.' 
      });
      return;
    }

    req.user = { id: user._id, email: user.email };
    next();
  } catch (error) {
    res.status(401).json({ 
      success: false, 
      message: 'Invalid token.' 
    });
  }
};

export const checkProfileUpdateLimit = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Check if user updated profile in last 5 minutes (business rule)
  User.findById(req.user?.id)
    .then(user => {
      if (user && user.lastProfileUpdate) {
        const timeDiff = Date.now() - user.lastProfileUpdate.getTime();
        const minutesDiff = timeDiff / (1000 * 60);
        
        if (minutesDiff < 5) {
          return res.status(429).json({
            success: false,
            message: 'Please wait 5 minutes between profile updates',
            nextAllowedUpdate: new Date(user.lastProfileUpdate.getTime() + 5 * 60 * 1000)
          });
        }
      }
      next();
    })
    .catch(() => next());
};