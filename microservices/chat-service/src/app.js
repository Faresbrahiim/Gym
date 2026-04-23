import express from "express";
import conversationRoutes from "./modules/conversation/conversation.routes.js";
import messageRoutes from "./modules/message/message.routes.js";

const app = express();

app.use(express.json());

app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// ---------------------------------------------------------------------------
// Presence proxy
// POST /api/presence/bulk  { "userIds": ["id1", "id2", ...] }
// Returns { "id1": true, "id2": false, ... }
// Calls presence-service internally — keeps presence-service off the public Kong
// surface for bulk queries while the frontend goes through a single trusted endpoint.
// ---------------------------------------------------------------------------
const PRESENCE_SERVICE_URL = process.env.PRESENCE_SERVICE_URL ?? "http://presence-service:8080";

app.post("/api/presence/bulk", async (req, res) => {
  const { userIds } = req.body;

  if (!Array.isArray(userIds) || userIds.length === 0) {
    return res.status(400).json({ message: "userIds must be a non-empty array" });
  }

  try {
    const results = await Promise.all(
      userIds.map(async (id) => {
        try {
          const response = await fetch(`${PRESENCE_SERVICE_URL}/presence/${id}`);
          if (!response.ok) return { id, online: false };
          const data = await response.json();
          return { id, online: data.online === true };
        } catch {
          return { id, online: false };
        }
      })
    );

    const presenceMap = Object.fromEntries(results.map(({ id, online }) => [id, online]));
    res.json(presenceMap);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

export default app;