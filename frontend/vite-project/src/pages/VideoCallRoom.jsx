import { useState, useEffect, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { 
  Video, VideoOff, Mic, MicOff, PhoneOff, Monitor, 
  MessageSquare, Pencil
} from 'lucide-react';
import io from 'socket.io-client';
import api from '../utils/api';
import { useAuth } from '../context/AuthContext';
import toast from 'react-hot-toast';

export default function VideoCallRoom() {
  const { roomId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  // Refs
  const localVideoRef = useRef(null);
  const remoteVideoRef = useRef(null);
  const peerConnectionRef = useRef(null);
  const socketRef = useRef(null);
  const localStreamRef = useRef(null);
  const screenStreamRef = useRef(null);
  const isCleaningUpRef = useRef(false);

  // State
  const [call, setCall] = useState(null);
  const [isVideoEnabled, setIsVideoEnabled] = useState(true);
  const [isAudioEnabled, setIsAudioEnabled] = useState(true);
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatMessages, setChatMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [connectionStatus, setConnectionStatus] = useState('connecting');
  const [callDuration, setCallDuration] = useState(0);
  const [hasRemoteVideo, setHasRemoteVideo] = useState(false);

  // ICE servers configuration
  const iceServers = {
    iceServers: [
      { urls: 'stun:stun.l.google.com:19302' },
      { urls: 'stun:stun1.l.google.com:19302' }
    ]
  };

  useEffect(() => {
    isCleaningUpRef.current = false;
    initializeCall();

    const handleWindowLeave = () => {
      cleanup();
    };

    window.addEventListener('beforeunload', handleWindowLeave);
    window.addEventListener('pagehide', handleWindowLeave);

    return () => {
      window.removeEventListener('beforeunload', handleWindowLeave);
      window.removeEventListener('pagehide', handleWindowLeave);
      cleanup();
    };
  }, [roomId]);

  // Timer for call duration
  useEffect(() => {
    if (connectionStatus === 'connected') {
      const interval = setInterval(() => {
        setCallDuration(prev => prev + 1);
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [connectionStatus]);

  const initializeCall = async () => {
    try {
      // Fetch call details
      const response = await api.get(`/video-calls/room/${roomId}`);
      setCall(response.data);
      setChatMessages(response.data.chatMessages || []);

      // Initialize socket
      const socketUrl =
        import.meta.env.VITE_SOCKET_URL ||
        import.meta.env.VITE_BACKEND_URL ||
        'http://127.0.0.1:5001';

      socketRef.current = io(socketUrl, {
        auth: { token: localStorage.getItem('token') }
      });

      // Setup socket listeners
      setupSocketListeners();

      // Get user media
      await getUserMedia();

      // Join room
      await joinRoom();
    } catch (error) {
      console.error('Error initializing call:', error);
      toast.error('Failed to join call');
      navigate('/bookings');
    }
  };

  const setupSocketListeners = () => {
    const socket = socketRef.current;

    socket.on('existing-participants', async (participants) => {
      console.log('Existing participants:', participants);
      // Create peer connections for each existing participant
      for (const participant of participants) {
        await createPeerConnection(participant.socketId, true);
      }
    });

    socket.on('user-joined', async ({ socketId, userName }) => {
      console.log(`${userName} joined`);
      toast.success(`${userName} joined the call`);
      // New user joined, they will initiate the connection
    });

    socket.on('offer', async ({ offer, from, userName }) => {
      console.log('Received offer from:', userName);
      await handleOffer(offer, from);
    });

    socket.on('answer', async ({ answer, from }) => {
      console.log('Received answer from:', from);
      await handleAnswer(answer, from);
    });

    socket.on('ice-candidate', async ({ candidate, from }) => {
      await handleIceCandidate(candidate, from);
    });

    socket.on('user-video-toggled', ({ socketId, enabled }) => {
      console.log(`User ${socketId} toggled video: ${enabled}`);
    });

    socket.on('user-audio-toggled', ({ socketId, enabled }) => {
      console.log(`User ${socketId} toggled audio: ${enabled}`);
    });

    socket.on('user-left', ({ userName }) => {
      console.log(`${userName} left`);
      toast(`${userName} left the call`);
      if (remoteVideoRef.current) {
        remoteVideoRef.current.srcObject = null;
      }
      setHasRemoteVideo(false);
    });

    socket.on('chat-message', (message) => {
      setChatMessages(prev => [...prev, message]);
    });

    socket.on('user-started-screen-share', ({ userName }) => {
      toast(`${userName} is sharing their screen`);
    });

    socket.on('user-stopped-screen-share', ({ userName }) => {
      toast(`${userName} stopped sharing`);
    });
  };

  const getUserMedia = async () => {
    try {
      if (localStreamRef.current) {
        localStreamRef.current.getTracks().forEach((track) => track.stop());
      }

      const stream = await navigator.mediaDevices.getUserMedia({
        video: { width: 1280, height: 720 },
        audio: true
      });

      localStreamRef.current = stream;
      if (localVideoRef.current) {
        localVideoRef.current.srcObject = stream;
      }
    } catch (error) {
      console.error('Error getting user media:', error);
      toast.error('Failed to access camera/microphone');
    }
  };

  const joinRoom = async () => {
    try {
      await api.post(`/video-calls/join/${roomId}`);
      
      socketRef.current.emit('join-room', {
        roomId,
        userId: user._id,
        userName: `${user.firstName} ${user.lastName}`
      });

      setConnectionStatus('connected');
    } catch (error) {
      console.error('Error joining room:', error);
    }
  };

  const createPeerConnection = async (socketId, shouldCreateOffer) => {
    try {
      const peerConnection = new RTCPeerConnection(iceServers);
      peerConnectionRef.current = peerConnection;

      // Add local stream tracks
      localStreamRef.current.getTracks().forEach(track => {
        peerConnection.addTrack(track, localStreamRef.current);
      });

      // Handle incoming tracks
      peerConnection.ontrack = (event) => {
        console.log('Received remote track');
        if (remoteVideoRef.current) {
          remoteVideoRef.current.srcObject = event.streams[0];
        }
        setHasRemoteVideo(true);
      };

      // Handle ICE candidates
      peerConnection.onicecandidate = (event) => {
        if (event.candidate) {
          socketRef.current.emit('ice-candidate', {
            candidate: event.candidate,
            to: socketId
          });
        }
      };

      // Handle connection state
      peerConnection.onconnectionstatechange = () => {
        console.log('Connection state:', peerConnection.connectionState);
        setConnectionStatus(peerConnection.connectionState);
      };

      // Create and send offer if initiator
      if (shouldCreateOffer) {
        const offer = await peerConnection.createOffer();
        await peerConnection.setLocalDescription(offer);
        
        socketRef.current.emit('offer', {
          offer,
          to: socketId
        });
      }

      return peerConnection;
    } catch (error) {
      console.error('Error creating peer connection:', error);
    }
  };

  const handleOffer = async (offer, from) => {
    try {
      const peerConnection = await createPeerConnection(from, false);
      await peerConnection.setRemoteDescription(new RTCSessionDescription(offer));
      
      const answer = await peerConnection.createAnswer();
      await peerConnection.setLocalDescription(answer);
      
      socketRef.current.emit('answer', {
        answer,
        to: from
      });
    } catch (error) {
      console.error('Error handling offer:', error);
    }
  };

  const handleAnswer = async (answer, from) => {
    try {
      await peerConnectionRef.current.setRemoteDescription(new RTCSessionDescription(answer));
    } catch (error) {
      console.error('Error handling answer:', error);
    }
  };

  const handleIceCandidate = async (candidate, from) => {
    try {
      if (peerConnectionRef.current) {
        await peerConnectionRef.current.addIceCandidate(new RTCIceCandidate(candidate));
      }
    } catch (error) {
      console.error('Error handling ICE candidate:', error);
    }
  };

  const toggleVideo = () => {
    if (localStreamRef.current) {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      videoTrack.enabled = !videoTrack.enabled;
      setIsVideoEnabled(videoTrack.enabled);
      
      socketRef.current.emit('toggle-video', { enabled: videoTrack.enabled });
    }
  };

  const toggleAudio = () => {
    if (localStreamRef.current) {
      const audioTrack = localStreamRef.current.getAudioTracks()[0];
      audioTrack.enabled = !audioTrack.enabled;
      setIsAudioEnabled(audioTrack.enabled);
      
      socketRef.current.emit('toggle-audio', { enabled: audioTrack.enabled });
    }
  };

  const startScreenShare = async () => {
    try {
      const screenStream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      const screenTrack = screenStream.getVideoTracks()[0];
      screenStreamRef.current = screenStream;

      // Replace video track
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      if (sender) {
        sender.replaceTrack(screenTrack);
      }

      setIsScreenSharing(true);
      socketRef.current.emit('start-screen-share');

      // Handle screen share end
      screenTrack.onended = () => {
        stopScreenShare();
      };
    } catch (error) {
      console.error('Error sharing screen:', error);
      toast.error('Failed to share screen');
    }
  };

  const stopScreenShare = async () => {
    try {
      const videoTrack = localStreamRef.current.getVideoTracks()[0];
      const sender = peerConnectionRef.current.getSenders().find(s => s.track?.kind === 'video');
      
      if (sender) {
        await sender.replaceTrack(videoTrack);
      }

      setIsScreenSharing(false);
      socketRef.current.emit('stop-screen-share');

      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((track) => track.stop());
        screenStreamRef.current = null;
      }
    } catch (error) {
      console.error('Error stopping screen share:', error);
    }
  };

  const openWhiteboard = () => {
    if (call?.roomId) {
      const whiteboardUrl = `/whiteboard/${call.roomId}`;
      window.open(whiteboardUrl, '_blank');
    } else {
      toast.error('Call information not available');
    }
  };

  const sendChatMessage = () => {
    if (newMessage.trim()) {
      socketRef.current.emit('chat-message', { message: newMessage });
      setNewMessage('');
    }
  };

  const endCall = () => {
    cleanup();
    navigate('/bookings');
    toast.success('Call ended');

    // Best-effort backend update; don't block media cleanup on network.
    api.post(`/video-calls/leave/${roomId}`).catch((error) => {
      console.error('Error ending call:', error);
    });
  };

  const cleanup = () => {
    if (isCleaningUpRef.current) {
      return;
    }
    isCleaningUpRef.current = true;

    const stopTracks = (stream) => {
      if (!stream) return;
      stream.getTracks().forEach((track) => {
        try {
          track.stop();
        } catch (error) {
          console.error('Error stopping media track:', error);
        }
      });
    };

    if (socketRef.current) {
      try {
        socketRef.current.emit('leave-room');
        socketRef.current.disconnect();
      } catch (error) {
        console.error('Error disconnecting socket:', error);
      } finally {
        socketRef.current = null;
      }
    }

    if (peerConnectionRef.current) {
      try {
        peerConnectionRef.current.getSenders().forEach((sender) => {
          if (sender.track) {
            sender.track.stop();
          }
        });
        peerConnectionRef.current.close();
      } catch (error) {
        console.error('Error closing peer connection:', error);
      } finally {
        peerConnectionRef.current = null;
      }
    }

    stopTracks(screenStreamRef.current);
    stopTracks(localStreamRef.current);
    screenStreamRef.current = null;
    localStreamRef.current = null;

    if (localVideoRef.current) {
      localVideoRef.current.srcObject = null;
    }

    if (remoteVideoRef.current) {
      remoteVideoRef.current.srcObject = null;
    }
  };

  const formatDuration = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="fixed inset-0 bg-gray-900 flex flex-col overflow-hidden">
      {/* Header */}
      <div className="bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-between shrink-0 border-b border-gray-700">
        <div className="flex items-center gap-4">
          <h1 className="text-white font-semibold">{call?.booking?.skill?.title || 'Video Call'}</h1>
          <span className="px-3 py-1 bg-red-600 text-white text-sm rounded-full flex items-center gap-2">
            <div className="w-2 h-2 bg-white rounded-full animate-pulse"></div>
            {formatDuration(callDuration)}
          </span>
        </div>
        
        <button
          onClick={() => setShowChat(!showChat)}
          className="text-white hover:bg-gray-700 p-2 rounded-lg"
        >
          <MessageSquare className="w-5 h-5" />
        </button>
      </div>

      {/* Video Area */}
      <div className="flex-1 min-h-0 relative flex items-center justify-center p-3 sm:p-4">
        {/* Remote Video (Main) */}
        <video
          ref={remoteVideoRef}
          autoPlay
          playsInline
          className="w-full h-full object-contain rounded-lg"
        />
        {!hasRemoteVideo && (
          <div className="absolute inset-0 flex items-center justify-center text-center pointer-events-none">
            <div className="px-6 py-4 rounded-xl bg-black/40 text-white">
              <p className="font-semibold mb-1">Waiting For The Other Participant</p>
              <p className="text-sm text-gray-200">Share the booking with them and ask them to join this call.</p>
            </div>
          </div>
        )}

        {/* Local Video (Picture in Picture) */}
        <div className="absolute bottom-3 right-3 sm:bottom-4 sm:right-4 w-32 h-24 sm:w-48 sm:h-36 md:w-64 md:h-48 bg-gray-800 rounded-lg overflow-hidden border-2 border-gray-700 shadow-xl z-10">
          <video
            ref={localVideoRef}
            autoPlay
            playsInline
            muted
            className="w-full h-full object-cover mirror"
          />
          {!isVideoEnabled && (
            <div className="absolute inset-0 flex items-center justify-center bg-gray-900">
              <div className="w-16 h-16 bg-gray-700 rounded-full flex items-center justify-center">
                <span className="text-white text-xl font-semibold">
                  {user?.firstName?.charAt(0)}
                </span>
              </div>
            </div>
          )}
        </div>

        {/* Chat Sidebar */}
        {showChat && (
          <div className="absolute right-0 top-0 bottom-0 w-full sm:w-80 bg-gray-800 border-l border-gray-700 flex flex-col z-20">
            <div className="p-4 border-b border-gray-700">
              <h3 className="text-white font-semibold">Chat</h3>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {chatMessages.map((msg, index) => (
                <div key={index} className={`${msg.userId === user._id ? 'text-right' : ''}`}>
                  <div className={`inline-block px-3 py-2 rounded-lg ${
                    msg.userId === user._id 
                      ? 'bg-rose-600 text-white' 
                      : 'bg-gray-700 text-white'
                  }`}>
                    {msg.userId !== user._id && (
                      <p className="text-xs text-gray-300 mb-1">{msg.userName}</p>
                    )}
                    <p className="text-sm">{msg.message}</p>
                  </div>
                </div>
              ))}
            </div>
            
            <div className="p-4 border-t border-gray-700">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                  placeholder="Type a message..."
                  className="flex-1 px-4 py-2 bg-gray-700 text-white rounded-lg border-0 focus:ring-2 focus:ring-rose-600"
                />
                <button
                  onClick={sendChatMessage}
                  className="px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700"
                >
                  Send
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Controls */}
      <div className="bg-gray-800 px-4 sm:px-6 py-3 sm:py-4 flex items-center justify-center gap-3 sm:gap-4 shrink-0 border-t border-gray-700 z-20">
        <button
          onClick={toggleAudio}
          className={`p-3 sm:p-4 rounded-full ${isAudioEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
          title={isAudioEnabled ? 'Mute' : 'Unmute'}
        >
          {isAudioEnabled ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        <button
          onClick={toggleVideo}
          className={`p-3 sm:p-4 rounded-full ${isVideoEnabled ? 'bg-gray-700 hover:bg-gray-600' : 'bg-red-600 hover:bg-red-700'} text-white transition-colors`}
          title={isVideoEnabled ? 'Turn off camera' : 'Turn on camera'}
        >
          {isVideoEnabled ? <Video className="w-5 h-5 sm:w-6 sm:h-6" /> : <VideoOff className="w-5 h-5 sm:w-6 sm:h-6" />}
        </button>

        <button
          onClick={isScreenSharing ? stopScreenShare : startScreenShare}
          className={`p-3 sm:p-4 rounded-full ${isScreenSharing ? 'bg-rose-600' : 'bg-gray-700 hover:bg-gray-600'} text-white transition-colors`}
          title={isScreenSharing ? 'Stop sharing' : 'Share screen'}
        >
          <Monitor className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          onClick={openWhiteboard}
          className="p-3 sm:p-4 rounded-full bg-gray-700 hover:bg-gray-600 text-white transition-colors"
          title="Open Whiteboard"
        >
          <Pencil className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>

        <button
          onClick={endCall}
          className="p-3 sm:p-4 rounded-full bg-red-600 hover:bg-red-700 text-white transition-colors"
          title="End call"
        >
          <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
        </button>
      </div>

      <style>{`
        .mirror {
          transform: scaleX(-1);
        }
      `}</style>
    </div>
  );
}