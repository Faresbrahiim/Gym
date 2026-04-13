import { body, param } from "express-validator";

export const validateGetOrCreate = [
  body("senderId")
    .notEmpty().withMessage("senderId is required")
    .isString().withMessage("senderId must be a string")
    .isUUID().withMessage("senderId must be a valid UUID"),
  body("receiverId")
    .notEmpty().withMessage("receiverId is required")
    .isString().withMessage("receiverId must be a string")
    .isUUID().withMessage("receiverId must be a valid UUID"),
];

export const validateCreateGroup = [
  body("name")
    .notEmpty().withMessage("Group name is required")
    .isString().withMessage("Group name must be a string"),
  body("adminId")
    .notEmpty().withMessage("adminId is required")
    .isString().withMessage("adminId must be a string")
    .isUUID().withMessage("adminId must be a valid UUID"),
  body("participants")
    .isArray({ min: 2 }).withMessage("participants must be an array with at least 2 users"),
  body("participants.*")
    .isString().withMessage("Each participant must be a string"),
];

export const validateAddRemoveParticipant = [
  param("conversationId")
    .notEmpty().withMessage("conversationId is required")
    .isMongoId().withMessage("conversationId must be a valid MongoDB ID")
    .isUUID().withMessage("conversationId must be a valid UUID"),
  body("userId")
    .notEmpty().withMessage("userId is required")
    .isString().withMessage("userId must be a string")
    .isUUID().withMessage("userId must be a valid UUID"),
  body("adminId")
    .notEmpty().withMessage("adminId is required")
    .isString().withMessage("adminId must be a string")
    .isUUID().withMessage("adminId must be a valid UUID"),
];

export const validateGetUserConversations = [
  param("userId")
    .notEmpty().withMessage("userId is required")
    .isString().withMessage("userId must be a string")
    .isUUID().withMessage("userId must be a valid UUID"),
];