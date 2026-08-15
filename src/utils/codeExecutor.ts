import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../integrations/supabase/client';

export type TestCase = {
  input: string;
  expected: string;
};

export type ExecutionResult = {
  passed: boolean;
  logs: string[];
  results: {
    caseId: number;
    input: string;
    expected: string;
    actual: string;
    passed: boolean;
  }[];
  error?: string;
};

// ─── Strip TypeScript annotations for in-browser JavaScript evaluation ───────────
export function stripTypeScript(code: string): string {
  try {
    let clean = code
      // Remove type-only imports/exports
      .replace(/import\s+type\s+[^;]+;/g, '')
      .replace(/export\s+type\s+[^;]+;/g, '')
      // Remove interface/type definitions
      .replace(/(?:interface|type)\s+[A-Za-z0-9_]+\s*(?:=\s*)?\{[\s\S]*?\};?/g, '')
      // Remove variable type annotations: let x: number = 0; const arr: number[] = [];
      .replace(/(\b(?:let|const|var)\s+[A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_$<>[\]|&\s]+(?=\s*=|\s*;|\s*,)/g, '$1')
      // Remove function return type annotations: function foo(): number[] { -> function foo() {
      .replace(/\)\s*:\s*[A-Za-z0-9_$<>[\]|&\s]+(?=\s*\{)/g, ')')
      // Remove parameter type annotations: (a: number, b: string) -> (a, b)
      .replace(/([A-Za-z0-9_$]+)\s*:\s*[A-Za-z0-9_$<>[\]|&\s]+(?=[,)])/g, '$1')
      // Remove generic calls like Map<string, number>() -> Map()
      .replace(/<[A-Za-z0-9_$,\s]+>(?=\()/g, '')
      // Remove 'as Type' assertions
      .replace(/\s+as\s+[A-Za-z0-9_$<>[\]|&]+/g, '')
      // Remove non-null assertion operator: charMap.get(char)!
      .replace(/([A-Za-z0-9_$)\]])!/g, '$1');
    return clean;
  } catch (e) {
    return code;
  }
}

// ─── Pyodide Setup (Main Thread Fallback) ───────────────────────────────────
declare global {
  interface Window {
    loadPyodide: (config?: any) => Promise<any>;
  }
}

let pyodideMain: any = null;
let pyodideLoadingPromise: Promise<any> | null = null;

const loadPyodideMain = async () => {
  if (pyodideMain) return pyodideMain;
  if (pyodideLoadingPromise) return pyodideLoadingPromise;

  pyodideLoadingPromise = new Promise(async (resolve, reject) => {
    try {
      const response = await fetch('https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js');
      const code = await response.text();

      const oldDefine = (window as any).define;
      (window as any).define = undefined;

      const script = document.createElement('script');
      script.textContent = code;
      document.body.appendChild(script);

      (window as any).define = oldDefine;

      // @ts-ignore
      const p = await window.loadPyodide({
        indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
      });
      pyodideMain = p;
      resolve(p);
    } catch (e) {
      reject(e);
    }
  });
  return pyodideLoadingPromise;
};

// ─── Edge Function Compiler (Java, C, C++, Python via OnlineCompiler.io) ──────────────
const EDGE_COMPILER_LANGUAGES = ['java', 'c', 'cpp', 'python'];

const executeViaEdgeCompiler = async (
  language: string,
  code: string,
  stdin: string,
  onLog: (msg: string) => void
): Promise<ExecutionResult> => {
  onLog(`⚡ Compiling ${language.toUpperCase()} code...\n`);

  const response = await fetch(`${SUPABASE_URL}/functions/v1/execute-code`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${SUPABASE_PUBLISHABLE_KEY}`,
    },
    body: JSON.stringify({ language, code, stdin }),
  });

  if (!response.ok) {
    let errMsg = `Server error: ${response.statusText}`;
    try {
      const errData = await response.json();
      errMsg = errData.error || errMsg;
    } catch (_) {}
    onLog(`\n❌ ${errMsg}\n`);
    return { passed: false, logs: [], results: [], error: errMsg };
  }

  const result = await response.json();
  const output: string = result?.run?.output ?? '';
  const stderr: string = result?.run?.stderr ?? '';

  if (output) onLog(output);
  if (stderr) onLog(`\nSTDERR:\n${stderr}`);

  return {
    passed: !stderr && result?.run?.code === 0,
    logs: [output],
    results: [],
    error: stderr || undefined,
  };
};

// ─── Compare Values Accurately (JSON / Arrays / Objects / Primitives) ────────
function normalizeAndCompare(actual: any, expectedStr: string): boolean {
  if (actual === undefined || actual === null) {
    return expectedStr.trim() === 'null' || expectedStr.trim() === 'undefined' || expectedStr.trim() === '[]';
  }

  const actualStr = typeof actual === 'object' ? JSON.stringify(actual) : String(actual);
  const cleanActual = actualStr.replace(/\s+/g, '');
  const cleanExpected = expectedStr.replace(/\s+/g, '');

  if (cleanActual === cleanExpected) return true;

  // Handle boolean loose match: true vs "true"
  if (String(actual).toLowerCase() === expectedStr.trim().toLowerCase()) return true;

  // Handle numeric match
  if (!isNaN(Number(actual)) && !isNaN(Number(expectedStr)) && Number(actual) === Number(expectedStr)) return true;

  return false;
}

// ─── Main Execution Function ─────────────────────────────────────────────────
export const executeCode = async (
  userCode: string,
  language: 'javascript' | 'python' | 'bash' | 'typescript' | 'java' | 'cpp' | 'c' | 'rust' | 'go' | 'ruby' | 'php' | 'swift' | 'kotlin' | 'scala',
  onLog?: (log: string) => void,
  onInputRequest?: (prompt: string) => void,
  stdin?: string,
  testCases?: { input: string; expected: string }[]
): Promise<ExecutionResult> => {
  const logs: string[] = [];
  const captureLog = (msg: string) => {
    logs.push(msg);
    onLog?.(msg);
  };

  // ── Edge Function Compilation (Java, C, C++, or Python without testCases) ──
  if (EDGE_COMPILER_LANGUAGES.includes(language)) {
    // If it's python but has testCases, we let the Pyodide block handle it below
    if (!(language === 'python' && testCases && testCases.length > 0)) {
      return executeViaEdgeCompiler(language, userCode, stdin ?? '', captureLog);
    }
  }

  // ── Python Execution via Pyodide (if test cases exist) ──
  // If testCases exist, we use Pyodide so we can properly evaluate inputs
  if (language === 'python' && testCases && testCases.length > 0) {
    captureLog("⚡ Running Python (In-Browser Evaluator)...\n");
    try {
      const py = await loadPyodideMain();
      py.setStdout({ batched: (msg: string) => captureLog(msg) });
      py.setStderr({ batched: (msg: string) => captureLog(`[stderr] ${msg}`) });

      const pythonHelpers = `
class TreeNode:
    def __init__(self, val=0, left=None, right=None):
        self.val = val
        self.left = left
        self.right = right

class ListNode:
    def __init__(self, val=0, next=None):
        self.val = val
        self.next = next

def buildTree(arr):
    if not arr or arr[0] is None:
        return None
    root = TreeNode(arr[0])
    queue = [root]
    i = 1
    while i < len(arr):
        curr = queue.pop(0)
        if arr[i] is not None:
            curr.left = TreeNode(arr[i])
            queue.append(curr.left)
        i += 1
        if i < len(arr) and arr[i] is not None:
            curr.right = TreeNode(arr[i])
            queue.append(curr.right)
        i += 1
    return root

def buildList(arr):
    if not arr:
        return None
    head = ListNode(arr[0])
    curr = head
    for i in range(1, len(arr)):
        curr.next = ListNode(arr[i])
        curr = curr.next
    return head
`;
      await py.runPythonAsync(pythonHelpers);
      await py.runPythonAsync(userCode);

      const results: { caseId: number; input: string; expected: string; actual: string; passed: boolean }[] = [];

      if (testCases && testCases.length > 0) {
        // Try calling the defined python function against test cases
        const funcNameMatch = userCode.match(/def\s+([A-Za-z0-9_]+)\s*\(/);
        const funcName = funcNameMatch ? funcNameMatch[1] : null;

        if (funcName) {
          for (let i = 0; i < testCases.length; i++) {
            const tc = testCases[i];
            try {
              const res = await py.runPythonAsync(`${funcName}(${tc.input})`);
              const actualStr = res !== undefined ? String(res) : 'None';
              const isMatch = normalizeAndCompare(actualStr, tc.expected);
              results.push({
                caseId: i + 1,
                input: tc.input,
                expected: tc.expected,
                actual: actualStr,
                passed: isMatch
              });
            } catch (tcErr: any) {
              results.push({
                caseId: i + 1,
                input: tc.input,
                expected: tc.expected,
                actual: `Runtime Error: ${tcErr.message}`,
                passed: false
              });
            }
          }
        }
      }

      const allPassed = results.length > 0 ? results.every(r => r.passed) : true;
      captureLog('\n✨ Execution completed!');
      return { passed: allPassed, logs, results };

    } catch (err: any) {
      const errMsg = err?.toString() ?? 'Unknown Python error';
      captureLog(`\n❌ ${errMsg}`);
      return { passed: false, logs, results: [], error: errMsg };
    }
  }

  // ── JavaScript / TypeScript Native Browser Execution with Node & Redis Mocks ──
  captureLog("⚡ Running JavaScript Runtime...\n");

  const mockConsole = {
    log: (...args: any[]) => {
      captureLog(args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' '));
    },
    error: (...args: any[]) => {
      captureLog("Error: " + args.map(a => String(a)).join(' '));
    },
    warn: (...args: any[]) => {
      captureLog("Warn: " + args.map(a => String(a)).join(' '));
    },
    info: (...args: any[]) => {
      captureLog(args.map(a => String(a)).join(' '));
    },
  };

  // Realistic in-memory Redis mock supporting Lua scripting & standard commands
  class MockRedis {
    private store: Map<string, any> = new Map();
    private zsets: Map<string, Array<{ member: any; score: number }>> = new Map();
    private expiries: Map<string, number> = new Map();

    constructor(_config?: any) {}

    async eval(script: string, _numKeys: number, key: string, ...args: any[]): Promise<number> {
      // Simulate Sliding Window Lua Script
      const limit = Number(args[0]) || 5;
      const window = Number(args[1]) || 60;
      const now = Number(args[2]) || Math.floor(Date.now() / 1000);

      let zset = this.zsets.get(key) || [];
      // Remove outdated timestamps
      zset = zset.filter(item => item.score > (now - window));

      const count = zset.length;
      if (count < limit) {
        zset.push({ member: now, score: now });
        this.zsets.set(key, zset);
        return 1;
      } else {
        this.zsets.set(key, zset);
        return 0;
      }
    }

    async zremrangebyscore(key: string, min: number, max: number) {
      let zset = this.zsets.get(key) || [];
      zset = zset.filter(item => item.score < min || item.score > max);
      this.zsets.set(key, zset);
      return 1;
    }

    async zcard(key: string) {
      return (this.zsets.get(key) || []).length;
    }

    async zadd(key: string, score: number, member: any) {
      let zset = this.zsets.get(key) || [];
      zset.push({ member, score });
      this.zsets.set(key, zset);
      return 1;
    }

    async expire(key: string, seconds: number) {
      this.expiries.set(key, Date.now() + seconds * 1000);
      return 1;
    }

    async get(key: string) { return this.store.get(key) ?? null; }
    async set(key: string, value: any) { this.store.set(key, value); return 'OK'; }
    async del(key: string) { return this.store.delete(key) ? 1 : 0; }
    async incr(key: string) {
      const v = (Number(this.store.get(key)) || 0) + 1;
      this.store.set(key, v);
      return v;
    }
    async quit() { return 'OK'; }
    async disconnect() { return 'OK'; }
  }

  // Node module polyfill for require(...)
  const mockRequire = (modName: string) => {
    const name = (modName || '').toLowerCase().trim();
    if (name === 'ioredis' || name === 'redis') {
      return MockRedis;
    }
    if (name === 'express') {
      return () => ({
        use: () => {},
        get: () => {},
        post: () => {},
        listen: (_p: any, cb: any) => cb && cb()
      });
    }
    if (name === 'crypto') {
      return {
        randomBytes: (_n: number) => ({ toString: () => Math.random().toString(36).substring(2) }),
        createHash: () => ({ update: () => ({ digest: () => 'hash_' + Math.random().toString(36).substring(2) }) })
      };
    }
    if (name === 'events') {
      return class EventEmitter { on() {} emit() {} };
    }
    return {};
  };

  try {
    let executableCode = language === 'typescript' ? stripTypeScript(userCode) : userCode;

    // Convert ES module import statements into require statements
    executableCode = executableCode
      .replace(/import\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require("$2")')
      .replace(/import\s+\*\s+as\s+([A-Za-z0-9_$]+)\s+from\s+['"]([^'"]+)['"]/g, 'const $1 = require("$2")')
      .replace(/import\s+\{([^}]+)\}\s+from\s+['"]([^'"]+)['"]/g, 'const { $1 } = require("$2")');

    // Detect primary function name (e.g. function twoSum, slidingWindowRateLimiter, searchRotatedArray)
    const fnMatch = executableCode.match(/(?:function\s+([A-Za-z0-9_$]+)|(?:var|let|const)\s+([A-Za-z0-9_$]+)\s*=\s*(?:async\s*)?(?:function|\([^)]*\)\s*=>))/);
    const mainFnName = fnMatch ? (fnMatch[1] || fnMatch[2]) : null;

    // Build async evaluation harness
    const harness = `
      // LeetCode Environment Helpers
      class TreeNode {
        constructor(val, left = null, right = null) {
          this.val = val;
          this.left = left;
          this.right = right;
        }
      }
      class ListNode {
        constructor(val, next = null) {
          this.val = val;
          this.next = next;
        }
      }
      function buildTree(arr) {
        if (!arr || arr.length === 0 || arr[0] === null) return null;
        const root = new TreeNode(arr[0]);
        const queue = [root];
        let i = 1;
        while (i < arr.length) {
          const curr = queue.shift();
          if (arr[i] !== null && arr[i] !== undefined) {
            curr.left = new TreeNode(arr[i]);
            queue.push(curr.left);
          }
          i++;
          if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
            curr.right = new TreeNode(arr[i]);
            queue.push(curr.right);
          }
          i++;
        }
        return root;
      }
      function buildList(arr) {
        if (!arr || arr.length === 0) return null;
        const head = new ListNode(arr[0]);
        let curr = head;
        for (let i = 1; i < arr.length; i++) {
          curr.next = new ListNode(arr[i]);
          curr = curr.next;
        }
        return head;
      }

      let __mainFn = null;
      ${executableCode}
      if (typeof ${mainFnName || 'null'} === 'function') {
        __mainFn = ${mainFnName};
      }
      return __mainFn;
    `;

    // Provide global fallback for Redis and LeetCode Data Structures
    if (typeof globalThis !== 'undefined') {
      (globalThis as any).Redis = MockRedis;
      
      (globalThis as any).TreeNode = class TreeNode {
        val: any; left: any; right: any;
        constructor(val: any, left = null, right = null) {
          this.val = val; this.left = left; this.right = right;
        }
      };
      (globalThis as any).ListNode = class ListNode {
        val: any; next: any;
        constructor(val: any, next = null) {
          this.val = val; this.next = next;
        }
      };
      (globalThis as any).buildTree = function(arr: any[]) {
        if (!arr || arr.length === 0 || arr[0] === null) return null;
        const root = new (globalThis as any).TreeNode(arr[0]);
        const queue = [root];
        let i = 1;
        while (i < arr.length) {
          const curr = queue.shift();
          if (arr[i] !== null && arr[i] !== undefined) {
            curr.left = new (globalThis as any).TreeNode(arr[i]);
            queue.push(curr.left);
          }
          i++;
          if (i < arr.length && arr[i] !== null && arr[i] !== undefined) {
            curr.right = new (globalThis as any).TreeNode(arr[i]);
            queue.push(curr.right);
          }
          i++;
        }
        return root;
      };
      (globalThis as any).buildList = function(arr: any[]) {
        if (!arr || arr.length === 0) return null;
        const head = new (globalThis as any).ListNode(arr[0]);
        let curr = head;
        for (let i = 1; i < arr.length; i++) {
          curr.next = new (globalThis as any).ListNode(arr[i]);
          curr = curr.next;
        }
        return head;
      };
    }

    // Asynchronous Function Constructor
    const AsyncFunction = Object.getPrototypeOf(async function(){}).constructor;
    const runner = new AsyncFunction('console', 'require', harness);
    const userFn = await runner(mockConsole, mockRequire);

    const results: { caseId: number; input: string; expected: string; actual: string; passed: boolean }[] = [];

    if (testCases && testCases.length > 0 && typeof userFn === 'function') {
      for (let i = 0; i < testCases.length; i++) {
        const tc = testCases[i];
        try {
          // Safely parse input arguments - handle multiple input formats:
          // 1. JavaScript expression format: [[1,2],[3,4]], 2
          // 2. Newline-separated stdin format: "2\n2\n1 2\n3 4"
          let args: any[];
          const inputStr = tc.input.trim();

          try {
            // First try: parse as JS expression array
            args = new Function(`return [${inputStr}];`)();
          } catch (_parseErr) {
            // Second try: stdin newline-separated format
            const lines = inputStr.split('\n').map((l: string) => l.trim()).filter(Boolean);
            if (lines.length === 1) {
              try { args = [JSON.parse(lines[0])]; } catch { args = [lines[0]]; }
            } else {
              // Try first two lines as rows/cols, rest as matrix data
              const rows = parseInt(lines[0]);
              const cols = parseInt(lines[1]);
              if (!isNaN(rows) && !isNaN(cols) && lines.length >= 2 + rows) {
                const matrix = lines.slice(2, 2 + rows).map((l: string) => l.split(/\s+/).map(Number));
                args = [matrix];
              } else {
                // Try each line as a space-separated row of numbers
                const parsed = lines.map((l: string) => {
                  const nums = l.split(/\s+/).map(Number);
                  return nums.every(n => !isNaN(n)) ? (nums.length > 1 ? nums : nums[0]) : l;
                });
                args = parsed.length === 1 ? [parsed[0]] : [parsed];
              }
            }
          }

          const actualVal = await Promise.resolve(userFn(...args));
          const actualStr = typeof actualVal === 'object' && actualVal !== null ? JSON.stringify(actualVal) : String(actualVal);
          const isPassed = normalizeAndCompare(actualVal, tc.expected);

          results.push({
            caseId: i + 1,
            input: tc.input,
            expected: tc.expected,
            actual: actualStr,
            passed: isPassed
          });
        } catch (tcErr: any) {
          results.push({
            caseId: i + 1,
            input: tc.input,
            expected: tc.expected,
            actual: `Error: ${tcErr.message || tcErr}`,
            passed: false
          });
        }
      }
    }

    const allPassed = results.length > 0 ? results.every(r => r.passed) : true;
    captureLog(allPassed ? '\n✨ Execution completed successfully!' : '\n❌ Some Test Cases Failed.');

    return {
      passed: allPassed,
      logs,
      results
    };

  } catch (err: any) {
    const errMsg = err?.message ?? 'Runtime error';
    captureLog(`\n❌ Execution Error: ${errMsg}`);
    return { passed: false, logs, results: [], error: errMsg };
  }
};

// ─── AI Static Code Validator (Low Token "Jugaad") ───────────────────────────
export const validateCodeWithAI = async (
  userCode: string,
  problemDescription: string,
  language: string
): Promise<ExecutionResult> => {
  const apiKey = import.meta.env.VITE_GROQ_API_KEY;
  if (!apiKey) {
    return { passed: false, logs: ["API Key missing for AI Validator"], results: [] };
  }

  const prompt = `You are a strict, expert coding interviewer evaluating a candidate's code.
Does the candidate's code correctly solve the problem described below?
Pay close attention to edge cases and Time/Space complexity.

Return ONLY a valid JSON object in this exact format, nothing else:
{
  "passed": true or false,
  "feedback": "A very short, 1-sentence reason why it passed or failed."
}

Problem Description:
${problemDescription.substring(0, 1500)}

Candidate's Code (${language}):
${userCode.substring(0, 2000)}
`;

  try {
    const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${apiKey}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "llama-3.1-8b-instant",
        messages: [{ role: "user", content: prompt }],
        temperature: 0.1
      })
    });

    if (!response.ok) {
      return { passed: false, logs: ["AI Validation API Error"], results: [] };
    }

    const result = await response.json();
    let content = result.choices[0].message.content.trim();
    if (content.startsWith("\`\`\`json")) {
      content = content.replace(/\`\`\`json/g, "").replace(/\`\`\`/g, "");
    }
    
    const parsed = JSON.parse(content);
    return {
      passed: parsed.passed === true,
      logs: [parsed.feedback || (parsed.passed ? "AI Verified: Correct" : "AI Verified: Incorrect")],
      results: [{
        caseId: 1,
        input: "Static AI Analysis",
        expected: "Correct Logic",
        actual: parsed.feedback || "Evaluated by AI",
        passed: parsed.passed === true
      }]
    };
  } catch (err: any) {
    return { passed: false, logs: ["Failed to validate with AI: " + err.message], results: [] };
  }
};
