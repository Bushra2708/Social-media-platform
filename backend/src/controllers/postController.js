const Post = require("../models/Post");
const User = require("../models/User");
const Notification = require("../models/Notification");
const { uploadImage } = require("../utils/cloudinary");

const createPost = async (req, res) => {
  try {
    const { content, repostOf } = req.body;
    let imageUrl = "";

    // AI Content Moderation Filter
    const spamKeywords = ["scam", "spammy", "abuse", "violation", "hate speech", "malicious", "buy cheap followers", "crypto hack"];
    const containsSpam = content && spamKeywords.some(keyword => content.toLowerCase().includes(keyword));
    if (containsSpam) {
      return res.status(400).json({
        success: false,
        message: "Post blocked by AI Content Moderation: content violates community safety guidelines (detected spam or inappropriate keywords)."
      });
    }

    if (req.file) {
      imageUrl = await uploadImage(req.file);
    }

    const post = await Post.create({
      content: content || "",
      image: imageUrl,
      author: req.user.id,
      repostOf: repostOf || null,
    });

    const populatedPost = await Post.findById(post._id)
      .populate("author", "name username avatar isVerified badge")
      .populate({
        path: "repostOf",
        populate: {
          path: "author",
          select: "name username avatar isVerified badge",
        },
      });

    res.status(201).json({
      success: true,
      message: "Post created successfully",
      post: populatedPost,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getAllPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const total = await Post.countDocuments();
    const posts = await Post.find()
      .populate("author", "name username avatar isVerified badge")
      .populate("comments.user", "name username avatar isVerified badge")
      .populate({
        path: "repostOf",
        populate: {
          path: "author",
          select: "name username avatar isVerified badge",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getFeedPosts = async (req, res) => {
  try {
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;
    const skip = (page - 1) * limit;

    const currentUser = await User.findById(req.user.id);
    if (!currentUser) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Default query: show posts of followed users + self.
    // If user follows nobody, fall back to showing all posts.
    let query = {};
    if (currentUser.following && currentUser.following.length > 0) {
      query = {
        author: {
          $in: [...currentUser.following, req.user.id],
        },
      };
    }

    const total = await Post.countDocuments(query);
    const posts = await Post.find(query)
      .populate("author", "name username avatar isVerified badge")
      .populate("comments.user", "name username avatar isVerified badge")
      .populate({
        path: "repostOf",
        populate: {
          path: "author",
          select: "name username avatar isVerified badge",
        },
      })
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    res.status(200).json({
      success: true,
      count: posts.length,
      posts,
      hasMore: skip + posts.length < total,
    });
  } catch (error) {
    res.status(550).json({
      success: false,
      message: error.message,
    });
  }
};

const likeUnlikePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const userId = req.user.id;
    const alreadyLiked = post.likes.includes(userId);

    if (alreadyLiked) {
      post.likes = post.likes.filter(
        (id) => id.toString() !== userId
      );

      await post.save();

      // Remove the like notification
      await Notification.findOneAndDelete({
        sender: userId,
        receiver: post.author,
        type: "like",
        post: post._id,
      });

      return res.status(200).json({
        success: true,
        message: "Post unliked",
        likes: post.likes,
      });
    }

    post.likes.push(userId);

    await post.save();

    // Create notification
    if (post.author.toString() !== userId) {
      const notification = await Notification.create({
        sender: userId,
        receiver: post.author,
        type: "like",
        post: post._id,
      });

      try {
        const populatedNotification = await Notification.findById(notification._id)
          .populate("sender", "name username avatar isVerified badge")
          .populate({
            path: "post",
            select: "content image",
          });

        if (populatedNotification) {
          const socketService = require("../services/socketService");
          socketService.sendRealTimeNotification(post.author, {
            ...populatedNotification.toObject(),
            content: `${req.user.name || "Someone"} liked your post.`
          });
        }
      } catch (err) {
        console.error("Failed to send real-time notification:", err);
      }
    }

    res.status(200).json({
      success: true,
      message: "Post liked",
      likes: post.likes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deletePost = async (req, res) => {
  try {
    const post = await Post.findById(req.params.id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    if (post.author.toString() !== req.user.id) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this post",
      });
    }

    await Post.findByIdAndDelete(req.params.id);

    // Delete associated notifications
    await Notification.deleteMany({ post: req.params.id });

    // Also pull post from any user's saved list
    await User.updateMany(
      { savedPosts: req.params.id },
      { $pull: { savedPosts: req.params.id } }
    );

    res.status(200).json({
      success: true,
      message: "Post deleted successfully",
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const bookmarkPost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    const postId = req.params.id;
    const post = await Post.findById(postId);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    // Initialize savedPosts if missing
    if (!user.savedPosts) {
      user.savedPosts = [];
    }

    const alreadyBookmarked = user.savedPosts.includes(postId);

    if (alreadyBookmarked) {
      user.savedPosts = user.savedPosts.filter(
        (id) => id.toString() !== postId
      );
      await user.save();
      return res.status(200).json({
        success: true,
        message: "Post removed from bookmarks",
        savedPosts: user.savedPosts,
      });
    }

    user.savedPosts.push(postId);
    await user.save();

    res.status(200).json({
      success: true,
      message: "Post saved to bookmarks",
      savedPosts: user.savedPosts,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const addComment = async (req, res) => {
  try {
    const { text } = req.body;

    if (!text || !text.trim()) {
      return res.status(400).json({
        success: false,
        message: "Comment text is required",
      });
    }

    const post = await Post.findById(req.params.id);
    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = {
      user: req.user.id,
      text: text.trim(),
      createdAt: new Date(),
    };

    post.comments.push(comment);
    await post.save();

    // Create notification
    if (post.author.toString() !== req.user.id) {
      const notification = await Notification.create({
        sender: req.user.id,
        receiver: post.author,
        type: "comment",
        post: post._id,
      });

      try {
        const populatedNotification = await Notification.findById(notification._id)
          .populate("sender", "name username avatar isVerified badge")
          .populate({
            path: "post",
            select: "content image",
          });

        if (populatedNotification) {
          const socketService = require("../services/socketService");
          socketService.sendRealTimeNotification(post.author, {
            ...populatedNotification.toObject(),
            content: `${req.user.name || "Someone"} commented on your post.`
          });
        }
      } catch (err) {
        console.error("Failed to send real-time comment notification:", err);
      }
    }

    const updatedPost = await Post.findById(post._id).populate(
      "comments.user",
      "name username avatar isVerified badge"
    );

    res.status(201).json({
      success: true,
      message: "Comment added successfully",
      comments: updatedPost.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const deleteComment = async (req, res) => {
  try {
    const { id, commentId } = req.params;
    const post = await Post.findById(id);

    if (!post) {
      return res.status(404).json({
        success: false,
        message: "Post not found",
      });
    }

    const comment = post.comments.id(commentId);

    if (!comment) {
      return res.status(404).json({
        success: false,
        message: "Comment not found",
      });
    }

    // Check if user is comment author OR post author
    if (
      comment.user.toString() !== req.user.id &&
      post.author.toString() !== req.user.id
    ) {
      return res.status(403).json({
        success: false,
        message: "Unauthorized to delete this comment",
      });
    }

    post.comments.pull(commentId);
    await post.save();

    const updatedPost = await Post.findById(post._id).populate(
      "comments.user",
      "name username avatar isVerified badge"
    );

    res.status(200).json({
      success: true,
      message: "Comment deleted successfully",
      comments: updatedPost.comments,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createPost,
  getAllPosts,
  getFeedPosts,
  likeUnlikePost,
  deletePost,
  bookmarkPost,
  addComment,
  deleteComment,
};