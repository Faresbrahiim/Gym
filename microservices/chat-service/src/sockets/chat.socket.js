import { Server } from "socket.io";
import Message from "../modules/message/message.model.js";
import Conversation from "../modules/conversation/conversation.model.js";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // online users map: userId -> socketId
  const onlineUsers = new Map();

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id}`);

    // user comes online
    socket.on("user:online", (userId) => {
      onlineUsers.set(userId, socket.id);
      console.log(`User ${userId} is online`);
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });

    // join a conversation room
    socket.on("conversation:join", (conversationId) => {
      socket.join(conversationId);
      console.log(`Socket ${socket.id} joined conversation ${conversationId}`);
    });

    // send a message in real time
    socket.on("message:send", async ({ conversationId, senderId, content }) => {
      try {
        const message = await Message.create({
          conversationId,
          senderId,
          content,
        });

        await Conversation.findByIdAndUpdate(conversationId, {
          lastMessage: message._id,
        });

        // broadcast to everyone in the conversation room
        io.to(conversationId).emit("message:received", message);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // typing indicator
    socket.on("typing:start", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("typing:start", { userId });
    });

    socket.on("typing:stop", ({ conversationId, userId }) => {
      socket.to(conversationId).emit("typing:stop", { userId });
    });

    // user disconnects
    socket.on("disconnect", () => {
      for (const [userId, socketId] of onlineUsers.entries()) {
        if (socketId === socket.id) {
          onlineUsers.delete(userId);
          console.log(`User ${userId} went offline`);
          break;
        }
      }
      io.emit("users:online", Array.from(onlineUsers.keys()));
    });
  });
};