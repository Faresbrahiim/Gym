import http from "http";
import app from "./app.js";
import { initSocket } from "./sockets/chat.socket.js";
import connectDB from "./config/db.js";

await connectDB();

const server = http.createServer(app);
initSocket(server);

server.listen(process.env.PORT || 5000, () => {
  console.log(`Chat service running on port ${process.env.PORT || 5000}`);
});