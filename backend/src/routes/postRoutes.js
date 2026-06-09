const express = require("express");
const multer = require("multer");

const {
  createPost,
  getAllPosts,
  getFeedPosts,
  likeUnlikePost,
  deletePost,
  bookmarkPost,
  addComment,
  deleteComment,
} = require("../controllers/postController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.post("/", protect, upload.single("image"), createPost);
router.get("/", getAllPosts);
router.get("/feed", protect, getFeedPosts);

router.put("/:id/like", protect, likeUnlikePost);
router.delete("/:id", protect, deletePost);
router.put("/:id/bookmark", protect, bookmarkPost);

router.post("/:id/comment", protect, addComment);
router.delete("/:id/comment/:commentId", protect, deleteComment);

module.exports = router;