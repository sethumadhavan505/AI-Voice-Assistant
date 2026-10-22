import "dotenv/config";
import express from "express";
import cors from "cors";
import OpenAI from "openai";

const app = express();
const port = Number(process.env.PORT || 3001);
const clientOrigin = process.env.CLIENT_ORIGIN || "http://localhost:5173";

app.use(cors({ origin: clientOrigin }));
app.use(express.json({ limit: "1mb" }));

const apiKey = process.env.OPENAI_API_KEY;
const openai = apiKey ? new OpenAI({ apiKey }) : null;

app.get("/api/health", (_req, res) => {
  res.json({ ok: true, configured: Boolean(openai) });
});

app.post("/api/chat", async (req, res) => {
  try {
    if (!openai) {
      return res.status(503).json({
        error: "The AI server is not configured. Add OPENAI_API_KEY to server/.env and restart it."
      });
    }

    const messages = req.body?.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 30) {
      return res.status(400).json({ error: "Send between 1 and 30 conversation messages." });
    }

    const safeMessages = messages
      .filter((m) => m && ["user", "assistant"].includes(m.role) && typeof m.content === "string")
      .map((m) => ({ role: m.role, content: m.content.slice(0, 8000) }));

    if (!safeMessages.length) {
      return res.status(400).json({ error: "No valid messages were provided." });
    }

    const completion = await openai.chat.completions.create({
      model: process.env.OPENAI_MODEL || "gpt-4o-mini",
      messages: [
        {
          role: "system",
          content: "You are Aura, a friendly, helpful voice assistant. Give clear, natural answers that sound good when read aloud. Keep answers concise unless the user asks for detail. Do not claim to perform actions you cannot perform."
        },
        ...safeMessages
      ],
      temperature: 0.7
    });

    const answer = completion.choices?.[0]?.message?.content?.trim();
    if (!answer) return res.status(502).json({ error: "The AI returned an empty response. Please try again." });
    res.json({ answer });
  } catch (error) {
    console.error("Chat request failed:", error?.message || error);
    const status = error?.status === 401 ? 502 : 500;
    res.status(status).json({
      error: error?.status === 401
        ? "The server API key was rejected. Check OPENAI_API_KEY in server/.env."
        : "Sorry, I couldn't get a response right now. Check the server logs and try again."
    });
  }
});

app.listen(port, () => {
  console.log(`Aura AI server listening on http://localhost:${port}`);
});
