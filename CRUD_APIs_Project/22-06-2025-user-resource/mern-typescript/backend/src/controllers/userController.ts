import { Request, Response, NextFunction } from "express";
import { v4 as uuidv4 } from "uuid";
import { User, users } from "../models/user";

export const createUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { name, email } = req.body;
  const user: User = { id: uuidv4(), name, email };
  users.push(user);
  res.status(201).json({ message: "User created", data: user });
};

export const getUsers = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  res.status(200).json({ data: users });
};

export const updateUser = (
  req: Request,
  res: Response,
  next: NextFunction
): void => {
  const { id } = req.params;
  const { name, email } = req.body;

  const userIndex = users.findIndex((user) => user.id === id);
  if (userIndex === -1) {
    res.status(404).json({ message: "User not found" });
    return;
  }

  const updatedUser = {
    ...users[userIndex],
    ...(name && { name }),
    ...(email && { email }),
  };

  users[userIndex] = updatedUser;
  res.status(200).json({ message: "User updated", data: updatedUser });
};

export const deleteUser = (req: Request, res: Response,next: NextFunction): void => {
  const { id } = req.params;

  if (!id || isNaN(Number(id))) {
    res.status(400).json({ error: 'Invalid user ID' });
    return; 
  }

  const userIndex = users.findIndex((user) => user.id === id);

  if (userIndex === -1) {
    res.status(404).json({ error: 'User not found' });
    return;
  }

  users.splice(userIndex, 1);
  res.status(200).json({ message: 'User deleted successfully' });
  return;
}

