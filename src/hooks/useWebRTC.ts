import { useEffect, useRef, useState } from 'react';
import io, { Socket } from 'socket.io-client';
import Peer from 'simple-peer';

interface User {
  id: string;
  name: string;
}

export const useWebRTC = (roomId: string, userName: string) => {
  const [peers, setPeers] = useState<{ peerId: string; peer: Peer.Instance; userName: string; stream: MediaStream | null }[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [myStream, setMyStream] = useState<MediaStream | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [whiteboardActive, setWhiteboardActive] = useState(false);
  const [timer, setTimer] = useState<{ duration: number; startTime: number } | null>(null);


  const socketRef = useRef<Socket | null>(null);
  const peersRef = useRef<{ peerId: string; peer: Peer.Instance; userName: string }[]>([]);
  const userStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    let isMounted = true;
    const socketInstance = io('http://localhost:3001');
    socketRef.current = socketInstance;
    setSocket(socketInstance);

    socketInstance.on('connect', () => {
      socketInstance.emit('join-room', { roomId, userName });
    });

    function createPeer(userToSignal: string, callerId: string, stream: MediaStream) {
      const peer = new Peer({
        initiator: true,
        trickle: false,
        stream,
      });

      peer.on('signal', (signal) => {
        socketInstance.emit('sending-signal', { userToSignal, callerId, signal, userName });
      });

      peer.on('stream', (remoteStream) => {
        setPeers((prev) => 
          prev.map((p) => p.peerId === userToSignal ? { ...p, stream: remoteStream } : p)
        );
      });

      return peer;
    }

    function addPeer(incomingSignal: any, callerId: string, stream: MediaStream) {
      const peer = new Peer({
        initiator: false,
        trickle: false,
        stream,
      });

      peer.on('signal', (signal) => {
        socketInstance.emit('returning-signal', { signal, callerId });
      });

      peer.on('stream', (remoteStream) => {
        setPeers((prev) => 
          prev.map((p) => p.peerId === callerId ? { ...p, stream: remoteStream } : p)
        );
      });

      peer.signal(incomingSignal);
      return peer;
    }

    socketInstance.on('room-state', ({ users, hostId, whiteboardActive, duration, startTime }) => {
      setIsHost(hostId === socketInstance.id);
      setWhiteboardActive(whiteboardActive);
      if (startTime) setTimer({ duration, startTime });

      if (userStreamRef.current) {
        const peersArr: { peerId: string; peer: Peer.Instance; userName: string; stream: MediaStream | null }[] = [];
        Object.keys(users).forEach((userId) => {
          if (userId !== socketInstance.id) {
            const peer = createPeer(userId, socketInstance.id!, userStreamRef.current!);
            peersRef.current.push({ peerId: userId, peer, userName: users[userId].name });
            peersArr.push({ peerId: userId, peer, userName: users[userId].name, stream: null });
          }
        });
        setPeers(peersArr);
      }
    });

    socketInstance.on('whiteboard-toggled', (active) => {
      setWhiteboardActive(active);
    });

    socketInstance.on('timer-started', (timerData) => {
      setTimer(timerData);
    });

    socketInstance.on('new-host', (hostId) => {
      setIsHost(hostId === socketInstance.id);
    });

    socketInstance.on('force-mute', () => {
      if (userStreamRef.current) {
        userStreamRef.current.getAudioTracks().forEach(track => track.enabled = false);
      }
    });

    socketInstance.on('kicked', () => {
      userStreamRef.current?.getTracks().forEach((track) => track.stop());
      window.location.href = '/';
    });

    socketInstance.on('meeting-ended', () => {
      alert('Meeting telah berakhir.');
      userStreamRef.current?.getTracks().forEach((track) => track.stop());
      window.location.href = '/';
    });

    socketInstance.on('user-joined', ({ signal, callerId, userName: joinedUserName }) => {
      if (userStreamRef.current) {
        const peer = addPeer(signal, callerId, userStreamRef.current!);
        peersRef.current.push({ peerId: callerId, peer, userName: joinedUserName });
        setPeers((prev) => [...prev, { peerId: callerId, peer, userName: joinedUserName, stream: null }]);
      }
    });

    socketInstance.on('receiving-returned-signal', ({ signal, id }) => {
      const item = peersRef.current.find((p) => p.peerId === id);
      if (item) item.peer.signal(signal);
    });

    socketInstance.on('user-disconnected', (userId) => {
      const peerObj = peersRef.current.find((p) => p.peerId === userId);
      if (peerObj) {
        peerObj.peer.destroy();
        peersRef.current = peersRef.current.filter((p) => p.peerId !== userId);
      }
      setPeers((prev) => prev.filter((p) => p.peerId !== userId));
    });

    navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
      if (!isMounted) {
        stream.getTracks().forEach(track => track.stop());
        return;
      }
      
      setMyStream(stream);
      userStreamRef.current = stream;

      socketInstance.emit('join-room', { roomId, userName });
    }).catch(err => {
      console.error("Error accessing media devices:", err);
    });

    return () => {
      isMounted = false;
      socketInstance.disconnect();
      if (userStreamRef.current) {
        userStreamRef.current.getTracks().forEach((track) => track.stop());
        userStreamRef.current = null;
      }
      peersRef.current.forEach(({ peer }) => peer.destroy());
    };
  }, [roomId, userName]);

  const toggleScreenShare = () => {
    if (!myStream) return;

    if (myStream.getVideoTracks()[0].label.includes('screen') || myStream.getVideoTracks()[0].label.includes('Monitor')) {
      // Stop screen share and revert to camera
      navigator.mediaDevices.getUserMedia({ video: true, audio: true }).then((stream) => {
        const videoTrack = stream.getVideoTracks()[0];
        const oldTrack = myStream.getVideoTracks()[0];
        
        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(oldTrack, videoTrack, myStream);
        });

        // Stop old screen track
        oldTrack.stop();
        
        setMyStream(stream);
        userStreamRef.current = stream;
      });
    } else {
      // Start screen share
      navigator.mediaDevices.getDisplayMedia({ video: true }).then((screenStream) => {
        const screenTrack = screenStream.getVideoTracks()[0];
        const oldTrack = myStream.getVideoTracks()[0];

        peersRef.current.forEach(({ peer }) => {
          peer.replaceTrack(oldTrack, screenTrack, myStream);
        });

        screenTrack.onended = () => {
          toggleScreenShare(); // Revert when user clicks browser's stop sharing
        };

        setMyStream(screenStream);
        userStreamRef.current = screenStream;
      });
    }
  };

  return { peers, myStream, socket, isHost, whiteboardActive, timer, setIsHost, toggleScreenShare };
};
