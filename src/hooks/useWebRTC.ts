import { useEffect, useRef, useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';

const STUN_SERVERS = {
  iceServers: [
    { urls: 'stun:stun.l.google.com:19302' },
    { urls: 'stun:stun1.l.google.com:19302' },
    { urls: 'stun:stun2.l.google.com:19302' },
    { urls: 'stun:stun3.l.google.com:19302' },
    { urls: 'stun:stun4.l.google.com:19302' },
  ],
};

export const useWebRTC = (sessionId: string | undefined, userId: string | null) => {
  const [localStream, setLocalStream] = useState<MediaStream | null>(null);
  const [remoteStream, setRemoteStream] = useState<MediaStream | null>(null);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [connectionStatus, setConnectionStatus] = useState<'connecting' | 'connected' | 'disconnected' | 'failed' | 'checking'>('connecting');

  const [lastMessage, setLastMessage] = useState<{sender: string, text: string, time: string} | null>(null);
  const peerConnection = useRef<RTCPeerConnection | null>(null);
  const channel = useRef<any>(null);

  useEffect(() => {
    if (!sessionId || !userId) return;

    const initialize = async () => {
      try {
        // ... (existing media setup) ...
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
        setLocalStream(stream);

        peerConnection.current = new RTCPeerConnection(STUN_SERVERS);
        stream.getTracks().forEach((track) => {
          peerConnection.current?.addTrack(track, stream);
        });

        peerConnection.current.ontrack = (event) => {
          console.log("Track received:", event.streams[0].id);
          setRemoteStream(event.streams[0]);
        };

        peerConnection.current.oniceconnectionstatechange = () => {
          const state = peerConnection.current?.iceConnectionState;
          console.log("ICE Connection State:", state);
          
          if (state === 'connected' || state === 'completed') {
            setConnectionStatus('connected');
          } else if (state === 'failed' || state === 'disconnected' || state === 'closed') {
            setConnectionStatus('failed');
          } else if (state === 'checking') {
            setConnectionStatus('checking');
            toast.info("Establishing connection path...");
          }
        };

        peerConnection.current.onicecandidate = (event) => {
          if (event.candidate) {
            channel.current?.send({
              type: 'broadcast',
              event: 'ice-candidate',
              payload: { candidate: event.candidate, userId },
            });
          }
        };

        channel.current = supabase.channel(`room:${sessionId}`, {
          config: {
            broadcast: { self: false },
          },
        });

        channel.current
          .on('broadcast', { event: 'offer' }, async ({ payload }: any) => {
            if (!peerConnection.current) return;
            if (payload.userId === userId) return;
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.offer));
            const answer = await peerConnection.current.createAnswer();
            await peerConnection.current.setLocalDescription(answer);
            channel.current.send({
              type: 'broadcast',
              event: 'answer',
              payload: { answer, userId },
            });
          })
          .on('broadcast', { event: 'answer' }, async ({ payload }: any) => {
            if (!peerConnection.current) return;
            if (payload.userId === userId) return;
            await peerConnection.current.setRemoteDescription(new RTCSessionDescription(payload.answer));
          })
          .on('broadcast', { event: 'ice-candidate' }, async ({ payload }: any) => {
            if (!peerConnection.current) return;
            if (payload.userId === userId) return;
            try {
              await peerConnection.current.addIceCandidate(new RTCIceCandidate(payload.candidate));
            } catch (e) {
              console.error('Error adding received ice candidate', e);
            }
          })
          .on('broadcast', { event: 'chat' }, ({ payload }: any) => {
             setLastMessage(payload);
          })
          .subscribe((status: string) => {
            if (status === 'SUBSCRIBED') {
              console.log('Subscribed to signaling channel');
            }
          });

      } catch (error) {
        console.error('Error initializing WebRTC:', error);
        toast.error('Failed to access camera/microphone');
        setConnectionStatus('failed');
      }
    };

    initialize();

    return () => {
      localStream?.getTracks().forEach(track => track.stop());
      peerConnection.current?.close();
      supabase.removeChannel(channel.current);
    };
  }, [sessionId, userId]);

  // ... (existing helper functions) ...

  const sendMessage = (text: string) => {
    const message = {
      sender: 'Remote Peer', // In a real app, send the actual name
      text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    };
    channel.current?.send({
      type: 'broadcast',
      event: 'chat',
      payload: message,
    });
  };



  // Helper to start the call (create offer)
  const startCall = async () => {
    if (!peerConnection.current) return;
    console.log('Starting call (creating offer)...');
    try {
      const offer = await peerConnection.current.createOffer();
      await peerConnection.current.setLocalDescription(offer);
      channel.current?.send({
        type: 'broadcast',
        event: 'offer',
        payload: { offer, userId },
      });
    } catch (err) {
      console.error('Error creating offer:', err);
    }
  };

  const toggleAudio = () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(track => {
        track.enabled = !isAudioEnabled;
      });
      setIsAudioEnabled(!isAudioEnabled);
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      localStream.getVideoTracks().forEach(track => {
        track.enabled = !isVideoEnabled;
      });
      setIsVideoEnabled(!isVideoEnabled);
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];

      if (peerConnection.current) {
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(screenTrack);
        }
      }

      // Update local stream to show screen share
      setLocalStream(screenStream);

      // Handle stop sharing from browser UI
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (err) {
      console.error("Error starting screen share:", err);
    }
  };

  const stopScreenShare = async () => {
    try {
      const cameraStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
      const videoTrack = cameraStream.getVideoTracks()[0];

      if (peerConnection.current) {
        const sender = peerConnection.current.getSenders().find(s => s.track?.kind === 'video');
        if (sender) {
          sender.replaceTrack(videoTrack);
        }
      }

      setLocalStream(cameraStream);
    } catch (err) {
      console.error("Error stopping screen share:", err);
    }
  };

  const endCall = () => {
    localStream?.getTracks().forEach(track => track.stop());
    peerConnection.current?.close();
    setLocalStream(null);
    setRemoteStream(null);
    setConnectionStatus('disconnected');
  };

  return {
    localStream,
    remoteStream,
    isAudioEnabled,
    isVideoEnabled,
    connectionStatus,
    lastMessage,
    toggleAudio,
    toggleVideo,
    startScreenShare,
    stopScreenShare,
    endCall,
    startCall,
    sendMessage
  };
};
