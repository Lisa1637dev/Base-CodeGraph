/**
 * Core types for the e-commerce application
 */

export interface User {
  id: string;
  email: string;
  name: string;
  passwordHash: string;
  createdAt: Date;
}

export interface Product {
  id: string;
  name: string;
  price: number;
  stock: number;
}

export interface OrderItem {
  productId: string;
  quantity: number;
  price: number;
}

export interface Order {
  id: string;
  userId: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  createdAt: Date;
}

export type OrderStatus = 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';

export interface PaymentResult {
  success: boolean;
  transactionId?: string;
  error?: string;
}

export interface AuthToken {
  token: string;
  userId: string;
  expiresAt: Date;
}
