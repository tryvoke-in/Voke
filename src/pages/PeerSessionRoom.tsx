import { useEffect, useState, useRef } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { 
  Mic, MicOff, Video, VideoOff, PhoneOff, 
  MessageSquare, MonitorUp, MoreVertical, 
  Users, Hand, Code, Copy, Send, UserPlus
} from "lucide-react";
import { toast } from "sonner";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useWebRTC } from "@/hooks/useWebRTC";
import { supabase } from "@/integrations/supabase/client";

const PeerSessionRoom = () => {
  const { sessionId } = useParams();
  const navigate = useNavigate();
  const [userId, setUserId] = useState<string | null>(null);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [activeSidePanel, setActiveSidePanel] = useState<'chat' | 'info' | 'code' | null>(null);
  const [messages, setMessages] = useState<{sender: string, text: string, time: string}[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [currentTime, setCurrentTime] = useState(new Date());
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const getUser = async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) setUserId(user.id);
    };
    getUser();

    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    connectionStatus,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    endCall: endWebRTCCall,
    startCall,
    sendMessage: sendWebRTCMessage,
    lastMessage
  } = useWebRTC(sessionId, userId);

  // Handle incoming messages
  useEffect(() => {
    if (lastMessage) {
      setMessages(prev => [...prev, lastMessage]);
    }
  }, [lastMessage]);

  // Attach streams to video elements
  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      console.log("Setting remote stream:", remoteStream.id, remoteStream.getTracks());
      remoteVideoRef.current.srcObject = remoteStream;
      
      remoteVideoRef.current.onloadedmetadata = () => {
        console.log("Remote video loaded metadata. Trying to play...");
        remoteVideoRef.current?.play().catch(e => console.error("Error playing remote video:", e));
      };
      
      // Listen for track mute/unmute events
      remoteStream.getTracks().forEach(track => {
        track.onmute = () => console.log(`Remote track ${track.kind} muted`);
        track.onunmute = () => console.log(`Remote track ${track.kind} unmuted`);
      });
    }
  }, [remoteStream]);

  // Auto-start call when ready (simple logic for now)
  useEffect(() => {
    if (userId && sessionId) {
      // Small delay to ensure channel is ready, or use a button
      // For better UX, let's just show a "Connect" button or auto-connect after a delay
      const timer = setTimeout(() => {
        startCall();
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [userId, sessionId]);

  const sendMessage = (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newMessage.trim()) return;
    
    const msg = {
      sender: "You",
      text: newMessage,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };

    setMessages([...messages, msg]);
    sendWebRTCMessage(newMessage);
    setNewMessage("");
  };

  const handleEndCall = () => {
    endWebRTCCall();
    toast.success("Session ended");
    navigate("/peer-interviews");
  };

  return (
    <div className="h-screen bg-[#202124] text-white overflow-hidden flex flex-col">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 z-10 flex justify-between items-start pointer-events-none">
        <div className="bg-black/40 backdrop-blur-md px-4 py-2 rounded-lg pointer-events-auto">
          <h1 className="font-medium text-sm flex items-center gap-2">
            <Users className="w-4 h-4 text-blue-400" />
            Peer Interview Session
            <Badge variant="outline" className="ml-2 border-white/20 text-white text-[10px] h-5">
              {sessionId?.slice(0, 8)}
            </Badge>
            <Badge variant={connectionStatus === 'connected' ? 'default' : 'destructive'} className="ml-2 h-5 text-[10px]">
              {connectionStatus}
            </Badge>
          </h1>
        </div>
      </div>

      {/* Main Video Grid */}
      <div className={`flex-1 p-4 flex gap-4 transition-all duration-300 ${activeSidePanel ? 'pr-[360px]' : ''}`}>
        <div className="flex-1 grid grid-cols-1 md:grid-cols-2 gap-4 h-full max-h-[calc(100vh-100px)]">
          
          {/* Remote Peer */}
          <div className="relative bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl group">
            {remoteStream ? (
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover" 
              />
            ) : (
              <div className="w-full h-full flex flex-col items-center justify-center bg-[#202124]">
                <div className="relative">
                  <div className="absolute inset-0 rounded-full border-t-4 border-blue-500 animate-spin"></div>
                  <Avatar className="w-24 h-24">
                    <AvatarFallback className="text-2xl bg-muted text-muted-foreground">...</AvatarFallback>
                  </Avatar>
                </div>
                <p className="mt-4 text-muted-foreground animate-pulse">Waiting for peer to join...</p>
                <Button variant="outline" size="sm" className="mt-4" onClick={startCall}>
                  Retry Connection
                </Button>
              </div>
            )}
            <div className="absolute bottom-4 left-4">
              <span className="text-sm font-medium text-white drop-shadow-md">Remote Peer</span>
            </div>
          </div>

          {/* Local User */}
          <div className="relative bg-[#3c4043] rounded-2xl overflow-hidden shadow-2xl">
            {isVideoEnabled ? (
              <video 
                ref={localVideoRef} 
                autoPlay 
                muted 
                playsInline 
                className="w-full h-full object-cover transform scale-x-[-1]" 
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <Avatar className="w-32 h-32">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="text-4xl bg-blue-600">ME</AvatarFallback>
                </Avatar>
              </div>
            )}
            <div className="absolute bottom-4 left-4">
              <span className="text-sm font-medium text-white drop-shadow-md">You</span>
            </div>
            {!isAudioEnabled && (
              <div className="absolute top-4 right-4 bg-red-500/90 p-1.5 rounded-full">
                <MicOff className="w-4 h-4 text-white" />
              </div>
            )}
          </div>

        </div>
      </div>

      {/* Bottom Control Bar */}
      <div className="h-20 bg-[#202124] border-t border-white/10 flex items-center justify-between px-6 z-20">
        <div className="flex items-center gap-4 min-w-[200px]">
          <span className="text-sm font-medium text-gray-300">
            {currentTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <div className="h-4 w-[1px] bg-white/20" />
          <span className="text-sm text-gray-300 truncate max-w-[150px]">
            {sessionId}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isAudioEnabled ? "secondary" : "destructive"}
                  size="icon" 
                  className={`rounded-full w-12 h-12 ${isAudioEnabled ? 'bg-[#3c4043] hover:bg-[#4a4e51] text-white border-none' : ''}`}
                  onClick={toggleAudio}
                >
                  {isAudioEnabled ? <Mic className="w-5 h-5" /> : <MicOff className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Turn {isAudioEnabled ? 'off' : 'on'} microphone</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant={isVideoEnabled ? "secondary" : "destructive"}
                  size="icon" 
                  className={`rounded-full w-12 h-12 ${isVideoEnabled ? 'bg-[#3c4043] hover:bg-[#4a4e51] text-white border-none' : ''}`}
                  onClick={toggleVideo}
                >
                  {isVideoEnabled ? <Video className="w-5 h-5" /> : <VideoOff className="w-5 h-5" />}
                </Button>
              </TooltipTrigger>
              <TooltipContent>Turn {isVideoEnabled ? 'off' : 'on'} camera</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="secondary"
                  size="icon" 
                  className={`rounded-full w-12 h-12 bg-[#3c4043] hover:bg-[#4a4e51] text-white border-none ${isScreenSharing ? 'text-blue-400' : ''}`}
                  onClick={() => {
                    if (isScreenSharing) {
                      stopScreenShare();
                      setIsScreenSharing(false);
                    } else {
                      startScreenShare();
                      setIsScreenSharing(true);
                    }
                  }}
                >
                  <MonitorUp className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>{isScreenSharing ? 'Stop presenting' : 'Present now'}</TooltipContent>
            </Tooltip>

            <Button 
              variant="destructive" 
              className="rounded-full px-6 h-12 ml-2 bg-red-600 hover:bg-red-700"
              onClick={handleEndCall}
            >
              <PhoneOff className="w-5 h-5 mr-2" />
              End Call
            </Button>
          </TooltipProvider>
        </div>

        <div className="flex items-center gap-3 min-w-[200px] justify-end">
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`text-white hover:bg-[#3c4043] ${activeSidePanel === 'info' ? 'text-blue-400' : ''}`}
                  onClick={() => setActiveSidePanel(activeSidePanel === 'info' ? null : 'info')}
                >
                  <Users className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Participants</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`text-white hover:bg-[#3c4043] ${activeSidePanel === 'chat' ? 'text-blue-400' : ''}`}
                  onClick={() => setActiveSidePanel(activeSidePanel === 'chat' ? null : 'chat')}
                >
                  <MessageSquare className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Chat</TooltipContent>
            </Tooltip>

            <Tooltip>
              <TooltipTrigger asChild>
                <Button 
                  variant="ghost" 
                  size="icon"
                  className={`text-white hover:bg-[#3c4043] ${activeSidePanel === 'code' ? 'text-blue-400' : ''}`}
                  onClick={() => setActiveSidePanel(activeSidePanel === 'code' ? null : 'code')}
                >
                  <Code className="w-5 h-5" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>Code Editor</TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Side Panel */}
      <div className={`absolute top-4 bottom-24 right-4 w-[340px] bg-[#202124] rounded-2xl shadow-2xl border border-white/10 transform transition-transform duration-300 flex flex-col overflow-hidden z-30 ${activeSidePanel ? 'translate-x-0' : 'translate-x-[400px]'}`}>
        <div className="p-4 border-b border-white/10 flex justify-between items-center bg-[#202124]">
          <h3 className="font-medium text-lg">
            {activeSidePanel === 'chat' && 'In-call messages'}
            {activeSidePanel === 'info' && 'People'}
            {activeSidePanel === 'code' && 'Collaborative Editor'}
          </h3>
          <Button variant="ghost" size="sm" onClick={() => setActiveSidePanel(null)}>
            Close
          </Button>
        </div>

        {activeSidePanel === 'chat' && (
          <>
            <ScrollArea className="flex-1 p-4">
              <div className="space-y-4">
                {messages.map((msg, i) => (
                  <div key={i} className={`p-3 rounded-lg ${msg.sender === 'You' ? 'bg-blue-600 rounded-tr-none ml-auto max-w-[85%]' : 'bg-[#3c4043] rounded-tl-none mr-auto max-w-[85%]'}`}>
                    <div className="flex justify-between items-baseline mb-1 gap-2">
                      <span className="font-semibold text-sm">{msg.sender}</span>
                      <span className="text-xs text-gray-300/80">{msg.time}</span>
                    </div>
                    <p className="text-sm text-white">{msg.text}</p>
                  </div>
                ))}
              </div>
            </ScrollArea>
            <div className="p-4 border-t border-white/10 bg-[#202124]">
              <form onSubmit={sendMessage} className="relative">
                <Input 
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Send a message..." 
                  className="bg-[#3c4043] border-none text-white pr-10 rounded-full"
                />
                <Button 
                  type="submit" 
                  size="icon" 
                  variant="ghost" 
                  className="absolute right-1 top-1/2 -translate-y-1/2 text-blue-400 hover:text-blue-300 hover:bg-transparent"
                >
                  <Send className="w-4 h-4" />
                </Button>
              </form>
            </div>
          </>
        )}

        {activeSidePanel === 'info' && (
          <div className="p-4 space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-400">Participants</span>
              <Button variant="ghost" size="icon" className="h-8 w-8"><UserPlus className="w-4 h-4" /></Button>
            </div>
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <Avatar className="w-8 h-8">
                  <AvatarImage src="/placeholder-user.jpg" />
                  <AvatarFallback className="bg-blue-600 text-xs">ME</AvatarFallback>
                </Avatar>
                <div className="flex-1">
                  <p className="text-sm font-medium">You</p>
                </div>
                <Mic className="w-4 h-4 text-gray-400" />
              </div>
            </div>
          </div>
        )}

        {activeSidePanel === 'code' && (
          <div className="flex-1 flex flex-col">
            <div className="p-2 bg-[#3c4043] flex items-center justify-between">
              <Badge variant="outline" className="text-xs border-white/20">JavaScript</Badge>
              <Button variant="ghost" size="sm" className="h-6 text-xs"><Copy className="w-3 h-3 mr-1" /> Copy</Button>
            </div>
            <div className="flex-1 bg-[#1e1e1e] p-4 font-mono text-sm text-gray-300 overflow-auto">
              <pre>{`// Collaborative Code Editor
// Start typing to share code...`}</pre>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PeerSessionRoom;
