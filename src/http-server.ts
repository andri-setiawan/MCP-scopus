#!/usr/bin/env node

import express, { Request, Response } from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import dotenv from "dotenv";
import { setApiKey } from "./client.js";
import { registerHandlers } from "./handlers.js";

dotenv.config();

const SCOPUS_API_KEY = process.env.SCOPUS_API_KEY;
const PORT = process.env.PORT || 5566;

if (!SCOPUS_API_KEY) {
  console.error("Error: SCOPUS_API_KEY environment variable is required");
  process.exit(1);
}

setApiKey(SCOPUS_API_KEY);

function createServer(): Server {
  const server = new Server(
    { name: "mcp-scopus", version: "2.0.0" },
    { capabilities: { tools: {} } }
  );
  registerHandlers(server);
  return server;
}

const transports: Map<string, { transport: SSEServerTransport; server: Server }> = new Map();

const app = express();
app.use(cors());
app.use(express.json());

app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "mcp-scopus" });
});

app.get("/sse", async (req: Request, res: Response) => {
  console.log("New SSE connection request");

  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  const server = createServer();
  const transport = new SSEServerTransport("/message", res);
  const sessionId = Math.random().toString(36).substring(2, 15);
  transports.set(sessionId, { transport, server });

  console.log(`Session ${sessionId} created`);

  res.on("close", () => {
    console.log(`Session ${sessionId} closed`);
    transports.delete(sessionId);
  });

  try {
    await server.connect(transport);
    console.log(`Session ${sessionId} connected`);
  } catch (error) {
    console.error(`Error connecting session ${sessionId}:`, error);
    transports.delete(sessionId);
    res.end();
  }
});

app.post("/message", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;
  console.log(`Message received for session ${sessionId || "unknown"}`);

  if (sessionId && transports.has(sessionId)) {
    const { transport } = transports.get(sessionId)!;
    try {
      await transport.handlePostMessage(req, res, req.body);
      return;
    } catch (error) {
      console.error(`Error handling message for session ${sessionId}:`, error);
      res.status(500).json({ error: "Internal server error" });
      return;
    }
  }

  for (const [id, { transport }] of transports) {
    try {
      await transport.handlePostMessage(req, res, req.body);
      console.log(`Message handled by session ${id}`);
      return;
    } catch {
      continue;
    }
  }

  res.status(404).json({ error: "No active session found" });
});

app.listen(PORT, () => {
  console.log(`Scopus MCP HTTP Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
