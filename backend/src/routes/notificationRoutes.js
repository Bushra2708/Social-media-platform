const express = require("express");

const {
  getNotifications,
  markNotificationsRead,
  clearNotifications,
} = require("../controllers/notificationController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();

router.get("/", protect, getNotifications);
router.put("/read", protect, markNotificationsRead);
router.delete("/", protect, clearNotifications);

module.exports = router;
