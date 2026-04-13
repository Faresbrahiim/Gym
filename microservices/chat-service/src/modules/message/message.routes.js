import express from "express";
import {
  sendMessage,
  getMessages,
  markAsRead,
} from "./message.controller.js";

const router = express.Router();

router.post("/", sendMessage);
router.get("/:conversationId", getMessages);
router.patch("/:conversationId/read", markAsRead);

export default router;