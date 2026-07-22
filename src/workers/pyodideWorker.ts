/* eslint-disable no-restricted-globals */

// Define the worker context
const ctx: Worker = self as any;

let pyodide: any = null;

// Load Pyodide script
importScripts("https://cdn.jsdelivr.net/pyodide/v0.26.1/full/pyodide.js");

async function loadPyodideAndPackages() {
    if (!pyodide) {
        // @ts-ignore
        pyodide = await loadPyodide({
            indexURL: "https://cdn.jsdelivr.net/pyodide/v0.26.1/full/",
        });
        // Set standard stdout/stderr
        pyodide.setStdout({
            batched: (msg: string) => {
                ctx.postMessage({ type: 'stdout', content: msg });
            }
        });
        pyodide.setStderr({
            batched: (msg: string) => {
                ctx.postMessage({ type: 'stderr', content: msg });
            }
        });
    }
}

// Input handler using SharedArrayBuffer and Atomics
function pythonInputHandler(promptText: string, sharedBuffer: Int32Array, paramBuffer: Uint8Array) {
    // 1. Notify main thread to show input prompt
    ctx.postMessage({ type: 'input_request', prompt: promptText });

    // 2. Wait for main thread to write data and notify us
    // index 0 of sharedBuffer is the status flag: 0 = waiting, 1 = have data
    Atomics.store(sharedBuffer, 0, 0);
    Atomics.wait(sharedBuffer, 0, 0);

    // 3. Read data from paramBuffer
    // We assume the main thread wrote the string as UTF-8 bytes into paramBuffer
    // converting null-terminated bytes back to string
    const decoder = new TextDecoder();
    // Find null terminator or end of buffer
    let end = 0;
    while (end < paramBuffer.length && paramBuffer[end] !== 0) {
        end++;
    }
    const inputString = decoder.decode(paramBuffer.slice(0, end));
    return inputString;
}

ctx.onmessage = async (event: MessageEvent) => {
    const { type, code, sharedBuffer, paramBuffer } = event.data;

    if (type === 'run') {
        try {
            if (!pyodide) {
                await loadPyodideAndPackages();
            }

            // Configure input handler dynamically for this run
            if (sharedBuffer && paramBuffer) {
                const int32Buffer = new Int32Array(sharedBuffer);
                const uint8Buffer = new Uint8Array(paramBuffer);

                // Register custom input function
                const jsInput = (prompt: string) => {
                    return pythonInputHandler(prompt, int32Buffer, uint8Buffer);
                };
                pyodide.globals.set("js_input_worker", jsInput);

                // Override Python's input
                await pyodide.runPythonAsync(`
            import builtins
            def input(prompt=""):
                return js_input_worker(prompt)
            builtins.input = input
          `);
            }

            await pyodide.runPythonAsync(code);
            ctx.postMessage({ type: 'finished' });
        } catch (error: any) {
            ctx.postMessage({ type: 'error', content: error.message });
        }
    }
};
