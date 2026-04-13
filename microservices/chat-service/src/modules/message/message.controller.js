import Message from "../message/message.model.js";
import Conversation from "../conversation/conversation.model.js";

// Send a message
export const sendMessage = async (req, res) => {
  const { conversationId, senderId, content } = req.body;

  try {
    const message = await Message.create({
      conversationId,
      senderId,
      content,
    });

    // Update lastMessage in conversation
    await Conversation.findByIdAndUpdate(conversationId, {
      lastMessage: message._id,
    });

    res.status(201).json(message);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all messages in a conversation
export const getMessages = async (req, res) => {
  const { conversationId } = req.params;

  try {
    const messages = await Message.find({ conversationId })
      .sort({ createdAt: 1 });

    res.status(200).json(messages);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Mark messages as read
export const markAsRead = async (req, res) => {
  const { conversationId } = req.params;
  const { userId } = req.body;

  try {
    await Message.updateMany(
      { conversationId, readBy: { $ne: userId } },
      { $push: { readBy: userId } }
    );

    res.status(200).json({ message: "Messages marked as read" });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};