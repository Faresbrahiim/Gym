import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { createMessageWithNotifications } from "../modules/message/message.service.js";

// PEM key stored with literal \n — reconstruct real newlines at startup
const JWT_PUBLIC_KEY = (process.env.JWT_PUBLIC_KEY ?? "").replace(/\\n/g, "\n");
const JWT_ISSUER    = process.env.JWT_ISSUER    ?? "MyGymApp";
const JWT_AUDIENCE  = process.env.JWT_AUDIENCE  ?? "MyGymUsers";

export const initSocket = (server) => {
  const io = new Server(server, {
    cors: {
      origin: "*",
      methods: ["GET", "POST"],
    },
  });

  // Authenticate every connection using the Bearer token from the handshake.
  // The frontend already sends: io(url, { auth: { token } })
  io.use((socket, next) => {
    const token = socket.handshake.auth?.token;
    if (!token) return next(new Error("Authentication required"));

    try {
      const payload = jwt.verify(token, JWT_PUBLIC_KEY, {
        algorithms: ["RS256"],
        issuer: JWT_ISSUER,
        audience: JWT_AUDIENCE,
      });
      socket.data.userId = payload.sub;
      next();
    } catch {
      next(new Error("Invalid token"));
    }
  });

  io.on("connection", (socket) => {
    console.log(`Socket connected: ${socket.id} (userId: ${socket.data.userId})`);

    // join a conversation room
    socket.on("conversation:join", (conversationId) => {
      socket.join(conversationId);
    });

    // send a message in real time
    // senderId comes from the validated JWT — client-provided senderId is ignored
    socket.on("message:send", async ({ conversationId, content }) => {
      try {
        const { message } = await createMessageWithNotifications({
          conversationId,
          senderId: socket.data.userId,
          content,
        });

        io.to(conversationId).emit("message:received", message);
      } catch (error) {
        socket.emit("error", { message: error.message });
      }
    });

    // typing indicators
    socket.on("typing:start", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:start", { userId: socket.data.userId });
    });

    socket.on("typing:stop", ({ conversationId }) => {
      socket.to(conversationId).emit("typing:stop", { userId: socket.data.userId });
    });

    socket.on("disconnect", () => {
      console.log(`Socket disconnected: ${socket.id} (userId: ${socket.data.userId})`);
    });
  });
};
