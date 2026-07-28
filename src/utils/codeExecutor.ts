import { SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY } from '../integrations/supabase/client';

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
  while (current !== null && result.length < 1000) {
    result.push(current.val);
    current = current.next;
  }
  return result;
}

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

      // Temporarily hide AMD define (Monaco) to force Pyodide into global mode
      const oldDefine = (window as any).define;
      (window as any).define = undefined;

      const script = document.createElement('script');
      script.textContent = code;
      document.body.appendChild(script);

      // Restore AMD define immediately after synchronous execution
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


// ─── Pyodide Worker Controller ───────────────────────────────────────────────
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

// ─── JDoodle Executor (Java, C, C++ via Supabase Edge Function) ──────────────
const JDOODLE_LANGUAGES = ['java', 'c', 'cpp'];

const executeViaJDoodle = async (
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

  const cpuTime = result?.cpuTime ? `\n✨ Done! CPU: ${result.cpuTime}s` : '\n✨ Done!';
  onLog(cpuTime);

  return {
    passed: !stderr && result?.run?.code === 0,
    logs: [output],
    results: [],
    error: stderr || undefined,
  };
};

// ─── Main Execution Function ─────────────────────────────────────────────────
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

  // ── Java / C / C++ → JDoodle via Supabase Edge Function ──
  if (JDOODLE_LANGUAGES.includes(language)) {
    return executeViaJDoodle(language, userCode, stdin ?? '', captureLog);
  }

  // ── Python → Pyodide (browser WebAssembly) ──────────────
  if (language === 'python') {
    // Happy path: Use Worker with SharedArrayBuffer (supports real input())
    if (window.crossOriginIsolated && typeof SharedArrayBuffer !== 'undefined') {
      return new Promise((resolve) => {
        pyodideController.run(userCode, {
          onLog: captureLog,
          onInput: (prompt) => { onInputRequest?.(prompt); },
          onFinished: () => resolve({ passed: true, logs, results: [] }),
          onError: (err) => resolve({ passed: false, logs, results: [], error: err }),
        });
      });
    } else {
      // Fallback: Main thread (input via window.prompt)
      captureLog("⚡ Running Python...\n");
      try {
        const py = await loadPyodideMain();
        py.setStdout({ batched: (msg: string) => captureLog(msg) });
        py.setStderr({ batched: (msg: string) => captureLog(`[stderr] ${msg}`) });

        const jsInput = (text: string) => {
          return window.prompt(text || "Input:") || "";
        };
        py.globals.set("js_input_main", jsInput);

        await py.runPythonAsync(`
import builtins
def input(prompt=""):
    return js_input_main(prompt)
builtins.input = input
        `);

        await py.runPythonAsync(userCode);
        captureLog('\n✨ Done!');
        return { passed: true, logs, results: [] };
      } catch (err: any) {
        const errMsg = err?.toString() ?? 'Unknown Python error';
        captureLog(`\n❌ ${errMsg}`);
        return { passed: false, logs, results: [], error: errMsg };
      }
    }
  }

  // ── Bash (simulated) ────────────────────────────────────
  if (language === 'bash') {
    if (userCode.trim().startsWith("echo")) {
      const output = userCode.replace("echo", "").replace(/"/g, "").replace(/'/g, "").trim();
      captureLog(output);
      return { passed: true, logs: [output], results: [] };
    }
    return {
      passed: false,
      logs: ["Bash execution is simulated (try 'echo hello')"],
      results: [],
      error: "Full Bash support requires a backend.",
    };
  }

  // ── JavaScript / TypeScript → Browser native ────────────
  captureLog("⚡ Running JavaScript...\n");

  const mockConsole = {
    log: (...args: any[]) => {
      captureLog(args.map(a => typeof a === 'object' ? JSON.stringify(a, null, 2) : String(a)).join(' '));
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

  try {
    // Try to detect if user defined a main function or it's a script
    const wrappedCode = `
      (function() {
        ${userCode}
      })();
    `;
    // eslint-disable-next-line no-new-func
    const fn = new Function('console', wrappedCode);
    fn(mockConsole);
    captureLog('\n✨ Done!');
    return { passed: true, logs, results: [] };
  } catch (err: any) {
    const errMsg = err?.message ?? 'Runtime error';
    captureLog(`\n❌ ${errMsg}`);
    return { passed: false, logs, results: [], error: errMsg };
  }
};
