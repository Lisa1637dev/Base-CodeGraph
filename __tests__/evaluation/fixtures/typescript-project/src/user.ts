/**
 * User management service
 */

import { User } from './types';
import { db } from './database';
import { validateEmail } from './utils/validation';

export class UserService {
  async getUser(id: string): Promise<User | null> {
    return db.findUserById(id);
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return db.findUserByEmail(email);
  }

  async updateProfile(userId: string, updates: { name?: string; email?: string }): Promise<User> {
    const user = await db.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    if (updates.email && updates.email !== user.email) {
      if (!validateEmail(updates.email)) {
        throw new Error('Invalid email format');
      }

      const existing = await db.findUserByEmail(updates.email);
      if (existing) {
        throw new Error('Email already in use');
      }
    }

    await db.updateUser(userId, updates);
    return { ...user, ...updates };
  }

  async deleteUser(userId: string): Promise<void> {
    const user = await db.findUserById(userId);
    if (!user) {
      throw new Error('User not found');
    }

    // In a real app, we'd also delete orders, etc.
    await db.updateUser(userId, { email: `deleted_${userId}@deleted.com` });
  }
}

export const userService = new UserService();
