import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, X, MessageSquare, Sparkles, Zap, Bot, User } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion"; // Changed to framer-motion unique import if possible, or stick to "framer-motion" user seems to have motion/react or framer-motion. Previous file used "motion/react". Let's check imports. 
// The previous file used: import { motion, AnimatePresence } from "motion/react"; 
// I will check the imports again. Step 37 showed: import { motion, AnimatePresence } from "motion/react";
// However, other files like Index.tsx (Step 21) used: import { motion, useScroll, useTransform, AnimatePresence } from "framer-motion";
// I will use "framer-motion" as it is more standard and utilized in Index.tsx.
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
  role: "user" | "assistant";
  content: string;
}

const GlobalAIChatbot = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    checkAuth();
  }, []);

  useEffect(() => {
    const handleOpenChat = () => setIsOpen(true);
    window.addEventListener("open-ai-coach", handleOpenChat);
    return () => window.removeEventListener("open-ai-coach", handleOpenChat);
  }, []);

  useEffect(() => {
    if (isOpen && scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages, isOpen]);

  const chatWindowRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (
        isOpen && 
        chatWindowRef.current && 
        !chatWindowRef.current.contains(event.target as Node) &&
        buttonRef.current &&
        !buttonRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [isOpen]);

  const checkAuth = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.user) {
      setUserId(session.user.id);
    }
  };

  const sendMessage = async (messageText?: string) => {
    const text = messageText || input.trim();
    if (!text || loading) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages(prev => [...prev, userMessage]);
    setInput("");
    setLoading(true);

    try {
      const { data, error } = await supabase.functions.invoke("interview-coach-chat", {
        body: {
          messages: [...messages, userMessage],
          userContext: "You are a strict AI study and interview assistant. You MUST ONLY answer questions related to interviews, career advice, coding, technical concepts, or study materials. If a user asks about anything else, politely refuse and steer them back to interview/study topics."
        }
      });

      if (error) throw error;

      if (data?.response) {
        const assistantMessage: Message = { role: "assistant", content: data.response };
        setMessages(prev => [...prev, assistantMessage]);
      }
    } catch (error: any) {
      console.error("Error sending message:", error);
      toast.error("Failed to get response from AI assistant");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end pointer-events-none">
      <AnimatePresence>
        {isOpen && (
          <motion.div
            ref={chatWindowRef}
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.9 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
            className="mb-6 w-[360px] md:w-[420px] pointer-events-auto"
          >
            {/* Glassmorphism Container */}
            <div className="relative overflow-hidden rounded-3xl border border-white/10 bg-black/80 backdrop-blur-xl shadow-2xl flex flex-col h-[600px]">
              
              {/* Decorative Gradients */}
              <div className="absolute top-0 left-0 w-full h-32 bg-gradient-to-b from-violet-600/20 to-transparent pointer-events-none" />
              <div className="absolute -top-20 -right-20 w-64 h-64 bg-fuchsia-600/20 rounded-full blur-3xl pointer-events-none" />
              <div className="absolute bottom-0 left-0 w-full h-24 bg-gradient-to-t from-black/50 to-transparent pointer-events-none" />

              {/* Header */}
              <div className="relative z-10 p-4 border-b border-white/5 flex items-center justify-between bg-white/5 backdrop-blur-md">
                <div className="flex items-center gap-3">
                  <div className="relative">
                    <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-violet-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-violet-500/20">
                      <Bot className="w-6 h-6 text-white" />
                    </div>
                    <span className="absolute -bottom-1 -right-1 flex h-3 w-3">
                      <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                      <span className="relative inline-flex rounded-full h-3 w-3 bg-green-500 border-2 border-black"></span>
                    </span>
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-sm tracking-wide">Voke Assistant</h3>
                    <div className="flex items-center gap-1.5">
                      <Sparkles className="w-3 h-3 text-fuchsia-400" />
                      <p className="text-[10px] font-medium text-fuchsia-400/90 uppercase tracking-widest">AI Online</p>
                    </div>
                  </div>
                </div>
                <Button 
                  variant="ghost" 
                  size="icon" 
                  className="text-gray-400 hover:text-white hover:bg-white/10 rounded-full transition-colors"
                  onClick={() => setIsOpen(false)}
                >
                  <X className="w-5 h-5" />
                </Button>
              </div>

              {/* Messages Area */}
              <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                {messages.length === 0 ? (
                  <div className="h-full flex flex-col items-center justify-center text-center p-6 mt-10">
                    <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-violet-500/10 to-fuchsia-500/10 flex items-center justify-center mb-6 border border-white/5 shadow-inner">
                      <Brain className="w-8 h-8 text-violet-400" />
                    </div>
                    <h4 className="text-xl font-bold text-white mb-2">How can I help you?</h4>
                    <p className="text-sm text-gray-400 mb-8 max-w-[240px]">
                      Ask me anything about interviews, coding problems, or career advice.
                    </p>
                    
                    <div className="grid gap-2 w-full">
                      {[
                        "How do I prepare for System Design?", 
                        "Explain Dynamic Programming", 
                        "Mock interview tips"
                      ].map((suggestion, i) => (
                        <button
                          key={i}
                          onClick={() => sendMessage(suggestion)}
                          className="text-xs text-left px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 hover:border-violet-500/30 text-gray-300 hover:text-white transition-all duration-300 flex items-center gap-2 group"
                        >
                          <Zap className="w-3 h-3 text-yellow-500/50 group-hover:text-yellow-400 transition-colors" />
                          {suggestion}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6 pb-4">
                    {messages.map((message, index) => (
                      <motion.div
                        initial={{ opacity: 0, y: 10, scale: 0.95 }}
                        animate={{ opacity: 1, y: 0, scale: 1 }}
                        key={index}
                        className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
                      >
                        {message.role === "assistant" && (
                          <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center border border-violet-500/30 shrink-0 mt-1">
                            <Bot className="w-4 h-4 text-violet-400" />
                          </div>
                        )}
                        
                        <div
                          className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-md ${
                            message.role === "user"
                              ? "bg-gradient-to-br from-violet-600 to-indigo-600 text-white rounded-tr-sm"
                              : "bg-white/10 border border-white/5 text-gray-100 rounded-tl-sm backdrop-blur-sm"
                          }`}
                        >
                          {message.role === "assistant" ? (
                            <div className="prose prose-invert prose-sm max-w-none prose-p:leading-relaxed prose-pre:bg-black/50 prose-pre:border prose-pre:border-white/10">
                              <ReactMarkdown>{message.content}</ReactMarkdown>
                            </div>
                          ) : (
                            message.content
                          )}
                        </div>

                        {message.role === "user" && (
                          <div className="w-8 h-8 rounded-full bg-gray-800 flex items-center justify-center border border-white/10 shrink-0 mt-1">
                            <User className="w-4 h-4 text-gray-400" />
                          </div>
                        )}
                      </motion.div>
                    ))}
                    {loading && (
                      <div className="flex gap-3 justify-start">
                        <div className="w-8 h-8 rounded-full bg-violet-600/20 flex items-center justify-center border border-violet-500/30 shrink-0 mt-1">
                          <Bot className="w-4 h-4 text-violet-400" />
                        </div>
                        <div className="bg-white/5 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-1.5">
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.3s]"></span>
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce [animation-delay:-0.15s]"></span>
                          <span className="w-1.5 h-1.5 bg-violet-400 rounded-full animate-bounce"></span>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </ScrollArea>

              {/* Input Area */}
              <div className="p-4 bg-black/40 backdrop-blur-md border-t border-white/5 relative z-10">
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    sendMessage();
                  }}
                  className="relative flex items-center gap-2"
                >
                  <Input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Ask a follow up question..."
                    disabled={loading}
                    className="flex-1 h-12 bg-white/5 border-white/10 text-white placeholder:text-gray-500 rounded-xl focus:border-violet-500/50 focus:ring-violet-500/20 transition-all pl-4 pr-12"
                  />
                  <Button 
                    type="submit" 
                    disabled={loading || !input.trim()} 
                    size="icon" 
                    className="absolute right-1.5 top-1.5 h-9 w-9 bg-gradient-to-r from-violet-600 to-indigo-600 hover:opacity-90 transition-opacity rounded-lg text-white shadow-lg"
                  >
                    <Send className="w-4 h-4" />
                  </Button>
                </form>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Floating Action Button */}
      <motion.button
        ref={buttonRef}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => setIsOpen(!isOpen)}
        className="pointer-events-auto relative group"
      >
        <div className={`absolute inset-0 rounded-full blur-xl transition-all duration-300 ${isOpen ? "bg-red-500/30" : "bg-violet-600/40 group-hover:bg-violet-600/60"}`}></div>
        <div className={`
          relative flex items-center justify-center w-16 h-16 rounded-full shadow-2xl border border-white/10 backdrop-blur-md transition-all duration-500
          ${isOpen ? "bg-black text-red-500 rotate-90" : "bg-gradient-to-br from-violet-600 via-indigo-600 to-fuchsia-600 text-white"}
        `}>
          <AnimatePresence mode="wait">
            {isOpen ? (
              <motion.div
                key="close"
                initial={{ opacity: 0, rotate: -90 }}
                animate={{ opacity: 1, rotate: 0 }}
                exit={{ opacity: 0, rotate: 90 }}
              >
                <X className="w-7 h-7" />
              </motion.div>
            ) : (
              <motion.div
                key="open"
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.5 }}
                className="relative"
              >
                <MessageSquare className="w-7 h-7 fill-white/20" />
                <span className="absolute -top-1 -right-1 flex h-3 w-3">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-white opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-3 w-3 bg-white"></span>
                </span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </motion.button>
    </div>
  );
};

export default GlobalAIChatbot;
