/**
 * Ground truth definitions for the TypeScript e-commerce fixture
 */

import { FixtureGroundTruth } from '../../types';

export const typescriptFixture: FixtureGroundTruth = {
  name: 'typescript-ecommerce',
  path: '__tests__/evaluation/fixtures/typescript-project',
  language: 'typescript',
  totalFiles: 9,
  approximateTokens: 2500, // Rough estimate

  testCases: [
    // =========================================================================
    // Search Tests
    // =========================================================================
    {
      id: 'ts-search-login',
      description: 'Search for login functionality',
      query: 'login',
      type: 'search',
      expectedSymbols: ['AuthService.login', 'AuthService'],
      irrelevantSymbols: ['PaymentService', 'OrderService', 'calculateTotal'],
      minRecall: 0.8,
      minPrecision: 0.5,
    },
    {
      id: 'ts-search-validation',
      description: 'Search for validation functions',
      query: 'validate',
      type: 'search',
      expectedSymbols: ['validateEmail', 'validatePassword', 'validateQuantity', 'validatePrice', 'validateToken'],
      irrelevantSymbols: ['hashPassword', 'generateToken', 'calculateTotal'],
      minRecall: 0.6,
      minPrecision: 0.6,
    },
    {
      id: 'ts-search-payment',
      description: 'Search for payment processing',
      query: 'payment process',
      type: 'search',
      expectedSymbols: ['PaymentService', 'processPayment', 'payOrder'],
      irrelevantSymbols: ['AuthService', 'UserService', 'validateEmail'],
      minRecall: 0.7,
      minPrecision: 0.5,
    },

    // =========================================================================
    // Context Tests (simulating Claude asking for context)
    // =========================================================================
    {
      id: 'ts-context-login-bug',
      description: 'Build context for fixing a login bug',
      query: 'fix the bug where login fails with valid credentials',
      type: 'context',
      expectedSymbols: [
        'AuthService.login',
        'verifyPassword',
        'db.findUserByEmail',
        'User',
        'AuthToken',
      ],
      irrelevantSymbols: [
        'OrderService',
        'PaymentService',
        'calculateTotal',
        'validateQuantity',
        'Product',
      ],
      minRecall: 0.8,
      minPrecision: 0.6,
    },
    {
      id: 'ts-context-order-creation',
      description: 'Build context for understanding order creation flow',
      query: 'understand how orders are created and validated',
      type: 'context',
      expectedSymbols: [
        'OrderService.createOrder',
        'validateQuantity',
        'db.findProductById',
        'db.createOrder',
        'paymentService.calculateTotal',
        'Order',
        'OrderItem',
      ],
      irrelevantSymbols: [
        'AuthService.register',
        'validateEmail',
        'hashPassword',
        'UserService',
      ],
      minRecall: 0.7,
      minPrecision: 0.5,
    },
    {
      id: 'ts-context-add-refund',
      description: 'Build context for adding refund functionality',
      query: 'add ability to request a refund for paid orders',
      type: 'context',
      expectedSymbols: [
        'PaymentService.refundPayment',
        'OrderService.cancelOrder',
        'db.updateOrderStatus',
        'Order',
        'PaymentResult',
      ],
      irrelevantSymbols: [
        'AuthService.register',
        'validateEmail',
        'hashPassword',
        'UserService.updateProfile',
      ],
      minRecall: 0.7,
      minPrecision: 0.5,
    },
    {
      id: 'ts-context-user-registration',
      description: 'Build context for user registration flow',
      query: 'implement email verification during user registration',
      type: 'context',
      expectedSymbols: [
        'AuthService.register',
        'validateEmail',
        'hashPassword',
        'db.createUser',
        'db.findUserByEmail',
        'User',
      ],
      irrelevantSymbols: [
        'OrderService',
        'PaymentService',
        'calculateTotal',
        'Product',
      ],
      minRecall: 0.7,
      minPrecision: 0.6,
    },

    // =========================================================================
    // Callers Tests
    // =========================================================================
    {
      id: 'ts-callers-validateEmail',
      description: 'Find all callers of validateEmail',
      query: 'validateEmail',
      type: 'callers',
      targetSymbol: 'validateEmail',
      expectedSymbols: [
        'AuthService.register',
        'UserService.updateProfile',
      ],
      irrelevantSymbols: [
        'OrderService',
        'PaymentService',
        'validateQuantity',
      ],
      minRecall: 1.0, // Should find all callers
      minPrecision: 1.0,
    },
    {
      id: 'ts-callers-findUserByEmail',
      description: 'Find all callers of db.findUserByEmail',
      query: 'findUserByEmail',
      type: 'callers',
      targetSymbol: 'findUserByEmail',
      expectedSymbols: [
        'AuthService.register',
        'AuthService.login',
        'UserService.getUserByEmail',
        'UserService.updateProfile',
      ],
      irrelevantSymbols: [
        'OrderService',
        'PaymentService',
        'findProductById',
      ],
      minRecall: 1.0,
      minPrecision: 1.0,
    },
    {
      id: 'ts-callers-generateToken',
      description: 'Find all callers of generateToken',
      query: 'generateToken',
      type: 'callers',
      targetSymbol: 'generateToken',
      expectedSymbols: [
        'AuthService.register',
        'AuthService.createToken',
        'PaymentService.processPayment',
        'PaymentService.refundPayment',
      ],
      irrelevantSymbols: [
        'validateEmail',
        'validateQuantity',
        'calculateTotal',
      ],
      minRecall: 1.0,
      minPrecision: 1.0,
    },

    // =========================================================================
    // Callees Tests
    // =========================================================================
    {
      id: 'ts-callees-login',
      description: 'Find what AuthService.login calls',
      query: 'login',
      type: 'callees',
      targetSymbol: 'login',
      expectedSymbols: [
        'db.findUserByEmail',
        'verifyPassword',
        'createToken',
      ],
      irrelevantSymbols: [
        'hashPassword',
        'validateQuantity',
        'calculateTotal',
      ],
      minRecall: 1.0,
      minPrecision: 1.0,
    },
    {
      id: 'ts-callees-createOrder',
      description: 'Find what OrderService.createOrder calls',
      query: 'createOrder',
      type: 'callees',
      targetSymbol: 'OrderService.createOrder',
      expectedSymbols: [
        'authService.validateToken',
        'validateQuantity',
        'db.findProductById',
        'paymentService.calculateTotal',
        'generateOrderId',
        'db.createOrder',
        'db.updateProductStock',
      ],
      irrelevantSymbols: [
        'validateEmail',
        'hashPassword',
        'refundPayment',
      ],
      minRecall: 0.8,
      minPrecision: 0.8,
    },

    // =========================================================================
    // Impact Tests
    // =========================================================================
    {
      id: 'ts-impact-generateToken',
      description: 'Impact of changing generateToken',
      query: 'generateToken',
      type: 'impact',
      targetSymbol: 'generateToken',
      expectedSymbols: [
        // Direct callers
        'AuthService.register',
        'AuthService.createToken',
        'PaymentService.processPayment',
        'PaymentService.refundPayment',
        // Indirect (callers of callers)
        'AuthService.login',
        'AuthService.refreshToken',
        'OrderService.payOrder',
        'OrderService.cancelOrder',
      ],
      irrelevantSymbols: [
        'validateQuantity',
        'validatePrice',
        'UserService.getUser',
      ],
      minRecall: 0.7,
      minPrecision: 0.6,
    },
    {
      id: 'ts-impact-validateToken',
      description: 'Impact of changing validateToken',
      query: 'validateToken',
      type: 'impact',
      targetSymbol: 'validateToken',
      expectedSymbols: [
        // Direct callers
        'AuthService.refreshToken',
        'OrderService.createOrder',
        'OrderService.getOrder',
        'OrderService.getUserOrders',
        'OrderService.payOrder',
        'OrderService.cancelOrder',
      ],
      irrelevantSymbols: [
        'validateEmail',
        'validateQuantity',
        'hashPassword',
        'PaymentService.calculateTotal',
      ],
      minRecall: 0.8,
      minPrecision: 0.7,
    },
  ],

  // Known call graph edges for validation
  callGraph: [
    // Auth -> Database
    { caller: 'AuthService.register', callee: 'db.findUserByEmail' },
    { caller: 'AuthService.register', callee: 'db.createUser' },
    { caller: 'AuthService.login', callee: 'db.findUserByEmail' },

    // Auth -> Crypto
    { caller: 'AuthService.register', callee: 'hashPassword' },
    { caller: 'AuthService.register', callee: 'generateToken' },
    { caller: 'AuthService.login', callee: 'verifyPassword' },
    { caller: 'AuthService.createToken', callee: 'generateToken' },

    // Auth -> Validation
    { caller: 'AuthService.register', callee: 'validateEmail' },

    // User -> Database
    { caller: 'UserService.getUser', callee: 'db.findUserById' },
    { caller: 'UserService.getUserByEmail', callee: 'db.findUserByEmail' },
    { caller: 'UserService.updateProfile', callee: 'db.findUserById' },
    { caller: 'UserService.updateProfile', callee: 'db.findUserByEmail' },
    { caller: 'UserService.updateProfile', callee: 'db.updateUser' },
    { caller: 'UserService.deleteUser', callee: 'db.findUserById' },
    { caller: 'UserService.deleteUser', callee: 'db.updateUser' },

    // User -> Validation
    { caller: 'UserService.updateProfile', callee: 'validateEmail' },

    // Order -> Auth
    { caller: 'OrderService.createOrder', callee: 'authService.validateToken' },
    { caller: 'OrderService.getOrder', callee: 'authService.validateToken' },
    { caller: 'OrderService.getUserOrders', callee: 'authService.validateToken' },

    // Order -> Database
    { caller: 'OrderService.createOrder', callee: 'db.findProductById' },
    { caller: 'OrderService.createOrder', callee: 'db.createOrder' },
    { caller: 'OrderService.createOrder', callee: 'db.updateProductStock' },
    { caller: 'OrderService.getOrder', callee: 'db.findOrderById' },
    { caller: 'OrderService.getUserOrders', callee: 'db.findOrdersByUserId' },
    { caller: 'OrderService.cancelOrder', callee: 'db.updateOrderStatus' },

    // Order -> Payment
    { caller: 'OrderService.createOrder', callee: 'paymentService.calculateTotal' },
    { caller: 'OrderService.payOrder', callee: 'paymentService.processPayment' },
    { caller: 'OrderService.cancelOrder', callee: 'paymentService.refundPayment' },

    // Order -> Validation
    { caller: 'OrderService.createOrder', callee: 'validateQuantity' },

    // Order -> Crypto
    { caller: 'OrderService.createOrder', callee: 'generateOrderId' },

    // Payment -> Database
    { caller: 'PaymentService.processPayment', callee: 'db.findOrderById' },
    { caller: 'PaymentService.processPayment', callee: 'db.updateOrderStatus' },
    { caller: 'PaymentService.refundPayment', callee: 'db.findOrderById' },
    { caller: 'PaymentService.refundPayment', callee: 'db.updateOrderStatus' },

    // Payment -> Crypto
    { caller: 'PaymentService.processPayment', callee: 'generateToken' },
    { caller: 'PaymentService.refundPayment', callee: 'generateToken' },
  ],
};
