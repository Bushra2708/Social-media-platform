const Story = require("../models/Story");
const User = require("../models/User");
const { uploadImage } = require("../utils/cloudinary");

const createStory = async (req, res) => {
  try {
    if (!req.file && !req.body.image) {
      return res.status(400).json({
        success: false,
        message: "An image file is required to post a story",
      });
    }

    let imageUrl = "";
    if (req.file) {
      imageUrl = await uploadImage(req.file);
    } else {
      imageUrl = req.body.image;
    }

    const story = await Story.create({
      author: req.user.id,
      image: imageUrl,
    });

    const populatedStory = await Story.findById(story._id).populate(
      "author",
      "name username avatar isVerified badge"
    );

    res.status(201).json({
      success: true,
      story: populatedStory,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

const getActiveStories = async (req, res) => {
  try {
    const currentUserId = req.user.id;
    const currentUser = await User.findById(currentUserId);
    
    if (!currentUser) {
      return res.status(404).json({ success: false, message: "User not found" });
    }

    // Load active stories from current user + users they follow
    const userIds = [currentUserId, ...currentUser.following];

    let stories = await Story.find({
      author: { $in: userIds },
      expiresAt: { $gt: new Date() },
    })
      .sort({ createdAt: 1 })
      .populate("author", "name username avatar isVerified badge");

    // Fallback: If no stories exist in follow pool, load overall system stories for active styling demo
    if (stories.length === 0) {
      stories = await Story.find({
        expiresAt: { $gt: new Date() },
      })
        .sort({ createdAt: 1 })
        .populate("author", "name username avatar isVerified badge");
    }

    // Group stories by author
    const groupedStoriesMap = new Map();

    stories.forEach((story) => {
      const authorId = story.author._id.toString();
      if (!groupedStoriesMap.has(authorId)) {
        groupedStoriesMap.set(authorId, {
          user: story.author,
          stories: [],
        });
      }
      groupedStoriesMap.get(authorId).stories.push({
        _id: story._id,
        image: story.image,
        createdAt: story.createdAt,
      });
    });

    const groupedStories = Array.from(groupedStoriesMap.values());

    res.status(200).json({
      success: true,
      stories: groupedStories,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

module.exports = {
  createStory,
  getActiveStories,
};
