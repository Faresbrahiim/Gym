import { Message } from "./message.model";
export interface Conversation {
  _id: string;
  participants: string[];
  isGroup: boolean;
  name?: string;
  admin?: string;
  lastMessage?: Message;
  createdAt: string;
  updatedAt: string;
}
