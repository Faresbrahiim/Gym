import express from "express";
import {
  sendMessage,
  getMessages,
  markAsRead,
} from "./message.controller.js";
import {
  validateSendMessage,
  validateGetMessages,
  validateMarkAsRead,
} from "./message.validation.js";
import validate from "../../middlewares/validate.js";

const router = express.Router();

router.post("/", validateSendMessage, validate, sendMessage);
router.get("/:conversationId", validateGetMessages, validate, getMessages);
router.patch("/:conversationId/read", validateMarkAsRead, validate, markAsRead);

export default router;