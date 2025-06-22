import { Router } from 'express';
import { createUser, getUsers, updateUser,deleteUser } from '../controllers/userController';
import { validateUser } from '../middleware/validate';
import { authMiddleware } from '../middleware/auth';

const router = Router();

router.post('/users', validateUser, createUser);
router.get('/users', getUsers);
router.put('/users/:id', validateUser, updateUser);

// DELETE /users/:id
// router.delete('/users/:id', (req: Request, res: Response) => {
//   const { id } = req.params;

//   // Validate ID
//   if (!id || isNaN(Number(id))) {
//     return res.status(400).json({ error: 'Invalid user ID' });
//   }

//   // Find user index
//   const userIndex = users.findIndex((user) => user.id === id);

//   if (userIndex === -1) {
//     return res.status(404).json({ error: 'User not found' });
//   }

//   // Delete user
//   users.splice(userIndex, 1);
//   return res.status(200).json({ message: 'User deleted successfully' });
// });

// DELETE /users/:id (protected by auth middleware)
router.delete('/:id', authMiddleware, deleteUser );
export default router;