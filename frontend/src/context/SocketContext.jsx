import { createContext, useContext, useEffect, useState } from "react";
import { io } from "socket.io-client";
import { useAuth } from "./AuthContext";
import { useToast } from "./ToastContext";

const SocketContext = createContext();

const getSocketUrl = () => {
  if (import.meta.env.VITE_SOCKET_URL) {
    return import.meta.env.VITE_SOCKET_URL;
  }

  const apiUrl = import.meta.env.VITE_API_URL || "http://localhost:5000/api";
  return apiUrl.replace(/\/api\/?$/, "");
};

export const SocketProvider = ({ children }) => {
  const { user } = useAuth();
  const { showToast } = useToast();
  const [socket, setSocket] = useState(null);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState({}); // Maps senderId -> boolean

  useEffect(() => {
    if (!user) {
      // Disconnect socket if user logs out
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      setOnlineUsers([]);
      setTypingUsers({});
      return;
    }

    const socketUrl = getSocketUrl();
    const newSocket = io(socketUrl, {
      transports: ["websocket"],
      withCredentials: true
    });

    setSocket(newSocket);

    // On connection, register our user ID
    newSocket.on("connect", () => {
      console.log("WebSocket client connected. Registering ID:", user._id);
      newSocket.emit("register", user._id);
    });

    // Listen for online users roster
    newSocket.on("online_users", (users) => {
      setOnlineUsers(users);
    });

    // Listen for typing events
    newSocket.on("typing_status", (data) => {
      // data: { senderId, isTyping }
      setTypingUsers((prev) => ({
        ...prev,
        [data.senderId]: data.isTyping
      }));
    });

    // Listen for instant notification push
    newSocket.on("notification_received", (notification) => {
      console.log("Push notification received:", notification);
      showToast(notification.content || "You received a new notification!", "info");
      
      // Dispatch custom DOM event to trigger incremental badges globally
      const event = new CustomEvent("new_notification", { detail: notification });
      window.dispatchEvent(event);
    });

    // Listen for message events (will also be handled in Chat context/components)
    newSocket.on("message_received", (message) => {
      console.log("Push message received:", message);
      // Only show a toast if the user is not actively on the messages page
      const isMessagesPage = window.location.pathname.startsWith("/messages");
      if (!isMessagesPage) {
        showToast(`New message from ${message.sender.name}: "${message.text.substring(0, 30)}${message.text.length > 30 ? '...' : ''}"`, "info");
      }
      
      const event = new CustomEvent("new_message", { detail: message });
      window.dispatchEvent(event);
    });

    return () => {
      console.log("Cleaning up WebSocket connection...");
      newSocket.disconnect();
    };
  }, [user]);

  const emitTyping = (receiverId, isTyping) => {
    if (socket && user) {
      socket.emit("typing", {
        senderId: user._id,
        receiverId,
        isTyping
      });
    }
  };

  return (
    <SocketContext.Provider value={{ socket, onlineUsers, typingUsers, emitTyping }}>
      {children}
    </SocketContext.Provider>
  );
};

export const useSocket = () => useContext(SocketContext);
