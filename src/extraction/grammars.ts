/**
 * Grammar Loading and Caching
 *
 * Manages tree-sitter language grammars.
 */

import Parser from 'tree-sitter';
import { Language } from '../types';

// Grammar module imports — wrapped in tryRequire so a missing native binding
// (e.g. tree-sitter-kotlin on Windows) degrades gracefully instead of crashing.
// eslint-disable-next-line @typescript-eslint/no-require-imports
function tryRequire(id: string, prop?: string): unknown | null {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const mod = require(id);
    return prop ? mod[prop] : mod;
  } catch {
    console.warn(`[CodeGraph] Failed to load ${id} — ${prop ?? id} parsing will be unavailable on this platform.`);
    return null;
  }
}

const TypeScript = tryRequire('tree-sitter-typescript', 'typescript');
const TSX = tryRequire('tree-sitter-typescript', 'tsx');
const JavaScript = tryRequire('tree-sitter-javascript');
const Python = tryRequire('tree-sitter-python');
const Go = tryRequire('tree-sitter-go');
const Rust = tryRequire('tree-sitter-rust');
const Java = tryRequire('tree-sitter-java');
const C = tryRequire('tree-sitter-c');
const Cpp = tryRequire('tree-sitter-cpp');
const CSharp = tryRequire('tree-sitter-c-sharp');
const PHP = tryRequire('tree-sitter-php', 'php');
const Ruby = tryRequire('tree-sitter-ruby');
const Swift = tryRequire('tree-sitter-swift');
const Kotlin = tryRequire('tree-sitter-kotlin');
const Dart = tryRequire('@sengac/tree-sitter-dart');
// Note: tree-sitter-liquid has ABI compatibility issues with tree-sitter 0.22+
// Liquid extraction is handled separately via regex in tree-sitter.ts

/**
 * Mapping of Language to tree-sitter grammar.
 * Parsers that failed to load are excluded.
 */
const GRAMMAR_MAP: Record<string, unknown> = {};

const grammarEntries: [string, unknown][] = [
  ['typescript', TypeScript],
  ['tsx', TSX],
  ['javascript', JavaScript],
  ['jsx', JavaScript], // JSX uses the JavaScript grammar
  ['python', Python],
  ['go', Go],
  ['rust', Rust],
  ['java', Java],
  ['c', C],
  ['cpp', Cpp],
  ['csharp', CSharp],
  ['php', PHP],
  ['ruby', Ruby],
  ['swift', Swift],
  ['kotlin', Kotlin],
  ['dart', Dart],
  // liquid: uses custom regex-based extraction, not tree-sitter
];

for (const [lang, grammar] of grammarEntries) {
  if (grammar) GRAMMAR_MAP[lang] = grammar;
}

/**
 * File extension to Language mapping
 */
export const EXTENSION_MAP: Record<string, Language> = {
  '.ts': 'typescript',
  '.tsx': 'tsx',
  '.js': 'javascript',
  '.mjs': 'javascript',
  '.cjs': 'javascript',
  '.jsx': 'jsx',
  '.py': 'python',
  '.pyw': 'python',
  '.go': 'go',
  '.rs': 'rust',
  '.java': 'java',
  '.c': 'c',
  '.h': 'c', // Could also be C++, defaulting to C
  '.cpp': 'cpp',
  '.cc': 'cpp',
  '.cxx': 'cpp',
  '.hpp': 'cpp',
  '.hxx': 'cpp',
  '.cs': 'csharp',
  '.php': 'php',
  '.rb': 'ruby',
  '.rake': 'ruby',
  '.swift': 'swift',
  '.kt': 'kotlin',
  '.kts': 'kotlin',
  '.dart': 'dart',
  '.liquid': 'liquid',
};

/**
 * Cache for initialized parsers
 */
const parserCache = new Map<Language, Parser>();

/**
 * Get a parser for the specified language
 */
export function getParser(language: Language): Parser | null {
  // Check cache first
  if (parserCache.has(language)) {
    return parserCache.get(language)!;
  }

  // Get grammar for language
  const grammar = GRAMMAR_MAP[language];
  if (!grammar) {
    return null;
  }

  // Create and cache parser
  const parser = new Parser();
  parser.setLanguage(grammar as Parameters<typeof parser.setLanguage>[0]);
  parserCache.set(language, parser);

  return parser;
}

/**
 * Detect language from file extension
 */
export function detectLanguage(filePath: string): Language {
  const ext = filePath.substring(filePath.lastIndexOf('.')).toLowerCase();
  return EXTENSION_MAP[ext] || 'unknown';
}

/**
 * Check if a language is supported
 */
export function isLanguageSupported(language: Language): boolean {
  // Liquid uses custom regex-based extraction, not tree-sitter
  if (language === 'liquid') return true;
  return language !== 'unknown' && language in GRAMMAR_MAP;
}

/**
 * Get all supported languages
 */
export function getSupportedLanguages(): Language[] {
  const languages = Object.keys(GRAMMAR_MAP) as Language[];
  // Add Liquid which uses custom extraction
  languages.push('liquid');
  return languages;
}

/**
 * Clear the parser cache (useful for testing)
 */
export function clearParserCache(): void {
  parserCache.clear();
}

/**
 * Get language display name
 */
export function getLanguageDisplayName(language: Language): string {
  const names: Record<Language, string> = {
    typescript: 'TypeScript',
    javascript: 'JavaScript',
    tsx: 'TypeScript (TSX)',
    jsx: 'JavaScript (JSX)',
    python: 'Python',
    go: 'Go',
    rust: 'Rust',
    java: 'Java',
    c: 'C',
    cpp: 'C++',
    csharp: 'C#',
    php: 'PHP',
    ruby: 'Ruby',
    swift: 'Swift',
    kotlin: 'Kotlin',
    dart: 'Dart',
    liquid: 'Liquid',
    unknown: 'Unknown',
  };
  return names[language] || language;
}
