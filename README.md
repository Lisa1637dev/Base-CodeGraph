# CodeGraph

A local-first code intelligence system that builds a semantic knowledge graph from any codebase. Designed to give Claude Code deep understanding of code relationships.

## Quick Start

### 1. Install

```bash
npm install -g @colbymchenry/codegraph
```

### 2. Configure Claude Code MCP

Add to your `~/.claude.json` in the `mcpServers` section:

```json
{
  "mcpServers": {
    "codegraph": {
      "type": "stdio",
      "command": "codegraph",
      "args": ["serve", "--mcp"]
    }
  }
}
```

### 3. Add Global Instructions

Create or append to `~/.claude/CLAUDE.md`:

```markdown
## CodeGraph

CodeGraph builds a semantic knowledge graph of codebases for better code exploration.

### If `.codegraph/` exists in the project

Use the codegraph MCP tools instead of manually searching:

- `codegraph_search` - Find symbols by name
- `codegraph_context` - Get context for a task/issue
- `codegraph_callers` - Find what calls a function
- `codegraph_callees` - Find what a function calls
- `codegraph_impact` - See what's affected by changing a symbol
- `codegraph_node` - Get details about a specific symbol
- `codegraph_status` - Check index status

Use these tools when:
- Exploring unfamiliar code
- Finding where a function is used
- Understanding dependencies before making changes
- Building context for bug fixes or features

The index auto-updates via git post-commit hook, so no manual sync needed.

### If `.codegraph/` does NOT exist

At the start of a session, ask the user if they'd like to initialize CodeGraph for better code intelligence:

"I notice this project doesn't have CodeGraph initialized. Would you like me to run `codegraph init -i` to build a code knowledge graph? This enables smarter code exploration, caller/callee analysis, and impact detection."

If they agree, run:
codegraph init -i
```

### 4. Initialize Your Projects

```bash
cd your-project
codegraph init -i    # Initialize and index
```

### 5. Restart Claude Code

Restart Claude Code for the MCP server to load. The tools will be available in any project with a `.codegraph/` directory.

---

## Features

- **Universal language support** via tree-sitter (TypeScript, JavaScript, Python, Go, Rust, Java, PHP, Ruby, C#, C, C++, Swift, Kotlin)
- **Zero external API dependencies** — all processing happens locally
- **Semantic search** — find code by meaning, not just text matching
- **Graph-based code intelligence** — callers, callees, impact analysis, dependency chains
- **Incremental updates** — only reindex changed files
- **Git integration** — automatic sync via post-commit hooks
- **MCP Server** — integrate directly with Claude Code and other AI assistants

## Requirements

- Node.js >= 18.0.0

## CLI Usage

```bash
codegraph init [path]       # Initialize in a project
codegraph index [path]      # Full index
codegraph sync [path]       # Incremental update
codegraph status [path]     # Show statistics
codegraph query <search>    # Search symbols
codegraph context <task>    # Build context for AI
codegraph hooks install     # Install git auto-sync hook
codegraph serve --mcp       # Start MCP server
```

## CLI Commands

### `codegraph init [path]`

Initialize CodeGraph in a project directory. Creates a `.codegraph/` directory with the database and configuration.

```bash
codegraph init                    # Initialize in current directory
codegraph init /path/to/project   # Initialize in specific directory
codegraph init --index            # Initialize and immediately index
codegraph init --no-hooks         # Skip git hook installation
```

### `codegraph index [path]`

Index all files in the project. Extracts functions, classes, methods, and their relationships.

```bash
codegraph index                   # Index current directory
codegraph index --force           # Force full re-index
codegraph index --quiet           # Suppress progress output
```

### `codegraph sync [path]`

Incrementally sync changes since the last index. Only processes added, modified, or removed files.

```bash
codegraph sync                    # Sync current directory
codegraph sync --quiet            # Suppress output
```

### `codegraph status [path]`

Show index status and statistics.

```bash
codegraph status
```

Output includes:
- Files indexed, nodes, edges
- Nodes by kind (functions, classes, methods, etc.)
- Files by language
- Pending changes (if any)
- Git hook status

### `codegraph query <search>`

Search for symbols in the codebase by name.

```bash
codegraph query "authenticate"           # Search for symbols
codegraph query "User" --kind class      # Filter by kind
codegraph query "process" --limit 20     # Limit results
codegraph query "validate" --json        # Output as JSON
```

### `codegraph context <task>`

Build relevant code context for a task. Uses semantic search to find entry points, then expands through the graph to find related code.

```bash
codegraph context "fix checkout bug"
codegraph context "add user authentication" --format json
codegraph context "refactor payment service" --max-nodes 30
```

### `codegraph hooks`

Manage git hooks for automatic syncing.

```bash
codegraph hooks install    # Install post-commit hook
codegraph hooks remove     # Remove hook
codegraph hooks status     # Check if hook is installed
```

### `codegraph serve`

Start CodeGraph as an MCP server for AI assistants.

```bash
codegraph serve                          # Show MCP configuration help
codegraph serve --mcp                    # Start MCP server (stdio)
codegraph serve --mcp --path /project    # Specify project path
```

## Library Usage

CodeGraph can also be used as a library in your Node.js applications:

```typescript
import CodeGraph from '@colbymchenry/codegraph';

// Initialize a new project
const cg = await CodeGraph.init('/path/to/project');

// Or open an existing one
const cg = await CodeGraph.open('/path/to/project');

// Index with progress callback
await cg.indexAll({
  onProgress: (progress) => {
    console.log(`${progress.phase}: ${progress.current}/${progress.total}`);
  }
});

// Search for symbols
const results = cg.searchNodes('UserService');

// Get callers of a function
const node = results[0].node;
const callers = cg.getCallers(node.id);

// Build context for a task
const context = await cg.buildContext('fix login bug', {
  maxNodes: 20,
  includeCode: true,
  format: 'markdown'
});

// Get impact radius
const impact = cg.getImpactRadius(node.id, 2);

// Sync changes
const syncResult = await cg.sync();

// Clean up
cg.close();
```

## Development

### Running Tests

```bash
npm test              # Run all tests
npm run test:watch    # Run tests in watch mode
```

### Building

```bash
npm run build         # Compile TypeScript and copy assets
npm run clean         # Remove build artifacts
```

### Project Structure

```
codegraph/
├── src/
│   ├── index.ts              # Main CodeGraph class
│   ├── types.ts              # TypeScript interfaces
│   ├── config.ts             # Configuration handling
│   ├── directory.ts          # .codegraph/ management
│   ├── errors.ts             # Custom error classes
│   ├── utils.ts              # Utilities (Mutex, batching, etc.)
│   │
│   ├── bin/
│   │   └── codegraph.ts      # CLI entry point
│   │
│   ├── db/
│   │   ├── index.ts          # Database connection
│   │   ├── schema.sql        # SQLite schema
│   │   ├── migrations.ts     # Schema versioning
│   │   └── queries.ts        # Prepared statements
│   │
│   ├── extraction/
│   │   ├── index.ts          # Extraction orchestrator
│   │   ├── tree-sitter.ts    # Parser wrapper
│   │   ├── grammars.ts       # Grammar loading
│   │   └── queries/          # Tree-sitter queries (.scm)
│   │
│   ├── resolution/
│   │   ├── index.ts          # Reference resolver
│   │   └── frameworks/       # Framework-specific patterns
│   │
│   ├── graph/
│   │   ├── index.ts          # Graph query interface
│   │   ├── traversal.ts      # BFS/DFS, impact radius
│   │   └── queries.ts        # Graph queries
│   │
│   ├── vectors/
│   │   ├── index.ts          # Vector operations
│   │   └── search.ts         # Similarity search
│   │
│   ├── sync/
│   │   ├── index.ts          # Sync orchestrator
│   │   └── git-hooks.ts      # Hook installation
│   │
│   ├── context/
│   │   ├── index.ts          # Context builder
│   │   └── formatter.ts      # Output formatting
│   │
│   └── mcp/
│       ├── index.ts          # MCP server
│       ├── transport.ts      # Stdio transport
│       └── tools.ts          # Tool definitions
│
└── __tests__/                # Test files
```

## How It Works

### 1. Extraction

CodeGraph uses [tree-sitter](https://tree-sitter.github.io/) to parse source code into ASTs. Language-specific queries (`.scm` files) extract:

- **Nodes**: Functions, methods, classes, interfaces, types, variables
- **Edges**: Calls, imports, extends, implements, returns_type

Each node gets a unique ID based on its kind, file path, name, and line number.

### 2. Storage

All data is stored in a local SQLite database (`.codegraph/codegraph.db`):

- **nodes** table: All code entities with metadata
- **edges** table: Relationships between nodes
- **files** table: File tracking for incremental updates
- **node_vectors** / **vector_map**: Embeddings for semantic search (using sqlite-vss)

### 3. Reference Resolution

After extraction, CodeGraph resolves references:

1. Match function calls to function definitions
2. Resolve imports to their source files
3. Link class inheritance and interface implementations
4. Apply framework-specific patterns (Express routes, etc.)

### 4. Semantic Search

CodeGraph uses local embeddings (via [@xenova/transformers](https://github.com/xenova/transformers.js)) to enable semantic search:

1. Code symbols are embedded using a transformer model
2. Queries are embedded and compared using cosine similarity
3. Results are ranked by relevance

### 5. Graph Queries

The graph structure enables powerful queries:

- **Callers/Callees**: Direct call relationships
- **Impact Radius**: BFS traversal to find all potentially affected code
- **Dependencies**: What a symbol depends on
- **Dependents**: What depends on a symbol

### 6. Context Building

When you request context for a task:

1. Semantic search finds relevant entry points
2. Graph traversal expands to related code
3. Code snippets are extracted
4. Results are formatted for AI consumption

## Configuration

The `.codegraph/config.json` file controls indexing behavior:

```json
{
  "version": 1,
  "projectName": "my-project",
  "languages": ["typescript", "javascript"],
  "exclude": [
    "node_modules/**",
    "dist/**",
    "build/**",
    "*.min.js"
  ],
  "frameworks": ["express", "react"],
  "maxFileSize": 1048576,
  "gitHooksEnabled": true
}
```

### Options

| Option | Description | Default |
|--------|-------------|---------|
| `languages` | Languages to index (auto-detected if empty) | `[]` |
| `exclude` | Glob patterns to ignore | `["node_modules/**", ...]` |
| `frameworks` | Framework hints for better resolution | `[]` |
| `maxFileSize` | Skip files larger than this (bytes) | `1048576` (1MB) |
| `gitHooksEnabled` | Enable git hook installation | `true` |

## Supported Languages

| Language | Extension | Status |
|----------|-----------|--------|
| TypeScript | `.ts`, `.tsx` | Full support |
| JavaScript | `.js`, `.jsx`, `.mjs` | Full support |
| Python | `.py` | Full support |
| Go | `.go` | Full support |
| Rust | `.rs` | Full support |
| Java | `.java` | Full support |
| C# | `.cs` | Full support |
| PHP | `.php` | Full support |
| Ruby | `.rb` | Full support |
| C | `.c`, `.h` | Full support |
| C++ | `.cpp`, `.hpp`, `.cc` | Full support |
| Swift | `.swift` | Basic support |
| Kotlin | `.kt` | Basic support |

## Troubleshooting

### "CodeGraph not initialized"

Run `codegraph init` in your project directory first.

### Indexing is slow

- Check if `node_modules` or other large directories are excluded
- Use `--quiet` flag to reduce console output overhead
- Consider increasing `maxFileSize` if you have large files to skip

### MCP server not connecting

1. Ensure the project is initialized and indexed
2. Check the path in your MCP configuration is correct
3. Verify `codegraph serve --mcp` works from the command line
4. Check Claude Code logs for connection errors

### Missing symbols in search

- Run `codegraph sync` to pick up recent changes
- Check if the file's language is supported
- Verify the file isn't excluded by config patterns

## License

MIT
