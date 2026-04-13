import express from "express";
import {
  getOrCreateConversation,
  createGroupConversation,
  getUserConversations,
  addParticipant,
  removeParticipant,
} from "./conversation.controller.js";
import {
  validateGetOrCreate,
  validateCreateGroup,
  validateAddRemoveParticipant,
  validateGetUserConversations,
} from "./conversation.validation.js";
import validate from "../../middlewares/validate.js";

const router = express.Router();

router.post("/", validateGetOrCreate, validate, getOrCreateConversation);
router.post("/group", validateCreateGroup, validate, createGroupConversation);
router.get("/:userId", validateGetUserConversations, validate, getUserConversations);
router.patch("/:conversationId/add", validateAddRemoveParticipant, validate, addParticipant);
router.patch("/:conversationId/remove", validateAddRemoveParticipant, validate, removeParticipant);

export default router;