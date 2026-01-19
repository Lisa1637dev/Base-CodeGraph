/**
 * Config file writing for the CodeGraph installer
 * Writes to claude.json and settings.json
 */

import * as fs from 'fs';
import * as path from 'path';
import * as os from 'os';
import { InstallLocation } from './prompts';

/**
 * Get the path to the Claude config directory
 */
function getClaudeConfigDir(location: InstallLocation): string {
  if (location === 'global') {
    return path.join(os.homedir(), '.claude');
  }
  return path.join(process.cwd(), '.claude');
}

/**
 * Get the path to the claude.json file
 * - Global: ~/.claude.json (root level)
 * - Local: ./.claude.json (project root)
 */
function getClaudeJsonPath(location: InstallLocation): string {
  if (location === 'global') {
    return path.join(os.homedir(), '.claude.json');
  }
  return path.join(process.cwd(), '.claude.json');
}

/**
 * Get the path to the settings.json file
 * - Global: ~/.claude/settings.json
 * - Local: ./.claude/settings.json
 */
function getSettingsJsonPath(location: InstallLocation): string {
  const configDir = getClaudeConfigDir(location);
  return path.join(configDir, 'settings.json');
}

/**
 * Read a JSON file, returning an empty object if it doesn't exist
 */
function readJsonFile(filePath: string): Record<string, any> {
  try {
    if (fs.existsSync(filePath)) {
      const content = fs.readFileSync(filePath, 'utf-8');
      return JSON.parse(content);
    }
  } catch {
    // Ignore parse errors, return empty object
  }
  return {};
}

/**
 * Write a JSON file, creating parent directories if needed
 */
function writeJsonFile(filePath: string, data: Record<string, any>): void {
  const dir = path.dirname(filePath);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2) + '\n');
}

/**
 * Get the MCP server configuration for the given location
 */
function getMcpServerConfig(location: InstallLocation): Record<string, any> {
  if (location === 'global') {
    // Global: use 'codegraph' command directly (assumes globally installed)
    return {
      type: 'stdio',
      command: 'codegraph',
      args: ['serve', '--mcp'],
    };
  }
  // Local: use npx to run the package
  return {
    type: 'stdio',
    command: 'npx',
    args: ['@colbymchenry/codegraph', 'serve', '--mcp'],
  };
}

/**
 * Write the MCP server configuration to claude.json
 */
export function writeMcpConfig(location: InstallLocation): void {
  const claudeJsonPath = getClaudeJsonPath(location);
  const config = readJsonFile(claudeJsonPath);

  // Ensure mcpServers object exists
  if (!config.mcpServers) {
    config.mcpServers = {};
  }

  // Add or update codegraph server
  config.mcpServers.codegraph = getMcpServerConfig(location);

  writeJsonFile(claudeJsonPath, config);
}

/**
 * Get the list of permissions for CodeGraph tools
 */
function getCodeGraphPermissions(): string[] {
  return [
    'mcp__codegraph__codegraph_search',
    'mcp__codegraph__codegraph_context',
    'mcp__codegraph__codegraph_callers',
    'mcp__codegraph__codegraph_callees',
    'mcp__codegraph__codegraph_impact',
    'mcp__codegraph__codegraph_node',
    'mcp__codegraph__codegraph_status',
  ];
}

/**
 * Write permissions to settings.json
 */
export function writePermissions(location: InstallLocation): void {
  const settingsPath = getSettingsJsonPath(location);
  const settings = readJsonFile(settingsPath);

  // Ensure permissions object exists
  if (!settings.permissions) {
    settings.permissions = {};
  }

  // Ensure allow array exists
  if (!Array.isArray(settings.permissions.allow)) {
    settings.permissions.allow = [];
  }

  // Add CodeGraph permissions (avoiding duplicates)
  const codegraphPermissions = getCodeGraphPermissions();
  for (const permission of codegraphPermissions) {
    if (!settings.permissions.allow.includes(permission)) {
      settings.permissions.allow.push(permission);
    }
  }

  writeJsonFile(settingsPath, settings);
}

/**
 * Check if MCP config already exists for CodeGraph
 */
export function hasMcpConfig(location: InstallLocation): boolean {
  const claudeJsonPath = getClaudeJsonPath(location);
  const config = readJsonFile(claudeJsonPath);
  return !!config.mcpServers?.codegraph;
}

/**
 * Check if permissions already exist for CodeGraph
 */
export function hasPermissions(location: InstallLocation): boolean {
  const settingsPath = getSettingsJsonPath(location);
  const settings = readJsonFile(settingsPath);
  const permissions = settings.permissions?.allow;
  if (!Array.isArray(permissions)) {
    return false;
  }
  // Check if at least one CodeGraph permission exists
  return permissions.some((p: string) => p.startsWith('mcp__codegraph__'));
}
