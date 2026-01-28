/**
 * Piston Code Executor
 * 
 * Uses Piston API for secure code execution
 * - 50+ programming languages supported
 * - Free, no API key required
 * - Sandboxed execution environment
 * 
 * Docs: https://github.com/engineer-man/piston
 */

import { logger } from '../utils/logger.js';

// Piston API endpoint (public, free)
const PISTON_API = process.env.PISTON_API_URL || 'https://emkc.org/api/v2/piston';

// Language configurations with Piston runtime names
const LANGUAGE_CONFIG = {
    javascript: { language: 'javascript', version: '18.15.0', aliases: ['js', 'node'] },
    typescript: { language: 'typescript', version: '5.0.3', aliases: ['ts'] },
    python: { language: 'python', version: '3.10.0', aliases: ['py', 'python3'] },
    java: { language: 'java', version: '15.0.2', aliases: [] },
    cpp: { language: 'cpp', version: '10.2.0', aliases: ['c++', 'cplusplus'] },
    c: { language: 'c', version: '10.2.0', aliases: [] },
    csharp: { language: 'csharp', version: '6.12.0', aliases: ['cs', 'c#'] },
    go: { language: 'go', version: '1.16.2', aliases: ['golang'] },
    rust: { language: 'rust', version: '1.68.2', aliases: ['rs'] },
    ruby: { language: 'ruby', version: '3.0.1', aliases: ['rb'] },
    php: { language: 'php', version: '8.2.3', aliases: [] },
    swift: { language: 'swift', version: '5.3.3', aliases: [] },
    kotlin: { language: 'kotlin', version: '1.8.20', aliases: ['kt'] },
    scala: { language: 'scala', version: '3.2.2', aliases: [] },
    r: { language: 'r', version: '4.1.1', aliases: ['rlang'] },
    perl: { language: 'perl', version: '5.36.0', aliases: ['pl'] },
    lua: { language: 'lua', version: '5.4.4', aliases: [] },
    bash: { language: 'bash', version: '5.2.0', aliases: ['sh', 'shell'] },
    powershell: { language: 'powershell', version: '7.1.4', aliases: ['ps', 'ps1'] },
    sql: { language: 'sqlite3', version: '3.36.0', aliases: ['sqlite'] },
    haskell: { language: 'haskell', version: '9.0.1', aliases: ['hs'] },
    elixir: { language: 'elixir', version: '1.11.3', aliases: ['ex'] },
    clojure: { language: 'clojure', version: '1.10.3', aliases: ['clj'] },
    dart: { language: 'dart', version: '2.19.6', aliases: [] },
    julia: { language: 'julia', version: '1.8.5', aliases: ['jl'] },
    fsharp: { language: 'fsharp', version: '5.0.201', aliases: ['fs', 'f#'] },
    matlab: { language: 'octave', version: '6.2.0', aliases: ['octave'] },
    cobol: { language: 'cobol', version: '3.1.2', aliases: ['cob'] },
    fortran: { language: 'fortran', version: '10.2.0', aliases: ['f90', 'f95'] },
    pascal: { language: 'pascal', version: '3.2.2', aliases: ['pas'] },
    groovy: { language: 'groovy', version: '3.0.7', aliases: [] },
    nim: { language: 'nim', version: '1.6.10', aliases: [] },
    crystal: { language: 'crystal', version: '1.7.2', aliases: ['cr'] },
    zig: { language: 'zig', version: '0.10.1', aliases: [] },
    vlang: { language: 'vlang', version: '0.3.3', aliases: ['v'] },
    racket: { language: 'racket', version: '8.3', aliases: ['rkt'] },
    prolog: { language: 'prolog', version: '8.2.4', aliases: ['pl'] },
    lisp: { language: 'lisp', version: '2.1.2', aliases: ['commonlisp', 'cl'] },
    erlang: { language: 'erlang', version: '23.0', aliases: ['erl'] },
    ocaml: { language: 'ocaml', version: '4.12.0', aliases: ['ml'] },
    d: { language: 'd', version: '2.101.0', aliases: ['dlang'] },
    assembly: { language: 'nasm', version: '2.15.5', aliases: ['asm', 'nasm'] },
};

// Execution limits
const LIMITS = {
    timeout: parseInt(process.env.EXECUTION_TIMEOUT) || 10000,
    maxOutput: 1024 * 100, // 100KB
    maxCodeLength: 1024 * 64, // 64KB
};

/**
 * Execute code using Piston API
 * @param {Object} options - Execution options
 * @returns {Promise<Object>} - Execution result
 */
export async function executeWithPiston(options) {
    const { code, language, stdin = '', args = [] } = options;

    // Validate inputs
    if (!code || typeof code !== 'string') {
        throw new Error('Code is required');
    }

    if (code.length > LIMITS.maxCodeLength) {
        throw new Error(`Code exceeds maximum length of ${LIMITS.maxCodeLength / 1024}KB`);
    }

    const config = getLanguageConfig(language);
    if (!config) {
        throw new Error(`Unsupported language: ${language}. Supported: ${getSupportedLanguages().join(', ')}`);
    }

    const startTime = Date.now();

    try {
        logger.info(`Executing ${language} code via Piston API`);

        const response = await fetch(`${PISTON_API}/execute`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({
                language: config.language,
                version: config.version,
                files: [
                    {
                        name: getFileName(config.language),
                        content: code,
                    },
                ],
                stdin: stdin,
                args: args,
                compile_timeout: LIMITS.timeout,
                run_timeout: LIMITS.timeout,
                compile_memory_limit: -1,
                run_memory_limit: -1,
            }),
        });

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Piston API error: ${response.status} - ${errorText}`);
        }

        const result = await response.json();
        const duration = Date.now() - startTime;

        // Handle compilation errors
        if (result.compile && result.compile.code !== 0) {
            return {
                success: false,
                output: '',
                error: truncateOutput(result.compile.stderr || result.compile.output || 'Compilation failed'),
                duration,
                language,
                engine: 'piston',
            };
        }

        // Handle runtime results
        const runResult = result.run || {};
        const stdout = runResult.stdout || '';
        const stderr = runResult.stderr || '';
        const exitCode = runResult.code || 0;

        return {
            success: exitCode === 0 && !stderr,
            output: truncateOutput(stdout) || (exitCode === 0 ? 'Code executed successfully (no output)' : ''),
            error: truncateOutput(stderr),
            exitCode,
            duration,
            language,
            engine: 'piston',
            signal: runResult.signal || null,
        };

    } catch (error) {
        logger.error('Piston execution error:', error.message);
        return {
            success: false,
            output: '',
            error: error.message,
            duration: Date.now() - startTime,
            language,
            engine: 'piston',
        };
    }
}

/**
 * Get available runtimes from Piston
 * @returns {Promise<Array>} - List of available runtimes
 */
export async function getAvailableRuntimes() {
    try {
        const response = await fetch(`${PISTON_API}/runtimes`);
        if (!response.ok) {
            throw new Error('Failed to fetch runtimes');
        }
        return await response.json();
    } catch (error) {
        logger.error('Failed to fetch Piston runtimes:', error.message);
        return [];
    }
}

/**
 * Get language configuration
 */
function getLanguageConfig(language) {
    const normalized = language.toLowerCase();

    // Direct match
    if (LANGUAGE_CONFIG[normalized]) {
        return LANGUAGE_CONFIG[normalized];
    }

    // Check aliases
    for (const [, config] of Object.entries(LANGUAGE_CONFIG)) {
        if (config.aliases.includes(normalized)) {
            return config;
        }
    }

    return null;
}

/**
 * Get appropriate filename for language
 */
function getFileName(language) {
    const extensions = {
        javascript: 'main.js',
        typescript: 'main.ts',
        python: 'main.py',
        java: 'Main.java',
        cpp: 'main.cpp',
        c: 'main.c',
        csharp: 'Main.cs',
        go: 'main.go',
        rust: 'main.rs',
        ruby: 'main.rb',
        php: 'main.php',
        swift: 'main.swift',
        kotlin: 'Main.kt',
        scala: 'Main.scala',
        r: 'main.r',
        perl: 'main.pl',
        lua: 'main.lua',
        bash: 'main.sh',
        powershell: 'main.ps1',
        sqlite3: 'main.sql',
        haskell: 'main.hs',
        elixir: 'main.ex',
        clojure: 'main.clj',
        dart: 'main.dart',
        julia: 'main.jl',
        fsharp: 'main.fs',
        octave: 'main.m',
        cobol: 'main.cob',
        fortran: 'main.f90',
        pascal: 'main.pas',
        groovy: 'main.groovy',
        nim: 'main.nim',
        crystal: 'main.cr',
        zig: 'main.zig',
        vlang: 'main.v',
        racket: 'main.rkt',
        prolog: 'main.pl',
        lisp: 'main.lisp',
        erlang: 'main.erl',
        ocaml: 'main.ml',
        d: 'main.d',
        nasm: 'main.asm',
    };
    return extensions[language] || 'main.txt';
}

/**
 * Truncate output to prevent memory issues
 */
function truncateOutput(output) {
    if (!output) return '';
    if (output.length > LIMITS.maxOutput) {
        return output.substring(0, LIMITS.maxOutput) + '\n[Output truncated - exceeded 100KB limit]';
    }
    return output;
}

/**
 * Get list of supported languages
 */
export function getSupportedLanguages() {
    return Object.keys(LANGUAGE_CONFIG);
}

/**
 * Check if language is supported
 */
export function isLanguageSupported(language) {
    return getLanguageConfig(language) !== null;
}

/**
 * Get language info
 */
export function getLanguageInfo(language) {
    const config = getLanguageConfig(language);
    if (!config) return null;

    return {
        name: language,
        runtime: config.language,
        version: config.version,
        aliases: config.aliases,
    };
}

export default {
    executeWithPiston,
    getSupportedLanguages,
    isLanguageSupported,
    getLanguageInfo,
    getAvailableRuntimes,
};
