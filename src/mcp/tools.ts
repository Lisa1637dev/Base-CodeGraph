/**
 * MCP Tool Definitions
 *
 * Defines the tools exposed by the CodeGraph MCP server.
 */

import * as fs from 'fs';
import * as path from 'path';
import CodeGraph from '../index';
import type { Node, SearchResult, Subgraph, TaskContext, NodeKind } from '../types';

/**
 * MCP Tool definition
 */
export interface ToolDefinition {
  name: string;
  description: string;
  inputSchema: {
    type: 'object';
    properties: Record<string, PropertySchema>;
    required?: string[];
  };
}

interface PropertySchema {
  type: string;
  description: string;
  enum?: string[];
  default?: unknown;
}

/**
 * Tool execution result
 */
export interface ToolResult {
  content: Array<{
    type: 'text';
    text: string;
  }>;
  isError?: boolean;
}

/**
 * All CodeGraph MCP tools
 *
 * Designed for minimal context usage - use codegraph_context as the primary tool,
 * and only use other tools for targeted follow-up queries.
 */
export const tools: ToolDefinition[] = [
  {
    name: 'codegraph_search',
    description: 'Quick symbol search by name. Returns locations only (no code). Use codegraph_context instead for comprehensive task context.',
    inputSchema: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Symbol name or partial name (e.g., "auth", "signIn", "UserService")',
        },
        kind: {
          type: 'string',
          description: 'Filter by node kind',
          enum: ['function', 'method', 'class', 'interface', 'type', 'variable', 'route', 'component'],
        },
        limit: {
          type: 'number',
          description: 'Maximum results (default: 10)',
          default: 10,
        },
      },
      required: ['query'],
    },
  },
  {
    name: 'codegraph_context',
    description: 'PRIMARY TOOL: Build comprehensive context for a task. Returns entry points, related symbols, and key code - often enough to understand the codebase without additional tool calls. NOTE: This provides CODE context, not product requirements. For new features, still clarify UX/behavior questions with the user before implementing.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Description of the task, bug, or feature to build context for',
        },
        maxNodes: {
          type: 'number',
          description: 'Maximum symbols to include (default: 20)',
          default: 20,
        },
        includeCode: {
          type: 'boolean',
          description: 'Include code snippets for key symbols (default: true)',
          default: true,
        },
      },
      required: ['task'],
    },
  },
  {
    name: 'codegraph_callers',
    description: 'Find all functions/methods that call a specific symbol. Useful for understanding usage patterns and impact of changes.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Name of the function, method, or class to find callers for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of callers to return (default: 20)',
          default: 20,
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'codegraph_callees',
    description: 'Find all functions/methods that a specific symbol calls. Useful for understanding dependencies and code flow.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Name of the function, method, or class to find callees for',
        },
        limit: {
          type: 'number',
          description: 'Maximum number of callees to return (default: 20)',
          default: 20,
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'codegraph_impact',
    description: 'Analyze the impact radius of changing a symbol. Shows what code could be affected by modifications.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Name of the symbol to analyze impact for',
        },
        depth: {
          type: 'number',
          description: 'How many levels of dependencies to traverse (default: 2)',
          default: 2,
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'codegraph_node',
    description: 'Get detailed information about a specific code symbol. Use includeCode=true only when you need the full source code - otherwise just get location and signature to minimize context usage.',
    inputSchema: {
      type: 'object',
      properties: {
        symbol: {
          type: 'string',
          description: 'Name of the symbol to get details for',
        },
        includeCode: {
          type: 'boolean',
          description: 'Include full source code (default: false to minimize context)',
          default: false,
        },
      },
      required: ['symbol'],
    },
  },
  {
    name: 'codegraph_status',
    description: 'Get the status of the CodeGraph index, including statistics about indexed files, nodes, and edges.',
    inputSchema: {
      type: 'object',
      properties: {},
    },
  },
  {
    name: 'codegraph_explore',
    description: 'RECOMMENDED FOR COMPLEX TASKS: Deep exploration that READS CODE INTERNALLY and returns synthesis with key snippets. You do NOT need to make separate Read calls - the code is included in the response. Checks for existing implementations, traces data flow, and includes relevant code. For feature requests, use AskUserQuestion to clarify requirements BEFORE planning.',
    inputSchema: {
      type: 'object',
      properties: {
        task: {
          type: 'string',
          description: 'Detailed description of the feature, bug, or task to explore',
        },
        focus: {
          type: 'string',
          description: 'Optional focus area: "architecture" (structure & patterns), "implementation" (specific code), or "impact" (what would change). Default: auto-detect.',
          enum: ['architecture', 'implementation', 'impact'],
        },
        keywords: {
          type: 'string',
          description: 'Optional comma-separated keywords to search for (e.g., "bundle,swap,subscription")',
        },
      },
      required: ['task'],
    },
  },
];

/**
 * Tool handler that executes tools against a CodeGraph instance
 */
export class ToolHandler {
  constructor(private cg: CodeGraph) {}

  /**
   * Execute a tool by name
   */
  async execute(toolName: string, args: Record<string, unknown>): Promise<ToolResult> {
    try {
      switch (toolName) {
        case 'codegraph_search':
          return await this.handleSearch(args);
        case 'codegraph_context':
          return await this.handleContext(args);
        case 'codegraph_callers':
          return await this.handleCallers(args);
        case 'codegraph_callees':
          return await this.handleCallees(args);
        case 'codegraph_impact':
          return await this.handleImpact(args);
        case 'codegraph_node':
          return await this.handleNode(args);
        case 'codegraph_status':
          return await this.handleStatus();
        case 'codegraph_explore':
          return await this.handleExplore(args);
        default:
          return this.errorResult(`Unknown tool: ${toolName}`);
      }
    } catch (err) {
      return this.errorResult(`Tool execution failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  /**
   * Handle codegraph_search
   */
  private async handleSearch(args: Record<string, unknown>): Promise<ToolResult> {
    const query = args.query as string;
    const kind = args.kind as string | undefined;
    const limit = (args.limit as number) || 10;

    const results = this.cg.searchNodes(query, {
      limit,
      kinds: kind ? [kind as NodeKind] : undefined,
    });

    if (results.length === 0) {
      return this.textResult(`No results found for "${query}"`);
    }

    const formatted = this.formatSearchResults(results);
    return this.textResult(formatted);
  }

  /**
   * Handle codegraph_context
   */
  private async handleContext(args: Record<string, unknown>): Promise<ToolResult> {
    const task = args.task as string;
    const maxNodes = (args.maxNodes as number) || 20;
    const includeCode = args.includeCode !== false;

    const context = await this.cg.buildContext(task, {
      maxNodes,
      includeCode,
      format: 'markdown',
    });

    // Detect if this looks like a feature request (vs bug fix or exploration)
    const isFeatureQuery = this.looksLikeFeatureRequest(task);
    const reminder = isFeatureQuery
      ? '\n\n⚠️ **Ask user:** UX preferences, edge cases, acceptance criteria'
      : '';

    // buildContext returns string when format is 'markdown'
    if (typeof context === 'string') {
      return this.textResult(context + reminder);
    }

    // If it returns TaskContext, format it
    return this.textResult(this.formatTaskContext(context) + reminder);
  }

  /**
   * Heuristic to detect if a query looks like a feature request
   */
  private looksLikeFeatureRequest(task: string): boolean {
    const featureKeywords = [
      'add', 'create', 'implement', 'build', 'enable', 'allow',
      'new feature', 'support for', 'ability to', 'want to',
      'should be able', 'need to add', 'swap', 'edit', 'modify'
    ];
    const bugKeywords = [
      'fix', 'bug', 'error', 'broken', 'crash', 'issue', 'problem',
      'not working', 'fails', 'undefined', 'null'
    ];
    const explorationKeywords = [
      'how does', 'where is', 'what is', 'find', 'show me',
      'explain', 'understand', 'explore'
    ];

    const lowerTask = task.toLowerCase();

    // If it's clearly a bug or exploration, not a feature
    if (bugKeywords.some(k => lowerTask.includes(k))) return false;
    if (explorationKeywords.some(k => lowerTask.includes(k))) return false;

    // If it matches feature keywords, it's likely a feature request
    return featureKeywords.some(k => lowerTask.includes(k));
  }

  /**
   * Handle codegraph_callers
   */
  private async handleCallers(args: Record<string, unknown>): Promise<ToolResult> {
    const symbol = args.symbol as string;
    const limit = (args.limit as number) || 20;

    // First find the node by name
    const results = this.cg.searchNodes(symbol, { limit: 1 });
    if (results.length === 0 || !results[0]) {
      return this.textResult(`Symbol "${symbol}" not found in the codebase`);
    }

    const node = results[0].node;
    const callers = this.cg.getCallers(node.id);

    if (callers.length === 0) {
      return this.textResult(`No callers found for "${symbol}"`);
    }

    // Extract just the nodes from the { node, edge } tuples
    const callerNodes = callers.slice(0, limit).map(c => c.node);
    const formatted = this.formatNodeList(callerNodes, `Callers of ${symbol}`);
    return this.textResult(formatted);
  }

  /**
   * Handle codegraph_callees
   */
  private async handleCallees(args: Record<string, unknown>): Promise<ToolResult> {
    const symbol = args.symbol as string;
    const limit = (args.limit as number) || 20;

    // First find the node by name
    const results = this.cg.searchNodes(symbol, { limit: 1 });
    if (results.length === 0 || !results[0]) {
      return this.textResult(`Symbol "${symbol}" not found in the codebase`);
    }

    const node = results[0].node;
    const callees = this.cg.getCallees(node.id);

    if (callees.length === 0) {
      return this.textResult(`No callees found for "${symbol}"`);
    }

    // Extract just the nodes from the { node, edge } tuples
    const calleeNodes = callees.slice(0, limit).map(c => c.node);
    const formatted = this.formatNodeList(calleeNodes, `Callees of ${symbol}`);
    return this.textResult(formatted);
  }

  /**
   * Handle codegraph_impact
   */
  private async handleImpact(args: Record<string, unknown>): Promise<ToolResult> {
    const symbol = args.symbol as string;
    const depth = (args.depth as number) || 2;

    // First find the node by name
    const results = this.cg.searchNodes(symbol, { limit: 1 });
    if (results.length === 0 || !results[0]) {
      return this.textResult(`Symbol "${symbol}" not found in the codebase`);
    }

    const node = results[0].node;
    const impact = this.cg.getImpactRadius(node.id, depth);

    const formatted = this.formatImpact(symbol, impact);
    return this.textResult(formatted);
  }

  /**
   * Handle codegraph_node
   */
  private async handleNode(args: Record<string, unknown>): Promise<ToolResult> {
    const symbol = args.symbol as string;
    // Default to false to minimize context usage
    const includeCode = args.includeCode === true;

    // Find the node by name
    const results = this.cg.searchNodes(symbol, { limit: 1 });
    if (results.length === 0 || !results[0]) {
      return this.textResult(`Symbol "${symbol}" not found in the codebase`);
    }

    const node = results[0].node;
    let code: string | null = null;

    if (includeCode) {
      code = await this.cg.getCode(node.id);
    }

    const formatted = this.formatNodeDetails(node, code);
    return this.textResult(formatted);
  }

  /**
   * Handle codegraph_status
   */
  private async handleStatus(): Promise<ToolResult> {
    const stats = this.cg.getStats();

    const lines: string[] = [
      '## CodeGraph Status',
      '',
      `**Files indexed:** ${stats.fileCount}`,
      `**Total nodes:** ${stats.nodeCount}`,
      `**Total edges:** ${stats.edgeCount}`,
      `**Database size:** ${(stats.dbSizeBytes / 1024 / 1024).toFixed(2)} MB`,
      '',
      '### Nodes by Kind:',
    ];

    for (const [kind, count] of Object.entries(stats.nodesByKind)) {
      if ((count as number) > 0) {
        lines.push(`- ${kind}: ${count}`);
      }
    }

    lines.push('', '### Languages:');
    for (const [lang, count] of Object.entries(stats.filesByLanguage)) {
      if ((count as number) > 0) {
        lines.push(`- ${lang}: ${count}`);
      }
    }

    return this.textResult(lines.join('\n'));
  }

  /**
   * Handle codegraph_explore - deep exploration with internal file reading
   * Returns synthesized context so Claude doesn't need separate Read calls
   */
  private async handleExplore(args: Record<string, unknown>): Promise<ToolResult> {
    const task = args.task as string;
    const keywordsArg = args.keywords as string | undefined;
    const projectRoot = this.cg.getProjectRoot();

    // Phase 1: Extract search terms
    const keywords = this.extractKeywords(task, keywordsArg);

    // Phase 2: Find relevant symbols
    const symbolMap = new Map<string, Node>();
    const fileSet = new Set<string>();

    for (const keyword of keywords.slice(0, 5)) {
      const results = this.cg.searchNodes(keyword, { limit: 10 });
      for (const r of results) {
        if (!symbolMap.has(r.node.id)) {
          symbolMap.set(r.node.id, r.node);
          fileSet.add(r.node.filePath);
        }
      }
    }

    // Phase 3: Look for EXISTING implementations
    const existingImplNodes: Node[] = [];
    const searchPatterns = this.generateExistingPatternSearches(keywords);

    for (const pattern of searchPatterns) {
      const results = this.cg.searchNodes(pattern, { limit: 5 });
      for (const r of results) {
        const node = r.node;
        if (['function', 'method', 'component'].includes(node.kind)) {
          if (!symbolMap.has(node.id)) {
            symbolMap.set(node.id, node);
            fileSet.add(node.filePath);
          }
          existingImplNodes.push(node);
        }
      }
    }

    // Phase 4: Categorize symbols by type
    const allSymbols = Array.from(symbolMap.values());
    const functions = allSymbols.filter(n => n.kind === 'function' || n.kind === 'method');
    const components = allSymbols.filter(n => n.kind === 'component');
    const types = allSymbols.filter(n => n.kind === 'interface' || n.kind === 'type_alias');
    const apiRoutes = allSymbols.filter(n => n.filePath.includes('/api/') || n.kind === 'route');

    // Phase 5: READ CODE INTERNALLY for key symbols (the sub-agent behavior)
    // Prioritize: existing implementations > API routes > types > functions
    const codeSnippets: Array<{ node: Node; code: string }> = [];
    const maxSnippets = 8;
    const maxCodeLength = 1500; // chars per snippet

    const priorityNodes = [
      ...existingImplNodes.slice(0, 3),
      ...apiRoutes.slice(0, 2),
      ...types.slice(0, 2),
      ...components.slice(0, 2),
      ...functions.filter(n => !existingImplNodes.includes(n)).slice(0, 1),
    ];

    for (const node of priorityNodes) {
      if (codeSnippets.length >= maxSnippets) break;

      const code = this.extractNodeCode(projectRoot, node, maxCodeLength);
      if (code) {
        codeSnippets.push({ node, code });
      }
    }

    // Phase 6: Trace call graphs for data flow understanding
    const dataFlowInsights: string[] = [];
    for (const node of existingImplNodes.slice(0, 3)) {
      const callers = this.cg.getCallers(node.id);
      const callees = this.cg.getCallees(node.id);

      if (callers.length > 0 || callees.length > 0) {
        let flow = `${node.name}`;
        if (callers.length > 0) flow = `${callers.slice(0, 2).map(c => c.node.name).join(', ')} → ${flow}`;
        if (callees.length > 0) flow = `${flow} → ${callees.slice(0, 2).map(c => c.node.name).join(', ')}`;
        dataFlowInsights.push(flow);
      }
    }

    // Phase 7: Build comprehensive synthesis
    const isFeatureQuery = this.looksLikeFeatureRequest(task);
    const hasExistingImpl = existingImplNodes.length > 0;

    const synthesis = this.buildExploreSynthesis({
      task,
      existingImplNodes,
      codeSnippets,
      types,
      apiRoutes,
      dataFlowInsights,
      totalSymbols: symbolMap.size,
      totalFiles: fileSet.size,
      isFeatureQuery,
      hasExistingImpl,
    });

    return this.textResult(synthesis);
  }

  /**
   * Extract code from a node's source file
   */
  private extractNodeCode(projectRoot: string, node: Node, maxLength: number): string | null {
    const filePath = path.join(projectRoot, node.filePath);

    if (!fs.existsSync(filePath)) {
      return null;
    }

    try {
      const content = fs.readFileSync(filePath, 'utf-8');
      const lines = content.split('\n');

      const startIdx = Math.max(0, node.startLine - 1);
      const endIdx = Math.min(lines.length, node.endLine);

      let code = lines.slice(startIdx, endIdx).join('\n');

      // Truncate if too long
      if (code.length > maxLength) {
        code = code.slice(0, maxLength) + '\n// ... truncated ...';
      }

      return code;
    } catch {
      return null;
    }
  }

  /**
   * Build comprehensive synthesis with code included
   */
  private buildExploreSynthesis(data: {
    task: string;
    existingImplNodes: Node[];
    codeSnippets: Array<{ node: Node; code: string }>;
    types: Node[];
    apiRoutes: Node[];
    dataFlowInsights: string[];
    totalSymbols: number;
    totalFiles: number;
    isFeatureQuery: boolean;
    hasExistingImpl: boolean;
  }): string {
    const lines: string[] = [];

    // Critical warnings at TOP
    if (data.hasExistingImpl) {
      lines.push('⚠️ **EXISTING IMPLEMENTATIONS FOUND** - Review code below before planning. Feature may already exist.');
      lines.push('');
    }
    if (data.isFeatureQuery) {
      lines.push('📋 **BEFORE PLANNING:** Use `AskUserQuestion` to clarify UX preferences and requirements.');
      lines.push('');
    }

    // Summary stats
    lines.push(`**Explored ${data.totalSymbols} symbols across ${data.totalFiles} files**`);
    lines.push('');

    // Data flow (if available)
    if (data.dataFlowInsights.length > 0) {
      lines.push('**Data Flow:**');
      for (const flow of data.dataFlowInsights.slice(0, 3)) {
        lines.push(`  ${flow}`);
      }
      lines.push('');
    }

    // Key types (signatures only, no code)
    if (data.types.length > 0) {
      lines.push('**Key Types:**');
      for (const t of data.types.slice(0, 4)) {
        lines.push(`  - \`${t.name}\` (${t.filePath}:${t.startLine})`);
      }
      lines.push('');
    }

    // API routes (signatures only)
    if (data.apiRoutes.length > 0) {
      lines.push('**API Routes:**');
      for (const r of data.apiRoutes.slice(0, 3)) {
        const routePath = r.filePath.split('/api/')[1] || r.filePath;
        lines.push(`  - \`/api/${routePath}\` (${r.name})`);
      }
      lines.push('');
    }

    // CODE SNIPPETS - the key sub-agent behavior
    if (data.codeSnippets.length > 0) {
      lines.push('---');
      lines.push('**Key Code (read internally):**');
      lines.push('');

      for (const { node, code } of data.codeSnippets) {
        lines.push(`### ${node.name} (${node.kind}) - ${node.filePath}:${node.startLine}`);
        lines.push('```' + (node.language || 'typescript'));
        lines.push(code);
        lines.push('```');
        lines.push('');
      }
    }

    return lines.join('\n');
  }

  /**
   * Generate search patterns to find existing implementations
   * Language-agnostic: generates patterns for multiple naming conventions
   */
  private generateExistingPatternSearches(keywords: string[]): string[] {
    const patterns: string[] = [];

    for (const keyword of keywords.slice(0, 3)) {
      // Skip very short or common words
      if (keyword.length < 3) continue;

      const lower = keyword.toLowerCase();
      const capitalized = keyword.charAt(0).toUpperCase() + keyword.slice(1).toLowerCase();

      // The keyword itself in various cases
      patterns.push(lower);
      patterns.push(capitalized);

      // Common suffixes (work across most languages)
      // These patterns find: SwapService, swap_service, SwapHandler, etc.
      const suffixes = ['Service', 'Handler', 'Controller', 'Manager', 'Helper', 'Util', 'Utils'];
      for (const suffix of suffixes) {
        patterns.push(`${capitalized}${suffix}`);     // PascalCase: SwapService
        patterns.push(`${lower}_${suffix.toLowerCase()}`); // snake_case: swap_service
      }

      // Common prefixes (work across most languages)
      const prefixes = ['handle', 'process', 'do', 'execute', 'perform', 'run'];
      for (const prefix of prefixes) {
        patterns.push(`${prefix}_${lower}`);          // snake_case: handle_swap
        patterns.push(`${prefix}${capitalized}`);     // camelCase: handleSwap
      }

      // Common action patterns
      patterns.push(`create_${lower}`);
      patterns.push(`update_${lower}`);
      patterns.push(`delete_${lower}`);
      patterns.push(`get_${lower}`);
      patterns.push(`create${capitalized}`);
      patterns.push(`update${capitalized}`);
      patterns.push(`delete${capitalized}`);
      patterns.push(`get${capitalized}`);
    }

    return [...new Set(patterns)];
  }

  /**
   * Extract keywords from task description
   */
  private extractKeywords(task: string, explicitKeywords?: string): string[] {
    const keywords: string[] = [];

    // Add explicit keywords first
    if (explicitKeywords) {
      keywords.push(...explicitKeywords.split(',').map(k => k.trim()).filter(Boolean));
    }

    // Extract likely code identifiers from task (camelCase, PascalCase, snake_case)
    const identifierPattern = /\b([A-Z][a-zA-Z0-9]*|[a-z][a-zA-Z0-9]*[A-Z][a-zA-Z0-9]*|[a-z]+_[a-z_]+)\b/g;
    const matches = task.match(identifierPattern) || [];
    keywords.push(...matches);

    // Extract quoted terms
    const quotedPattern = /"([^"]+)"|'([^']+)'/g;
    let match;
    while ((match = quotedPattern.exec(task)) !== null) {
      const quoted = match[1] || match[2];
      if (quoted) keywords.push(quoted);
    }

    // Extract domain-specific terms (nouns that might be code concepts)
    const commonTerms = task.toLowerCase()
      .split(/\s+/)
      .filter(word =>
        word.length > 3 &&
        !['this', 'that', 'with', 'from', 'have', 'been', 'will', 'would', 'could', 'should', 'when', 'where', 'what', 'which', 'their', 'there', 'these', 'those', 'about', 'into', 'then', 'than', 'some', 'other', 'after', 'before'].includes(word)
      );
    keywords.push(...commonTerms);

    // Deduplicate and return
    return [...new Set(keywords)];
  }

  // =========================================================================
  // Formatting helpers (compact by default to reduce context usage)
  // =========================================================================

  private formatSearchResults(results: SearchResult[]): string {
    const lines: string[] = [`## Search Results (${results.length} found)`, ''];

    for (const result of results) {
      const { node } = result;
      const location = node.startLine ? `:${node.startLine}` : '';
      // Compact format: one line per result with key info
      lines.push(`### ${node.name} (${node.kind})`);
      lines.push(`${node.filePath}${location}`);
      if (node.signature) lines.push(`\`${node.signature}\``);
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatNodeList(nodes: Node[], title: string): string {
    const lines: string[] = [`## ${title} (${nodes.length} found)`, ''];

    for (const node of nodes) {
      const location = node.startLine ? `:${node.startLine}` : '';
      // Compact: just name, kind, location
      lines.push(`- ${node.name} (${node.kind}) - ${node.filePath}${location}`);
    }

    return lines.join('\n');
  }

  private formatImpact(symbol: string, impact: Subgraph): string {
    const nodeCount = impact.nodes.size;

    // Compact format: just list affected symbols grouped by file
    const lines: string[] = [
      `## Impact: "${symbol}" affects ${nodeCount} symbols`,
      '',
    ];

    // Group by file
    const byFile = new Map<string, Node[]>();
    for (const node of impact.nodes.values()) {
      const existing = byFile.get(node.filePath) || [];
      existing.push(node);
      byFile.set(node.filePath, existing);
    }

    for (const [file, nodes] of byFile) {
      lines.push(`**${file}:**`);
      // Compact: inline list
      const nodeList = nodes.map(n => `${n.name}:${n.startLine}`).join(', ');
      lines.push(nodeList);
      lines.push('');
    }

    return lines.join('\n');
  }

  private formatNodeDetails(node: Node, code: string | null): string {
    const location = node.startLine ? `:${node.startLine}` : '';
    const lines: string[] = [
      `## ${node.name} (${node.kind})`,
      '',
      `**Location:** ${node.filePath}${location}`,
    ];

    if (node.signature) {
      lines.push(`**Signature:** \`${node.signature}\``);
    }

    // Only include docstring if it's short and useful
    if (node.docstring && node.docstring.length < 200) {
      lines.push('', node.docstring);
    }

    if (code) {
      lines.push('', '```' + node.language, code, '```');
    }

    return lines.join('\n');
  }

  private formatTaskContext(context: TaskContext): string {
    return context.summary || 'No context found';
  }

  private textResult(text: string): ToolResult {
    return {
      content: [{ type: 'text', text }],
    };
  }

  private errorResult(message: string): ToolResult {
    return {
      content: [{ type: 'text', text: `Error: ${message}` }],
      isError: true,
    };
  }
}
