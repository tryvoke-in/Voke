import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { callGeminiPipeline } from "../_shared/gemini-pipeline.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { messages, interviewType, resumeContent } = await req.json();

    let systemPrompt = `You are a world-class Elite Technical Interviewer conducting a live voice interview.

CRITICAL MANDATES:
1. YOUR RESPONSE MUST END WITH A QUESTION MARK (?). You MUST ask exactly ONE interview question per turn.
2. Keep your response to 1-3 sentences. A brief acknowledgment followed by your question.
3. NO FLUFF: NEVER say "Congratulations", "That's awesome", "Great job". Move directly to the question.
4. SINGLE FOCUSED QUESTION: Ask one specific, clear technical question. Never ask compound questions.`;

    if (interviewType === "technical") {
      systemPrompt += "\n\nFocus on technical skills: data structures, algorithms, system design, and programming concepts.";
    } else if (interviewType === "behavioral") {
      systemPrompt += "\n\nFocus on behavioral questions using the STAR method (Situation, Task, Action, Result).";
    } else if ((interviewType === "resume" || interviewType === "round1" || interviewType === "screening") && resumeContent) {
      systemPrompt += `\n\nCRITICAL ROUND 1 / RESUME & GITHUB MANDATE:
The candidate's resume and GitHub profile context:
${resumeContent}

STRICT QUESTIONING INSTRUCTION:
- YOU MUST EXTRACT AND NAME SPECIFIC PROJECT NAMES, REPOSITORY NAMES, AND TECH STACK ITEMS DIRECTLY FROM THE CANDIDATE CONTEXT ABOVE.
- ABSOLUTELY FORBIDDEN PHRASES (NEVER USE):
  ❌ "your resume project"
  ❌ "that project"
  ❌ "your primary project"
  ❌ "a project on your resume"
- ALWAYS REPLACE THOSE WITH THE ACTUAL REAL PROJECT NAME: (e.g. HirePath, CodeCompass, Truthlens, Prodex).
- EXAMPLE CORRECT QUESTION: "In your project HirePath, what was the most challenging technical bottleneck you encountered and how did you resolve it?"`;
    }

    // Extract system prompt if passed in messages
    const systemMsg = (messages || []).find((msg: any) => msg.role === 'system');
    if (systemMsg && systemMsg.content) {
      systemPrompt = systemMsg.content;
    }

    // Sanitize conversation history for Gemini API: remove system, alternate user/model, merge adjacent same-role
    const rawFiltered = (messages || []).filter((msg: any) => msg.role !== 'system');

    const conversationMessages = rawFiltered.map((msg: any) => ({
      role: msg.role === 'assistant' || msg.role === 'model' ? 'assistant' : 'user',
      content: msg.content || msg.text || ''
    }));

    const geminiContents: any[] = [];

    for (const msg of rawFiltered) {
      const role = msg.role === 'assistant' || msg.role === 'model' ? 'model' : 'user';
      const text = msg.content || msg.text || '';
      if (!text.trim()) continue;

      if (geminiContents.length > 0 && geminiContents[geminiContents.length - 1].role === role) {
        geminiContents[geminiContents.length - 1].parts[0].text += `\n${text}`;
      } else {
        geminiContents.push({
          role,
          parts: [{ text }]
        });
      }
    }


    // Ensure conversation starts with user turn (Gemini requirement)
    if (geminiContents.length === 0 || geminiContents[0].role !== 'user') {
      geminiContents.unshift({
        role: 'user',
        parts: [{ text: 'Hello! I am ready to start the interview session.' }]
      });
    }

    // Collect all previous assistant questions to prevent any duplicate questions
    const previousAssistantQuestions = conversationMessages
      .filter((m: any) => m.role === 'assistant')
      .map((m: any) => (m.content || '').trim().toLowerCase())
      .filter(Boolean);

    const assistantTurnCount = conversationMessages.filter((m: any) => m.role === 'assistant').length;

    const isCodingRound = /round\s*3|coding|live\s*coding|assessment|two\s*sum|longest\s*substring|algorithm|debugging|system\s*design|approach\s*phase/i.test(systemPrompt) || interviewType === "coding" || interviewType === "round3";
    const isProjectRound = (/round\s*2|project\s*deep\s*dive/i.test(systemPrompt) || interviewType === "project" || interviewType === "round2") && !isCodingRound;
    const isRound1 = (interviewType === "round1" || interviewType === "resume" || interviewType === "screening" || /round\s*1/i.test(systemPrompt)) && !isCodingRound && !isProjectRound;

    // Inject explicit Turn Directive based on the exact Interview Round
    let turnDirective = "";
    if (isCodingRound) {
      turnDirective = `CRITICAL ROUND 3 TECHNICAL CODING MANDATE:
You are a Principal Software Engineer conducting a FAANG-tier Live Technical Assessment. Structure your questioning dynamically:
1. APPROACH PHASE: When candidate explains their approach (spoken or written), check if it is relevant to the problem. If it is relevant, say: "[APPROACH_VERIFIED] Great approach! The editor is now unlocked — go ahead and code your solution."
2. CODING PHASE: When candidate is coding, be COMPLETELY SILENT. Do NOT ask any questions.
3. POST-RUN PHASE (AFTER TESTS PASS): Ask: (a) Time Complexity Big-O, (b) Auxiliary Space Complexity, (c) Edge cases that could break the code, (d) Further optimizations.
4. NEVER ask resume, college, education, degree, background, or introductory questions. EVER. Keep responses concise (1-2 sentences max).`;
    } else if (isProjectRound) {
      turnDirective = "CRITICAL ROUND 2 PROJECT DEEP DIVE MANDATE: You are conducting the Project Deep Dive. ONLY ask questions about project architecture, technical bottlenecks, scalability, and code structure. NEVER ask generic introductory screening questions!";
    } else if (isRound1) {
      if (assistantTurnCount === 1) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 2 OF 10 - EDUCATION FOCUS): Ask about candidate's relevant academic coursework or degree in CS/Web Development. DO NOT ask about projects yet!";
      } else if (assistantTurnCount === 2) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 3 OF 10 - CORE RESUME SKILLS): Ask about candidate's CORE TECHNICAL SKILLS listed on their resume (e.g. React, JavaScript, HTML/CSS). Ask which skill or framework they feel most proficient in!";
      } else if (assistantTurnCount === 3) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 4 OF 10 - PRACTICAL SKILL APPLICATION): Ask about how they learned or applied those specific resume skills in their practical coursework or initial study projects!";
      } else if (assistantTurnCount === 4) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 5 OF 10 - PROJECT QUESTION 1 OF 2): Ask a targeted technical question about candidate's FIRST project BY NAME (e.g. HirePath, CodeCompass, or their main repo). Ask about UI component architecture or state management!";
      } else if (assistantTurnCount === 5) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 6 OF 10 - PROJECT QUESTION 2 OF 2): Ask a targeted technical question about candidate's SECOND project BY NAME (e.g. Prodex or Truthlens). Ask about API integration, error handling, or performance optimization!";
      } else if (assistantTurnCount === 6) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 7 OF 10 - TOOLS & WORKFLOW): Ask about DEVELOPMENT TOOLS, version control (Git), build tools (Vite/Webpack), or testing utilities listed on their resume!";
      } else if (assistantTurnCount === 7) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 8 OF 10 - ROLE MOTIVATION): Ask why their background and resume skills make them excited to apply for this specific frontend engineering position!";
      } else if (assistantTurnCount === 8) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 9 OF 10 - SKILL GROWTH): Ask what new web technologies, performance concepts, or frameworks they are currently learning to expand their resume!";
      } else if (assistantTurnCount >= 9) {
        turnDirective = "CURRENT TURN DIRECTIVE (TURN 10 OF 10 - OUTRO): Ask a brief wrap-up question on their long-term technical career goals, then speak a warm closing goodbye thanking them for their time!";
      }
    }

    // Build focused system prompt with English mandate and turn directive
    const languageMandate = "CRITICAL MANDATE: You MUST communicate, ask questions, and respond ONLY in clear, natural, professional English. NEVER output Japanese, Chinese, or any other language.";
    const fullSystemPrompt = `${languageMandate}\n\n${turnDirective ? '*** MOST IMPORTANT INSTRUCTION: ' + turnDirective + ' ***\n\n' : ''}${systemPrompt}${previousAssistantQuestions.length > 0 ? '\n\nNO-REPEAT RULE: You have already asked these questions. DO NOT repeat them:\n' + previousAssistantQuestions.map(q => `- "${q}"`).join('\n') : ''}`;

    let content = "";

    // STEP 1: Primary - Gemini 3.1 Flash Lite via Gemini Pipeline (with automatic failover to 2nd Gemini API key on rate limits)
    console.log(`Executing Step 1: Gemini 3.1 Flash Lite for Question Generation (Turn ${assistantTurnCount + 1})...`);
    const recentContents = geminiContents.slice(-8);
    if (recentContents.length === 0 || recentContents[0].role !== 'user') {
      recentContents.unshift({ role: 'user', parts: [{ text: 'Continuing interview...' }] });
    }

    const geminiRes = await callGeminiPipeline({
      modelName: "gemini-3.1-flash-lite",
      geminiContents: recentContents,
      systemPrompt: fullSystemPrompt,
      temperature: 0.7,
    });

    if (geminiRes.ok && geminiRes.aiContent) {
      content = geminiRes.aiContent.trim();
      console.log(`✓ Gemini 3.1 Flash Lite generated question (Turn ${assistantTurnCount + 1}):`, content);
    }

    // STRICT REPETITION CHECK & RETRY FAILSAFE (only if we got content)
    if (content && previousAssistantQuestions.some(prevQ => 
      prevQ === content.toLowerCase() || 
      (prevQ.length > 15 && (prevQ.includes(content.toLowerCase()) || content.toLowerCase().includes(prevQ))) ||
      (prevQ.length > 25 && prevQ.slice(0, 30) === content.toLowerCase().slice(0, 30))
    )) {
      console.warn(`[Anti-Repetition Alert] Question "${content}" was repeated! Retrying...`);
      const retryRes = await callGeminiPipeline({
        modelName: "gemini-2.0-flash-lite",
        geminiContents: recentContents,
        systemPrompt: fullSystemPrompt + `\n\nCRITICAL OVERRIDE: The question "${content}" WAS ALREADY ASKED. YOU MUST ASK A COMPLETELY DIFFERENT QUESTION MATCHING THE ROUND DIRECTIVE!`,
        temperature: 0.85,
      });

      if (retryRes.ok && retryRes.aiContent) {
        content = retryRes.aiContent.trim();
        console.log("✓ Retry success with fresh question:", content);
      } else {
        // Clear the duplicate content so fallbacks can generate fresh one
        content = "";
      }
    }

    // LOVABLE GATEWAY FALLBACK: Only if Gemini produced no content at all
    if (!content) {
      console.warn("Gemini pipeline produced no content. Trying Lovable Gateway fallback...");
      const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
      if (LOVABLE_API_KEY) {
        try {
          const response = await fetch(
            "https://ai.gateway.lovable.dev/v1/chat/completions",
            {
              method: "POST",
              headers: {
                Authorization: `Bearer ${LOVABLE_API_KEY}`,
                "Content-Type": "application/json",
              },
              body: JSON.stringify({
                model: "google/gemini-2.5-flash",
                messages: [
                  { role: "system", content: fullSystemPrompt },
                  ...conversationMessages,
                ],
                stream: false,
              }),
            }
          );
          if (response.ok) {
            const data = await response.json();
            const lovableContent = data.choices?.[0]?.message?.content ?? "";
            if (lovableContent.trim()) {
              content = lovableContent.trim();
              console.log("✓ Lovable Gateway generated question:", content);
            }
          }
        } catch (lErr) {
          console.warn("Lovable gateway error:", lErr);
        }
      }
    }

    // EMERGENCY TURN-BASED FALLBACK: Only if ALL AI engines failed
    if (!content) {
      console.error("⚠️ ALL AI engines failed! Using emergency round-specific question.");
      const turnCount = conversationMessages.filter((m: any) => m.role === "assistant").length;

      if (isCodingRound) {
        const codingEmergency: Record<number, string> = {
          0: "Take a look at the coding challenge on your left. Talk me through your algorithmic approach before you write code.",
          1: "What time and space complexity are you aiming for with this data structure?",
          2: "How will your solution handle key edge cases like empty inputs, single elements, or duplicates?",
          3: "Let's optimize this further. Can we eliminate redundant checks or reduce space overhead?",
          4: "Now let's switch to Section B for debugging. Walk me through where the root failure occurs."
        };
        content = codingEmergency[Math.min(turnCount, 4)] || "How would you optimize the time complexity of your solution?";
      } else if (isProjectRound) {
        const projectEmergency: Record<number, string> = {
          0: "Walk me through the high-level architecture and component flow of your main project.",
          1: "What was the most difficult technical bottleneck you solved in that project?",
          2: "How did you manage state, concurrency, and error handling across your application?",
          3: "If your user traffic scaled 100x overnight, what parts of your system would break first?"
        };
        content = projectEmergency[Math.min(turnCount, 3)] || "What architectural trade-offs did you make in your project?";
      } else {
        const emergencyQuestions: Record<number, string> = {
          0: "Welcome! Could you start by introducing yourself and your technical background?",
          1: "What specific academic coursework or modules have shaped your skills as a developer?",
          2: "Which programming languages or frameworks listed on your resume are you most confident with?",
          3: "Can you walk me through how you've applied those skills in a real coding project?",
          4: "Tell me about the technical architecture behind your first project. What were the key engineering decisions?",
          5: "In your second project, what was the most challenging technical problem you solved?",
          6: "What development tools and workflow practices do you use for version control and testing?",
          7: "What excites you most about this role and how does it align with your career goals?",
          8: "What new technologies or concepts are you currently learning to grow as an engineer?",
          9: "Thank you for a great conversation! Where do you see your engineering career heading next?"
        };
        content = emergencyQuestions[Math.min(turnCount, 9)] || "Could you tell me about a technical challenge you've solved recently?";
      }
    }

    const apiLabel = geminiRes?.providerInfo?.apiLabel || "(primary 3.1)";
    return new Response(
      JSON.stringify({ 
        question: content, 
        content,
        apiLabel,
        providerInfo: geminiRes?.providerInfo 
      }),
      {
        headers: {
          ...corsHeaders,
          "Content-Type": "application/json",
        },
      }
    );
  } catch (error: any) {
    console.error("Error in interview-chat function:", error?.message, error?.stack);
    return new Response(
      JSON.stringify({ 
        question: "Walk me through your algorithmic approach and time complexity for this problem.", 
        content: "Walk me through your algorithmic approach and time complexity for this problem."
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
