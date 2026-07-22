import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Brain, Send, Lightbulb, Target, MessageSquare } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";

interface Message {
    role: "user" | "assistant";
    content: string;
}

interface AICoachChatProps {
    userId: string;
}

const AICoachChat = ({ userId }: AICoachChatProps) => {
    const [messages, setMessages] = useState<Message[]>([]);
    const [input, setInput] = useState("");
    const [loading, setLoading] = useState(false);
    const [loadingHistory, setLoadingHistory] = useState(true);
    const scrollRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        loadChatHistory();
    }, [userId]);

    useEffect(() => {
        // Auto-scroll to bottom when new messages arrive
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages]);

    const loadChatHistory = async () => {
        try {
            const { data } = await supabase
                .from("chat_sessions")
                .select("*")
                .eq("user_id", userId)
                .order("updated_at", { ascending: false })
                .limit(1)
                .single();

            if (data?.messages) {
                setMessages(data.messages);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        } finally {
            setLoadingHistory(false);
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
                    userContext: "User is preparing for technical interviews"
                }
            });

            if (error) throw error;

            if (data?.response) {
                const assistantMessage: Message = { role: "assistant", content: data.response };
                setMessages(prev => [...prev, assistantMessage]);
            }
        } catch (error: any) {
            console.error("Error sending message:", error);
            toast.error("Failed to get response from AI coach");
        } finally {
            setLoading(false);
        }
    };

    const quickActions = [
        { label: "Interview Tips", icon: Lightbulb, message: "What are the top 5 tips for acing a technical interview?" },
        { label: "Behavioral Questions", icon: MessageSquare, message: "How should I approach behavioral interview questions using the STAR method?" },
        { label: "Practice Questions", icon: Target, message: "Give me 3 practice questions for a senior software engineer role" }
    ];

    if (loadingHistory) {
        return (
            <div className="flex items-center justify-center py-12">
                <motion.div animate={{ rotate: 360 }} transition={{ duration: 2, repeat: Infinity, ease: "linear" }}>
                    <Brain className="h-8 w-8 text-primary" />
                </motion.div>
            </div>
        );
    }

    return (
        <Card className="border-border/50 bg-card/50 backdrop-blur-sm h-[600px] flex flex-col">
            <CardHeader className="border-b border-border/50">
                <CardTitle className="flex items-center gap-2">
                    <Brain className="h-5 w-5 text-primary" />
                    AI Interview Coach
                </CardTitle>
                <CardDescription>Get personalized interview preparation advice</CardDescription>
            </CardHeader>

            <CardContent className="flex-1 flex flex-col p-0 overflow-hidden">
                {/* Messages Area */}
                <ScrollArea className="flex-1 p-4" ref={scrollRef}>
                    <AnimatePresence>
                        {messages.length === 0 ? (
                            <motion.div
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                className="text-center py-12"
                            >
                                <Brain className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
                                <h3 className="text-lg font-semibold mb-2">Start a Conversation</h3>
                                <p className="text-muted-foreground mb-6">Ask me anything about interview preparation!</p>

                                <div className="grid gap-3 max-w-md mx-auto">
                                    {quickActions.map((action, index) => (
                                        <Button
                                            key={index}
                                            variant="outline"
                                            className="justify-start"
                                            onClick={() => sendMessage(action.message)}
                                        >
                                            <action.icon className="h-4 w-4 mr-2" />
                                            {action.label}
                                        </Button>
                                    ))}
                                </div>
                            </motion.div>
                        ) : (
                            <div className="space-y-4">
                                {messages.map((message, index) => (
                                    <motion.div
                                        key={index}
                                        initial={{ opacity: 0, y: 10 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: 0.1 }}
                                        className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
                                    >
                                        <div
                                            className={`max-w-[80%] rounded-2xl px-4 py-3 ${message.role === "user"
                                                    ? "bg-primary text-primary-foreground"
                                                    : "bg-muted"
                                                }`}
                                        >
                                            {message.role === "assistant" ? (
                                                <div className="prose prose-sm dark:prose-invert max-w-none">
                                                    <ReactMarkdown>{message.content}</ReactMarkdown>
                                                </div>
                                            ) : (
                                                <p className="text-sm">{message.content}</p>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}

                                {loading && (
                                    <motion.div
                                        initial={{ opacity: 0 }}
                                        animate={{ opacity: 1 }}
                                        className="flex justify-start"
                                    >
                                        <div className="bg-muted rounded-2xl px-4 py-3">
                                            <div className="flex gap-1">
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0 }}
                                                    className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.2 }}
                                                    className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                                                />
                                                <motion.div
                                                    animate={{ scale: [1, 1.2, 1] }}
                                                    transition={{ duration: 0.6, repeat: Infinity, delay: 0.4 }}
                                                    className="w-2 h-2 bg-muted-foreground/50 rounded-full"
                                                />
                                            </div>
                                        </div>
                                    </motion.div>
                                )}
                            </div>
                        )}
                    </AnimatePresence>
                </ScrollArea>

                {/* Input Area */}
                <div className="border-t border-border/50 p-4">
                    <form
                        onSubmit={(e) => {
                            e.preventDefault();
                            sendMessage();
                        }}
                        className="flex gap-2"
                    >
                        <Input
                            value={input}
                            onChange={(e) => setInput(e.target.value)}
                            placeholder="Ask me anything about interviews..."
                            disabled={loading}
                            className="flex-1"
                        />
                        <Button type="submit" disabled={loading || !input.trim()} size="icon">
                            <Send className="h-4 w-4" />
                        </Button>
                    </form>
                </div>
            </CardContent>
        </Card>
    );
};

export default AICoachChat;
