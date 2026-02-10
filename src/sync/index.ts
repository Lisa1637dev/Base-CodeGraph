/**
 * Sync Module
 *
 * Provides synchronization functionality for keeping the code graph
 * up-to-date with file system changes.
 *
 * Note: Git hooks functionality has been removed. CodeGraph sync is now
 * triggered through codegraph's Claude Code hooks integration instead.
 *
 * Components:
 * - Content hashing for change detection (in extraction module)
 * - Incremental reindexing (in extraction module)
 */

// This module is kept for potential future sync-related exports
// Currently all sync functionality is in the extraction module
export {};
