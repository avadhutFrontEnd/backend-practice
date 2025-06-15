import express from 'express';
import multer from 'multer';
import path from 'path';
import { authenticate, checkProfileUpdateLimit } from '../middleware/auth';
import userController from '../controllers/userController';

const router = express.Router();

// Multer configuration for profile pictures
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, 'uploads/profiles/');
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, `profile-${uniqueSuffix}${path.extname(file.originalname)}`);
  }
});

const fileFilter = (req: any, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid file type. Only JPEG, PNG, and WebP are allowed.'));
  }
};

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Routes
router.get('/profile', authenticate, userController.getProfile);
router.put('/profile', 
  authenticate, 
  checkProfileUpdateLimit,
  upload.single('profilePicture'), 
  userController.updateProfile
);
router.delete('/profile', authenticate, userController.deleteProfile);
router.get('/audit-logs', authenticate, userController.getAuditLogs);

export default router;