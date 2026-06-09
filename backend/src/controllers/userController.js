const User = require("../models/User");
const Notification = require("../models/Notification");
const { uploadImage } = require("../utils/cloudinary");

const followUnfollowUser = async (req, res) => {
  try {
    const targetUserId = req.params.id;
    const currentUserId = req.user.id;

    if (targetUserId === currentUserId) {
      return res.status(400).json({
        success: false,
        message: "You cannot follow yourself",
      });
    }

    const currentUser = await User.findById(currentUserId);
    const targetUser = await User.findById(targetUserId);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const alreadyFollowing =
      currentUser.following.includes(targetUserId);

    if (alreadyFollowing) {
      currentUser.following = currentUser.following.filter(
        (id) => id.toString() !== targetUserId
      );

      targetUser.followers = targetUser.followers.filter(
        (id) => id.toString() !== currentUserId
      );

      await currentUser.save();
      await targetUser.save();

      // Remove the follow notification
      await Notification.findOneAndDelete({
        sender: currentUserId,
        receiver: targetUserId,
        type: "follow",
      });

      return res.status(200).json({
        success: true,
        message: "User unfollowed",
      });
    }

    currentUser.following.push(targetUserId);
    targetUser.followers.push(currentUserId);

    await currentUser.save();
    await targetUser.save();

    // Create notification
    const notification = await Notification.create({
      sender: currentUserId,
      receiver: targetUserId,
      type: "follow",
    });

    try {
      const populatedNotification = await Notification.findById(notification._id)
        .populate("sender", "name username avatar isVerified badge");

      if (populatedNotification) {
        const socketService = require("../services/socketService");
        socketService.sendRealTimeNotification(targetUserId, {
          ...populatedNotification.toObject(),
          content: `${currentUser.name || "Someone"} started following you.`
        });
      }
    } catch (err) {
      console.error("Failed to send real-time follow notification:", err);
    }

    res.status(200).json({
      success: true,
      message: "User followed",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getUserProfile = async (req, res) => {
  try {
    const user = await User.findById(req.params.id)
      .select("-password")
      .populate("followers", "name username avatar bio isVerified badge")
      .populate("following", "name username avatar bio isVerified badge")
      .populate({
        path: "savedPosts",
        populate: {
          path: "author",
          select: "name username avatar isVerified badge",
        },
      });

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    res.status(200).json({
      success: true,
      user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const updateProfile = async (req, res) => {
  try {
    const { name, bio } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    if (name) user.name = name;
    if (bio !== undefined) user.bio = bio;

    if (req.files) {
      if (req.files.avatar && req.files.avatar[0]) {
        user.avatar = await uploadImage(req.files.avatar[0]);
      }
      if (req.files.coverImage && req.files.coverImage[0]) {
        user.coverImage = await uploadImage(
          req.files.coverImage[0]
        );
      }
    }

    await user.save();

    const updatedUser = await User.findById(user._id).select(
      "-password"
    );

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const searchUsers = async (req, res) => {
  try {
    const { query } = req.query;

    if (!query) {
      return res.status(200).json({
        success: true,
        users: [],
      });
    }

    const users = await User.find({
      $or: [
        { name: { $regex: query, $options: "i" } },
        { username: { $regex: query, $options: "i" } },
      ],
      _id: { $ne: req.user?.id },
    })
      .select("name username avatar bio followers isVerified badge")
      .limit(20);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getRecommendedUsers = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);

    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const excludedIds = [currentUserId, ...currentUser.following];

    const users = await User.find({
      _id: { $nin: excludedIds },
    })
      .select("name username avatar bio isVerified badge")
      .limit(5);

    res.status(200).json({
      success: true,
      users,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  followUnfollowUser,
  getUserProfile,
  updateProfile,
  searchUsers,
  getRecommendedUsers,
};