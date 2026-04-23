import Conversation from "../conversation/conversation.model.js";
import Message from "./message.model.js";
import { publishKafkaMessages } from "../../config/kafka.js";

const CHAT_MESSAGE_CREATED_TOPIC = "chat.message.created";

export const createMessageWithNotifications = async ({
  conversationId,
  senderId,
  content,
}) => {
  const conversation = await Conversation.findById(conversationId);
  if (!conversation) {
    throw new Error("Conversation not found");
  }

  const message = await Message.create({
    conversationId,
    senderId,
    content,
  });

  conversation.lastMessage = message._id;
  await conversation.save();

  try {
    await publishChatMessageCreated(conversation, message);
  } catch (error) {
    console.error("Failed to publish chat.message.created event:", error.message);
  }

  return { message, conversation };
};

const publishChatMessageCreated = async (conversation, message) => {
  const recipients = conversation.participants.filter(
    (participantId) => participantId !== message.senderId
  );

  if (recipients.length === 0) return;

  const messages = recipients.map((recipientUserId) => ({
    key: recipientUserId,
    value: JSON.stringify({
      messageId: message._id.toString(),
      conversationId: conversation._id.toString(),
      senderId: message.senderId,
      recipientUserId,
      content: message.content,
      group: conversation.isGroup === true,
      conversationName: conversation.name ?? null,
    }),
  }));

  await publishKafkaMessages(CHAT_MESSAGE_CREATED_TOPIC, messages);
};
