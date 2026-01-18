/**
 * Sync Module
 *
 * Provides synchronization functionality for keeping the code graph
 * up-to-date with file system changes.
 *
 * Components:
 * - Git hooks for automatic post-commit syncing
 * - Content hashing for change detection (in extraction module)
 * - Incremental reindexing (in extraction module)
 */

export {
  GitHooksManager,
  createGitHooksManager,
  HookInstallResult,
  HookRemoveResult,
} from './git-hooks';
