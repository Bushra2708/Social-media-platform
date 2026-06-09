const express = require("express");
const multer = require("multer");
const {
  sendMessage,
  getMessages,
  getConversations,
} = require("../controllers/messageController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/conversations", protect, getConversations);
router.post("/", protect, upload.single("image"), sendMessage);
router.get("/:userId", protect, getMessages);

module.exports = router;
