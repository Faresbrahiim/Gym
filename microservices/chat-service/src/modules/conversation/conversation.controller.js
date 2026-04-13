import Conversation from "../conversation/conversation.model.js";

// Get or create a 1-to-1 conversation
export const getOrCreateConversation = async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    let conversation = await Conversation.findOne({
      isGroup: false,
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
        isGroup: false,
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Create a group conversation
export const createGroupConversation = async (req, res) => {
  const { name, participants, adminId } = req.body;

  try {
    if (!name) {
      return res.status(400).json({ message: "Group name is required" });
    }
    if (!participants || participants.length < 2) {
      return res.status(400).json({ message: "Group needs at least 2 participants" });
    }

    const conversation = await Conversation.create({
      name,
      isGroup: true,
      participants: [...participants, adminId],
      admin: adminId,
    });

    res.status(201).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add participant to group
export const addParticipant = async (req, res) => {
  const { conversationId } = req.params;
  const { userId, adminId } = req.body;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Not a group conversation" });
    }
    if (conversation.admin !== adminId) {
      return res.status(403).json({ message: "Only admin can add participants" });
    }
    if (conversation.participants.includes(userId)) {
      return res.status(400).json({ message: "User already in group" });
    }

    conversation.participants.push(userId);
    await conversation.save();

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Remove participant from group
export const removeParticipant = async (req, res) => {
  const { conversationId } = req.params;
  const { userId, adminId } = req.body;

  try {
    const conversation = await Conversation.findById(conversationId);

    if (!conversation.isGroup) {
      return res.status(400).json({ message: "Not a group conversation" });
    }
    if (conversation.admin !== adminId) {
      return res.status(403).json({ message: "Only admin can remove participants" });
    }

    conversation.participants = conversation.participants.filter(
      (p) => p !== userId
    );
    await conversation.save();

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations for a user (both 1-to-1 and group)
export const getUserConversations = async (req, res) => {
  const { userId } = req.params;

  try {
    const conversations = await Conversation.find({
      participants: userId,
    })
      .populate("lastMessage")
      .sort({ updatedAt: -1 });

    res.status(200).json(conversations);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};