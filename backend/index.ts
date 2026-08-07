import { tavily } from "@tavily/core";
import express from "express";
import OpenAI from "openai";
import "dotenv/config";
import { prisma } from "./db.ts";
import cors from "cors";

import { SYSTEM_PROMPT, PROMPT_TEMPLATE } from "./prompts";
import { middleware } from "./middleware";
import { rateLimit } from "./rateLimit";

const client = tavily({ apiKey: process.env.TAVILY_API_KEY });
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const app = express();

app.use(express.json());
const allowedOrigins = (process.env.CORS_ORIGIN || "http://localhost:5173")
  .split(",")
  .map((o) => o.trim());

app.use(cors({ origin: allowedOrigins }));

app.get("/health", (_req, res) => {
  res.status(200).json({ status: "ok" });
});

// end points

// // testing
// async function testDb() {
//   const res = await prisma.user.create({
//     data: {
//       email: "mehul.test@gmail.com",
//
//       provider: "Github",
//
//       name: "Mehul",
//     },
//   });
//
//   console.log(res);
// }
//
// testDb();

app.post("/webster/ask", middleware, rateLimit, async (req, res) => {
  const query = req.body.query;
  if (!query) {
    return res.status(400).json({
      error: "Query is required",
    });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: req.userId },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const base =
    query.match(/[a-z0-9]+/gi)?.join("-").slice(0, 80) ||
    `conv-${Date.now()}`;
  const slug = `${base}-${crypto.randomUUID().slice(0, 8)}`;

  const conversation = await prisma.conversation.create({
    data: {
      title: query.slice(0, 100),
      slug,
      userId: user.id,
    },
  });

  const webSearchResponse = await client.search(query, {
    searchDepth: "advanced",
  });
  const webSearchResult = webSearchResponse.results;

  const prompt = PROMPT_TEMPLATE.replace(
    "{{WEB_SEARCH_RESULTS}}",
    JSON.stringify(webSearchResult),
  ).replace("{{USER_QUERY}}", query);

  await prisma.message.create({
    data: {
      content: query,
      role: "User",
      conversationId: conversation.id,
    },
  });

  const stream = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "user", content: prompt },
    ],
    stream: true,
  });

  res.header("Cache-Control", "no-cache");
  res.header("Content-Type", "text/event-stream");

  res.write(`<CONVERSATION_ID>${conversation.id}</CONVERSATION_ID>\n`);

  let fullResponse = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    fullResponse += text;
    res.write(text);
  }

  res.write("\n<SOURCES>\n");
  res.write(
    JSON.stringify(
      webSearchResult.map((result) => ({
        url: result.url,
      })),
    ),
  );
  res.write("\n</SOURCES>\n");

  res.end();

  await prisma.message.create({
    data: {
      content: fullResponse,
      role: "Assistant",
      conversationId: conversation.id,
    },
  });
});

// Get all past conversations
app.get("/conversations", middleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { supabaseId: req.userId },
    include: {
      conversations: {
        include: {
          messages: {
            take: 1,
            orderBy: { createdAt: "desc" },
          },
          _count: { select: { messages: true } },
        },
      },
    },
  });

  if (!user) {
    return res.json([]);
  }

  const conversations = [...user.conversations].sort(
    (a, b) =>
      new Date(b.messages[0]?.createdAt ?? 0).getTime() -
      new Date(a.messages[0]?.createdAt ?? 0).getTime(),
  );

  res.json(conversations);
});

// Get a specific conversation
app.get("/conversation/:conversationId", middleware, async (req, res) => {
  const user = await prisma.user.findUnique({
    where: { supabaseId: req.userId },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: String(req.params.conversationId), userId: user.id },
    include: {
      messages: { orderBy: { createdAt: "asc" } },
    },
  });

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  res.json(conversation);
});

// Follow-up within an existing conversation
app.post("/webster/follow-up", middleware, rateLimit, async (req, res) => {
  const { conversationId, query } = req.body;

  if (!conversationId || !query) {
    return res.status(400).json({ error: "conversationId and query are required" });
  }

  const user = await prisma.user.findUnique({
    where: { supabaseId: req.userId },
  });

  if (!user) {
    return res.status(404).json({ error: "User not found" });
  }

  const conversation = await prisma.conversation.findFirst({
    where: { id: conversationId, userId: user.id },
    include: { messages: { orderBy: { createdAt: "asc" } } },
  });

  if (!conversation) {
    return res.status(404).json({ error: "Conversation not found" });
  }

  const webSearchResponse = await client.search(query, {
    searchDepth: "advanced",
  });
  const webSearchResult = webSearchResponse.results;

  const historyMessages = conversation.messages.map((m) => ({
    role: m.role === "User" ? "user" : "assistant",
    content: m.content,
  })) as ({ role: "user" | "assistant"; content: string })[];

  const followUpPrompt = PROMPT_TEMPLATE.replace(
    "{{WEB_SEARCH_RESULTS}}",
    JSON.stringify(webSearchResult),
  ).replace("{{USER_QUERY}}", query);

  await prisma.message.create({
    data: {
      content: query,
      role: "User",
      conversationId: conversation.id,
    },
  });

  const stream = await openai.chat.completions.create({
    model: "gpt-4.1-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      ...historyMessages,
      { role: "user", content: followUpPrompt },
    ],
    stream: true,
  });

  res.header("Cache-Control", "no-cache");
  res.header("Content-Type", "text/event-stream");

  let fullResponse = "";
  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content || "";
    fullResponse += text;
    res.write(text);
  }

  res.write("\n<SOURCES>\n");
  res.write(
    JSON.stringify(
      webSearchResult.map((result) => ({
        url: result.url,
      })),
    ),
  );
  res.write("\n</SOURCES>\n");

  res.end();

  await prisma.message.create({
    data: {
      content: fullResponse,
      role: "Assistant",
      conversationId: conversation.id,
    },
  });
});
app.listen(Number(process.env.PORT) || 3001, () => {
  console.log(`Server running on port ${process.env.PORT || 3001}`);
});
