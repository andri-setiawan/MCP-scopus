#!/usr/bin/env node

import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import dotenv from "dotenv";
import { setApiKey } from "./client.js";
import { registerHandlers } from "./handlers.js";

dotenv.config();

const SCOPUS_API_KEY = process.env.SCOPUS_API_KEY;

if (!SCOPUS_API_KEY) {
  console.error("Error: SCOPUS_API_KEY environment variable is required");
  process.exit(1);
}

setApiKey(SCOPUS_API_KEY);

const server = new Server(
  { name: "mcp-scopus", version: "2.0.0" },
  { capabilities: { tools: {} } }
);

registerHandlers(server);

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error("Scopus MCP server running on stdio");
}

main().catch((error) => {
  console.error("Fatal error:", error);
  process.exit(1);
});
