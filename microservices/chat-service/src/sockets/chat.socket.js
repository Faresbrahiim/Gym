import { Server } from "socket.io";

export const initSocket = (server) => {
  const io = new Server(server, { /* cors options */ });
  // your socket logic
};