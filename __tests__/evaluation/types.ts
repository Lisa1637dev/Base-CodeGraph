/**
 * Evaluation Framework Types
 */

/**
 * A test case with expected ground truth
 */
export interface TestCase {
  /** Unique identifier for this test case */
  id: string;

  /** Human-readable description */
  description: string;

  /** The query/task to test */
  query: string;

  /** Type of operation being tested */
  type: 'search' | 'callers' | 'callees' | 'impact' | 'context';

  /** For callers/callees/impact: the symbol to analyze */
  targetSymbol?: string;

  /** Symbols that MUST be in the results (for recall) */
  expectedSymbols: string[];

  /** Symbols that should NOT be in the results (for precision) */
  irrelevantSymbols: string[];

  /** Minimum acceptable recall (0-1) */
  minRecall?: number;

  /** Minimum acceptable precision (0-1) */
  minPrecision?: number;
}

/**
 * Ground truth for a test fixture
 */
export interface FixtureGroundTruth {
  /** Fixture name */
  name: string;

  /** Path to the fixture directory */
  path: string;

  /** Language of the fixture */
  language: string;

  /** Total files in the fixture */
  totalFiles: number;

  /** Approximate total tokens in the fixture */
  approximateTokens: number;

  /** Test cases for this fixture */
  testCases: TestCase[];

  /** Known call graph edges for validation */
  callGraph: {
    caller: string;  // qualified name
    callee: string;  // qualified name
  }[];
}

/**
 * Results from evaluating a single test case
 */
export interface TestCaseResult {
  /** Test case ID */
  testCaseId: string;

  /** Whether the test passed */
  passed: boolean;

  /** Precision: relevant retrieved / total retrieved */
  precision: number;

  /** Recall: relevant retrieved / total relevant */
  recall: number;

  /** F1 score: 2 * (precision * recall) / (precision + recall) */
  f1Score: number;

  /** Symbols that were correctly retrieved */
  truePositives: string[];

  /** Irrelevant symbols that were incorrectly retrieved */
  falsePositives: string[];

  /** Expected symbols that were missed */
  falseNegatives: string[];

  /** Tokens in the retrieved context */
  contextTokens: number;

  /** Execution time in ms */
  executionTimeMs: number;
}

/**
 * Results from evaluating a fixture
 */
export interface FixtureEvaluationResult {
  /** Fixture name */
  fixtureName: string;

  /** Total test cases */
  totalTestCases: number;

  /** Passed test cases */
  passedTestCases: number;

  /** Average precision across all tests */
  averagePrecision: number;

  /** Average recall across all tests */
  averageRecall: number;

  /** Average F1 score */
  averageF1Score: number;

  /** Total tokens in the full codebase */
  fullCodebaseTokens: number;

  /** Average tokens in retrieved context */
  averageContextTokens: number;

  /** Token reduction percentage */
  tokenReductionPercent: number;

  /** Individual test case results */
  testCaseResults: TestCaseResult[];

  /** Total evaluation time in ms */
  totalTimeMs: number;
}

/**
 * Overall evaluation summary
 */
export interface EvaluationSummary {
  /** Timestamp of the evaluation */
  timestamp: Date;

  /** CodeGraph version */
  version: string;

  /** Results per fixture */
  fixtureResults: FixtureEvaluationResult[];

  /** Overall average precision */
  overallPrecision: number;

  /** Overall average recall */
  overallRecall: number;

  /** Overall average F1 */
  overallF1Score: number;

  /** Overall token reduction */
  overallTokenReduction: number;
}
