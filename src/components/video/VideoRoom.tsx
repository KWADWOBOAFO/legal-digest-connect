import { useState, useEffect, useRef, useCallback } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Video, 
  VideoOff, 
  Mic, 
  MicOff, 
  PhoneOff, 
  Maximize2,
  Minimize2,
  Users
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

interface VideoRoomProps {
  roomId: string;
  onLeave: () => void;
}

interface SignalingMessage {
  type: 'offer' | 'answer' | 'ice-candidate';
  payload: any;
  sender: string;
}

export function VideoRoom({ roomId, onLeave }: VideoRoomProps) {
  const { user } = useAuth();
  const { toast } = useToast();
  
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isConnected, setIsConnected] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [participantCount, setParticipantCount] = useState(1);
  
  const localVideoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);
  const peerConnectionRef = useRef<RTCPeerConnection | null>(null);
  const localStreamRef = useRef<MediaStream | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const createPeerConnection = useCallback(() => {
    const config: RTCConfiguration = {
      iceServers: [
        { urls: 'stun:stun.l.google.com:19302' },
        { urls: 'stun:stun1.l.google.com:19302' },
      ]
    };

    const pc = new RTCPeerConnection(config);

    pc.onicecandidate = (event) => {
      if (event.candidate && channelRef.current) {
        channelRef.current.send({
          type: 'broadcast',
          event: 'signaling',
          payload: {
            type: 'ice-candidate',
            payload: event.candidate,
            sender: user?.id
          }
        });
      }
    };

    pc.ontrack = (event) => {
      console.log('Received remote track');
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = event.streams[0];
      }
      setIsConnected(true);
    };

    pc.onconnectionstatechange = () => {
      console.log('Connection state:', pc.connectionState);
      if (pc.connectionState === 'disconnected' || pc.connectionState === 'failed') {
        setIsConnected(false);
      }
    };

    return pc;
  }, [user?.id]);

  const handleSignalingMessage = useCallback(async (message: SignalingMessage) => {
    if (message.sender === user?.id) return;

    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      if (message.type === 'offer') {
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
        const answer = await pc.createAnswer();
        await pc.setLocalDescription(answer);
        
        channelRef.current?.send({
          type: 'broadcast',
          event: 'signaling',
          payload: {
            type: 'answer',
            payload: answer,
            sender: user?.id
          }
        });
      } else if (message.type === 'answer') {
        await pc.setRemoteDescription(new RTCSessionDescription(message.payload));
      } else if (message.type === 'ice-candidate') {
        await pc.addIceCandidate(new RTCIceCandidate(message.payload));
      }
    } catch (error) {
      console.error('Signaling error:', error);
    }
  }, [user?.id]);

  const startCall = useCallback(async () => {
    const pc = peerConnectionRef.current;
    if (!pc) return;

    try {
      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);
      
      channelRef.current?.send({
        type: 'broadcast',
        event: 'signaling',
        payload: {
          type: 'offer',
          payload: offer,
          sender: user?.id
        }
      });
    } catch (error) {
      console.error('Error starting call:', error);
    }
  }, [user?.id]);

  useEffect(() => {
    const initializeMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true
        });
        
        localStreamRef.current = stream;
        
        if (localVideoRef.current) {
          localVideoRef.current.srcObject = stream;
        }

        // Create peer connection and add tracks
        const pc = createPeerConnection();
        peerConnectionRef.current = pc;
        
        stream.getTracks().forEach(track => {
          pc.addTrack(track, stream);
        });

        // Set up signaling channel
        const channel = supabase.channel(`video-room-${roomId}`, {
          config: {
            presence: { key: user?.id }
          }
        });

        channel
          .on('broadcast', { event: 'signaling' }, ({ payload }) => {
            handleSignalingMessage(payload as SignalingMessage);
          })
          .on('presence', { event: 'sync' }, () => {
            const state = channel.presenceState();
            const count = Object.keys(state).length;
            setParticipantCount(count);
            
            // If we're not the first participant, start the call
            if (count > 1) {
              setTimeout(startCall, 1000);
            }
          })
          .on('presence', { event: 'join' }, () => {
            toast({
              title: 'Participant joined',
              description: 'Someone has joined the video call'
            });
          })
          .on('presence', { event: 'leave' }, () => {
            setIsConnected(false);
            toast({
              title: 'Participant left',
              description: 'Someone has left the video call'
            });
          })
          .subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
              await channel.track({ online_at: new Date().toISOString() });
            }
          });

        channelRef.current = channel;

      } catch (error) {
        console.error('Error accessing media devices:', error);
        toast({
          title: 'Camera/Microphone Error',
          description: 'Please allow access to camera and microphone',
          variant: 'destructive'
        });
      }
    };

    initializeMedia();

    return () => {
      // Cleanup
      localStreamRef.current?.getTracks().forEach(track => track.stop());
      peerConnectionRef.current?.close();
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [roomId, user?.id, createPeerConnection, handleSignalingMessage, startCall, toast]);

  const toggleVideo = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const videoTrack = stream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoEnabled(videoTrack.enabled);
      }
    }
  };

  const toggleAudio = () => {
    const stream = localStreamRef.current;
    if (stream) {
      const audioTrack = stream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsAudioEnabled(audioTrack.enabled);
      }
    }
  };

  const handleLeave = () => {
    localStreamRef.current?.getTracks().forEach(track => track.stop());
    peerConnectionRef.current?.close();
    onLeave();
  };

  const toggleFullscreen = () => {
    setIsFullscreen(!isFullscreen);
  };

  return (
    <div className={`${isFullscreen ? 'fixed inset-0 z-50 bg-background' : ''}`}>
      <Card className={`${isFullscreen ? 'h-full rounded-none' : ''}`}>
        <CardContent className="p-4">
          {/* Video Grid */}
          <div className={`grid gap-4 ${isFullscreen ? 'h-[calc(100vh-120px)]' : 'h-[400px]'} ${isConnected ? 'grid-cols-2' : 'grid-cols-1'}`}>
            {/* Remote Video */}
            {isConnected && (
              <div className="relative bg-muted rounded-lg overflow-hidden">
                <video
                  ref={remoteVideoRef}
                  autoPlay
                  playsInline
                  className="w-full h-full object-cover"
                />
                <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                  Remote
                </div>
              </div>
            )}
            
            {/* Local Video */}
            <div className={`relative bg-muted rounded-lg overflow-hidden ${!isConnected ? 'max-w-2xl mx-auto w-full' : ''}`}>
              <video
                ref={localVideoRef}
                autoPlay
                playsInline
                muted
                className={`w-full h-full object-cover ${!isVideoEnabled ? 'invisible' : ''}`}
              />
              {!isVideoEnabled && (
                <div className="absolute inset-0 flex items-center justify-center bg-muted">
                  <VideoOff className="h-12 w-12 text-muted-foreground" />
                </div>
              )}
              <div className="absolute bottom-2 left-2 bg-black/50 px-2 py-1 rounded text-white text-xs">
                You {!isAudioEnabled && '(muted)'}
              </div>
            </div>
          </div>

          {/* Status Bar */}
          <div className="flex items-center justify-between mt-4 mb-4">
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Users className="h-4 w-4" />
              <span>{participantCount} participant{participantCount !== 1 ? 's' : ''}</span>
              {!isConnected && participantCount === 1 && (
                <span className="text-yellow-500 ml-2">Waiting for others to join...</span>
              )}
              {isConnected && (
                <span className="text-green-500 ml-2">● Connected</span>
              )}
            </div>
          </div>

          {/* Controls */}
          <div className="flex items-center justify-center gap-4">
            <Button
              variant={isVideoEnabled ? 'secondary' : 'destructive'}
              size="icon"
              onClick={toggleVideo}
              className="h-12 w-12 rounded-full"
            >
              {isVideoEnabled ? <Video className="h-5 w-5" /> : <VideoOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant={isAudioEnabled ? 'secondary' : 'destructive'}
              size="icon"
              onClick={toggleAudio}
              className="h-12 w-12 rounded-full"
            >
              {isAudioEnabled ? <Mic className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
            </Button>
            
            <Button
              variant="destructive"
              size="icon"
              onClick={handleLeave}
              className="h-12 w-12 rounded-full"
            >
              <PhoneOff className="h-5 w-5" />
            </Button>
            
            <Button
              variant="outline"
              size="icon"
              onClick={toggleFullscreen}
              className="h-12 w-12 rounded-full"
            >
              {isFullscreen ? <Minimize2 className="h-5 w-5" /> : <Maximize2 className="h-5 w-5" />}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
