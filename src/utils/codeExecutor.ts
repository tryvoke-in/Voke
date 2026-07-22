import { executePistonCode, isPistonLanguageSupported, type PistonLanguage } from './pistonExecutor';

// Definition for singly-linked list.
class ListNode {
  val: number;
  next: ListNode | null;
  constructor(val?: number, next?: ListNode | null) {
    this.val = (val === undefined ? 0 : val);
    this.next = (next === undefined ? null : next);
  }
}

// Helper: Convert Array to Linked List
function arrayToList(arr: number[]): ListNode | null {
  if (arr.length === 0) return null;
  let head = new ListNode(arr[0]);
  let current = head;
  for (let i = 1; i < arr.length; i++) {
    current.next = new ListNode(arr[i]);
    current = current.next;
  }
  return head;
}

// Helper: Convert Linked List to Array
function listToArray(head: ListNode | null): number[] {
  const result: number[] = [];
  let current = head;
  while (current !== null && result.length < 1000) { // Safety break
    result.push(current.val);
    current = current.next;
  }
  return result;
}

export type ExecutionResult = {
  passed: boolean; // Keep for JS tests compat
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

// --- Pyodide Setup (Main Thread Fallback) ---
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

  pyodideLoadingPromise = new Promise((resolve, reject) => {
    // ... (Similar loading logic as before) ...
    // Reusing the simple loading logic or we can just rely on the script being there?
    // Let's implement robust loading again for fallback.
    const script = document.createElement('script');
    script.src = 'https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js';
    script.type = 'text/javascript';
    script.async = true;

    script.onload = async () => {
      try {
        // @ts-ignore
        const p = await window.loadPyodide({
          indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/"
        });
        pyodideMain = p;
        resolve(p);
      } catch (e) {
        reject(e);
      }
    };
    script.onerror = (e) => reject(e);
    document.body.appendChild(script);
  });
  return pyodideLoadingPromise;
};


// --- Pyodide Worker Controller ---
class PyodideController {
  worker: Worker | null = null;
  sharedBuffer: SharedArrayBuffer | null = null;
  int32Buffer: Int32Array | null = null;
  uint8Buffer: Uint8Array | null = null;

  callbacks: {
    onLog: (msg: string) => void;
    onInput: (prompt: string) => void;
    onFinished: () => void;
    onError: (err: string) => void;
  } | null = null;

  constructor() {
    if (typeof SharedArrayBuffer !== 'undefined') {
      try {
        this.sharedBuffer = new SharedArrayBuffer(1024 + 4);
        this.int32Buffer = new Int32Array(this.sharedBuffer);
        this.uint8Buffer = new Uint8Array(this.sharedBuffer, 4);
      } catch (e) {
        console.warn("Failed to create SharedArrayBuffer", e);
      }
    }
  }

  initWorker() {
    if (this.worker) return;
    this.worker = new Worker(new URL('../workers/pyodideWorker.ts', import.meta.url), {
      type: 'module'
    });

    this.worker.onmessage = (event) => {
      const { type, content, prompt } = event.data;
      if (type === 'stdout' || type === 'stderr') {
        this.callbacks?.onLog(content);
      } else if (type === 'input_request') {
        this.callbacks?.onInput(prompt);
      } else if (type === 'finished') {
        this.callbacks?.onFinished();
      } else if (type === 'error') {
        this.callbacks?.onError(content);
      }
    };
  }

  run(code: string, callbacks: NonNullable<typeof this.callbacks>) {
    this.initWorker();
    this.callbacks = callbacks;
    this.worker?.postMessage({
      type: 'run',
      code,
      sharedBuffer: this.sharedBuffer,
      paramBuffer: this.sharedBuffer
    });
  }

  submitInput(text: string) {
    if (!this.sharedBuffer || !this.int32Buffer || !this.uint8Buffer) return;

    const encoder = new TextEncoder();
    const bytes = encoder.encode(text);

    this.uint8Buffer.fill(0);
    this.uint8Buffer.set(bytes.slice(0, 1024));

    Atomics.store(this.int32Buffer, 0, 1);
    Atomics.notify(this.int32Buffer, 0);
  }
}

export const pyodideController = new PyodideController();

// --- Main Execution Function ---
export const executeCode = async (
  userCode: string,
  language: 'javascript' | 'python' | 'bash' | 'typescript' | 'java' | 'cpp' | 'c' | 'rust' | 'go' | 'ruby' | 'php' | 'swift' | 'kotlin' | 'scala',
  onLog?: (log: string) => void,
  onInputRequest?: (prompt: string) => void,
  stdin?: string
): Promise<ExecutionResult> => {
  const logs: string[] = [];
  const captureLog = (msg: string) => {
    logs.push(msg);
    onLog?.(msg);
  };

  // --- Piston Execution for Supported Languages ---
  if (isPistonLanguageSupported(language)) {
    captureLog(`⚡ Running your code...\n\n`);

    try {
      const result = await executePistonCode(
        language as PistonLanguage,
        userCode,
        stdin,
        {
          onLog: captureLog,
          runTimeout: 5000,
          compileTimeout: 10000,
        }
      );

      if (result.success) {
        captureLog(`\n✨ Done! (${result.executionTime}ms)`);
        return {
          passed: true,
          logs,
          results: [],
        };
      } else {
        captureLog(`\n❌ ${result.error}`);
        return {
          passed: false,
          logs,
          results: [],
          error: result.error,
        };
      }
    } catch (error: any) {
      captureLog(`\n❌ ${error.message}`);
      return {
        passed: false,
        logs,
        results: [],
        error: error.message,
      };
    }
  }

  // --- Python Execution (Pyodide Fallback) ---
  if (language === 'python') {

    // CHECK: Can we use the worker?
    if (window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') {
      // Happy path: Use Worker
      return new Promise((resolve) => {
        pyodideController.run(userCode, {
          onLog: captureLog,
          onInput: (prompt) => {
            if (onInputRequest) {
              onInputRequest(prompt);
            }
          },
          onFinished: () => {
            resolve({ passed: true, logs, results: [] });
          },
          onError: (err) => {
            resolve({ passed: false, logs, results: [], error: err });
          }
        });
      });
    } else {
      // Fallback: Run on main thread (with window.prompt)
      captureLog("⚠️ Running in Legacy Mode (Worker disabled). Input will be via popup.");
      try {
        const py = await loadPyodideMain();
        py.setStdout({ batched: (msg: string) => captureLog(msg) });

        // Input override for main thread
        const jsInput = (text: string) => {
          const result = window.prompt(text || "Input required:");
          return result || "";
        };
        py.globals.set("js_input_main", jsInput);

        await py.runPythonAsync(`
                import builtins
                def input(prompt=""):
                    return js_input_main(prompt)
                builtins.input = input
              `);

        await py.runPythonAsync(userCode);

        return { passed: true, logs, results: [] };
      } catch (err: any) {
        return { passed: false, logs, results: [], error: err.toString() };
      }
    }
  }

  // --- Bash Execution (Simulated) ---
  if (language === 'bash') {
    if (userCode.trim().startsWith("echo")) {
      const output = userCode.replace("echo", "").replace(/"/g, "").replace(/'/g, "").trim();
      captureLog(output);
      return {
        passed: true,
        logs: [output],
        results: []
      };
    }
    return {
      passed: false,
      logs: ["Execution for Bash is currently simulated (try 'echo hello')"],
      results: [],
      error: "Full Bash support requires a backend system."
    };
  }

  // --- JavaScript Execution ---
  const mockConsole = {
    log: (...args: any[]) => {
      const msg = args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ');
      captureLog(msg);
    },
    error: (...args: any[]) => {
      const msg = "Error: " + args.map(a => String(a)).join(' ');
      captureLog(msg);
    }
  };

  const testCases = [
    { input: [1, 2, 3, 4, 5], expected: [5, 4, 3, 2, 1] },
    { input: [1, 2], expected: [2, 1] },
    { input: [], expected: [] }
  ];

  const results: ExecutionResult['results'] = [];
  let allPassed = true;

  try {
    const factory = new Function('ListNode', 'console', `
      ${userCode}
      if (typeof reverseList !== 'function') {
        return null; 
      }
      return reverseList;
    `);

    const userFunction = factory(ListNode, mockConsole);

    if (userFunction) {
      testCases.forEach((tc, index) => {
        const inputList = arrayToList(tc.input);
        try {
          const outputList = userFunction(inputList);
          const outputArray = listToArray(outputList);

          const passed = JSON.stringify(outputArray) === JSON.stringify(tc.expected);
          if (!passed) allPassed = false;

          results.push({
            caseId: index + 1,
            input: JSON.stringify(tc.input),
            expected: JSON.stringify(tc.expected),
            actual: JSON.stringify(outputArray),
            passed
          });
        } catch (err: any) {
          allPassed = false;
          captureLog(`Error in Test Case ${index + 1}: ${err.message}`);
          results.push({
            caseId: index + 1,
            input: JSON.stringify(tc.input),
            expected: JSON.stringify(tc.expected),
            actual: "Error: " + err.message,
            passed: false
          });
        }
      });
    }

  } catch (err: any) {
    return {
      passed: false,
      logs: [...logs, `Runtime Error: ${err.message}`],
      results: [],
      error: err.message
    };
  }

  return {
    passed: allPassed,
    logs,
    results
  };
};
