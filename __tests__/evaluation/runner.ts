/**
 * Evaluation Runner
 *
 * Runs test cases against CodeGraph fixtures and measures precision/recall.
 */

import * as path from 'path';
import * as fs from 'fs';
import CodeGraph from '../../src/index';
import type { Node, SearchResult, NodeKind } from '../../src/types';
import type {
  TestCase,
  TestCaseResult,
  FixtureGroundTruth,
  FixtureEvaluationResult,
  EvaluationSummary,
} from './types';

// Import fixtures
import { typescriptFixture } from './fixtures/typescript-project/ground-truth';
import { pythonFixture } from './fixtures/python-project/ground-truth';

/**
 * Simple token counter (approximation using word count * 1.3)
 */
function countTokens(text: string): number {
  const words = text.split(/\s+/).filter(w => w.length > 0);
  return Math.ceil(words.length * 1.3);
}

/**
 * Extract symbol names from CodeGraph results
 */
function extractSymbolNames(nodes: Node[]): Set<string> {
  const names = new Set<string>();
  for (const node of nodes) {
    // Add the simple name
    names.add(node.name);

    // Add qualified name if we have parent info (Class.method format)
    // This is a simplification - real implementation would use containment edges
    if (node.kind === 'method' || node.kind === 'function') {
      // Try to infer class from file path or other context
      const fileName = path.basename(node.filePath, path.extname(node.filePath));
      names.add(`${fileName}.${node.name}`);
    }
  }
  return names;
}

/**
 * Normalize symbol name for comparison
 */
function normalizeSymbol(symbol: string): string {
  // Remove common prefixes and normalize
  return symbol
    .replace(/^(db\.|authService\.|paymentService\.|auth_service\.|task_service\.)/, '')
    .toLowerCase();
}

/**
 * Check if a symbol matches any in a set (with fuzzy matching)
 */
function symbolMatches(symbol: string, candidates: Set<string>): boolean {
  const normalized = normalizeSymbol(symbol);

  for (const candidate of candidates) {
    const normalizedCandidate = normalizeSymbol(candidate);

    // Exact match
    if (normalized === normalizedCandidate) return true;

    // Partial match (e.g., "login" matches "AuthService.login")
    if (normalizedCandidate.endsWith(`.${normalized}`)) return true;
    if (normalized.endsWith(`.${normalizedCandidate}`)) return true;

    // Simple name match
    const simpleName = normalized.split('.').pop();
    const simpleCandidateName = normalizedCandidate.split('.').pop();
    if (simpleName === simpleCandidateName) return true;
  }

  return false;
}

/**
 * Run a single test case
 */
async function runTestCase(
  cg: CodeGraph,
  testCase: TestCase,
  fixtureTokens: number
): Promise<TestCaseResult> {
  const startTime = Date.now();

  let retrievedNodes: Node[] = [];
  let contextText = '';

  try {
    switch (testCase.type) {
      case 'search': {
        const results = cg.searchNodes(testCase.query, { limit: 20 });
        retrievedNodes = results.map(r => r.node);
        break;
      }

      case 'context': {
        const context = await cg.buildContext(testCase.query, {
          maxNodes: 30,
          includeCode: true,
          format: 'markdown',
        });
        contextText = typeof context === 'string' ? context : '';

        // Also get the nodes that were used to build context
        const results = cg.searchNodes(testCase.query, { limit: 30 });
        retrievedNodes = results.map(r => r.node);
        break;
      }

      case 'callers': {
        if (testCase.targetSymbol) {
          const results = cg.searchNodes(testCase.targetSymbol, { limit: 1 });
          if (results.length > 0 && results[0]) {
            const callers = cg.getCallers(results[0].node.id);
            retrievedNodes = callers.map(c => c.node);
          }
        }
        break;
      }

      case 'callees': {
        if (testCase.targetSymbol) {
          const results = cg.searchNodes(testCase.targetSymbol, { limit: 1 });
          if (results.length > 0 && results[0]) {
            const callees = cg.getCallees(results[0].node.id);
            retrievedNodes = callees.map(c => c.node);
          }
        }
        break;
      }

      case 'impact': {
        if (testCase.targetSymbol) {
          const results = cg.searchNodes(testCase.targetSymbol, { limit: 1 });
          if (results.length > 0 && results[0]) {
            const impact = cg.getImpactRadius(results[0].node.id, 2);
            retrievedNodes = Array.from(impact.nodes.values());
          }
        }
        break;
      }
    }
  } catch (err) {
    console.error(`Error running test case ${testCase.id}:`, err);
  }

  const executionTimeMs = Date.now() - startTime;

  // Extract retrieved symbol names
  const retrievedSymbols = extractSymbolNames(retrievedNodes);

  // Calculate metrics
  const expectedSet = new Set(testCase.expectedSymbols.map(s => normalizeSymbol(s)));
  const irrelevantSet = new Set(testCase.irrelevantSymbols.map(s => normalizeSymbol(s)));

  const truePositives: string[] = [];
  const falsePositives: string[] = [];

  for (const symbol of retrievedSymbols) {
    const normalized = normalizeSymbol(symbol);

    if (symbolMatches(symbol, new Set(testCase.expectedSymbols))) {
      truePositives.push(symbol);
    } else if (symbolMatches(symbol, new Set(testCase.irrelevantSymbols))) {
      falsePositives.push(symbol);
    }
    // Symbols not in either list are ignored (neutral)
  }

  // Find false negatives (expected but not retrieved)
  const falseNegatives: string[] = [];
  for (const expected of testCase.expectedSymbols) {
    if (!symbolMatches(expected, retrievedSymbols)) {
      falseNegatives.push(expected);
    }
  }

  // Calculate precision and recall
  const totalRetrieved = truePositives.length + falsePositives.length;
  const precision = totalRetrieved > 0 ? truePositives.length / totalRetrieved : 0;

  const totalRelevant = testCase.expectedSymbols.length;
  const recall = totalRelevant > 0 ? truePositives.length / totalRelevant : 0;

  const f1Score = precision + recall > 0
    ? 2 * (precision * recall) / (precision + recall)
    : 0;

  // Count context tokens
  const contextTokens = contextText
    ? countTokens(contextText)
    : retrievedNodes.reduce((sum, node) => {
        // Estimate tokens from node info
        return sum + countTokens(node.name + ' ' + (node.signature || ''));
      }, 0);

  // Determine if test passed
  const meetsRecall = !testCase.minRecall || recall >= testCase.minRecall;
  const meetsPrecision = !testCase.minPrecision || precision >= testCase.minPrecision;
  const passed = meetsRecall && meetsPrecision;

  return {
    testCaseId: testCase.id,
    passed,
    precision,
    recall,
    f1Score,
    truePositives,
    falsePositives,
    falseNegatives,
    contextTokens,
    executionTimeMs,
  };
}

/**
 * Run evaluation on a single fixture
 */
async function evaluateFixture(
  fixture: FixtureGroundTruth
): Promise<FixtureEvaluationResult> {
  const fixturePath = path.resolve(process.cwd(), fixture.path);
  const startTime = Date.now();

  console.log(`\nEvaluating fixture: ${fixture.name}`);
  console.log(`  Path: ${fixturePath}`);

  // Initialize CodeGraph for this fixture
  let cg: CodeGraph;

  if (CodeGraph.isInitialized(fixturePath)) {
    console.log('  Opening existing index...');
    cg = await CodeGraph.open(fixturePath);
  } else {
    console.log('  Initializing and indexing...');
    cg = await CodeGraph.init(fixturePath, { index: true });
  }

  const stats = cg.getStats();
  console.log(`  Indexed ${stats.fileCount} files, ${stats.nodeCount} nodes`);

  // Run all test cases
  const testCaseResults: TestCaseResult[] = [];

  for (const testCase of fixture.testCases) {
    console.log(`  Running: ${testCase.id}...`);
    const result = await runTestCase(cg, testCase, fixture.approximateTokens);
    testCaseResults.push(result);

    const status = result.passed ? '✓' : '✗';
    console.log(`    ${status} P=${(result.precision * 100).toFixed(0)}% R=${(result.recall * 100).toFixed(0)}% F1=${(result.f1Score * 100).toFixed(0)}%`);
  }

  // Close CodeGraph
  cg.destroy();

  // Calculate aggregate metrics
  const totalTimeMs = Date.now() - startTime;
  const passedTestCases = testCaseResults.filter(r => r.passed).length;

  const averagePrecision = testCaseResults.reduce((sum, r) => sum + r.precision, 0) / testCaseResults.length;
  const averageRecall = testCaseResults.reduce((sum, r) => sum + r.recall, 0) / testCaseResults.length;
  const averageF1Score = testCaseResults.reduce((sum, r) => sum + r.f1Score, 0) / testCaseResults.length;
  const averageContextTokens = testCaseResults.reduce((sum, r) => sum + r.contextTokens, 0) / testCaseResults.length;

  const tokenReductionPercent = fixture.approximateTokens > 0
    ? ((fixture.approximateTokens - averageContextTokens) / fixture.approximateTokens) * 100
    : 0;

  return {
    fixtureName: fixture.name,
    totalTestCases: testCaseResults.length,
    passedTestCases,
    averagePrecision,
    averageRecall,
    averageF1Score,
    fullCodebaseTokens: fixture.approximateTokens,
    averageContextTokens,
    tokenReductionPercent,
    testCaseResults,
    totalTimeMs,
  };
}

/**
 * Run full evaluation across all fixtures
 */
export async function runEvaluation(): Promise<EvaluationSummary> {
  console.log('╔════════════════════════════════════════════════════════════════╗');
  console.log('║              CodeGraph Evaluation Suite                        ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  const fixtures: FixtureGroundTruth[] = [
    typescriptFixture,
    pythonFixture,
  ];

  const fixtureResults: FixtureEvaluationResult[] = [];

  for (const fixture of fixtures) {
    const result = await evaluateFixture(fixture);
    fixtureResults.push(result);
  }

  // Calculate overall metrics
  const totalTests = fixtureResults.reduce((sum, r) => sum + r.totalTestCases, 0);
  const totalPassed = fixtureResults.reduce((sum, r) => sum + r.passedTestCases, 0);

  const overallPrecision = fixtureResults.reduce((sum, r) => sum + r.averagePrecision, 0) / fixtureResults.length;
  const overallRecall = fixtureResults.reduce((sum, r) => sum + r.averageRecall, 0) / fixtureResults.length;
  const overallF1Score = fixtureResults.reduce((sum, r) => sum + r.averageF1Score, 0) / fixtureResults.length;
  const overallTokenReduction = fixtureResults.reduce((sum, r) => sum + r.tokenReductionPercent, 0) / fixtureResults.length;

  // Print summary
  console.log('\n╔════════════════════════════════════════════════════════════════╗');
  console.log('║                      EVALUATION SUMMARY                         ║');
  console.log('╚════════════════════════════════════════════════════════════════╝');

  console.log(`\nTest Results: ${totalPassed}/${totalTests} passed`);
  console.log(`\nOverall Metrics:`);
  console.log(`  Precision:        ${(overallPrecision * 100).toFixed(1)}%`);
  console.log(`  Recall:           ${(overallRecall * 100).toFixed(1)}%`);
  console.log(`  F1 Score:         ${(overallF1Score * 100).toFixed(1)}%`);
  console.log(`  Token Reduction:  ${overallTokenReduction.toFixed(1)}%`);

  console.log('\nPer-Fixture Results:');
  for (const result of fixtureResults) {
    console.log(`  ${result.fixtureName}:`);
    console.log(`    Tests: ${result.passedTestCases}/${result.totalTestCases} passed`);
    console.log(`    P=${(result.averagePrecision * 100).toFixed(0)}% R=${(result.averageRecall * 100).toFixed(0)}% F1=${(result.averageF1Score * 100).toFixed(0)}%`);
  }

  const summary: EvaluationSummary = {
    timestamp: new Date(),
    version: '0.1.0',
    fixtureResults,
    overallPrecision,
    overallRecall,
    overallF1Score,
    overallTokenReduction,
  };

  // Save results to file
  const resultsPath = path.join(__dirname, 'results', `eval-${Date.now()}.json`);
  const resultsDir = path.dirname(resultsPath);
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  fs.writeFileSync(resultsPath, JSON.stringify(summary, null, 2));
  console.log(`\nResults saved to: ${resultsPath}`);

  return summary;
}

// Run if called directly
if (require.main === module) {
  runEvaluation()
    .then(() => process.exit(0))
    .catch(err => {
      console.error('Evaluation failed:', err);
      process.exit(1);
    });
}
