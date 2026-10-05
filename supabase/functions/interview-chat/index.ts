import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { streamGeminiPipeline, callGeminiPipeline } from "../_shared/gemini-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Extracted logic to build system prompt and contents
function buildInterviewContext(payload: any) {
  const { messages, interviewType, resumeContent } = payload;
  let systemPrompt = ``;
  const systemMsg = (messages || []).find((msg: any) => msg.role === 'system');

  if (systemMsg && systemMsg.content) {
    systemPrompt = systemMsg.content; // Strictly prioritize frontend's detailed instruction (with the 8-10 turn limit & START_CODING)
  } else {
    // Fallback if frontend didn't send a system prompt
    systemPrompt = `You are a world-class Elite Technical Interviewer conducting a live voice interview.
CRITICAL MANDATES:
1. YOUR RESPONSE MUST END WITH A QUESTION MARK (?). You MUST ask exactly ONE interview question per turn.
2. Keep your response to 1-3 sentences. A brief acknowledgment followed by your question.
3. INTERVIEW PROGRESSION:
   - Ask 4-5 conceptual questions.
   - Say "[START_CODING]" and give a coding problem.
4. ENDING: Once the candidate answers the coding question, finish the interview with "[VERDICT:PASS]" or "[VERDICT:FAIL]".
5. NEVER REPEAT A PREVIOUS QUESTION.`;
  }

  const rawFiltered = (messages || []).filter((msg: any) => msg.role !== 'system');
  const geminiContents: any[] = [];

  for (const msg of rawFiltered) {
    const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
    const text = msg.content || msg.text || '';
    if (!text.trim()) continue;

    if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
      geminiContents[geminiContents.length - 1].parts[0].text += `\n${text}`;
    } else {
      geminiContents.push({ role, parts: [{ text }] });
    }
  }

  if (geminiContents.length === 0 || geminiContents[0].role !== 'user') {
    geminiContents.unshift({ role: 'user', parts: [{ text: 'Hello! I am ready to start the interview session.' }] });
  }

  // Only enter strict live coding mandate if specifically designated as a coding assessment round
  const isCodingRound = (
    interviewType === "coding" ||
    interviewType === "round3" ||
    (typeof systemPrompt === 'string' && systemPrompt.includes('[START_CODING]') && !systemPrompt.includes('MANDATORY QUESTION PROGRESSION'))
  ) && interviewType !== "pro_interview" && interviewType !== "behavioral";

  let turnDirective = "";
  if (isCodingRound) {
    turnDirective = `CRITICAL ROUND 3 TECHNICAL CODING MANDATE:
You are a Principal Software Engineer conducting a FAANG-tier Live Technical Assessment.
1. START QUESTION: Ask ONLY for the candidate's algorithmic approach to solve the problem on screen.
2. APPROACH VERIFICATION (50% MATCH IS ENOUGH): When the candidate explains their approach, if it is at least 50% relevant, immediately say: "[APPROACH_VERIFIED] Great approach! The editor is now unlocked — go ahead and code your solution."
3. CODING PHASE: When the candidate is coding, be COMPLETELY SILENT. Do NOT speak, comment, or ask questions.
4. POST-RUN PHASE (AFTER TESTS PASS): Ask: (a) Time Complexity Big-O, (b) Auxiliary Space Complexity, (c) Edge cases, (d) Optimizations.
5. ABSOLUTE PROHIBITION: NEVER ask resume, background, or introductory questions. EVER. Keep responses concise.`;
  } else {
    turnDirective = `CRITICAL THEORETICAL & CONCEPTUAL INTERVIEW MANDATE:
You are conducting a thorough Technical Interview focused on THEORETICAL FOUNDATIONS, ARCHITECTURAL DESIGN, AND ENGINEERING CONCEPTS.
1. STRICTLY ASK THEORETICAL & CONCEPTUAL QUESTIONS:
   - Ask deep conceptual questions testing internal mechanisms (how things work under the hood, memory management, garbage collection, event loops, execution contexts, protocols).
   - Ask architectural and system design questions (distributed systems, database indexing internals, ACID vs BASE, caching strategies, API protocols like REST vs gRPC vs WebSockets).
   - Ask comparative and trade-off analysis questions (e.g. SQL vs NoSQL, process vs thread, synchronization primitives, concurrency models, scaling bottlenecks).
2. ABSOLUTE PROHIBITION:
   - NEVER ask direct coding problems, DSA puzzle problems (e.g., Two Sum, Reverse a Linked List, Palindrome), or ask the candidate to write or type code.
   - Do NOT ask the candidate for algorithmic implementation syntax.
   - This phase is purely verbal and conceptual.
3. STRUCTURE:
   - Ask exactly ONE clear, sharp theoretical question per turn.
   - Maximum 1-2 short sentences (under 35 words).
   - End with a question mark.`;
  }

  const languageMandate = "CRITICAL MANDATE: You MUST communicate, ask questions, and respond ONLY in clear, natural, professional English. NEVER output Japanese, Chinese, or any other language.";
  const fullSystemPrompt = `${languageMandate}\n\n${turnDirective ? '*** MOST IMPORTANT INSTRUCTION: ' + turnDirective + ' ***\n\n' : ''}${systemPrompt}`;

  return { geminiContents, fullSystemPrompt };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  // STEP 2: Handle WebSocket Upgrade
  if (req.headers.get("upgrade") === "websocket") {
    const { socket, response } = Deno.upgradeWebSocket(req);

    socket.onmessage = async (e) => {
      try {
        const payload = JSON.parse(e.data);

        // STEP 5: Pre-warm ping
        if (payload.type === 'ping') {
          socket.send(JSON.stringify({ type: 'pong', status: 'warm' }));
          return;
        }

        const { geminiContents, fullSystemPrompt } = buildInterviewContext(payload);
        const recentContents = geminiContents.slice(-8);

        const geminiRes = await streamGeminiPipeline({
          geminiContents: recentContents,
          systemPrompt: fullSystemPrompt,
          temperature: 0.7,
        });

        if (geminiRes.ok && geminiRes.stream) {
          const reader = geminiRes.stream.getReader();
          const decoder = new TextDecoder("utf-8");
          while (true) {
            const { value, done } = await reader.read();
            if (done) break;
            const chunk = decoder.decode(value, { stream: true });
            socket.send(chunk);
          }
          socket.send("[DONE]");
        } else {
          socket.send(`data: {"candidates": [{"content": {"parts": [{"text": "[DEBUG ERROR: ${geminiRes.errorText || 'Unknown pipeline error'}] Could you tell me about a technical challenge you've solved recently?"}]}}]}\n\n`);
          socket.send("[DONE]");
        }
      } catch (err: any) {
        console.error(err);
        socket.send(JSON.stringify({ error: err.message }));
      }
    };

    return response;
  }

  // STEP 1: Handle HTTP POST (SSE Fallback)
  try {
    const body = await req.json();

    // STEP 5: Pre-warm ping over HTTP
    if (body.type === 'ping') {
      return new Response(JSON.stringify({ status: 'warm' }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const { geminiContents, fullSystemPrompt } = buildInterviewContext(body);
    const recentContents = geminiContents.slice(-8);

    const geminiRes = await callGeminiPipeline({
      geminiContents: recentContents,
      systemPrompt: fullSystemPrompt,
      temperature: 0.7,
    });

    if (geminiRes.ok && geminiRes.aiContent) {
      return new Response(JSON.stringify({
        question: geminiRes.aiContent,
        content: geminiRes.aiContent,
        apiLabel: geminiRes.modelName,
        usageMetadata: geminiRes.usageMetadata
      }), {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      });
    }

    // Emergency Fallback if AI fails completely
    const fallbackText = `[DEBUG ERROR: ${geminiRes.errorText || 'Unknown pipeline error'}] Could you tell me about a technical challenge you've solved recently?`;
    return new Response(JSON.stringify({
      question: fallbackText,
      content: fallbackText
    }), {
      headers: {
        ...corsHeaders,
        "Content-Type": "application/json",
      },
    });

  } catch (err: any) {
    console.error("HTTP handler error:", err);
    return new Response(JSON.stringify({ error: err.message }), { status: 500, headers: corsHeaders });
  }
});
