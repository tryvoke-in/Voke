import React, { useEffect, useRef, useState } from 'react';
import { useGroqVoice } from '@/hooks/useGroqVoice';
import { AudioVisualizer } from '@/components/AudioVisualizer';
import { LiveStatus } from '@/types/voice';
import { CompanyItem, RoleItem, InterviewRoundDef, InterviewTypeItem } from '@/data/eliteInterviewData';
import { updateRoundResult } from '@/utils/eliteInterviewStorage';
import {
  Mic, MicOff, Video, VideoOff, PhoneOff, CheckCircle2, XCircle,
  Sparkles, HelpCircle, ShieldCheck, ChevronRight, User, Award, Clock,
  Volume2, Maximize2, Zap, Radio, MessageSquare, FileText, Subtitles
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { toast } from 'sonner';
import ReactConfetti from 'react-confetti';

interface EliteVoiceRoomProps {
  interviewType: InterviewTypeItem;
  company: CompanyItem;
  role: RoleItem;
  round: InterviewRoundDef;
  candidateProfileContext?: string;
  onCompleteRound: (verdict: 'PASSED' | 'FAILED') => void;
  onExit: () => void;
}

export const EliteVoiceRoom: React.FC<EliteVoiceRoomProps> = ({
  interviewType,
  company,
  role,
  round,
  candidateProfileContext,
  onCompleteRound,
  onExit
}) => {
  const {
    status,
    connect,
    disconnect,
    isUserSpeaking,
    isAiSpeaking,
    volume,
    logs
  } = useGroqVoice();

  // Video & Audio state
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isMicEnabled, setIsMicEnabled] = useState(true);
  const [showTranscription, setShowTranscription] = useState(true);
  const [stream, setStream] = useState<MediaStream | null>(null);

  // Timer & Question Counter
  const [duration, setDuration] = useState(0);
  const [currentQuestionNumber, setCurrentQuestionNumber] = useState(1);
  const totalQuestions = round.questionCount || 9;

  // Verdict state
  const [showVerdictOverlay, setShowVerdictOverlay] = useState(false);
  const [verdict, setVerdict] = useState<'PASSED' | 'FAILED' | null>(null);
  const [verdictReason, setVerdictReason] = useState<string>('');
  const [verdictScore, setVerdictScore] = useState<number>(85);
  const [isEnding, setIsEnding] = useState(false);

  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll transcription logs
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [logs]);

  // Start Camera
  const startCamera = async () => {
    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: "user" },
        audio: true
      });
      setStream(mediaStream);
      setIsVideoEnabled(true);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }
    } catch (err) {
      console.error("Error accessing camera/mic:", err);
      toast.error("Camera and microphone permissions required.");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(t => t.stop());
      setStream(null);
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
  };

  const toggleVideo = () => {
    if (stream) {
      stream.getVideoTracks().forEach(t => t.enabled = !t.enabled);
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const toggleMic = () => {
    if (stream) {
      stream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      setIsMicEnabled(!isMicEnabled);
    }
  };

  // Start Session on Mount
  useEffect(() => {
    startCamera();
    initiateSession();

    return () => {
      stopCamera();
      disconnect();
    };
  }, []);

  // Timer
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (status === LiveStatus.CONNECTED) {
      interval = setInterval(() => setDuration(d => d + 1), 1000);
    }
    return () => clearInterval(interval);
  }, [status]);

  // Track question count (assistant turns count as questions)
  useEffect(() => {
    const assistantTurns = logs.filter(l => l.role === 'assistant');
    if (assistantTurns.length > 0) {
      const qNum = Math.min(assistantTurns.length, totalQuestions);
      setCurrentQuestionNumber(qNum);
    }
  }, [logs, totalQuestions]);

  // Listen for AI verdict tokens
  useEffect(() => {
    if (logs.length > 0) {
      const lastMsg = logs[logs.length - 1];
      if (lastMsg.role === 'assistant') {
        if (lastMsg.text.includes('[VERDICT: PASSED]') || lastMsg.text.includes('[VERDICT: SELECTED]')) {
          const reasonMatch = lastMsg.text.match(/\[REASON:(.*?)\]/);
          handleTriggerVerdict('PASSED', reasonMatch ? reasonMatch[1].trim() : 'Exceeded evaluation criteria.');
        } else if (lastMsg.text.includes('[VERDICT: FAILED]') || lastMsg.text.includes('[VERDICT: NOT_SELECTED]')) {
          const reasonMatch = lastMsg.text.match(/\[REASON:(.*?)\]/);
          handleTriggerVerdict('FAILED', reasonMatch ? reasonMatch[1].trim() : 'Did not clear company benchmark standard.');
        }
      }
    }
  }, [logs]);

  const initiateSession = () => {
    const systemPrompt = `
ROLE: You are an Elite Technical Interviewer at ${company.name} conducting a pure voice/video interview.
CATEGORY: ${interviewType.title}
TARGET ROLE: ${role.title}
CURRENT ROUND: ${round.title} (Round ${round.roundNumber} of 4)
FOCUS AREAS: ${round.focusAreas.join(', ')}

=== STRICT INTERVIEW INSTRUCTIONS ===
1. PURE VOICE INTERVIEW:
   - This interview is 100% voice and video based.
   - Keep spoken questions concise, clear, and direct (1-2 sentences).

2. QUESTION COUNT:
   - You MUST conduct an interview consisting of EXACTLY ${totalQuestions} sequential questions.
   - Ask Question 1 first. Listen to candidate answer via voice, then ask Question 2, up to Question ${totalQuestions}.

3. ZERO TEXT FEEDBACK DURING INTERVIEW:
   - Do NOT give feedback like "Good answer", "Great", or "Correct".
   - Simply ask the next question or brief follow-up neutrally.

4. FINAL VERDICT:
   - After Question ${totalQuestions} is answered, output EXACTLY one of these verdict tokens:
     - [VERDICT: PASSED] [REASON: Concise pass explanation]
     - [VERDICT: FAILED] [REASON: Concise fail explanation]
    `;

    connect(systemPrompt);
  };

  const handleTriggerVerdict = (result: 'PASSED' | 'FAILED', reason?: string) => {
    disconnect();
    stopCamera();

    const isPass = result === 'PASSED';
    const finalReason = reason || (isPass ? `Strong performance for ${role.title} at ${company.name}.` : `Needs improvement to clear ${company.name} benchmark.`);
    const score = isPass ? Math.floor(Math.random() * 15) + 85 : Math.floor(Math.random() * 20) + 40;

    setVerdict(result);
    setVerdictReason(finalReason);
    setVerdictScore(score);
    setShowVerdictOverlay(true);

    // Save progress
    updateRoundResult(interviewType.id, company.id, role.id, round.roundNumber, result, finalReason, score);
  };

  const handleManualEndSession = () => {
    setIsEnding(true);
    const userMsgCount = logs.filter(l => l.role === 'user').length;
    const passed = userMsgCount >= Math.floor(totalQuestions * 0.6);
    handleTriggerVerdict(passed ? 'PASSED' : 'FAILED', passed ? 'Completed round session satisfactorily.' : 'Interview ended early before evaluation bar was satisfied.');
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="h-screen w-screen bg-[#050508] text-white flex flex-col overflow-hidden font-sans relative select-none">
      {verdict === 'PASSED' && <ReactConfetti width={window.innerWidth} height={window.innerHeight} style={{ zIndex: 100 }} />}

      {/* TOP FLOATING HUD BAR */}
      <header className="h-16 border-b border-white/10 bg-zinc-950/80 backdrop-blur-2xl px-6 flex items-center justify-between z-20 shrink-0 shadow-2xl">
        {/* Left: Company & Role Details */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-white p-1.5 shadow-lg flex items-center justify-center overflow-hidden shrink-0 border border-gray-200">
            <img
              src={company.logo}
              alt={company.name}
              onError={(e) => {
                e.currentTarget.src = `https://ui-avatars.com/api/?name=${encodeURIComponent(company.name)}&background=18181b&color=fff&size=64`;
              }}
              className="w-full h-full object-contain"
            />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-base text-white tracking-wide">{company.name}</span>
              <span className="text-zinc-600">•</span>
              <span className="text-xs font-bold text-violet-400">{role.title}</span>
              <Badge variant="outline" className="border-amber-500/30 bg-amber-500/10 text-amber-300 text-[10px] py-0.5 font-semibold">
                {interviewType.title}
              </Badge>
            </div>
            <div className="text-[11px] text-zinc-400 font-mono">
              {round.title}
            </div>
          </div>
        </div>

        {/* Center: 9-Step Progress Nodes HUD */}
        <div className="hidden md:flex items-center gap-3 bg-zinc-900/90 border border-white/15 px-5 py-2 rounded-2xl shadow-xl">
          <div className="flex items-center gap-2 mr-2">
            <HelpCircle className="w-4 h-4 text-amber-400" />
            <span className="text-xs font-extrabold text-white">Q{currentQuestionNumber} of {totalQuestions}</span>
          </div>

          {/* Node Indicators */}
          <div className="flex items-center gap-1.5">
            {Array.from({ length: totalQuestions }).map((_, i) => {
              const qIndex = i + 1;
              const isDone = qIndex < currentQuestionNumber;
              const isCurrent = qIndex === currentQuestionNumber;

              return (
                <div
                  key={i}
                  className={`h-2 rounded-full transition-all duration-500 ${
                    isDone
                      ? 'w-4 bg-emerald-400 shadow-md shadow-emerald-400/50'
                      : isCurrent
                      ? 'w-7 bg-amber-400 animate-pulse shadow-lg shadow-amber-400/60'
                      : 'w-2 bg-zinc-800'
                  }`}
                />
              );
            })}
          </div>
        </div>

        {/* Right: Live Timer & End Call */}
        <div className="flex items-center gap-3">
          {status === LiveStatus.CONNECTED && (
            <div className="flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-red-500/10 border border-red-500/30 text-red-400 text-xs font-mono font-extrabold">
              <span className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
              <span>{formatTime(duration)}</span>
            </div>
          )}

          <Button
            variant="destructive"
            size="sm"
            onClick={handleManualEndSession}
            disabled={isEnding}
            className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-xl text-xs px-4 h-9 shadow-lg shadow-red-600/20"
          >
            <PhoneOff className="w-3.5 h-3.5 mr-1.5" /> End Interview
          </Button>
        </div>
      </header>

      {/* MAIN DUAL STAGE WORKSPACE */}
      <main className="flex-1 p-4 md:p-6 flex flex-col md:flex-row gap-4 md:gap-6 min-h-0 bg-[#050508] relative overflow-hidden">
        
        {/* LEFT AREA: AI ORB STAGE WITH CONTROL NAVBAR SLIGHTLY SHIFTED RIGHT */}
        <div className="flex-1 flex flex-col relative min-h-0 h-full">
          
          {/* AI INTERVIEWER STAGE CARD */}
          <div className="flex-1 relative rounded-3xl bg-zinc-950 border border-white/15 overflow-hidden shadow-2xl flex flex-col items-center justify-center p-6 group h-full">
            {/* Ambient Radial Glow */}
            <div className="absolute inset-0 bg-gradient-to-b from-violet-950/30 via-zinc-950 to-zinc-950 pointer-events-none" />

            {/* AI Sphere Visualizer */}
            <div className="relative z-10 w-48 h-48 md:w-64 md:h-64 flex items-center justify-center my-auto">
              <AudioVisualizer
                isUserSpeaking={isUserSpeaking}
                isAiSpeaking={isAiSpeaking}
                volume={volume}
              />
            </div>

            {/* AI Badge Overlay (Top-Left) */}
            <div className="absolute top-5 left-5 z-20 flex items-center gap-2.5 px-3.5 py-2 rounded-2xl bg-zinc-900/90 backdrop-blur-md border border-white/15 shadow-xl">
              <div className="w-7 h-7 rounded-xl bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-amber-400 shrink-0">
                <Sparkles className="w-4 h-4" />
              </div>
              <div>
                <div className="text-xs font-extrabold text-white">{company.name} AI Technical Lead</div>
                <div className="text-[10px] text-zinc-400 font-mono">Interviewer</div>
              </div>
            </div>

            {/* ENLARGED CANDIDATE WEBCAM PIP BOX (TOP-RIGHT CORNER INSIDE AI BOX) */}
            <div className="absolute top-5 right-5 z-20 w-64 md:w-76 lg:w-84 aspect-video rounded-2xl bg-zinc-900 border-2 border-white/20 overflow-hidden shadow-2xl ring-1 ring-white/10 group/pip">
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className={`w-full h-full object-cover transform scale-x-[-1] transition-opacity duration-300 ${isVideoEnabled ? 'opacity-100' : 'opacity-0'}`}
              />

              {!isVideoEnabled && (
                <div className="absolute inset-0 flex flex-col items-center justify-center bg-zinc-900 text-zinc-500 text-xs font-semibold">
                  <VideoOff className="w-6 h-6 mb-1 text-zinc-600" />
                  <span>Camera Off</span>
                </div>
              )}

              <div className="absolute bottom-2 left-2 px-2.5 py-1 rounded-lg bg-black/80 backdrop-blur-md text-[11px] font-extrabold text-white flex items-center gap-1.5 shadow-md">
                <span className={`w-2 h-2 rounded-full ${isUserSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-zinc-400'}`} />
                <span>You (Candidate)</span>
              </div>
            </div>

            {/* Real-time Status Pill (Bottom-Left INSIDE AI BOX) */}
            <div className="absolute bottom-5 left-5 z-20 hidden lg:block">
              <div className={`inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider border backdrop-blur-md shadow-lg ${
                isAiSpeaking
                  ? 'bg-amber-500/20 border-amber-500/40 text-amber-300 shadow-amber-500/10'
                  : isUserSpeaking
                  ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 shadow-emerald-500/10'
                  : 'bg-zinc-900/90 border-white/10 text-zinc-400'
              }`}>
                <span className={`w-2 h-2 rounded-full ${isAiSpeaking ? 'bg-amber-400 animate-ping' : isUserSpeaking ? 'bg-emerald-400 animate-ping' : 'bg-zinc-500'}`} />
                {isAiSpeaking ? "AI Speaking..." : isUserSpeaking ? "Listening to Candidate..." : "Voice Connected"}
              </div>
            </div>

            {/* CONTROL NAVBAR INSIDE AI BOX POSITIONED SLIGHTLY TO THE RIGHT */}
            <div className="absolute bottom-5 left-1/2 sm:left-[55%] md:left-[58%] -translate-x-1/2 z-30 flex items-center gap-4 px-6 py-3 rounded-full bg-zinc-900/95 backdrop-blur-2xl border border-white/20 shadow-2xl ring-1 ring-white/10 pointer-events-auto">
              {/* Mic Toggle */}
              <button
                onClick={toggleMic}
                className={`p-3.5 rounded-full transition-all duration-300 ${
                  isMicEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white shadow-md'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isMicEnabled ? "Mute Microphone" : "Unmute Microphone"}
              >
                {isMicEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5 text-red-400" />}
              </button>

              {/* Camera Toggle */}
              <button
                onClick={toggleVideo}
                className={`p-3.5 rounded-full transition-all duration-300 ${
                  isVideoEnabled
                    ? 'bg-zinc-800 hover:bg-zinc-700 text-white shadow-md'
                    : 'bg-red-500/20 text-red-400 border border-red-500/40'
                }`}
                title={isVideoEnabled ? "Turn Off Camera" : "Turn On Camera"}
              >
                {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5 text-red-400" />}
              </button>

              {/* Subtitles / Transcription Toggle */}
              <button
                onClick={() => setShowTranscription(!showTranscription)}
                className={`p-3.5 rounded-full transition-all duration-300 ${
                  showTranscription
                    ? 'bg-amber-500/20 border border-amber-500/40 text-amber-300 shadow-md'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-zinc-400'
                }`}
                title="Toggle Live Speech Transcription Panel"
              >
                <Subtitles className="w-5 h-5" />
              </button>

              <div className="w-px h-6 bg-white/15" />

              {/* End Call Button */}
              <Button
                variant="destructive"
                size="sm"
                onClick={handleManualEndSession}
                disabled={isEnding}
                className="bg-gradient-to-r from-red-600 to-rose-600 hover:from-red-500 hover:to-rose-500 text-white font-extrabold rounded-full px-5 h-11 text-xs shadow-lg shadow-red-600/30"
              >
                <PhoneOff className="w-4 h-4 mr-2" /> End Interview
              </Button>
            </div>
          </div>
        </div>

        {/* RIGHT AREA: LIVE AUDIO TRANSCRIPTION PANEL */}
        {showTranscription && (
          <div className="w-full md:w-96 lg:w-[420px] bg-zinc-950/90 backdrop-blur-2xl rounded-3xl border border-white/15 flex flex-col shrink-0 min-h-0 shadow-2xl overflow-hidden h-full">
            {/* Header */}
            <div className="p-4 border-b border-white/10 bg-zinc-900/60 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileText className="w-4 h-4 text-amber-400" />
                <h4 className="text-xs font-extrabold text-white uppercase tracking-wider">Live Speech Transcription</h4>
              </div>
              <Badge variant="outline" className="text-[10px] border-white/10 text-zinc-400">
                Real-time
              </Badge>
            </div>

            {/* Scrolling Logs */}
            <ScrollArea className="flex-1 p-4 space-y-4">
              {logs.length === 0 ? (
                <div className="text-center py-24 text-zinc-600 space-y-2">
                  <Sparkles className="w-6 h-6 mx-auto text-amber-500/40 animate-pulse" />
                  <p className="text-xs font-semibold text-zinc-500">Live speech transcript will appear here as the interview progresses...</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {logs.map((log) => (
                    <div
                      key={log.id}
                      className={`flex gap-3 ${log.role === 'user' ? 'flex-row-reverse' : ''}`}
                    >
                      <div className={`w-7 h-7 rounded-xl flex items-center justify-center shrink-0 ${
                        log.role === 'assistant' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-violet-500/20 text-violet-300 border border-violet-500/30'
                      }`}>
                        {log.role === 'assistant' ? <Sparkles className="w-3.5 h-3.5" /> : <User className="w-3.5 h-3.5" />}
                      </div>

                      <div className={`p-3.5 rounded-2xl text-xs leading-relaxed max-w-[85%] border shadow-md ${
                        log.role === 'assistant'
                          ? 'bg-zinc-900 text-zinc-200 border-white/10'
                          : 'bg-violet-950/50 text-violet-200 border-violet-500/30'
                      }`}>
                        <div className="text-[10px] font-bold mb-1 opacity-70">
                          {log.role === 'assistant' ? `${company.name} AI Lead` : 'You (Candidate)'}
                        </div>
                        {log.text
                          .replace(/\[.*?\]/g, '')
                          .replace(/\[VERDICT:.*?\]/g, '')
                          .replace(/\[REASON:.*?\]/g, '')
                          .trim()}
                      </div>
                    </div>
                  ))}
                  <div ref={scrollRef} />
                </div>
              )}
            </ScrollArea>
          </div>
        )}

      </main>

      {/* VERDICT OVERLAY MODAL */}
      {showVerdictOverlay && (
        <div className="fixed inset-0 z-50 bg-black/95 backdrop-blur-2xl flex items-center justify-center p-6 animate-in fade-in duration-300">
          <div className="max-w-md w-full bg-zinc-950 border border-white/15 rounded-3xl p-8 text-center space-y-6 shadow-2xl relative overflow-hidden">
            {/* Ambient Background */}
            <div className={`absolute -top-32 -left-32 w-64 h-64 rounded-full blur-3xl ${verdict === 'PASSED' ? 'bg-emerald-500/20' : 'bg-rose-500/20'}`} />

            <div className="relative z-10 space-y-4">
              {verdict === 'PASSED' ? (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-emerald-500/20 border-2 border-emerald-500 flex items-center justify-center text-emerald-400 shadow-xl shadow-emerald-500/20 animate-bounce">
                    <CheckCircle2 className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-emerald-400 tracking-tight">
                    ROUND PASSED!
                  </h2>
                </>
              ) : (
                <>
                  <div className="w-20 h-20 mx-auto rounded-full bg-rose-500/20 border-2 border-rose-500 flex items-center justify-center text-rose-400 shadow-xl shadow-rose-500/20">
                    <XCircle className="w-10 h-10" />
                  </div>
                  <h2 className="text-3xl font-black text-rose-500 tracking-tight">
                    ROUND FAILED
                  </h2>
                </>
              )}

              <div className="bg-zinc-900 border border-white/10 rounded-2xl p-4 text-left space-y-2">
                <div className="flex items-center justify-between text-xs text-zinc-400">
                  <span>Score Evaluation</span>
                  <span className={`font-bold font-mono ${verdict === 'PASSED' ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {verdictScore}%
                  </span>
                </div>
                <p className="text-xs text-zinc-300 leading-relaxed italic">
                  "{verdictReason}"
                </p>
              </div>

              <p className="text-xs text-zinc-400">
                {verdict === 'PASSED'
                  ? 'Congratulations! The next interview round has been unlocked.'
                  : 'You did not clear the benchmark for this round. You can re-give the interview from the Rounds page.'}
              </p>

              <Button
                size="lg"
                onClick={() => onCompleteRound(verdict || 'FAILED')}
                className={`w-full h-12 font-bold text-sm rounded-xl ${
                  verdict === 'PASSED'
                    ? 'bg-emerald-500 hover:bg-emerald-400 text-black shadow-lg shadow-emerald-500/20'
                    : 'bg-zinc-800 hover:bg-zinc-700 text-white'
                }`}
              >
                Return to Rounds Hub <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
