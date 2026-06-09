const express = require("express");
const multer = require("multer");
const {
  createStory,
  getActiveStories,
} = require("../controllers/storyController");
const protect = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/", protect, getActiveStories);
router.post("/", protect, upload.single("image"), createStory);

module.exports = router;
