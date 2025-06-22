import { Request, Response, NextFunction } from 'express';

export const authMiddleware = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers['authorization'];

  // Simulate token validation (replace with real logic, e.g., JWT verification)
  if (!authHeader || authHeader !== 'Bearer my-secret-token') {
    res.status(401).json({ error: 'Unauthorized' });
    return;
  }

  next(); // Proceed to the next middleware or route handler
};