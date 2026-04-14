export interface Message {
  _id: string;
  conversationId: string;
  senderId: string;
  content: string;
  readBy: string[];
  createdAt: string;
  updatedAt: string;
}
