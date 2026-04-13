import Conversation from "../conversation/conversation.model.js";

// Get or create a conversation between two users
export const getOrCreateConversation = async (req, res) => {
  const { senderId, receiverId } = req.body;

  try {
    let conversation = await Conversation.findOne({
      participants: { $all: [senderId, receiverId] },
    });

    if (!conversation) {
      conversation = await Conversation.create({
        participants: [senderId, receiverId],
      });
    }

    res.status(200).json(conversation);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all conversations for a user
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