import express from "express";
import {
  getOrCreateConversation,
  getUserConversations,
} from "./conversation.controller.js";

const router = express.Router();

router.post("/", getOrCreateConversation);
router.get("/:userId", getUserConversations);

export default router;