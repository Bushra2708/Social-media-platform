const Message = require("../models/Message");
const User = require("../models/User");
const { uploadImage } = require("../utils/cloudinary");

const sendMessage = async (req, res) => {
  try {
    const senderId = req.user.id;
    const { receiverId, text } = req.body;
    let imageUrl = "";

    if (!receiverId) {
      return res.status(400).json({
        success: false,
        message: "Receiver ID is required",
      });
    }

    if (!text && !req.file && !req.body.image) {
      return res.status(400).json({
        success: false,
        message: "Message text or image is required",
      });
    }

    // Support image attachments from Multer memory upload
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    } else if (req.body.image) {
      // If client passed pre-uploaded URL or direct base64 string
      imageUrl = req.body.image;
    }

    const message = await Message.create({
      sender: senderId,
      receiver: receiverId,
      text: text || "",
      image: imageUrl,
    });

    const populatedMessage = await Message.findById(message._id)
      .populate("sender", "name username avatar isVerified badge")
      .populate("receiver", "name username avatar isVerified badge");

    // Push the message in real-time over WebSocket
    const socketService = require("../services/socketService");
    socketService.sendRealTimeMessage(receiverId, populatedMessage);

    res.status(201).json({
      success: true,
      message: populatedMessage,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getMessages = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const { userId } = req.params;

    // Fetch messages between these two users
    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: userId },
        { sender: userId, receiver: currentUserId },
      ],
    })
      .sort({ createdAt: 1 }) // Chronological order
      .populate("sender", "name username avatar isVerified badge")
      .populate("receiver", "name username avatar isVerified badge");

    // Auto-mark unread messages received from the target user as READ
    await Message.updateMany(
      { sender: userId, receiver: currentUserId, read: false },
      { $set: { read: true } }
    );

    res.status(200).json({
      success: true,
      messages,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getConversations = async (req, res) => {
  try {
    const currentUserId = req.user.id;

    // Find all messages involving the current user
    const messages = await Message.find({
      $or: [{ sender: currentUserId }, { receiver: currentUserId }],
    })
      .sort({ createdAt: -1 })
      .populate("sender", "name username avatar isVerified badge")
      .populate("receiver", "name username avatar isVerified badge");

    const conversationsMap = new Map();

    messages.forEach((msg) => {
      const otherUser = msg.sender._id.toString() === currentUserId ? msg.receiver : msg.sender;
      const otherUserId = otherUser._id.toString();

      if (!conversationsMap.has(otherUserId)) {
        conversationsMap.set(otherUserId, {
          user: otherUser,
          lastMessage: msg,
          unreadCount: 0,
        });
      }

      // Check for unread messages sent to current user
      if (msg.receiver._id.toString() === currentUserId && !msg.read) {
        conversationsMap.get(otherUserId).unreadCount += 1;
      }
    });

    const conversations = Array.from(conversationsMap.values());

    res.status(200).json({
      success: true,
      conversations,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  sendMessage,
  getMessages,
  getConversations,
};
