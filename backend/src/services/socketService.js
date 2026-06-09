const socketIo = require("socket.io");

let io;
const userSockets = new Map(); // Maps userId (string) -> array of socket.id strings (supporting multi-tab sessions)

const init = (server) => {
  io = socketIo(server, {
    cors: {
      origin: true, // Auto-reflect client origin headers to prevent CORS mismatches
      methods: ["GET", "POST"],
      credentials: true
    }
  });

  io.on("connection", (socket) => {
    console.log("Client socket connected:", socket.id);

    // Register active user account mapping
    socket.on("register", (userId) => {
      if (!userId) return;
      
      const userIdStr = userId.toString();
      if (!userSockets.has(userIdStr)) {
        userSockets.set(userIdStr, []);
      }
      
      // Avoid duplicate socket registrations
      if (!userSockets.get(userIdStr).includes(socket.id)) {
        userSockets.get(userIdStr).push(socket.id);
      }
      
      console.log(`Socket user mapped: ${userIdStr} -> ${socket.id}`);
      broadcastOnlineUsers();
    });

    // Handle user typing statuses
    socket.on("typing", (data) => {
      // data contains { receiverId, isTyping }
      if (!data || !data.receiverId) return;
      sendTypingStatus(data.receiverId, {
        senderId: data.senderId,
        isTyping: data.isTyping
      });
    });

    socket.on("disconnect", () => {
      console.log("Client socket disconnected:", socket.id);
      
      // Clean up mapping
      for (const [userId, sockets] of userSockets.entries()) {
        const index = sockets.indexOf(socket.id);
        if (index !== -1) {
          sockets.splice(index, 1);
          if (sockets.length === 0) {
            userSockets.delete(userId);
          }
          break;
        }
      }
      
      broadcastOnlineUsers();
    });
  });

  return io;
};

const getIo = () => {
  if (!io) throw new Error("Socket.io is not initialized yet.");
  return io;
};

const sendRealTimeNotification = (userId, notification) => {
  if (!io) return;
  const userIdStr = userId.toString();
  const sockets = userSockets.get(userIdStr);
  if (sockets && sockets.length > 0) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit("notification_received", notification);
    });
  }
};

const sendRealTimeMessage = (userId, message) => {
  if (!io) return;
  const userIdStr = userId.toString();
  const sockets = userSockets.get(userIdStr);
  if (sockets && sockets.length > 0) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit("message_received", message);
    });
  }
};

const sendTypingStatus = (userId, data) => {
  if (!io) return;
  const userIdStr = userId.toString();
  const sockets = userSockets.get(userIdStr);
  if (sockets && sockets.length > 0) {
    sockets.forEach((socketId) => {
      io.to(socketId).emit("typing_status", data);
    });
  }
};

const broadcastOnlineUsers = () => {
  if (!io) return;
  const onlineUsers = Array.from(userSockets.keys());
  io.emit("online_users", onlineUsers);
};

module.exports = {
  init,
  getIo,
  sendRealTimeNotification,
  sendRealTimeMessage,
  sendTypingStatus,
  broadcastOnlineUsers,
  userSockets
};
