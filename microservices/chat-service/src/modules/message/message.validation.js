import { body, param } from "express-validator";

// Send message
export const validateSendMessage = [
  body("conversationId")
    .notEmpty().withMessage("conversationId is required")
    .isMongoId().withMessage("conversationId must be a valid MongoDB ID"),

  body("senderId")
    .notEmpty().withMessage("senderId is required")
    .isString().withMessage("senderId must be a string")
    .isUUID().withMessage("senderId must be a valid UUID"),

  body("content")
    .notEmpty().withMessage("content is required")
    .isString().withMessage("content must be a string")
    .isLength({ max: 1000 })
    .withMessage("content must be under 1000 characters"),
];

// Get messages
export const validateGetMessages = [
  param("conversationId")
    .notEmpty().withMessage("conversationId is required")
    .isMongoId().withMessage("conversationId must be a valid MongoDB ID"),
];

// Mark as read
export const validateMarkAsRead = [
  param("conversationId")
    .notEmpty().withMessage("conversationId is required")
    .isMongoId().withMessage("conversationId must be a valid MongoDB ID"),

  body("userId")
    .notEmpty().withMessage("userId is required")
    .isString().withMessage("userId must be a string")
    .isUUID().withMessage("userId must be a valid UUID"),
];