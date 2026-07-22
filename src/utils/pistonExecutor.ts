// Piston API Client for Multi-Language Code Execution
// API Documentation: https://github.com/engineer-man/piston

const PISTON_API_URL = 'https://emkc.org/api/v2/piston';

// Language mapping for Piston API
export const PISTON_LANGUAGES = {
  python: { language: 'python', version: '3.10.0', aliases: ['py', 'py3'] },
  javascript: { language: 'javascript', version: '18.15.0', aliases: ['js', 'node'] },
  typescript: { language: 'typescript', version: '5.0.3', aliases: ['ts'] },
  java: { language: 'java', version: '15.0.2', aliases: [] },
  cpp: { language: 'c++', version: '10.2.0', aliases: ['c++', 'g++'] },
  c: { language: 'c', version: '10.2.0', aliases: ['gcc'] },
  rust: { language: 'rust', version: '1.68.2', aliases: ['rs'] },
  go: { language: 'go', version: '1.16.2', aliases: ['golang'] },
  ruby: { language: 'ruby', version: '3.0.1', aliases: ['rb'] },
  php: { language: 'php', version: '8.2.3', aliases: [] },
  swift: { language: 'swift', version: '5.3.3', aliases: [] },
  kotlin: { language: 'kotlin', version: '1.8.20', aliases: ['kt'] },
  scala: { language: 'scala', version: '3.2.2', aliases: ['sc'] },
  bash: { language: 'bash', version: '5.2.0', aliases: ['sh'] },
} as const;

export type PistonLanguage = keyof typeof PISTON_LANGUAGES;

// Piston API Types
export interface PistonExecuteRequest {
  language: string;
  version: string;
  files: Array<{
    name?: string;
    content: string;
    encoding?: 'utf8' | 'base64' | 'hex';
  }>;
  stdin?: string;
  args?: string[];
  compile_timeout?: number;
  run_timeout?: number;
  compile_memory_limit?: number;
  run_memory_limit?: number;
}

export interface PistonExecuteResponse {
  language: string;
  version: string;
  run: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
    message?: string | null;
    status?: string | null;
  };
  compile?: {
    stdout: string;
    stderr: string;
    output: string;
    code: number | null;
    signal: string | null;
    message?: string | null;
    status?: string | null;
  };
}

export interface PistonRuntime {
  language: string;
  version: string;
  aliases: string[];
  runtime?: string;
}

export interface PistonExecutionResult {
  success: boolean;
  output: string;
  error?: string;
  executionTime?: number;
  language: string;
  version: string;
}

/**
 * Fetch available runtimes from Piston API
 */
export async function getPistonRuntimes(): Promise<PistonRuntime[]> {
  try {
    const response = await fetch(`${PISTON_API_URL}/runtimes`);
    if (!response.ok) {
      throw new Error(`Failed to fetch runtimes: ${response.statusText}`);
    }
    return await response.json();
  } catch (error) {
    console.error('Error fetching Piston runtimes:', error);
    throw error;
  }
}

/**
 * Execute code using Piston API
 * @param language - Programming language (e.g., 'python', 'javascript', 'cpp')
 * @param code - Source code to execute
 * @param stdin - Optional stdin input for the program
 * @param options - Optional execution options (timeout, memory limit, etc.)
 */
export async function executePistonCode(
  language: PistonLanguage,
  code: string,
  stdin?: string,
  options?: {
    args?: string[];
    compileTimeout?: number;
    runTimeout?: number;
    onLog?: (log: string) => void;
  }
): Promise<PistonExecutionResult> {
  const startTime = Date.now();
  
  // Get language configuration
  const langConfig = PISTON_LANGUAGES[language];
  if (!langConfig) {
    return {
      success: false,
      output: '',
      error: `Unsupported language: ${language}`,
      language,
      version: 'unknown',
    };
  }

  // Prepare request payload
  const payload: PistonExecuteRequest = {
    language: langConfig.language,
    version: langConfig.version,
    files: [
      {
        content: code,
      },
    ],
    stdin: stdin || '',
    args: options?.args || [],
    compile_timeout: options?.compileTimeout || 10000,
    run_timeout: options?.runTimeout || 3000,
  };

  try {
    // Make API request
    const response = await fetch(`${PISTON_API_URL}/execute`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({ message: response.statusText }));
      throw new Error(errorData.message || `API request failed: ${response.statusText}`);
    }

    const result: PistonExecuteResponse = await response.json();
    const executionTime = Date.now() - startTime;

    // Check for compilation errors
    if (result.compile) {
      if (result.compile.code !== 0 || result.compile.stderr) {
        options?.onLog?.(`Compilation output:\n${result.compile.output}`);
        
        if (result.compile.code !== 0) {
          return {
            success: false,
            output: result.compile.output,
            error: `Compilation failed with exit code ${result.compile.code}`,
            executionTime,
            language: result.language,
            version: result.version,
          };
        }
      }
    }

    // Check for runtime errors
    const hasError = result.run.code !== 0 || result.run.signal !== null;
    const output = result.run.output || result.run.stdout;

    // Log output if callback provided
    if (options?.onLog && output) {
      options.onLog(output);
    }

    return {
      success: !hasError,
      output,
      error: hasError
        ? result.run.stderr || result.run.message || `Process exited with code ${result.run.code}`
        : undefined,
      executionTime,
      language: result.language,
      version: result.version,
    };
  } catch (error) {
    const executionTime = Date.now() - startTime;
    const errorMessage = error instanceof Error ? error.message : String(error);

    return {
      success: false,
      output: '',
      error: `Execution failed: ${errorMessage}`,
      executionTime,
      language: langConfig.language,
      version: langConfig.version,
    };
  }
}

/**
 * Check if a language is supported by Piston
 */
export function isPistonLanguageSupported(language: string): language is PistonLanguage {
  return language in PISTON_LANGUAGES;
}

/**
 * Get file extension for a language
 */
export function getFileExtension(language: PistonLanguage): string {
  const extensions: Record<PistonLanguage, string> = {
    python: 'py',
    javascript: 'js',
    typescript: 'ts',
    java: 'java',
    cpp: 'cpp',
    c: 'c',
    rust: 'rs',
    go: 'go',
    ruby: 'rb',
    php: 'php',
    swift: 'swift',
    kotlin: 'kt',
    scala: 'scala',
    bash: 'sh',
  };
  return extensions[language] || 'txt';
}
