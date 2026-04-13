import express from "express";
import conversationRoutes from "./modules/conversation/conversation.routes.js";
import messageRoutes from "./modules/message/message.routes.js";

const app = express();

app.use(express.json());

app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

export default app;