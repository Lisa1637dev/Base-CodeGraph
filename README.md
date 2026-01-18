# CodeGraph

A local-first code intelligence system that builds a semantic knowledge graph from any codebase. CodeGraph provides structural understanding of code relationships—not just text similarity—enabling AI assistants to understand how code connects, what depends on what, and what breaks when something changes.

## Features

- **Universal language support** via tree-sitter (TypeScript, JavaScript, Python, Go, Rust, Java, PHP, Ruby, C#, C, C++, Swift, Kotlin)
- **Zero external API dependencies** — all processing happens locally
- **Semantic search** — find code by meaning, not just text matching
- **Graph-based code intelligence** — callers, callees, impact analysis, dependency chains
- **Incremental updates** — only reindex changed files
- **Git integration** — automatic sync via post-commit hooks
- **MCP Server** — integrate directly with Claude Code and other AI assistants

## Installation

```bash
# Clone and install
git clone <repository-url>
cd codegraph
npm install

# Build
npm run build

# Link globally (optional, for CLI usage)
npm link
```

### Requirements

- Node.js >= 18.0.0
- npm or yarn

## Quick Start

```bash
# Initialize CodeGraph in your project
codegraph init /path/to/your/project

# Index the codebase (with progress)
codegraph index /path/to/your/project

# Search for symbols
codegraph query "UserService"

# Build context for a task
codegraph context "fix the login bug"

# Check index status
codegraph status
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

## Using with Claude Code (MCP)

CodeGraph can be used as an MCP (Model Context Protocol) server, allowing Claude Code to directly query your codebase.

### Setup

1. Initialize and index your project:
   ```bash
   codegraph init /path/to/your/project --index
   ```

2. Add to your Claude Code MCP configuration (`~/.claude/claude_desktop_config.json` or similar):
   ```json
   {
     "mcpServers": {
       "codegraph": {
         "command": "codegraph",
         "args": ["serve", "--mcp", "--path", "/path/to/your/project"]
       }
     }
   }
   ```

   Or if using npx:
   ```json
   {
     "mcpServers": {
       "codegraph": {
         "command": "npx",
         "args": ["codegraph", "serve", "--mcp", "--path", "/path/to/your/project"]
       }
     }
   }
   ```

3. Restart Claude Code. The following tools will be available:

### MCP Tools

| Tool | Description |
|------|-------------|
| `codegraph_search` | Search for code symbols by name or semantic similarity |
| `codegraph_context` | Build relevant code context for a task or issue |
| `codegraph_callers` | Find all functions/methods that call a specific symbol |
| `codegraph_callees` | Find all functions/methods that a symbol calls |
| `codegraph_impact` | Analyze what code could be affected by changing a symbol |
| `codegraph_node` | Get detailed information about a specific symbol |
| `codegraph_status` | Get index statistics |

### Example Prompts for Claude Code

Once configured, you can ask Claude Code things like:

- "Use codegraph to find all callers of the `authenticate` function"
- "What would be impacted if I change the `UserService` class?"
- "Build context for fixing the checkout bug"
- "Search for all functions related to payment processing"

## Library Usage

CodeGraph can also be used as a library in your Node.js applications:

```typescript
import CodeGraph from 'codegraph';

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
