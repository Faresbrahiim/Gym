import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    conversationId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Conversation",
      required: true,
    },
    senderId: {
      type: String,
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    readBy: [{ type: String }], // list of userIds who read the message
  },
  { timestamps: true }
);

export default mongoose.model("Message", messageSchema);