/**
 * Database abstraction layer
 */

import { User, Product, Order } from './types';

export class Database {
  private users: Map<string, User> = new Map();
  private products: Map<string, Product> = new Map();
  private orders: Map<string, Order> = new Map();

  async findUserById(id: string): Promise<User | null> {
    return this.users.get(id) || null;
  }

  async findUserByEmail(email: string): Promise<User | null> {
    for (const user of this.users.values()) {
      if (user.email === email) {
        return user;
      }
    }
    return null;
  }

  async createUser(user: User): Promise<void> {
    this.users.set(user.id, user);
  }

  async updateUser(id: string, updates: Partial<User>): Promise<void> {
    const user = this.users.get(id);
    if (user) {
      this.users.set(id, { ...user, ...updates });
    }
  }

  async findProductById(id: string): Promise<Product | null> {
    return this.products.get(id) || null;
  }

  async updateProductStock(id: string, quantity: number): Promise<void> {
    const product = this.products.get(id);
    if (product) {
      product.stock -= quantity;
      this.products.set(id, product);
    }
  }

  async createOrder(order: Order): Promise<void> {
    this.orders.set(order.id, order);
  }

  async findOrderById(id: string): Promise<Order | null> {
    return this.orders.get(id) || null;
  }

  async findOrdersByUserId(userId: string): Promise<Order[]> {
    const orders: Order[] = [];
    for (const order of this.orders.values()) {
      if (order.userId === userId) {
        orders.push(order);
      }
    }
    return orders;
  }

  async updateOrderStatus(id: string, status: Order['status']): Promise<void> {
    const order = this.orders.get(id);
    if (order) {
      order.status = status;
      this.orders.set(id, order);
    }
  }
}

export const db = new Database();
