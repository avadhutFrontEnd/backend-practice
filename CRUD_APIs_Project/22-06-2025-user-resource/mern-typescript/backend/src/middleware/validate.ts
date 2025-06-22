import { Request, Response, NextFunction } from 'express';
import { z, ZodError } from 'zod';


export const userSchema = z.object({
    name: z.string().min(1, 'Name is required'),
    email: z.string().email('Invalid email address')
});

export const validateUser = (req: Request, res: Response, next: NextFunction):void => {
  try {
    userSchema.parse(req.body);
    next();
  } catch (error) {
    if (error instanceof ZodError) {
      res.status(400).json({ errors: error.errors });
      return; // Explicit return to satisfy TypeScript
    }
    res.status(500).json({ message: 'Internal server error' });
    return; // Explicit return to satisfy TypeScript
  }
};
