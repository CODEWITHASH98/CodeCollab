import { Worker } from 'bullmq';
import { spawn } from 'child_process';
import { writeFile, unlink, mkdir } from 'fs/promises';
import { join } from 'path';
import { randomUUID } from 'crypto';
import os from 'os';

// Language configurations
const LANGUAGE_CONFIG = {
  javascript: {
    extension: '.js',
    command: 'node',
    args: [],
    image: 'node:20-alpine',
  },
  python: {
    extension: '.py',
    command: 'python3',
    args: [],
    image: 'python:3.11-alpine',
  },
  java: {
    extension: '.java',
    command: 'java',
    args: [],
    compile: { command: 'javac', args: [] },
    image: 'openjdk:17-alpine',
  },
  cpp: {
    extension: '.cpp',
    command: './a.out',
    args: [],
    compile: { command: 'g++', args: ['-o', 'a.out'] },
    image: 'gcc:latest',
  },
  typescript: {
    extension: '.ts',
    command: 'npx',
    args: ['ts-node'],
    image: 'node:20-alpine',
  },
  go: {
    extension: '.go',
    command: 'go',
    args: ['run'],
    image: 'golang:alpine',
  },
  rust: {
    extension: '.rs',
    command: './main',
    args: [],
    compile: { command: 'rustc', args: ['-o', 'main'] },
    image: 'rust:alpine',
  },
  ruby: {
    extension: '.rb',
    command: 'ruby',
    args: [],
    image: 'ruby:alpine',
  },
};

// Execution limits
const LIMITS = {
  timeout: parseInt(process.env.EXECUTION_TIMEOUT) || 10000, // 10 seconds
  maxOutput: 1024 * 100, // 100KB max output
  maxMemory: process.env.MAX_MEMORY || '128m',
};

/**
 * Execute code in an isolated environment
 * @param {Object} job - BullMQ job
 */
export async function executeCode(job) {
  const { code, language, stdin = '', timeout = LIMITS.timeout } = job.data;

  const config = LANGUAGE_CONFIG[language];
  if (!config) {
    throw new Error(`Unsupported language: ${language}`);
  }

  const startTime = Date.now();
  const executionId = randomUUID();
  const tempDir = join(os.tmpdir(), 'codecollab', executionId);
  const filename = `main${config.extension}`;
  const filepath = join(tempDir, filename);

  try {
    // Create temp directory
    await mkdir(tempDir, { recursive: true });

    // Write code to file
    await writeFile(filepath, code);

    let result;

    // Use Docker if available, otherwise fallback to local execution
    if (process.env.USE_DOCKER === 'true') {
      result = await executeInDocker(config, filepath, stdin, timeout);
    } else {
      result = await executeLocally(config, filepath, stdin, timeout, tempDir);
    }

    const duration = Date.now() - startTime;

    return {
      success: !result.error || result.error.length === 0,
      output: truncateOutput(result.stdout),
      error: truncateOutput(result.stderr),
      duration,
      language,
      executionId,
    };

  } finally {
    // Cleanup temp files
    try {
      await unlink(filepath).catch(() => { });
      // Note: In production, use rimraf or similar for recursive delete
    } catch (e) {
      // Ignore cleanup errors
    }
  }
}

/**
 * Execute code locally (for development)
 */
async function executeLocally(config, filepath, stdin, timeout, workDir) {
  return new Promise((resolve) => {
    let stdout = '';
    let stderr = '';
    let killed = false;

    // Build command args
    const args = [...config.args, filepath];

    const process = spawn(config.command, args, {
      cwd: workDir,
      timeout,
      maxBuffer: LIMITS.maxOutput,
    });

    // Timeout handler
    const timeoutId = setTimeout(() => {
      killed = true;
      process.kill('SIGKILL');
    }, timeout);

    // Provide stdin if needed
    if (stdin) {
      process.stdin.write(stdin);
      process.stdin.end();
    }

    // Collect stdout
    process.stdout.on('data', (data) => {
      stdout += data.toString();
      if (stdout.length > LIMITS.maxOutput) {
        stdout = stdout.substring(0, LIMITS.maxOutput) + '\n[Output truncated]';
        process.kill('SIGKILL');
      }
    });

    // Collect stderr
    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    // Handle completion
    process.on('close', (code) => {
      clearTimeout(timeoutId);

      if (killed) {
        stderr = 'Execution timed out';
      }

      resolve({ stdout, stderr, exitCode: code });
    });

    // Handle errors
    process.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({ stdout: '', stderr: err.message, exitCode: 1 });
    });
  });
}

/**
 * Execute code in Docker container (for production)
 */
async function executeInDocker(config, filepath, stdin, timeout) {
  return new Promise((resolve) => {
    const args = [
      'run',
      '--rm',
      '--network', 'none',           // No network access
      '--memory', LIMITS.maxMemory,  // Memory limit
      '--cpus', '0.5',               // CPU limit
      '--pids-limit', '50',          // Process limit
      '--read-only',                 // Read-only filesystem
      '--tmpfs', '/tmp:size=64m',    // Writable temp
      '-v', `${filepath}:/app/code${config.extension}:ro`,
      '-w', '/app',
      config.image,
      config.command,
      ...config.args,
      `/app/code${config.extension}`,
    ];

    let stdout = '';
    let stderr = '';
    let killed = false;

    const process = spawn('docker', args, {
      timeout: timeout + 5000, // Extra buffer for container startup
    });

    const timeoutId = setTimeout(() => {
      killed = true;
      process.kill('SIGKILL');
    }, timeout);

    if (stdin) {
      process.stdin.write(stdin);
      process.stdin.end();
    }

    process.stdout.on('data', (data) => {
      stdout += data.toString();
    });

    process.stderr.on('data', (data) => {
      stderr += data.toString();
    });

    process.on('close', (code) => {
      clearTimeout(timeoutId);

      if (killed) {
        stderr = 'Execution timed out';
      }

      resolve({ stdout, stderr, exitCode: code });
    });

    process.on('error', (err) => {
      clearTimeout(timeoutId);
      resolve({ stdout: '', stderr: `Docker error: ${err.message}`, exitCode: 1 });
    });
  });
}

/**
 * Truncate output to prevent memory issues
 */
function truncateOutput(output) {
  if (!output) return '';
  if (output.length > LIMITS.maxOutput) {
    return output.substring(0, LIMITS.maxOutput) + '\n[Output truncated]';
  }
  return output;
}

/**
 * Get supported languages
 */
export function getSupportedLanguages() {
  return Object.keys(LANGUAGE_CONFIG);
}

/**
 * Validate language support
 */
export function isLanguageSupported(language) {
  return language in LANGUAGE_CONFIG;
}

export default { executeCode, getSupportedLanguages, isLanguageSupported };
