/**
 * Order management service
 */

import { Order, OrderItem, Product } from './types';
import { db } from './database';
import { paymentService } from './payment';
import { authService } from './auth';
import { generateOrderId } from './utils/crypto';
import { validateQuantity } from './utils/validation';

export class OrderService {
  async createOrder(token: string, items: OrderItem[]): Promise<Order> {
    const userId = await authService.validateToken(token);
    if (!userId) {
      throw new Error('Invalid or expired token');
    }

    // Validate items
    for (const item of items) {
      if (!validateQuantity(item.quantity)) {
        throw new Error(`Invalid quantity for product ${item.productId}`);
      }

      const product = await db.findProductById(item.productId);
      if (!product) {
        throw new Error(`Product not found: ${item.productId}`);
      }

      if (product.stock < item.quantity) {
        throw new Error(`Insufficient stock for product ${item.productId}`);
      }
    }

    // Calculate total
    const total = paymentService.calculateTotal(items);

    // Create order
    const order: Order = {
      id: generateOrderId(),
      userId,
      items,
      total,
      status: 'pending',
      createdAt: new Date(),
    };

    await db.createOrder(order);

    // Update stock
    for (const item of items) {
      await db.updateProductStock(item.productId, item.quantity);
    }

    return order;
  }

  async getOrder(token: string, orderId: string): Promise<Order | null> {
    const userId = await authService.validateToken(token);
    if (!userId) {
      throw new Error('Invalid or expired token');
    }

    const order = await db.findOrderById(orderId);
    if (!order || order.userId !== userId) {
      return null;
    }

    return order;
  }

  async getUserOrders(token: string): Promise<Order[]> {
    const userId = await authService.validateToken(token);
    if (!userId) {
      throw new Error('Invalid or expired token');
    }

    return db.findOrdersByUserId(userId);
  }

  async payOrder(token: string, orderId: string): Promise<boolean> {
    const order = await this.getOrder(token, orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status !== 'pending') {
      throw new Error('Order already processed');
    }

    const result = await paymentService.processPayment(orderId, order.total);
    return result.success;
  }

  async cancelOrder(token: string, orderId: string): Promise<boolean> {
    const order = await this.getOrder(token, orderId);
    if (!order) {
      throw new Error('Order not found');
    }

    if (order.status === 'shipped' || order.status === 'delivered') {
      throw new Error('Cannot cancel shipped or delivered orders');
    }

    if (order.status === 'paid') {
      const refund = await paymentService.refundPayment(orderId);
      return refund.success;
    }

    await db.updateOrderStatus(orderId, 'cancelled');
    return true;
  }
}

export const orderService = new OrderService();
