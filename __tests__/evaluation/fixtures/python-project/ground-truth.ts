/**
 * Ground truth definitions for the Python task management fixture
 */

import { FixtureGroundTruth } from '../../types';

export const pythonFixture: FixtureGroundTruth = {
  name: 'python-taskmanager',
  path: '__tests__/evaluation/fixtures/python-project',
  language: 'python',
  totalFiles: 5,
  approximateTokens: 1200, // Rough estimate

  testCases: [
    // =========================================================================
    // Search Tests
    // =========================================================================
    {
      id: 'py-search-auth',
      description: 'Search for authentication functionality',
      query: 'authentication login',
      type: 'search',
      expectedSymbols: ['AuthService', 'AuthService.login', 'AuthService.register', 'verify_password'],
      irrelevantSymbols: ['TaskService', 'validate_task_title', 'Project'],
      minRecall: 0.7,
      minPrecision: 0.5,
    },
    {
      id: 'py-search-task',
      description: 'Search for task management',
      query: 'task create complete',
      type: 'search',
      expectedSymbols: ['TaskService', 'TaskService.create_task', 'TaskService.complete_task', 'Task'],
      irrelevantSymbols: ['AuthService', 'validate_email', 'hash_password'],
      minRecall: 0.7,
      minPrecision: 0.5,
    },
    {
      id: 'py-search-validation',
      description: 'Search for validation',
      query: 'validate',
      type: 'search',
      expectedSymbols: ['validate_email', 'validate_password', 'validate_task_title'],
      irrelevantSymbols: ['hash_password', 'generate_token', 'TaskService'],
      minRecall: 0.8,
      minPrecision: 0.6,
    },

    // =========================================================================
    // Context Tests
    // =========================================================================
    {
      id: 'py-context-login-bug',
      description: 'Build context for fixing login issues',
      query: 'debug why users cannot log in',
      type: 'context',
      expectedSymbols: [
        'AuthService.login',
        'verify_password',
        'db.get_user_by_email',
        'User',
        'hash_password',
      ],
      irrelevantSymbols: [
        'TaskService',
        'validate_task_title',
        'Project',
        'Task',
      ],
      minRecall: 0.8,
      minPrecision: 0.6,
    },
    {
      id: 'py-context-task-creation',
      description: 'Build context for task creation flow',
      query: 'understand how tasks are created',
      type: 'context',
      expectedSymbols: [
        'TaskService.create_task',
        'validate_task_title',
        'auth_service.get_user_id',
        'db.create_task',
        'Task',
        'generate_token',
      ],
      irrelevantSymbols: [
        'validate_email',
        'hash_password',
        'AuthService.register',
        'Project',
      ],
      minRecall: 0.7,
      minPrecision: 0.5,
    },
    {
      id: 'py-context-user-registration',
      description: 'Build context for user registration',
      query: 'add email confirmation to registration',
      type: 'context',
      expectedSymbols: [
        'AuthService.register',
        'validate_email',
        'validate_password',
        'hash_password',
        'db.create_user',
        'User',
      ],
      irrelevantSymbols: [
        'TaskService',
        'validate_task_title',
        'Task',
        'Project',
      ],
      minRecall: 0.7,
      minPrecision: 0.6,
    },

    // =========================================================================
    // Callers Tests
    // =========================================================================
    {
      id: 'py-callers-get_user_id',
      description: 'Find all callers of auth_service.get_user_id',
      query: 'get_user_id',
      type: 'callers',
      targetSymbol: 'get_user_id',
      expectedSymbols: [
        'TaskService.create_task',
        'TaskService.get_task',
        'TaskService.get_user_tasks',
      ],
      irrelevantSymbols: [
        'AuthService.login',
        'validate_email',
        'hash_password',
      ],
      minRecall: 1.0,
      minPrecision: 1.0,
    },
    {
      id: 'py-callers-validate_email',
      description: 'Find all callers of validate_email',
      query: 'validate_email',
      type: 'callers',
      targetSymbol: 'validate_email',
      expectedSymbols: [
        'AuthService.register',
      ],
      irrelevantSymbols: [
        'TaskService',
        'validate_password',
        'hash_password',
      ],
      minRecall: 1.0,
      minPrecision: 1.0,
    },
    {
      id: 'py-callers-generate_token',
      description: 'Find all callers of generate_token',
      query: 'generate_token',
      type: 'callers',
      targetSymbol: 'generate_token',
      expectedSymbols: [
        'AuthService.register',
        'AuthService.login',
        'TaskService.create_task',
      ],
      irrelevantSymbols: [
        'validate_email',
        'validate_password',
        'db.get_user',
      ],
      minRecall: 1.0,
      minPrecision: 1.0,
    },

    // =========================================================================
    // Callees Tests
    // =========================================================================
    {
      id: 'py-callees-login',
      description: 'Find what AuthService.login calls',
      query: 'login',
      type: 'callees',
      targetSymbol: 'login',
      expectedSymbols: [
        'db.get_user_by_email',
        'verify_password',
        'generate_token',
      ],
      irrelevantSymbols: [
        'validate_email',
        'hash_password',
        'validate_task_title',
      ],
      minRecall: 1.0,
      minPrecision: 1.0,
    },
    {
      id: 'py-callees-create_task',
      description: 'Find what TaskService.create_task calls',
      query: 'create_task',
      type: 'callees',
      targetSymbol: 'TaskService.create_task',
      expectedSymbols: [
        'auth_service.get_user_id',
        'validate_task_title',
        'generate_token',
        'db.create_task',
      ],
      irrelevantSymbols: [
        'validate_email',
        'hash_password',
        'db.get_user',
      ],
      minRecall: 0.8,
      minPrecision: 0.8,
    },

    // =========================================================================
    // Impact Tests
    // =========================================================================
    {
      id: 'py-impact-generate_token',
      description: 'Impact of changing generate_token',
      query: 'generate_token',
      type: 'impact',
      targetSymbol: 'generate_token',
      expectedSymbols: [
        // Direct callers
        'AuthService.register',
        'AuthService.login',
        'TaskService.create_task',
      ],
      irrelevantSymbols: [
        'validate_email',
        'validate_task_title',
        'db.get_project',
      ],
      minRecall: 0.8,
      minPrecision: 0.7,
    },
    {
      id: 'py-impact-get_user_id',
      description: 'Impact of changing get_user_id',
      query: 'get_user_id',
      type: 'impact',
      targetSymbol: 'get_user_id',
      expectedSymbols: [
        'TaskService.create_task',
        'TaskService.get_task',
        'TaskService.get_user_tasks',
        'TaskService.complete_task',
        'TaskService.delete_task',
      ],
      irrelevantSymbols: [
        'AuthService.register',
        'validate_email',
        'hash_password',
      ],
      minRecall: 0.8,
      minPrecision: 0.7,
    },
  ],

  // Known call graph edges for validation
  callGraph: [
    // Auth -> Database
    { caller: 'AuthService.register', callee: 'db.get_user_by_email' },
    { caller: 'AuthService.register', callee: 'db.create_user' },
    { caller: 'AuthService.login', callee: 'db.get_user_by_email' },

    // Auth -> Crypto
    { caller: 'AuthService.register', callee: 'hash_password' },
    { caller: 'AuthService.register', callee: 'generate_token' },
    { caller: 'AuthService.login', callee: 'verify_password' },
    { caller: 'AuthService.login', callee: 'generate_token' },

    // Auth -> Validation
    { caller: 'AuthService.register', callee: 'validate_email' },
    { caller: 'AuthService.register', callee: 'validate_password' },

    // Task -> Auth
    { caller: 'TaskService.create_task', callee: 'auth_service.get_user_id' },
    { caller: 'TaskService.get_task', callee: 'auth_service.get_user_id' },
    { caller: 'TaskService.get_user_tasks', callee: 'auth_service.get_user_id' },

    // Task -> Database
    { caller: 'TaskService.create_task', callee: 'db.create_task' },
    { caller: 'TaskService.get_task', callee: 'db.get_task' },
    { caller: 'TaskService.get_user_tasks', callee: 'db.get_user_tasks' },
    { caller: 'TaskService.complete_task', callee: 'db.update_task' },
    { caller: 'TaskService.delete_task', callee: 'db.delete_task' },

    // Task -> Crypto
    { caller: 'TaskService.create_task', callee: 'generate_token' },

    // Task -> Validation
    { caller: 'TaskService.create_task', callee: 'validate_task_title' },

    // Task -> Task (internal)
    { caller: 'TaskService.complete_task', callee: 'TaskService.get_task' },
    { caller: 'TaskService.delete_task', callee: 'TaskService.get_task' },
  ],
};
