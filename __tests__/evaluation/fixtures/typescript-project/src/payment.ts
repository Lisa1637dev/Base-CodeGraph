/**
 * Payment processing service
 */

import { PaymentResult, Order } from './types';
import { db } from './database';
import { generateToken } from './utils/crypto';

export class PaymentService {
  async processPayment(orderId: string, amount: number): Promise<PaymentResult> {
    const order = await db.findOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'pending') {
      return { success: false, error: 'Order already processed' };
    }

    if (order.total !== amount) {
      return { success: false, error: 'Amount mismatch' };
    }

    // Simulate payment processing
    const success = Math.random() > 0.1; // 90% success rate

    if (success) {
      await db.updateOrderStatus(orderId, 'paid');
      return {
        success: true,
        transactionId: generateToken(),
      };
    }

    return { success: false, error: 'Payment declined' };
  }

  async refundPayment(orderId: string): Promise<PaymentResult> {
    const order = await db.findOrderById(orderId);
    if (!order) {
      return { success: false, error: 'Order not found' };
    }

    if (order.status !== 'paid') {
      return { success: false, error: 'Order not eligible for refund' };
    }

    await db.updateOrderStatus(orderId, 'cancelled');
    return {
      success: true,
      transactionId: generateToken(),
    };
  }

  calculateTotal(items: { price: number; quantity: number }[]): number {
    return items.reduce((sum, item) => sum + item.price * item.quantity, 0);
  }
}

export const paymentService = new PaymentService();
