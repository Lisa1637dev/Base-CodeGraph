/**
 * Authentication service
 */

import { User, AuthToken } from './types';
import { db } from './database';
import { hashPassword, verifyPassword, generateToken } from './utils/crypto';
import { validateEmail } from './utils/validation';

export class AuthService {
  private tokens: Map<string, AuthToken> = new Map();

  async register(email: string, password: string, name: string): Promise<User> {
    if (!validateEmail(email)) {
      throw new Error('Invalid email format');
    }

    const existing = await db.findUserByEmail(email);
    if (existing) {
      throw new Error('Email already registered');
    }

    const passwordHash = await hashPassword(password);
    const user: User = {
      id: generateToken(),
      email,
      name,
      passwordHash,
      createdAt: new Date(),
    };

    await db.createUser(user);
    return user;
  }

  async login(email: string, password: string): Promise<AuthToken> {
    const user = await db.findUserByEmail(email);
    if (!user) {
      throw new Error('Invalid credentials');
    }

    const valid = await verifyPassword(password, user.passwordHash);
    if (!valid) {
      throw new Error('Invalid credentials');
    }

    const token = this.createToken(user.id);
    return token;
  }

  async logout(token: string): Promise<void> {
    this.tokens.delete(token);
  }

  async validateToken(token: string): Promise<string | null> {
    const authToken = this.tokens.get(token);
    if (!authToken) {
      return null;
    }

    if (authToken.expiresAt < new Date()) {
      this.tokens.delete(token);
      return null;
    }

    return authToken.userId;
  }

  async refreshToken(token: string): Promise<AuthToken | null> {
    const userId = await this.validateToken(token);
    if (!userId) {
      return null;
    }

    this.tokens.delete(token);
    return this.createToken(userId);
  }

  private createToken(userId: string): AuthToken {
    const token: AuthToken = {
      token: generateToken(),
      userId,
      expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
    };
    this.tokens.set(token.token, token);
    return token;
  }
}

export const authService = new AuthService();
