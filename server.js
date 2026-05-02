const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());

const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "*",
    methods: ["GET", "POST"]
  }
});

const rooms = {};

io.on('connection', (socket) => {
  console.log('User connected:', socket.id);

  socket.on('join-room', ({ roomId, userName }) => {
    socket.join(roomId);
    
    if (!rooms[roomId]) {
      rooms[roomId] = {
        users: {},
        host: socket.id,
        timer: null,
        duration: 0,
        whiteboardActive: false,
        startTime: null
      };
    }

    rooms[roomId].users[socket.id] = { id: socket.id, name: userName };
    
    // Notify others
    socket.to(roomId).emit('user-connected', { userId: socket.id, userName });
    
    // Send current state to new user
    socket.emit('room-state', {
      users: rooms[roomId].users,
      hostId: rooms[roomId].host,
      whiteboardActive: rooms[roomId].whiteboardActive,
      duration: rooms[roomId].duration,
      startTime: rooms[roomId].startTime
    });

    console.log(`User ${userName} joined room ${roomId}`);
  });

  // WebRTC Signaling
  socket.on('sending-signal', ({ userToSignal, signal, callerId, userName }) => {
    io.to(userToSignal).emit('user-joined', { signal, callerId, userName });
  });

  socket.on('returning-signal', ({ signal, callerId }) => {
    io.to(callerId).emit('receiving-returned-signal', { signal, id: socket.id });
  });

  // Chat
  socket.on('send-message', ({ roomId, message, userName }) => {
    const msgData = { 
      message, 
      userName, 
      userId: socket.id, 
      time: new Date().toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' }) 
    };
    io.to(roomId).emit('receive-message', msgData);
  });

  // Whiteboard
  socket.on('draw', ({ roomId, drawData }) => {
    socket.to(roomId).emit('draw', drawData);
  });

  socket.on('clear-whiteboard', (roomId) => {
    socket.to(roomId).emit('clear-whiteboard');
  });

  socket.on('toggle-whiteboard', ({ roomId, active }) => {
    if (rooms[roomId] && rooms[roomId].host === socket.id) {
      rooms[roomId].whiteboardActive = active;
      io.to(roomId).emit('whiteboard-toggled', active);
    }
  });

  // Timer & Host Controls
  socket.on('start-timer', ({ roomId, duration }) => {
    if (rooms[roomId] && rooms[roomId].host === socket.id) {
      rooms[roomId].duration = duration;
      rooms[roomId].startTime = Date.now();
      io.to(roomId).emit('timer-started', { duration, startTime: rooms[roomId].startTime });
    }
  });

  socket.on('kick-user', ({ roomId, userId }) => {
    if (rooms[roomId] && rooms[roomId].host === socket.id) {
      io.to(userId).emit('kicked');
      io.to(roomId).emit('user-disconnected', userId);
      delete rooms[roomId].users[userId];
    }
  });

  socket.on('mute-all', ({ roomId }) => {
    if (rooms[roomId] && rooms[roomId].host === socket.id) {
      socket.to(roomId).emit('force-mute');
    }
  });

  socket.on('camera-blurred', ({ roomId, blurred }) => {
    io.to(roomId).emit('user-camera-blurred', { userId: socket.id, blurred });
  });

  socket.on('raise-hand', ({ roomId, raised }) => {
    io.to(roomId).emit('user-raised-hand', { userId: socket.id, raised });
  });

  socket.on('end-meeting', (roomId) => {
    if (rooms[roomId] && rooms[roomId].host === socket.id) {
      io.to(roomId).emit('meeting-ended');
      delete rooms[roomId];
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);
    for (const roomId in rooms) {
      if (rooms[roomId].users[socket.id]) {
        const userName = rooms[roomId].users[socket.id].name;
        delete rooms[roomId].users[socket.id];
        socket.to(roomId).emit('user-disconnected', socket.id);
        
        // If host leaves, assign new host or delete room
        if (rooms[roomId].host === socket.id) {
          const remainingUsers = Object.keys(rooms[roomId].users);
          if (remainingUsers.length > 0) {
            rooms[roomId].host = remainingUsers[0];
            io.to(roomId).emit('new-host', rooms[roomId].host);
          } else {
            delete rooms[roomId];
          }
        }
        break;
      }
    }
  });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
