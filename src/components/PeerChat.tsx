import React, { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { MessageSquare, Send } from 'lucide-react';

interface ChatMessage {
  sender: string;
  text: string;
  time: string;
}

interface PeerChatProps {
  sessionId: string;
  currentUserId: string;
  otherUserName: string;
}

export const PeerChat = ({ sessionId, currentUserId, otherUserName }: PeerChatProps) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const channelRef = useRef<any>(null);

  useEffect(() => {
    if (!isOpen) return;

    // Initialize Realtime Channel for Chat
    channelRef.current = supabase.channel(`chat:${sessionId}`, {
      config: {
        broadcast: { self: false },
      },
    });

    channelRef.current
      .on('broadcast', { event: 'message' }, ({ payload }: any) => {
        setMessages(prev => [...prev, payload]);
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channelRef.current);
    };
  }, [sessionId, isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages]);

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;

    const msg: ChatMessage = {
      sender: 'You',
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    // Optimistic update
    setMessages(prev => [...prev, msg]);

    // Send to peer
    channelRef.current?.send({
      type: 'broadcast',
      event: 'message',
      payload: {
        sender: otherUserName, // When they receive it, it comes from "otherUserName" (conceptually)
        // Actually, let's send the sender's name so the receiver knows who sent it.
        // But for "You" vs "Them" logic:
        // Receiver receives: { sender: "SenderName", text: "..." }
        // We need to know if it's "Me" or "Them".
        // Simplified: Just send the text and let the receiver label it as "Peer".
        text: newMessage,
        time: msg.time
      }
    });

    setNewMessage("");
  };

  return (
    <Sheet open={isOpen} onOpenChange={setIsOpen}>
      <SheetTrigger asChild>
        <Button variant="outline" size="icon">
          <MessageSquare className="w-4 h-4" />
        </Button>
      </SheetTrigger>
      <SheetContent className="w-[400px] sm:w-[540px] flex flex-col h-full">
        <SheetHeader>
          <SheetTitle>Chat with {otherUserName}</SheetTitle>
        </SheetHeader>
        
        <div className="flex-1 overflow-hidden flex flex-col mt-4 border rounded-md">
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`flex flex-col ${msg.sender === 'You' ? 'items-end' : 'items-start'}`}
                >
                  <div 
                    className={`max-w-[80%] rounded-lg px-3 py-2 text-sm ${
                      msg.sender === 'You' 
                        ? 'bg-primary text-primary-foreground' 
                        : 'bg-muted'
                    }`}
                  >
                    {msg.text}
                  </div>
                  <span className="text-[10px] text-muted-foreground mt-1">
                    {msg.time}
                  </span>
                </div>
              ))}
              <div ref={scrollRef} />
            </div>
          </ScrollArea>
          
          <div className="p-4 border-t bg-background">
            <form onSubmit={sendMessage} className="flex gap-2">
              <Input 
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder="Type a message..."
                className="flex-1"
              />
              <Button type="submit" size="icon">
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
};
