const express = require("express");
const multer = require("multer");

const {
  followUnfollowUser,
  getUserProfile,
  updateProfile,
  searchUsers,
  getRecommendedUsers,
} = require("../controllers/userController");

const protect = require("../middleware/authMiddleware");

const router = express.Router();
const upload = multer({ storage: multer.memoryStorage() });

router.get("/search", protect, searchUsers);
router.get("/recommended", protect, getRecommendedUsers);
router.put(
  "/update",
  protect,
  upload.fields([
    { name: "avatar", maxCount: 1 },
    { name: "coverImage", maxCount: 1 },
  ]),
  updateProfile
);

router.put("/:id/follow", protect, followUnfollowUser);
router.get("/:id", getUserProfile);

module.exports = router;