import { useEffect, useState, useRef } from "react";
import { useAuth } from "../../context/AuthContext";
import { useSocket } from "../../context/SocketContext";
import { useToast } from "../../context/ToastContext";
import { getConversations, getMessages, sendMessage } from "../../services/messageService";
import { searchUsers } from "../../services/userService";
import { FiSend, FiImage, FiX, FiMessageSquare, FiSearch } from "react-icons/fi";

export default function Messages() {
  const { user } = useAuth();
  const { onlineUsers, typingUsers, emitTyping } = useSocket();
  const { showToast } = useToast();

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);
  const typingTimeoutRef = useRef(null);

  const [conversations, setConversations] = useState([]);
  const [activeChat, setActiveChat] = useState(null); // Contains user object
  const [messages, setMessages] = useState([]);
  const [loadingConversations, setLoadingConversations] = useState(true);
  const [loadingMessages, setLoadingMessages] = useState(false);

  // Search states for starting new chat
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);

  // Message composer states
  const [text, setText] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [sending, setSending] = useState(false);

  // Fetch conversations roster
  const fetchConversations = async () => {
    try {
      const data = await getConversations();
      setConversations(data.conversations || []);
    } catch (error) {
      console.error("Failed to load conversations:", error);
    } finally {
      setLoadingConversations(false);
    }
  };

  useEffect(() => {
    fetchConversations();
  }, []);

  // Handle incoming live message listener
  useEffect(() => {
    const handleLiveMessage = (e) => {
      const liveMsg = e.detail;
      // If we are actively chatting with the sender of this message
      if (activeChat && (liveMsg.sender._id === activeChat._id || liveMsg.receiver._id === activeChat._id)) {
        setMessages((prev) => [...prev, liveMsg]);
        // Also trigger unread cleanup on backend
        getMessages(activeChat._id).catch(() => {});
      } else {
        // Otherwise, update conversations list
        fetchConversations();
      }
    };

    window.addEventListener("new_message", handleLiveMessage);
    return () => {
      window.removeEventListener("new_message", handleLiveMessage);
    };
  }, [activeChat]);

  // Fetch messages for selected user
  useEffect(() => {
    if (!activeChat) return;

    const fetchHistory = async () => {
      setLoadingMessages(true);
      try {
        const data = await getMessages(activeChat._id);
        setMessages(data.messages || []);
        
        // Reset unread indicator badge count in conversations array locally
        setConversations((prev) =>
          prev.map((c) =>
            c.user._id === activeChat._id ? { ...c, unreadCount: 0 } : c
          )
        );
      } catch (error) {
        showToast("Failed to load chat history", "error");
      } finally {
        setLoadingMessages(false);
      }
    };

    fetchHistory();
  }, [activeChat]);

  // Auto Scroll message chain
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loadingMessages]);

  // Handle user search for starting a new thread
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults([]);
      return;
    }

    const delaySearch = setTimeout(async () => {
      try {
        const data = await searchUsers(searchQuery);
        // Exclude ourselves from search results
        setSearchResults((data.users || []).filter((u) => u._id !== user?._id));
      } catch (error) {
        console.error("Search failed:", error);
      }
    }, 400);

    return () => clearTimeout(delaySearch);
  }, [searchQuery]);

  // Send message handler
  const handleSendMessage = async (e) => {
    e.preventDefault();
    if ((!text.trim() && !imageFile) || sending || !activeChat) return;

    setSending(true);
    emitTyping(activeChat._id, false); // Stop typing
    try {
      const data = await sendMessage(activeChat._id, text.trim(), imageFile);
      setMessages((prev) => [...prev, data.message]);
      setText("");
      setImageFile(null);
      setImagePreview("");
      if (fileInputRef.current) fileInputRef.current.value = "";
      
      // Update our conversation list with this last message
      fetchConversations();
    } catch (error) {
      showToast("Message failed to send", "error");
    } finally {
      setSending(false);
    }
  };

  // Keyboard and typing status indicators
  const handleInputChange = (e) => {
    setText(e.target.value);
    if (!activeChat) return;

    // Send typing notification
    emitTyping(activeChat._id, true);

    // Debounce typing status stop
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    
    typingTimeoutRef.current = setTimeout(() => {
      emitTyping(activeChat._id, false);
    }, 2000);
  };

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImageFile(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const startNewChat = (selectedUser) => {
    setActiveChat(selectedUser);
    setSearchQuery("");
    setShowSearchDropdown(false);
    
    // Check if user already exists in conversations, otherwise prepend them
    const exists = conversations.some((c) => c.user._id === selectedUser._id);
    if (!exists) {
      setConversations((prev) => [
        {
          user: selectedUser,
          lastMessage: { text: "No messages yet.", createdAt: new Date() },
          unreadCount: 0,
        },
        ...prev,
      ]);
    }
  };

  return (
    <div className="w-full flex h-[calc(100vh-7rem)] md:h-[calc(100vh-4rem)] border border-[var(--border-color)] glass-panel rounded-3xl overflow-hidden mt-2 text-left">
      {/* Left Pane - Conversations List */}
      <div className={`w-full md:w-80 flex flex-col border-r border-[var(--border-color)] bg-[var(--panel-bg)]/30 backdrop-blur-xl ${activeChat ? "hidden md:flex" : "flex"}`}>
        
        {/* Contacts Header */}
        <div className="p-4 border-b border-[var(--border-color)] space-y-3">
          <h2 className="text-lg font-extrabold text-[var(--text-main)]">Chats</h2>
          
          {/* User Search widgets */}
          <div className="relative">
            <div className="flex items-center space-x-2 bg-[var(--input-bg)] border border-[var(--border-color)] px-3 py-2 rounded-xl">
              <FiSearch className="text-gray-400 w-4 h-4" />
              <input
                type="text"
                placeholder="Search people..."
                value={searchQuery}
                onFocus={() => setShowSearchDropdown(true)}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-transparent outline-none border-none text-xs text-[var(--text-main)] placeholder-gray-500"
              />
              {searchQuery && (
                <button onClick={() => setSearchQuery("")} className="text-gray-400 hover:text-[var(--text-main)] cursor-pointer">
                  <FiX className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            {/* User Dropdown */}
            {showSearchDropdown && (searchResults.length > 0 || searchQuery) && (
              <div className="absolute left-0 right-0 top-full mt-2 bg-[var(--panel-bg)] border border-[var(--border-color)] rounded-2xl shadow-xl z-50 max-h-60 overflow-y-auto">
                {searchResults.length === 0 ? (
                  <p className="p-4 text-xs text-gray-500 text-center">No users found</p>
                ) : (
                  searchResults.map((usr) => (
                    <button
                      key={usr._id}
                      onClick={() => startNewChat(usr)}
                      className="w-full flex items-center space-x-3 p-3 hover:bg-[var(--hover-bg)] text-left border-b border-[var(--border-color)]/20 cursor-pointer"
                    >
                      <img
                        src={usr.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                        alt={usr.name}
                        className="w-8 h-8 rounded-full object-cover"
                      />
                      <div>
                        <p className="text-xs font-bold text-[var(--text-main)]">{usr.name}</p>
                        <p className="text-[10px] text-gray-500">@{usr.username}</p>
                      </div>
                    </button>
                  ))
                )}
              </div>
            )}
          </div>
        </div>

        {/* Conversation Users Column */}
        <div className="flex-1 overflow-y-auto divide-y divide-[var(--border-color)]/20">
          {loadingConversations ? (
            <div className="p-4 space-y-4">
              {[1, 2, 3].map((n) => (
                <div key={n} className="flex space-x-3 items-center animate-pulse">
                  <div className="w-10 h-10 rounded-full bg-white/5" />
                  <div className="flex-1 space-y-2">
                    <div className="h-3 bg-white/5 w-24 rounded" />
                    <div className="h-2 bg-white/5 w-36 rounded" />
                  </div>
                </div>
              ))}
            </div>
          ) : conversations.length === 0 ? (
            <div className="p-8 text-center text-gray-500 flex flex-col items-center space-y-2 mt-12">
              <FiMessageSquare className="w-8 h-8 opacity-40 text-[var(--primary-accent)]" />
              <p className="text-xs">No active chats. Start searching above!</p>
            </div>
          ) : (
            conversations.map((c) => {
              const otherUser = c.user;
              const isOnline = onlineUsers.includes(otherUser._id);
              const isSelected = activeChat && activeChat._id === otherUser._id;
              
              return (
                <button
                  key={otherUser._id}
                  onClick={() => {
                    setActiveChat(otherUser);
                    setShowSearchDropdown(false);
                  }}
                  className={`w-full flex items-center space-x-3 p-4 transition-colors hover:bg-[var(--hover-bg)] text-left cursor-pointer ${
                    isSelected ? "bg-[var(--hover-bg)] font-medium border-l-4 border-[var(--primary-accent)]" : ""
                  }`}
                >
                  <div className="relative flex-shrink-0">
                    <img
                      src={otherUser.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                      alt={otherUser.name}
                      className="w-10 h-10 rounded-full object-cover border border-[var(--border-color)]"
                    />
                    {isOnline && (
                      <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-[var(--bg-base)] rounded-full animate-pulse" />
                    )}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex justify-between items-center mb-0.5">
                      <span className="text-xs font-bold text-[var(--text-main)] truncate">{otherUser.name}</span>
                      <span className="text-[9px] text-gray-500">
                        {c.lastMessage?.createdAt && formatDistance(c.lastMessage.createdAt)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between items-center">
                      <p className={`text-xs truncate ${c.unreadCount > 0 ? "text-[var(--text-main)] font-extrabold" : "text-gray-400"}`}>
                        {c.lastMessage?.text || "Sent an attachment"}
                      </p>
                      {c.unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 text-[10px] font-black bg-[var(--primary-accent)] text-[var(--button-text)] rounded-full">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  </div>
                </button>
              );
            })
          )}
        </div>
      </div>

      {/* Right Pane - Chat Conversation Area */}
      <div className={`flex-1 flex flex-col bg-[var(--bg-base)]/10 backdrop-blur-md ${!activeChat ? "hidden md:flex items-center justify-center p-8 text-center" : "flex"}`}>
        {activeChat ? (
          <>
            {/* Active Contact Header */}
            <div className="p-4 border-b border-[var(--border-color)] flex items-center justify-between bg-[var(--panel-bg)]/20">
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => setActiveChat(null)}
                  className="md:hidden p-1.5 rounded-lg text-gray-400 hover:text-[var(--text-main)] hover:bg-[var(--hover-bg)] mr-1 cursor-pointer"
                >
                  Back
                </button>
                <div className="relative flex-shrink-0">
                  <img
                    src={activeChat.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                    alt={activeChat.name}
                    className="w-9 h-9 rounded-full object-cover border border-[var(--border-color)]"
                  />
                  {onlineUsers.includes(activeChat._id) && (
                    <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-emerald-500 border-2 border-[var(--bg-base)] rounded-full animate-pulse" />
                  )}
                </div>
                <div>
                  <h3 className="text-xs font-bold text-[var(--text-main)]">{activeChat.name}</h3>
                  {typingUsers[activeChat._id] ? (
                    <p className="text-[10px] text-[var(--secondary-accent)] animate-pulse font-semibold">typing...</p>
                  ) : (
                    <p className="text-[10px] text-gray-400">
                      {onlineUsers.includes(activeChat._id) ? "Online" : "Offline"}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Message Bubble Threads */}
            <div className="flex-1 overflow-y-auto p-4 space-y-3.5">
              {loadingMessages ? (
                <div className="h-full flex items-center justify-center">
                  <div className="w-8 h-8 border-2 border-t-transparent border-[var(--primary-accent)] rounded-full animate-spin" />
                </div>
              ) : (
                messages.map((msg) => {
                  const isSender = msg.sender._id === user?._id;
                  return (
                    <div
                      key={msg._id}
                      className={`flex ${isSender ? "justify-end" : "justify-start"} items-end space-x-2`}
                    >
                      {!isSender && (
                        <img
                          src={activeChat.avatar || "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=150"}
                          alt=""
                          className="w-6 h-6 rounded-full object-cover border border-[var(--border-color)] mb-1"
                        />
                      )}
                      
                      <div className="max-w-[70%] space-y-1">
                        <div
                          className={`p-3.5 rounded-2xl text-xs break-words shadow-sm text-left ${
                            isSender
                              ? "bg-[var(--primary-accent)] text-[#070913] rounded-br-none"
                              : "bg-[var(--panel-bg)] border border-[var(--border-color)] text-[var(--text-main)] rounded-bl-none"
                          }`}
                        >
                          {msg.image && (
                            <img
                              src={msg.image}
                              alt="Attachment"
                              className="rounded-xl max-h-60 w-full object-cover mb-2 border border-black/10"
                            />
                          )}
                          <p className="leading-relaxed font-medium">{msg.text}</p>
                        </div>
                        
                        <p className="text-[8px] text-gray-500 text-right px-1">
                          {formatDistance(msg.createdAt)}
                        </p>
                      </div>
                    </div>
                  );
                })
              )}
              <div ref={messagesEndRef} />
            </div>

            {/* Composer Footer Form */}
            <form onSubmit={handleSendMessage} className="p-4 border-t border-[var(--border-color)] bg-[var(--panel-bg)]/20">
              
              {/* Attachment Previews */}
              {imagePreview && (
                <div className="relative rounded-2xl overflow-hidden border border-[var(--border-color)] aspect-video max-w-xs mb-3 bg-black/20">
                  <img src={imagePreview} alt="Upload Preview" className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => {
                      setImageFile(null);
                      setImagePreview("");
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="absolute top-2 right-2 p-1 bg-black/80 hover:bg-black/90 text-white rounded-full transition-colors cursor-pointer"
                  >
                    <FiX className="w-4.5 h-4.5" />
                  </button>
                </div>
              )}

              <div className="flex items-center space-x-2 bg-[var(--input-bg)] border border-[var(--border-color)] p-2.5 rounded-2xl">
                {/* Media trigger */}
                <label className="p-2 rounded-xl text-gray-400 hover:text-[var(--secondary-accent)] hover:bg-[var(--hover-bg)] cursor-pointer transition-colors flex-shrink-0">
                  <FiImage className="w-5 h-5" />
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    ref={fileInputRef}
                    className="hidden"
                  />
                </label>
                
                <input
                  type="text"
                  placeholder="Type a message..."
                  value={text}
                  onChange={handleInputChange}
                  className="flex-grow bg-transparent border-none outline-none text-xs text-[var(--text-main)] placeholder-gray-500"
                />
                
                <button
                  type="submit"
                  disabled={sending || (!text.trim() && !imageFile)}
                  className="p-2 rounded-xl bg-[var(--button-bg)] text-[var(--button-text)] hover:opacity-90 disabled:opacity-50 transition-all flex-shrink-0 cursor-pointer"
                >
                  <FiSend className="w-4 h-4" />
                </button>
              </div>
            </form>
          </>
        ) : (
          <div className="flex flex-col items-center space-y-4">
            <div className="w-16 h-16 rounded-full bg-[var(--hover-bg)] border border-[var(--border-color)] flex items-center justify-center">
              <FiMessageSquare className="w-7 h-7 text-[var(--primary-accent)]" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-[var(--text-main)]">Your Messages</h3>
              <p className="text-xs text-gray-500 mt-1">Select a contact or query someone above to begin chatting!</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// Simple absolute date parser
function formatDistance(dateStr) {
  try {
    const date = new Date(dateStr);
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000); // Diff in seconds

    if (diff < 60) return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return date.toLocaleDateString(undefined, { month: "short", day: "numeric" });
  } catch (err) {
    return "";
  }
}
