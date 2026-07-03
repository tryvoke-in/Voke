import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { 
  ArrowRight, Sparkles, Users, Award, Zap, Shield, 
  Globe, Play, Star, Menu, X, Terminal, Code,
  Layers, MessageSquare, BarChart3, Check, Camera,
  Mic, FileText, Github, Smile, Building, MapPin, DollarSign
} from "lucide-react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";
import { FloatingParticles } from "@/components/FloatingParticles";
import { WAITLIST_CONFIG } from "@/config/waitlist";

const Index = () => {
  const navigate = useNavigate();
  const [isScrolled, setIsScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Live Dialogue Simulator state machine
  const dialogues = [
    {
      ai: "How do you scale PostgreSQL database writes under heavy loads?",
      user: "I would set up connection pooling, partition tables, and introduce Redis caching to offload hot queries."
    },
    {
      ai: "Explain the difference between optimistic and pessimistic locking.",
      user: "Optimistic locking checks version fields on update, whereas pessimistic locks rows immediately, slowing writes."
    }
  ];

  const [currentDialogueIdx, setCurrentDialogueIdx] = useState(0);
  const [typedAi, setTypedAi] = useState("");
  const [typedUser, setTypedUser] = useState("");
  const [isAiSpeaking, setIsAiSpeaking] = useState(true);

  useEffect(() => {
    let aiInterval: NodeJS.Timeout;
    let userInterval: NodeJS.Timeout;
    let mainTimeout: NodeJS.Timeout;

    const runDialogue = () => {
      const dialogue = dialogues[currentDialogueIdx];
      setTypedAi("");
      setTypedUser("");
      setIsAiSpeaking(true);

      // Type AI text with static block character capture to avoid closure index issues
      let aiCharIdx = 0;
      aiInterval = setInterval(() => {
        if (aiCharIdx < dialogue.ai.length) {
          const charToAppend = dialogue.ai[aiCharIdx];
          setTypedAi((prev) => prev + charToAppend);
          aiCharIdx++;
        } else {
          clearInterval(aiInterval);
          // AI finished. Wait 1 second, then switch to candidate answering
          mainTimeout = setTimeout(() => {
            setIsAiSpeaking(false);
            let userCharIdx = 0;
            userInterval = setInterval(() => {
              if (userCharIdx < dialogue.user.length) {
                const charToAppend = dialogue.user[userCharIdx];
                setTypedUser((prev) => prev + charToAppend);
                userCharIdx++;
              } else {
                clearInterval(userInterval);
                // User finished. Wait 4 seconds, then trigger next dialogue cycle
                mainTimeout = setTimeout(() => {
                  setCurrentDialogueIdx((prev) => (prev + 1) % dialogues.length);
                }, 4000);
              }
            }, 30);
          }, 1000);
        }
      }, 40);
    };

    runDialogue();

    return () => {
      clearInterval(aiInterval);
      clearInterval(userInterval);
      clearTimeout(mainTimeout);
    };
  }, [currentDialogueIdx]);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 50);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleAuthNavigation = () => {
    const isBypassed = localStorage.getItem("voke_waitlist_bypass") === "true";
    if (WAITLIST_CONFIG.enabled && !isBypassed) {
      navigate("/waitlist");
    } else {
      navigate("/auth");
    }
  };

  return (
    <div className="min-h-screen text-white selection:bg-violet-500/30 font-sans antialiased overflow-x-hidden relative">
      {/* Base Solid Background beneath all negative layers */}
      <div className="absolute inset-0 bg-[#030305] -z-30 pointer-events-none" />

      <style>{`
        @keyframes drift {
          0% { transform: translate(0px, 0px) scale(1); }
          33% { transform: translate(30px, -50px) scale(1.05); }
          66% { transform: translate(-20px, 20px) scale(0.95); }
          100% { transform: translate(0px, 0px) scale(1); }
        }
      `}</style>

      {/* Dynamic mesh backgrounds with rich drifting glow auras */}
      <div 
        className="absolute top-0 left-1/4 w-[300px] md:w-[900px] h-[300px] md:h-[900px] bg-gradient-to-r from-violet-600/25 via-fuchsia-600/20 to-indigo-600/15 rounded-full blur-[140px] -z-10 pointer-events-none" 
        style={{ animation: 'drift 15s infinite ease-in-out' }}
      />
      <div 
        className="absolute top-[35%] right-[-10%] w-[300px] md:w-[800px] h-[300px] md:h-[800px] bg-gradient-to-br from-fuchsia-600/22 via-violet-600/18 to-transparent rounded-full blur-[130px] -z-10 pointer-events-none" 
        style={{ animation: 'drift 20s infinite ease-in-out 2s' }}
      />
      <div 
        className="absolute top-[65%] left-[-10%] w-[300px] md:w-[850px] h-[300px] md:h-[850px] bg-gradient-to-tr from-violet-600/22 via-indigo-600/18 to-transparent rounded-full blur-[150px] -z-10 pointer-events-none" 
        style={{ animation: 'drift 18s infinite ease-in-out 4s' }}
      />

      {/* Floating Particles globally mounted in background */}
      <FloatingParticles />

      {/* Thin mesh grid lines for aesthetics */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.025)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.025)_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_40%,#000_70%,transparent_100%)] -z-20 pointer-events-none" />

      {/* Navbar */}
      <nav 
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          isScrolled 
            ? "bg-black/60 backdrop-blur-xl border-b border-white/5 py-4" 
            : "bg-transparent py-6"
        }`}
      >
        <div className="container mx-auto px-4 md:px-6">
          <div className="flex items-center justify-between">
            <div 
              className="flex items-center gap-2 cursor-pointer group" 
              onClick={() => navigate("/")}
            >
              <img 
                src="/images/voke_logo.png" 
                alt="Voke Logo" 
                className="w-10 h-10 object-contain group-hover:rotate-[15deg] transition-transform duration-300"
              />
              <span className="text-2xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white via-white to-white/50">
                Voke
              </span>
            </div>

            {/* Desktop Nav */}
            <div className="hidden md:flex items-center gap-8">
              {["Features", "Job Matching", "How it Works", "Pricing"].map((item) => (
                <a 
                  key={item} 
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-sm font-medium text-gray-400 hover:text-white transition-colors relative group"
                >
                  {item}
                  <span className="absolute bottom-[-4px] left-0 w-0 h-[1px] bg-violet-400 transition-all duration-300 group-hover:w-full" />
                </a>
              ))}
            </div>

            <div className="hidden md:flex items-center gap-4">
              <Button 
                onClick={handleAuthNavigation}
                className="text-gray-300 hover:text-white bg-transparent hover:bg-white/5 rounded-full px-5 h-10 flex items-center justify-center transition-all border-0 shadow-none font-medium text-sm"
              >
                Sign In
              </Button>
              <Button
                onClick={handleAuthNavigation}
                className="bg-white text-black hover:bg-zinc-200 rounded-full px-6 font-semibold transition-all duration-300 shadow-[0_0_20px_rgba(255,255,255,0.08)] hover:shadow-[0_0_25px_rgba(255,255,255,0.15)] hover:scale-105"
              >
                Get Started
              </Button>
            </div>

            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden text-white p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {mobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="fixed inset-0 z-40 bg-[#050508]/98 backdrop-blur-2xl pt-24 px-6 md:hidden"
          >
            <div className="flex flex-col gap-8 text-center">
              {["Features", "Job Matching", "How it Works", "Pricing"].map((item) => (
                <a 
                  key={item}
                  href={`#${item.toLowerCase().replace(/\s+/g, '-')}`}
                  className="text-2xl font-semibold text-gray-300 hover:text-white transition-colors"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  {item}
                </a>
              ))}
              <div className="flex flex-col gap-4 mt-12">
                <Button 
                  onClick={handleAuthNavigation}
                  className="w-full border border-white/10 rounded-full text-white bg-transparent hover:bg-white/5 h-12 flex items-center justify-center font-medium"
                >
                  Sign In
                </Button>
                <Button
                  onClick={handleAuthNavigation}
                  className="w-full bg-violet-600 hover:bg-violet-700 text-white rounded-full h-12 flex items-center justify-center font-semibold"
                >
                  Get Started
                </Button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Hero Section with Overlapping 3D Floating Cards Stack & Live Dialog Simulator */}
      <section className="relative pt-36 pb-24 md:pt-48 md:pb-36 overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="grid lg:grid-cols-12 gap-16 items-center">
            
            {/* Left Column: Headlines & Actions */}
            <div className="lg:col-span-6 space-y-8 text-center lg:text-left">
              <motion.div
                initial={{ opacity: 0, y: 15 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6 }}
                className="inline-flex items-center px-3 py-1.5 sm:px-4 sm:py-2 rounded-full bg-white/[0.03] border border-white/10 text-violet-300 text-xs font-semibold tracking-wider uppercase backdrop-blur-md shadow-[0_0_15px_rgba(124,58,237,0.1)]"
              >
                <span className="hidden sm:inline">Voke Platform • Advanced Interview Sandbox</span>
                <span className="inline sm:hidden text-[10px]">Voke • AI Interview Sandbox</span>
              </motion.div>

              <motion.h1
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="text-4xl md:text-6xl font-extrabold tracking-tight leading-[1.1]"
              >
                Master the Interview.<br />
                <span className="bg-gradient-to-r from-white via-violet-300 to-fuchsia-400 bg-clip-text text-transparent">
                  Secure the Offer.
                </span>
              </motion.h1>

              <motion.p
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="text-base md:text-lg text-gray-400 leading-relaxed max-w-xl"
              >
                Simulate realistic technical and behavioral rounds with audio-video tracking, 
                ATS resume analyses, and repo integrations. Get verified and get matched with top tech jobs.
              </motion.p>

              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="flex flex-col sm:flex-row items-center justify-center lg:justify-start gap-4 pt-2"
              >
                <Button
                  onClick={handleAuthNavigation}
                  variant="ghost"
                  className="w-full max-w-[280px] sm:w-auto bg-gradient-to-r from-violet-600 to-fuchsia-600 hover:from-violet-700 hover:to-fuchsia-700 text-white text-sm px-8 h-12 rounded-full font-bold shadow-lg shadow-violet-500/20 hover:shadow-violet-500/35 hover:scale-105 transition-all duration-300 flex items-center justify-center border-0"
                >
                  Start Preparing Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
                
                <Dialog>
                  <DialogTrigger asChild>
                    <Button
                      variant="ghost"
                      className="w-full max-w-[280px] sm:w-auto border border-white/10 text-gray-200 hover:text-white bg-white/5 hover:bg-white/10 text-sm px-8 h-12 rounded-full backdrop-blur-md flex items-center justify-center transition-all duration-300 hover:scale-105 shadow-none"
                    >
                      <Play className="mr-2 w-4 h-4 fill-current text-white" />
                      Watch Platform Demo
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[900px] p-0 overflow-hidden bg-black/90 border-white/10 backdrop-blur-xl">
                    <div className="aspect-video w-full">
                      <iframe 
                        className="w-full h-full"
                        src="https://www.youtube.com/embed/LXb3EKWsInQ?si=KvH-2j1k2j1k2j1k&autoplay=1&mute=0" 
                        title="Voke AI Demo" 
                        allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share" 
                        allowFullScreen
                      ></iframe>
                    </div>
                  </DialogContent>
                </Dialog>
              </motion.div>
            </div>

            {/* Right Column: Highly Creative 3D Overlapping Floating Cards Stack with Live Dialogue Inside Webcam Box */}
            <div className="lg:col-span-6 relative h-[450px] flex items-center justify-center select-none">
              
              {/* Glow backdrop blob */}
              <div className="absolute w-72 h-72 bg-violet-600/10 rounded-full blur-[100px] pointer-events-none -z-10" />

              {/* CARD 1 (Main Base Card): Webcam Feed & Live Dialogue simulation */}
              <motion.div
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.8, delay: 0.4 }}
                whileHover={{ scale: 1.01 }}
                className="w-full md:w-[85%] bg-zinc-950/80 border border-white/10 rounded-3xl p-3.5 sm:p-5 shadow-2xl backdrop-blur-xl relative"
              >
                {/* Simulated Webcam layout with live typing dialogue overlay rendering INSIDE the aspect-video screen container */}
                <div className="bg-black/80 border border-white/5 rounded-2xl p-3 sm:p-4 relative aspect-video flex flex-col justify-between overflow-hidden min-h-[150px] sm:min-h-[180px] md:min-h-[220px]">
                  <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_30%,#000_100%)] opacity-75 z-10 pointer-events-none" />
                  
                  {/* Fine face mesh scanning visualizer lines */}
                  <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-20 pointer-events-none z-10">
                    {[...Array(36)].map((_, i) => (
                      <div key={i} className="flex items-center justify-center">
                        <span className="w-0.5 h-0.5 rounded-full bg-violet-400" />
                      </div>
                    ))}
                  </div>

                  {/* Header metadata */}
                  <div className="flex justify-between items-center relative z-20 text-[8px] font-extrabold tracking-widest text-gray-400 mb-2">
                    <span className="flex items-center gap-1.5 bg-black/60 border border-white/10 px-2.5 py-0.5 rounded-full">
                      <Camera className="w-2.5 h-2.5 text-red-500 animate-pulse" /> WEBCAM SIMULATOR
                    </span>
                    <span className="bg-green-500/10 border border-green-500/20 text-green-400 px-2 py-0.5 rounded-full uppercase">
                      Tracking Active
                    </span>
                  </div>

                  {/* Dialogue bubbles overlay directly INSIDE the webcam viewport box */}
                  <div className="relative z-20 flex-1 flex flex-col justify-center gap-2 my-1">
                    {/* AI Coach question bubble */}
                    <div className="bg-black/60 border border-white/10 rounded-xl p-2.5 space-y-1 text-[10px] backdrop-blur-md">
                      <div className="flex items-center gap-1.5 text-[8px] text-violet-300 font-bold uppercase tracking-wider">
                        <span className="w-1 h-1 rounded-full bg-violet-400 animate-pulse" />
                        AI Coach:
                      </div>
                      <p className="text-gray-300 leading-tight font-mono text-[10px]">
                        {typedAi || <span className="text-gray-600 animate-pulse">Waiting for AI...</span>}
                        {isAiSpeaking && <span className="inline-block w-1 h-2.5 bg-violet-400 ml-1 animate-pulse" />}
                      </p>
                    </div>

                    {/* Candidate answer bubble */}
                    {(typedUser || !isAiSpeaking) && (
                      <div className="bg-black/60 border border-white/10 rounded-xl p-2.5 space-y-1 text-[10px] backdrop-blur-md">
                        <div className="flex items-center gap-1.5 text-[8px] text-fuchsia-300 font-bold uppercase tracking-wider">
                          <span className="w-1 h-1 rounded-full bg-fuchsia-400 animate-pulse" />
                          Candidate (You):
                        </div>
                        <p className="text-gray-200 leading-tight font-mono text-[10px]">
                          {typedUser || <span className="text-gray-600 animate-pulse">Answering...</span>}
                          {!isAiSpeaking && typedUser.length < dialogues[currentDialogueIdx].user.length && (
                            <span className="inline-block w-1 h-2.5 bg-fuchsia-400 ml-1 animate-pulse" />
                          )}
                        </p>
                      </div>
                    )}
                  </div>

                  {/* Dynamic waveform based on speaker status */}
                  <div className="flex justify-center items-end gap-1 h-5 relative z-20 mt-1">
                    {[...Array(14)].map((_, i) => (
                      <span 
                        key={i} 
                        className={`w-[2px] rounded-full transition-all duration-300 ${isAiSpeaking ? 'bg-violet-500/80 animate-pulse' : 'bg-fuchsia-500/90 animate-bounce'}`} 
                        style={{ 
                          height: isAiSpeaking 
                            ? `${Math.sin(i * 0.5) * 5 + 8}px` 
                            : `${Math.abs(Math.sin(i * 0.7)) * 12 + 6}px`,
                          animationDuration: isAiSpeaking ? '1.5s' : `${0.4 + (i % 3) * 0.1}s`
                        }} 
                      />
                    ))}
                  </div>
                </div>
              </motion.div>

              {/* CARD 2 (Floating Top-Left Card): AI Confidence Monitor */}
              <motion.div
                animate={{ y: [0, -12, 0] }}
                transition={{ duration: 5, repeat: Infinity, ease: "easeInOut" }}
                className="absolute top-[30px] left-0 z-20 w-[220px] bg-zinc-900/90 border border-white/15 rounded-2xl p-4 shadow-xl backdrop-blur-2xl items-center gap-3 animate-none hidden md:flex"
              >
                <div className="w-8 h-8 rounded-full bg-emerald-500/10 border border-emerald-500/25 flex items-center justify-center shrink-0">
                  <Smile className="w-4 h-4 text-emerald-400" />
                </div>
                <div className="min-w-0">
                  <h4 className="text-[11px] font-bold text-gray-400 uppercase tracking-wide">Confidence Meter</h4>
                  <p className="text-xs font-extrabold text-emerald-400 mt-0.5">Stable (95%)</p>
                </div>
                <span className="w-2 h-2 rounded-full bg-emerald-500 ml-auto animate-ping shrink-0" />
              </motion.div>

              {/* CARD 3 (Floating Bottom-Right Card): Match Scorecard */}
              <motion.div
                animate={{ y: [0, 12, 0] }}
                transition={{ duration: 6, repeat: Infinity, ease: "easeInOut" }}
                className="absolute bottom-[20px] right-0 z-20 w-[230px] bg-zinc-900/90 border border-white/15 rounded-2xl p-4 shadow-xl backdrop-blur-2xl space-y-2.5 animate-none hidden md:block"
              >
                <div className="flex items-center justify-between">
                  <span className="text-[9px] text-gray-500 font-bold uppercase tracking-wider">Match Scorecard</span>
                  <span className="text-[10px] font-extrabold text-violet-400 bg-violet-950/40 border border-violet-500/20 px-2 py-0.5 rounded-full">
                    92% Match
                  </span>
                </div>
                
                <div className="space-y-1.5">
                  <p className="text-[10px] font-semibold text-gray-200">Recommended Job Fit:</p>
                  <div className="flex flex-wrap gap-1">
                    {["System Design", "Stripe Match"].map((tag) => (
                      <span key={tag} className="text-[8px] px-2 py-0.5 bg-white/5 border border-white/10 rounded text-gray-400">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </motion.div>

            </div>
            
          </div>
        </div>
      </section>

      {/* Prepare for Any Path Section */}
      <section className="py-12 border-y border-white/5 bg-[#08080c] relative">
        <div className="container mx-auto px-4 max-w-5xl">
          <p className="text-center text-xs font-bold text-gray-500 mb-8 tracking-widest uppercase">
            SUPPORTED ROLES AND TRACKS
          </p>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
            {[
              { icon: <Terminal className="w-4 h-4 text-violet-400" />, label: "Software Engineering" },
              { icon: <Layers className="w-4 h-4 text-fuchsia-400" />, label: "Product Management" },
              { icon: <Globe className="w-4 h-4 text-blue-400" />, label: "System Design" },
              { icon: <BarChart3 className="w-4 h-4 text-green-400" />, label: "Data Science" },
              { icon: <MessageSquare className="w-4 h-4 text-yellow-400" />, label: "Behavioral rounds" },
            ].map((track, i) => (
              <div 
                key={i} 
                className="flex items-center gap-3 p-3 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 hover:bg-white/[0.04] transition-all duration-300"
              >
                <div className="p-1.5 rounded-xl bg-white/5 shrink-0">
                  {track.icon}
                </div>
                <span className="text-xs font-medium text-gray-300">{track.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Bento Grid Features Section (Lucide Card Icons Removed as requested) */}
      <section id="features" className="py-24 md:py-32 relative border-t border-white/5 bg-[#050508]/40">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center max-w-2xl mx-auto mb-20 space-y-4">
            <motion.h2 
              initial={{ opacity: 0, y: 10 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className="text-3xl md:text-5xl font-extrabold tracking-tight"
            >
              Master Every <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">Interview Dimension</span>
            </motion.h2>
            <p className="text-base md:text-lg text-gray-400 leading-relaxed">
              Explore the detailed visual tools built directly into Voke to measure and optimize your interview performance.
            </p>
          </div>

          {/* Bento Grid */}
          <div className="grid md:grid-cols-12 gap-6 max-w-6xl mx-auto">
            
            {/* Card 1: AI Video Interviews */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.01, rotateY: 1, rotateX: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-6 group relative bg-white/[0.015] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden hover:border-violet-500/30 hover:shadow-[0_20px_40px_rgba(124,58,237,0.08)] transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-violet-400 font-bold uppercase tracking-wider">Visual Prep</span>
                </div>
                <h3 className="text-2xl font-bold"> AI Video Interviews</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Practice like a real interview with your webcam active. Engage in face-to-face setups styled to match remote corporate panels.
                </p>
              </div>

              {/* Webcam simulation box */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-4 relative overflow-hidden aspect-video flex items-center justify-center text-center">
                <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent z-10" />
                
                {/* Visual mesh dots for face tracking mockup */}
                <div className="absolute inset-0 grid grid-cols-6 grid-rows-6 opacity-35 pointer-events-none">
                  {[...Array(36)].map((_, i) => (
                    <div key={i} className="flex items-center justify-center">
                      <span className="w-1 h-1 rounded-full bg-violet-400 animate-ping" style={{ animationDelay: `${i * 100}ms`, animationDuration: '3s' }} />
                    </div>
                  ))}
                </div>

                <div className="relative z-20 space-y-2">
                  <div className="w-12 h-12 rounded-full bg-violet-500/10 border border-violet-500/30 flex items-center justify-center mx-auto text-violet-400 animate-pulse">
                    <Camera className="w-6 h-6" />
                  </div>
                  <p className="text-[10px] text-violet-300 font-bold uppercase tracking-widest">Webcam Feed Active</p>
                </div>
              </div>
            </motion.div>

            {/* Card 2: AI Voice Interviews */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.01, rotateY: -1, rotateX: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-6 group relative bg-white/[0.015] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden hover:border-fuchsia-500/30 hover:shadow-[0_20px_40px_rgba(240,79,207,0.08)] transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-fuchsia-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-fuchsia-400 font-bold uppercase tracking-wider">Audio Prep</span>
                </div>
                <h3 className="text-2xl font-bold"> AI Voice Interviews</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Have natural, real-time conversations with an AI interviewer. Practice vocal formatting, pacing controls, and syntax delivery.
                </p>
              </div>

              {/* Animating waveforms widget */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-4 flex flex-col justify-center h-[180px] relative overflow-hidden">
                <div className="flex items-center justify-between border-b border-white/5 pb-2 mb-4 text-[10px] text-gray-500 font-bold">
                  <span>VOICE SESSION IN PROGRESS</span>
                  <span className="text-fuchsia-400 flex items-center gap-1">
                    <span className="w-1.5 h-1.5 rounded-full bg-fuchsia-400 animate-ping" /> Live Audio
                  </span>
                </div>
                <div className="flex items-center justify-center gap-1.5 h-16">
                  {[...Array(24)].map((_, i) => (
                    <span 
                      key={i} 
                      className="w-[2.5px] bg-gradient-to-t from-fuchsia-500 to-violet-500 rounded-full animate-bounce"
                      style={{ 
                        height: `${Math.abs(Math.sin(i * 0.4)) * 40 + 10}px`,
                        animationDuration: `${0.8 + (i % 4) * 0.15}s`
                      }}
                    />
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Card 3: Resume-Based Questions */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.01, rotateY: 1, rotateX: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-6 group relative bg-white/[0.015] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden hover:border-blue-500/30 hover:shadow-[0_20px_40px_rgba(59,130,246,0.08)] transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-blue-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Custom Prompting</span>
                </div>
                <h3 className="text-2xl font-bold"> Resume-Based Questions</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Upload your resume and get personalized interview questions generated dynamically from your target skills, projects, and history.
                </p>
              </div>

              {/* Resume mapping visual mockup */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-4 space-y-3 relative overflow-hidden">
                <div className="flex items-center justify-between text-[10px] text-gray-500 font-bold border-b border-white/5 pb-2">
                  <span>RESUME SKILL EVALUATION</span>
                  <span className="text-blue-400">Match active</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="w-8 h-8 text-blue-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-semibold truncate text-gray-200">Anurag_Resume_2026.pdf</p>
                    <div className="w-full h-1 bg-white/5 rounded-full mt-1 overflow-hidden">
                      <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }} />
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-1.5 pt-1">
                  {["React.js", "NodeJS", "System Design", "PostgreSQL"].map((tag) => (
                    <span key={tag} className="text-[9px] px-2 py-0.5 bg-blue-500/10 border border-blue-500/25 rounded-md text-blue-300">
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            </motion.div>

            {/* Card 4: GitHub Analysis */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.01, rotateY: -1, rotateX: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-6 group relative bg-white/[0.015] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden hover:border-violet-500/30 hover:shadow-[0_20px_40px_rgba(124,58,237,0.08)] transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-violet-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400 font-bold uppercase tracking-wider">Code Review</span>
                </div>
                <h3 className="text-2xl font-bold"> GitHub Analysis</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Generate technical challenges directly from your actual GitHub repositories. Analyze implementation structure and explain logic.
                </p>
              </div>

              {/* GitHub branch mockup */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-4 font-mono text-[10px] space-y-2 backdrop-blur-md">
                <div className="flex items-center justify-between pb-2 border-b border-white/5">
                  <span className="text-[9px] text-gray-500">repo: Anurag/tryvoke-app</span>
                  <span className="text-violet-400 text-[8px] bg-violet-950/40 border border-violet-500/20 px-2 py-0.5 rounded">Connected</span>
                </div>
                <div className="space-y-1 text-gray-400 text-[9px]">
                  <p>📁 src/pages/Index.tsx <span className="text-gray-600">// technical triggers</span></p>
                  <p className="text-violet-300">➜ AI Question: "Explain why you chose Redis over Memcached for caching user tokens in your middleware..."</p>
                </div>
              </div>
            </motion.div>

            {/* Card 5: Body Language & Confidence */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.01, rotateY: 1, rotateX: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-7 group relative bg-white/[0.015] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden hover:border-emerald-500/30 hover:shadow-[0_20px_40px_rgba(16,185,129,0.08)] transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-600/5 rounded-full blur-3xl pointer-events-none" />
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-emerald-400 font-bold uppercase tracking-wider">Cognitive Check</span>
                </div>
                <h3 className="text-2xl font-bold"> Body Language & Confidence Analysis</h3>
                <p className="text-sm text-gray-400 leading-relaxed max-w-md">
                  Voke tracks eye contact stability, head postures, confidence indicators, filler pauses, and facial tension cues to check overall delivery effectiveness.
                </p>
              </div>

              {/* Dials layout */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-4 grid grid-cols-3 gap-3 text-center backdrop-blur-md">
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-500 uppercase font-bold block">Eye Contact</p>
                  <p className="text-base font-extrabold text-emerald-400">92%</p>
                  <span className="text-[8px] text-emerald-500 bg-emerald-950/20 px-1.5 py-0.5 rounded">Steady</span>
                </div>
                <div className="space-y-1 border-x border-white/5">
                  <p className="text-[9px] text-gray-500 uppercase font-bold block">Posture Log</p>
                  <p className="text-base font-extrabold text-gray-200">Optimal</p>
                  <span className="text-[8px] text-emerald-500 bg-emerald-950/20 px-1.5 py-0.5 rounded">Aligned</span>
                </div>
                <div className="space-y-1">
                  <p className="text-[9px] text-gray-500 uppercase font-bold block">Confidence</p>
                  <p className="text-base font-extrabold text-gray-200">High</p>
                  <span className="text-[8px] text-emerald-500 bg-emerald-950/20 px-1.5 py-0.5 rounded">95 Score</span>
                </div>
              </div>
            </motion.div>

            {/* Card 6: Detailed AI Feedback */}
            <motion.div 
              whileHover={{ y: -8, scale: 1.01, rotateY: -1, rotateX: -1 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
              className="md:col-span-5 group relative bg-white/[0.015] border border-white/10 rounded-3xl p-6 md:p-8 flex flex-col justify-between overflow-hidden hover:border-yellow-500/30 hover:shadow-[0_20px_40px_rgba(234,179,8,0.08)] transition-all duration-500"
            >
              <div className="absolute top-0 right-0 w-36 h-36 bg-yellow-600/5 rounded-full blur-2xl pointer-events-none" />
              
              <div className="space-y-3 mb-8">
                <div className="flex items-center gap-2">
                  <span className="text-xs text-yellow-400 font-bold uppercase tracking-wider">Feedback Loop</span>
                </div>
                <h3 className="text-2xl font-bold">Detailed AI Feedback</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  Instead of generic numbers, review structural highlights mapping strengths, phrasing mistakes, and exact phrasing suggestions.
                </p>
              </div>

              {/* Before/After list Mock */}
              <div className="bg-black/60 border border-white/5 rounded-2xl p-4 text-[10px] space-y-2 backdrop-blur-md">
                <div className="text-red-400 flex items-start gap-1.5 leading-tight">
                  <span className="font-bold shrink-0">[×] MISTAKE:</span>
                  <span>"I built a standard caching layers and things went fast." (Vague action)</span>
                </div>
                <div className="text-emerald-400 flex items-start gap-1.5 leading-tight">
                  <span className="font-bold shrink-0">[✓] IMPROVED:</span>
                  <span>"I configured Redis as a key-value store for session caching, which cut load latency by 45%."</span>
                </div>
              </div>
            </motion.div>

          </div>
        </div>
      </section>

      {/* Job Match & Verified Score Placement */}
      <section id="job-matching" className="py-24 bg-[#08080c] relative border-y border-white/5 overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,rgba(124,58,237,0.03),transparent_60%)] pointer-events-none" />
        
        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
          <div className="grid lg:grid-cols-12 gap-12 items-center">
            {/* Left Content Column */}
            <div className="lg:col-span-5 space-y-6 text-center lg:text-left">
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-violet-500/10 border border-violet-500/20 text-violet-300 text-xs font-semibold uppercase tracking-wider">
                <Users className="w-3.5 h-3.5" /> Job Alignment
              </div>
              <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight leading-tight">
                Discover Jobs Based on <br />
                <span className="bg-gradient-to-r from-violet-400 via-fuchsia-400 to-white bg-clip-text text-transparent">
                  Your Interview Scores
                </span>
              </h2>
              <p className="text-base md:text-lg text-gray-400 leading-relaxed">
                Voke doesn't provide jobs directly or guarantee placements. Instead, we show you active industry roles and their target benchmarks, allowing you to see how your mock interview performance stacks up against real-world position requirements.
              </p>
              
              <div className="space-y-4 pt-4 text-left max-w-md mx-auto lg:mx-0">
                <div className="flex items-start gap-3.5 text-sm text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-violet-400" />
                  </div>
                  <p><strong>Role Compatibility Benchmarks</strong> – Compare your scores against standard performance baselines expected for target technical roles.</p>
                </div>
                <div className="flex items-start gap-3.5 text-sm text-gray-300">
                  <div className="w-5 h-5 rounded-full bg-violet-500/10 border border-violet-500/20 flex items-center justify-center shrink-0 mt-0.5">
                    <Check className="w-3 h-3 text-violet-400" />
                  </div>
                  <p><strong>Targeted Prep Insights</strong> – Instantly identify which modules you need to focus on to match hiring expectations.</p>
                </div>
              </div>
            </div>

            {/* Right Job Cards Column (Fixed button colors to prevent blackout) */}
            <div className="lg:col-span-7 grid sm:grid-cols-2 gap-4">
              {[
                {
                  role: "Software Engineer III",
                  company: "Linear",
                  location: "Remote, US",
                  salary: "$140k - $170k",
                  score: 88,
                  logoBg: "bg-zinc-800"
                },
                {
                  role: "Frontend Specialist",
                  company: "Vercel",
                  location: "Remote, Global",
                  salary: "$130k - $160k",
                  score: 90,
                  logoBg: "bg-white text-black"
                },
                {
                  role: "Product Manager",
                  company: "Stripe",
                  location: "San Francisco, CA",
                  salary: "$150k - $185k",
                  score: 86,
                  logoBg: "bg-violet-600"
                },
                {
                  role: "Infrastructure Engineer",
                  company: "Supabase",
                  location: "Remote, SG",
                  salary: "$120k - $150k",
                  score: 87,
                  logoBg: "bg-emerald-600"
                }
              ].map((job, idx) => (
                <motion.div
                  key={idx}
                  whileHover={{ y: -6, scale: 1.02 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                  className="bg-[#0c0c12] border border-white/5 rounded-3xl p-5 space-y-4 hover:border-violet-500/20 transition-all duration-300 shadow-[0_4px_20px_rgba(0,0,0,0.2)]"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex gap-3 min-w-0 flex-1">
                      <div className={`w-8 h-8 rounded-lg ${job.logoBg} flex items-center justify-center font-bold text-xs shrink-0`}>
                        {job.company[0]}
                      </div>
                      <div className="min-w-0 flex-1">
                        <h4 className="font-bold text-sm text-gray-200 truncate">{job.role}</h4>
                        <p className="text-xs text-gray-500">{job.company}</p>
                      </div>
                    </div>
                    <span className="text-[10px] font-bold text-violet-400 bg-violet-950/40 border border-violet-500/25 px-2 py-0.5 rounded-full whitespace-nowrap shrink-0">
                      Full-time
                    </span>
                  </div>

                  <div className="space-y-1.5 text-xs text-gray-400">
                    <div className="flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5 text-gray-600" />
                      <span>{job.location}</span>
                    </div>
                    <div className="flex items-center gap-1.5">
                      <DollarSign className="w-3.5 h-3.5 text-gray-600" />
                      <span>{job.salary}</span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t border-white/5">
                    <div className="text-[10px]">
                      <p className="text-gray-500 uppercase font-bold">BENCHMARK SCORE</p>
                      <p className="text-xs font-extrabold text-violet-300">Score &ge; {job.score}+</p>
                    </div>
                    
                    <Button 
                      onClick={handleAuthNavigation}
                      className="bg-white/10 text-white border border-white/10 hover:bg-violet-600 hover:border-violet-600 hover:text-white rounded-xl text-xs px-4 h-9 flex items-center justify-center transition-all duration-300 font-semibold"
                    >
                      Check Fit
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section id="how-it-works" className="py-24 relative overflow-hidden">
        <div className="container mx-auto px-4 md:px-6 relative z-10">
          <div className="text-center mb-20 max-w-2xl mx-auto space-y-4">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight">
              How Voke <span className="text-fuchsia-400">Works</span>
            </h2>
            <p className="text-base text-gray-400 leading-relaxed">
              Three simple steps to test your skills and get placed.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-12 relative max-w-6xl mx-auto">
            {/* Connecting Line */}
            <div className="hidden md:block absolute top-1/3 left-0 w-full h-0.5 bg-gradient-to-r from-violet-500/0 via-violet-500/20 to-violet-500/0 -translate-y-1/2 z-0" />

            {[
              {
                step: "01",
                title: "Practice Rounds",
                desc: "Conduct video or voice mock interviews. Respond to resume-based prompts and coding algorithm challenges."
              },
              {
                step: "02",
                title: "Verify Scorecard",
                desc: "AI coach generates detailed reports mapping behavioral alignment, speech pace, posture, and technical logic structures."
              },
              {
                step: "03",
                title: "Get Hired",
                desc: "Your scorecard triggers direct job matching filters, placing your profile instantly before matching tech employers."
              }
            ].map((item, i) => (
              <div
                key={i}
                className="relative z-10 bg-zinc-950/40 border border-white/10 p-8 rounded-3xl text-center group hover:border-violet-500/30 transition-all duration-300"
              >
                <div className="w-16 h-16 rounded-2xl bg-violet-500/5 border border-violet-500/10 flex items-center justify-center mx-auto mb-6 text-2xl font-bold text-violet-400 group-hover:scale-105 transition-transform duration-300">
                  {item.step}
                </div>
                <h3 className="text-xl font-bold text-gray-100 mb-4">{item.title}</h3>
                <p className="text-sm text-gray-400 leading-relaxed">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section (Realignment with actual pricing setup) */}
      <section id="pricing" className="py-24 relative">
        <div className="container mx-auto px-4 md:px-6">
          <div className="text-center mb-20 max-w-2xl mx-auto">
            <h2 className="text-3xl md:text-5xl font-extrabold tracking-tight mb-6">
              Simple, Transparent <span className="text-fuchsia-400">Pricing</span>
            </h2>
            <p className="text-lg text-gray-400 leading-relaxed">
              Start practicing immediately for free, or unlock unlimited access with a Voke Elite upgrade.
            </p>
          </div>

          <div className="grid md:grid-cols-3 gap-8 max-w-5xl mx-auto">
            {[
              {
                name: "Basic",
                price: "Free",
                originalPrice: "",
                desc: "Essential practice for casual learners.",
                features: [
                  "1 Free Mock Credit for each round (Elite, Voice, Video)",
                  "+2 Bonus Mock Credits upon giving platform feedback",
                  "Access to Basic Question Bank",
                  "Daily Coding Challenges",
                  "Basic Progress Tracking"
                ],
                cta: "Get Started Free",
                popular: false,
                priceLabel: ""
              },
              {
                name: "Voke Elite",
                price: "₹99",
                originalPrice: "₹199",
                desc: "Complete power for serious job hunters.",
                features: [
                  "Everything in Basic",
                  "Unlimited AI Mock Interviews",
                  "Elite Mock with Code IDE",
                  "Resume Analysis & Optimization",
                  "Priority Community Support",
                  "Elite Audio/Video Performance Reports",
                  "Ad-free Experience"
                ],
                cta: "Upgrade to Elite",
                popular: true,
                priceLabel: "/ month"
              },
              {
                name: "Enterprise",
                price: "Custom",
                originalPrice: "",
                desc: "For universities and coding bootcamps.",
                features: [
                  "Everything in Elite",
                  "Bulk Seat Management",
                  "Custom Interview Flows",
                  "Admin Analytics Dashboard",
                  "SSO & Custom Integrations",
                  "Dedicated Success Manager",
                  "SLA Support"
                ],
                cta: "Contact Sales",
                popular: false,
                priceLabel: "Contact teamtryvoke@gmail.com"
              }
            ].map((plan, i) => (
              <div
                key={i}
                className={`relative p-8 rounded-3xl border flex flex-col transition-all duration-300 ${
                  plan.popular 
                    ? "bg-violet-900/10 border-violet-500/50 shadow-2xl shadow-violet-500/5 hover:border-violet-500" 
                    : "bg-zinc-950/40 border-white/10 hover:border-white/20"
                }`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 -translate-x-1/2 px-4 py-1 rounded-full bg-gradient-to-r from-violet-600 to-fuchsia-600 text-xs font-bold shadow-lg uppercase tracking-wider">
                    Most Popular
                  </div>
                )}
                <div className="mb-8">
                  <h3 className="text-xl font-bold mb-2 text-gray-100">{plan.name}</h3>
                  <div className="flex items-baseline gap-2 flex-wrap">
                    <span className="text-4xl font-extrabold text-gray-100">{plan.price}</span>
                    {plan.originalPrice && (
                      <span className="text-lg text-gray-500 line-through ml-1">{plan.originalPrice}</span>
                    )}
                  </div>
                  {plan.priceLabel && (
                    <p className="text-xs text-violet-400 mt-2 font-medium">{plan.priceLabel}</p>
                  )}
                  <p className="text-gray-400 mt-2 text-xs leading-relaxed">{plan.desc}</p>
                </div>
                <ul className="space-y-4 mb-8 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-xs text-gray-300">
                      <Check className="w-4 h-4 text-violet-400 shrink-0 mt-0.5" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Button 
                  variant="ghost"
                  className={`w-full py-6 rounded-xl font-bold transition-all duration-300 border-0 ${
                    plan.popular 
                      ? "bg-white text-black hover:bg-zinc-200 hover:scale-[1.02]" 
                      : "bg-white/10 text-white hover:bg-white/20 hover:scale-[1.02]"
                  }`}
                  onClick={() => {
                    if (plan.name === "Enterprise") {
                      window.location.href = "mailto:teamtryvoke@gmail.com";
                    } else {
                      handleAuthNavigation();
                    }
                  }}
                >
                  {plan.cta}
                </Button>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Creative Sandbox Portal CTA Section */}
      <section className="py-24 relative overflow-hidden">
        <div className="absolute inset-0 bg-[#030305] pointer-events-none" />
        <div className="container mx-auto px-4 md:px-6 relative z-10 max-w-6xl">
          <div className="bg-gradient-to-b from-[#0c0c14]/90 to-[#06060a]/95 border border-white/10 rounded-[3rem] p-12 md:p-24 text-center relative overflow-hidden shadow-2xl backdrop-blur-xl">
            
            {/* Ambient center glow */}
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(139,92,246,0.1),transparent_70%)] pointer-events-none z-0" />
            
            {/* Subtle dot matrix lines inside the portal */}
            <div className="absolute inset-0 bg-[radial-gradient(rgba(255,255,255,0.015)_1px,transparent_1px)] bg-[size:20px_20px] pointer-events-none opacity-80" />

            {/* Left Floating Card: Voke Verified Scorecard Match */}
            <div 
              className="absolute left-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2 p-4 bg-zinc-950/90 border border-white/10 rounded-2xl w-[190px] text-left shadow-2xl backdrop-blur-xl z-10 animate-pulse"
              style={{ animationDuration: '6s' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Scorecard</span>
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-ping" />
              </div>
              <p className="text-[10px] font-bold text-gray-200">Verified Voke Match</p>
              <div className="space-y-1 mt-1">
                <div className="flex justify-between text-[8px] text-gray-400">
                  <span>Compatibility</span>
                  <span className="text-violet-400 font-bold">94%</span>
                </div>
                <div className="w-full h-1 bg-white/5 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-violet-500 to-fuchsia-500 rounded-full" style={{ width: '94%' }} />
                </div>
              </div>
            </div>

            {/* Right Floating Card: Pacing & Speaking Cadence feedback */}
            <div 
              className="absolute right-8 top-1/2 -translate-y-1/2 hidden xl:flex flex-col gap-2 p-4 bg-zinc-950/90 border border-white/10 rounded-2xl w-[200px] text-left shadow-2xl backdrop-blur-xl z-10 animate-pulse"
              style={{ animationDuration: '8s' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">Speech Pacing</span>
                <span className="text-[8px] text-emerald-400 font-bold bg-emerald-950/40 px-1.5 py-0.5 rounded">Optimal</span>
              </div>
              <p className="text-[10px] font-bold text-gray-200">Speaking Pacing Tracker</p>
              
              <div className="flex gap-1 items-end h-6 mt-1.5">
                {[5, 12, 18, 14, 8, 16, 20, 10, 6].map((h, i) => (
                  <span 
                    key={i} 
                    className="flex-1 rounded-sm bg-gradient-to-t from-fuchsia-500 to-violet-500" 
                    style={{ height: `${h}px` }} 
                  />
                ))}
              </div>
            </div>

            {/* Main CTA Headlines & Actions */}
            <div className="relative z-10 space-y-6 max-w-xl mx-auto">
              <h2 className="text-3xl md:text-5xl font-extrabold text-white tracking-tight leading-tight">
                Ready to take the<br />
                <span className="bg-gradient-to-r from-violet-400 to-fuchsia-400 bg-clip-text text-transparent">
                  interview sandbox?
                </span>
              </h2>
              <p className="text-sm md:text-base text-gray-400 leading-relaxed">
                Create a free account to test your skills, practice mock voice and video rounds, 
                and fast-track matches with tech employers.
              </p>
              <div className="pt-4">
                <Button
                  onClick={handleAuthNavigation}
                  className="bg-white text-black hover:bg-zinc-200 text-sm px-10 h-13 rounded-full font-bold shadow-2xl hover:shadow-violet-600/10 transition-all duration-300 hover:scale-105 flex items-center justify-center border-0 mx-auto"
                >
                  Get Started for Free
                  <ArrowRight className="ml-2 w-4 h-4" />
                </Button>
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Footer (Voke Logo added, generic sparkles icon removed) */}
      <footer className="bg-black border-t border-white/10 pt-20 pb-10 relative z-10">
        <div className="container mx-auto px-4 md:px-6">
          <div className="grid md:grid-cols-4 gap-12 mb-16">
            <div className="col-span-1 md:col-span-2 space-y-6">
              <div className="flex items-center gap-2">
                <img 
                  src="/images/voke_logo.png" 
                  alt="Voke Logo" 
                  className="w-8 h-8 object-contain"
                />
                <span className="text-2xl font-bold text-white">Voke</span>
              </div>
              <p className="text-gray-400 max-w-sm leading-relaxed text-sm">
                AI interview simulation sandbox. Practice smarter with voice analytics, verbal structure feedback, and technical compilers.
              </p>
            </div>
            
            <div>
              <h4 className="font-bold text-white mb-6 text-sm">Product</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="#features" className="hover:text-violet-400 transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-violet-400 transition-colors">Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-violet-400 transition-colors">How it Works</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-bold text-white mb-6 text-sm">Support</h4>
              <ul className="space-y-4 text-gray-400 text-sm">
                <li><a href="mailto:support@voke.ai" className="hover:text-violet-400 transition-colors">Contact Support</a></li>
                <li><a href="mailto:teamtryvoke@gmail.com" className="hover:text-violet-400 transition-colors">Enterprise Sales</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-white/10 pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-gray-500 text-xs">
              © {new Date().getFullYear()} Voke AI. All rights reserved.
            </p>
            <div className="flex items-center gap-6 text-xs">
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Privacy Policy</a>
              <a href="#" className="text-gray-500 hover:text-white transition-colors">Terms of Service</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;