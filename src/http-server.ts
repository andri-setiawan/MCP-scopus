#!/usr/bin/env node

import express, { Request, Response } from "express";
import cors from "cors";
import { Server } from "@modelcontextprotocol/sdk/server/index.js";
import { SSEServerTransport } from "@modelcontextprotocol/sdk/server/sse.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import axios from "axios";
import dotenv from "dotenv";

dotenv.config();

const SCOPUS_API_KEY = process.env.SCOPUS_API_KEY;
const SCOPUS_BASE_URL = "https://api.elsevier.com/content";
const PORT = process.env.PORT || 5566;

if (!SCOPUS_API_KEY) {
  console.error("Error: SCOPUS_API_KEY environment variable is required");
  process.exit(1);
}

// Scopus API client
const scopusClient = axios.create({
  baseURL: SCOPUS_BASE_URL,
  headers: {
    "X-ELS-APIKey": SCOPUS_API_KEY,
    "Accept": "application/json",
  },
});

// Helper function to format paper data
function formatPaper(entry: any) {
  return {
    scopusId: entry["dc:identifier"]?.replace("SCOPUS_ID:", "") || "",
    title: entry["dc:title"] || "",
    authors: entry["dc:creator"] || "",
    publicationName: entry["prism:publicationName"] || "",
    publicationDate: entry["prism:coverDate"] || "",
    volume: entry["prism:volume"] || "",
    issue: entry["prism:issueIdentifier"] || "",
    pages: entry["prism:pageRange"] || "",
    doi: entry["prism:doi"] || "",
    issn: entry["prism:issn"] || "",
    eIssn: entry["prism:eIssn"] || "",
    isbn: entry["prism:isbn"] || "",
    citations: entry["citedby-count"] || "0",
    abstract: entry["dc:description"] || "",
    affiliation: entry["affiliation"] || [],
    keywords: entry["authkeywords"] || "",
    documentType: entry["subtypeDescription"] || "",
    openAccess: entry["openaccess"] || "0",
    openAccessType: entry["openaccessFlag"] || "",
    url: entry["link"]?.[0]?.["@href"] || "",
  };
}

// Create MCP Server factory
function createServer(): Server {
  const server = new Server(
    {
      name: "mcp-scopus",
      version: "1.0.0",
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  // List available tools
  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: "search_papers",
          description: "Search for academic papers on Scopus by keywords, title, author, or other criteria. Returns a list of matching papers with metadata including title, authors, abstract, citations, DOI, and more.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "The search query. Examples: 'machine learning', 'TITLE(machine learning)', 'AUTHOR(smith)', 'ABS(neural networks) AND PUBYEAR > 2020'",
              },
              count: {
                type: "number",
                description: "Number of results to return (default: 10, max: 200)",
                default: 10,
              },
              start: {
                type: "number",
                description: "Starting index for pagination (default: 0)",
                default: 0,
              },
              sortBy: {
                type: "string",
                description: "Sort field: 'relevance', 'date', 'citedby-count', 'pub-name'",
                enum: ["relevance", "date", "citedby-count", "pub-name"],
                default: "relevance",
              },
              sortOrder: {
                type: "string",
                description: "Sort order: 'asc' or 'desc'",
                enum: ["asc", "desc"],
                default: "desc",
              },
              field: {
                type: "string",
                description: "Comma-separated list of fields to return (optional). If not specified, returns all available fields.",
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_paper_by_id",
          description: "Retrieve detailed information about a specific paper using its Scopus EID or Scopus ID.",
          inputSchema: {
            type: "object",
            properties: {
              scopusId: {
                type: "string",
                description: "The Scopus ID or EID of the paper. Examples: '2-s2.0-85123456789', '85123456789'",
              },
              field: {
                type: "string",
                description: "Comma-separated list of fields to return (optional)",
              },
            },
            required: ["scopusId"],
          },
        },
        {
          name: "get_paper_by_doi",
          description: "Retrieve detailed information about a specific paper using its DOI (Digital Object Identifier).",
          inputSchema: {
            type: "object",
            properties: {
              doi: {
                type: "string",
                description: "The DOI of the paper. Examples: '10.1016/j.example.2023.01.001'",
              },
            },
            required: ["doi"],
          },
        },
        {
          name: "search_authors",
          description: "Search for authors on Scopus by name. Returns author profiles with affiliations, publication counts, citation counts, and h-index.",
          inputSchema: {
            type: "object",
            properties: {
              query: {
                type: "string",
                description: "Author name to search for. Examples: 'Smith J', 'John Smith'",
              },
              count: {
                type: "number",
                description: "Number of results to return (default: 10, max: 200)",
                default: 10,
              },
              start: {
                type: "number",
                description: "Starting index for pagination (default: 0)",
                default: 0,
              },
            },
            required: ["query"],
          },
        },
        {
          name: "get_author_by_id",
          description: "Retrieve detailed information about a specific author using their Scopus Author ID.",
          inputSchema: {
            type: "object",
            properties: {
              authorId: {
                type: "string",
                description: "The Scopus Author ID. Examples: '57217123456'",
              },
            },
            required: ["authorId"],
          },
        },
        {
          name: "get_author_publications",
          description: "Retrieve a list of publications by a specific author using their Scopus Author ID.",
          inputSchema: {
            type: "object",
            properties: {
              authorId: {
                type: "string",
                description: "The Scopus Author ID",
              },
              count: {
                type: "number",
                description: "Number of results to return (default: 25, max: 200)",
                default: 25,
              },
              start: {
                type: "number",
                description: "Starting index for pagination (default: 0)",
                default: 0,
              },
              sortBy: {
                type: "string",
                description: "Sort by: 'date', 'citedby-count'",
                enum: ["date", "citedby-count"],
                default: "date",
              },
              sortOrder: {
                type: "string",
                description: "Sort order: 'asc' or 'desc'",
                enum: ["asc", "desc"],
                default: "desc",
              },
            },
            required: ["authorId"],
          },
        },
        {
          name: "get_citations",
          description: "Retrieve the list of papers that cite a specific paper using its Scopus ID.",
          inputSchema: {
            type: "object",
            properties: {
              scopusId: {
                type: "string",
                description: "The Scopus ID of the paper to get citations for",
              },
              count: {
                type: "number",
                description: "Number of results to return (default: 20, max: 200)",
                default: 20,
              },
              start: {
                type: "number",
                description: "Starting index for pagination (default: 0)",
                default: 0,
              },
            },
            required: ["scopusId"],
          },
        },
        {
          name: "get_references",
          description: "Retrieve the list of references (bibliography) of a specific paper using its Scopus ID.",
          inputSchema: {
            type: "object",
            properties: {
              scopusId: {
                type: "string",
                description: "The Scopus ID of the paper to get references for",
              },
              count: {
                type: "number",
                description: "Number of results to return (default: 20, max: 200)",
                default: 20,
              },
              start: {
                type: "number",
                description: "Starting index for pagination (default: 0)",
                default: 0,
              },
            },
            required: ["scopusId"],
          },
        },
        {
          name: "search_by_affiliation",
          description: "Search for papers from a specific institution/affiliation.",
          inputSchema: {
            type: "object",
            properties: {
              affiliationName: {
                type: "string",
                description: "Name of the institution to search for",
              },
              count: {
                type: "number",
                description: "Number of results to return (default: 10)",
                default: 10,
              },
              start: {
                type: "number",
                description: "Starting index for pagination (default: 0)",
                default: 0,
              },
            },
            required: ["affiliationName"],
          },
        },
        {
          name: "get_abstract",
          description: "Retrieve the abstract of a specific paper using its Scopus ID.",
          inputSchema: {
            type: "object",
            properties: {
              scopusId: {
                type: "string",
                description: "The Scopus ID of the paper",
              },
            },
            required: ["scopusId"],
          },
        },
      ],
    };
  });

  // Handle tool execution
  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;

    try {
      switch (name) {
        case "search_papers": {
          const { query, count = 10, start = 0, sortBy = "relevance", sortOrder = "desc", field } = args as any;
          const params: any = {
            query,
            count,
            start,
            sort: `${sortBy}-${sortOrder}`,
          };
          if (field) params.field = field;

          const response = await scopusClient.get("/search/scopus", { params });
          const entries = response.data["search-results"]?.entry || [];
          const totalResults = response.data["search-results"]["opensearch:totalResults"];

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  totalResults,
                  startIndex: start,
                  itemsPerPage: count,
                  papers: entries.map(formatPaper),
                }, null, 2),
              },
            ],
          };
        }

        case "get_paper_by_id": {
          const { scopusId, field } = args as any;
          const normalizedId = scopusId.startsWith("2-s2.0-") ? scopusId : `2-s2.0-${scopusId}`;
          const params: any = {};
          if (field) params.field = field;

          const response = await scopusClient.get(`/abstract/scopus_id/${normalizedId}`, { params });
          const entry = response.data["abstracts-retrieval-response"];

          if (!entry) {
            throw new McpError(ErrorCode.InvalidRequest, `Paper with Scopus ID ${scopusId} not found`);
          }

          const coredata = entry.coredata || {};
          const authors = entry.authors?.author || [];
          const affiliations = entry.affiliation || [];

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  scopusId: coredata["dc:identifier"]?.replace("SCOPUS_ID:", "") || normalizedId,
                  title: coredata["dc:title"] || "",
                  authors: authors.map((a: any) => ({
                    name: a["ce:indexed-name"] || a["preferred-name"]?.ce?.indexedName || "",
                    givenName: a["ce:given-name"] || "",
                    surname: a["ce:surname"] || "",
                    authorId: a["@auid"] || "",
                    affiliation: a.affiliation?.["@id"] || "",
                  })),
                  publicationName: coredata["prism:publicationName"] || "",
                  publicationDate: coredata["prism:coverDate"] || "",
                  volume: coredata["prism:volume"] || "",
                  issue: coredata["prism:issueIdentifier"] || "",
                  pages: coredata["prism:pageRange"] || "",
                  doi: coredata["prism:doi"] || "",
                  issn: coredata["prism:issn"] || "",
                  citations: coredata["citedby-count"] || "0",
                  abstract: entry.item?.bibrecord?.head?.abstracts?.abstracts?.$ || "",
                  subjectAreas: entry.subjectAreas?.["subject-area"]?.map((s: any) => s.$) || [],
                  keywords: entry.item?.bibrecord?.head?.citationInfo?.authorKeywords?.["author-keyword"]?.map((k: any) => k.$) || [],
                  affiliations: affiliations.map((a: any) => ({
                    id: a["@affiliation-id"] || "",
                    name: a["affiliation-name"] || "",
                    city: a["city"] || "",
                    country: a["country"] || "",
                  })),
                  documentType: coredata["subtypeDescription"] || "",
                  openAccess: coredata["openaccess"] || "0",
                }, null, 2),
              },
            ],
          };
        }

        case "get_paper_by_doi": {
          const { doi } = args as any;
          const response = await scopusClient.get(`/abstract/doi/${encodeURIComponent(doi)}`);
          const entry = response.data["abstracts-retrieval-response"];

          if (!entry) {
            throw new McpError(ErrorCode.InvalidRequest, `Paper with DOI ${doi} not found`);
          }

          const coredata = entry.coredata || {};

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  scopusId: coredata["dc:identifier"]?.replace("SCOPUS_ID:", "") || "",
                  title: coredata["dc:title"] || "",
                  publicationName: coredata["prism:publicationName"] || "",
                  publicationDate: coredata["prism:coverDate"] || "",
                  doi: coredata["prism:doi"] || doi,
                  citations: coredata["citedby-count"] || "0",
                  abstract: entry.item?.bibrecord?.head?.abstracts?.abstracts?.$ || "",
                }, null, 2),
              },
            ],
          };
        }

        case "search_authors": {
          const { query, count = 10, start = 0 } = args as any;
          const response = await scopusClient.get("/search/author", {
            params: {
              query: `AUTHNAME(${query})`,
              count,
              start,
            },
          });

          const entries = response.data["search-results"]?.entry || [];
          const totalResults = response.data["search-results"]["opensearch:totalResults"];

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  totalResults,
                  startIndex: start,
                  itemsPerPage: count,
                  authors: entries.map((entry: any) => {
                    const preferredName = entry["preferred-name"] || {};
                    const surname = preferredName.surname || "";
                    const givenName = preferredName.given_name || preferredName["given-name"] || "";
                    const name = surname && givenName ? `${surname}, ${givenName}` : (entry["dc:title"] || "");
                    return {
                      authorId: entry["dc:identifier"]?.replace("AUTHOR_ID:", "") || "",
                      name,
                      givenName,
                      surname,
                      affiliation: entry["affiliation-current"]?.["affiliation-name"] || "",
                      documentCount: entry["document-count"] || "0",
                    };
                  }),
                }, null, 2),
              },
            ],
          };
        }

        case "get_author_by_id": {
          const { authorId } = args as any;
          const response = await scopusClient.get(`/author/author_id/${authorId}`);
          const entry = response.data["author-retrieval-response"]?.[0];

          if (!entry) {
            throw new McpError(ErrorCode.InvalidRequest, `Author with ID ${authorId} not found`);
          }

          const author = entry.author || {};
          const coauthor = entry.coauthor || [];
          const hIndex = entry.h_index || {};
          const preferredName = author["preferred-name"] || {};
          const surname = preferredName.surname || "";
          const givenName = preferredName.given_name || preferredName["given-name"] || "";
          const name = surname && givenName ? `${surname}, ${givenName}` : "";

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  authorId,
                  name,
                  givenName,
                  surname,
                  initials: preferredName.initials || "",
                  affiliation: author["affiliation-current"]?.["affiliation-name"] || "",
                  affiliationId: author["affiliation-current"]?.["affiliation-id"] || "",
                  subjectAreas: author["subject-area"]?.map((s: any) => s.$) || [],
                  documentCount: entry["coredata"]?.["document-count"] || "0",
                  citationCount: entry["coredata"]?.["cited-by-count"] || "0",
                  hIndex: hIndex?.$ || "0",
                  publicationStart: author["publication-start"]?.year || "",
                  publicationEnd: author["publication-end"]?.year || "",
                  coauthorCount: coauthor.length || 0,
                }, null, 2),
              },
            ],
          };
        }

        case "get_author_publications": {
          const { authorId, count = 25, start = 0, sortBy = "date", sortOrder = "desc" } = args as any;
          const response = await scopusClient.get("/search/scopus", {
            params: {
              query: `AU-ID(${authorId})`,
              count,
              start,
              sort: `${sortBy}-${sortOrder}`,
            },
          });

          const entries = response.data["search-results"]?.entry || [];
          const totalResults = response.data["search-results"]["opensearch:totalResults"];

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  authorId,
                  totalResults,
                  startIndex: start,
                  itemsPerPage: count,
                  publications: entries.map(formatPaper),
                }, null, 2),
              },
            ],
          };
        }

        case "get_citations": {
          const { scopusId, count = 20, start = 0 } = args as any;
          const normalizedId = scopusId.startsWith("2-s2.0-") ? scopusId : `2-s2.0-${scopusId}`;

          const response = await scopusClient.get("/search/scopus", {
            params: {
              query: `REF(${normalizedId})`,
              count,
              start,
              sort: "date-desc",
            },
          });

          const entries = response.data["search-results"]?.entry || [];
          const totalResults = response.data["search-results"]["opensearch:totalResults"];

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  citedPaperId: normalizedId,
                  totalCitations: totalResults,
                  startIndex: start,
                  itemsPerPage: count,
                  citingPapers: entries.map(formatPaper),
                }, null, 2),
              },
            ],
          };
        }

        case "get_references": {
          const { scopusId, count = 20, start = 0 } = args as any;
          const normalizedId = scopusId.startsWith("2-s2.0-") ? scopusId : `2-s2.0-${scopusId}`;

          const response = await scopusClient.get(`/abstract/scopus_id/${normalizedId}`, {
            params: {
              field: "references",
            },
          });

          const references = response.data["abstracts-retrieval-response"]?.item?.bibrecord?.tail?.bibliography?.reference || [];
          const paginatedReferences = references.slice(start, start + count);

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  paperId: normalizedId,
                  totalReferences: references.length,
                  startIndex: start,
                  itemsPerPage: count,
                  references: paginatedReferences.map((ref: any) => ({
                    id: ref["@id"] || "",
                    text: ref["ref-text"] || "",
                    authors: ref["ref-authors"]?.author?.map((a: any) => a["ce:indexed-name"] || a?.ce?.indexedName || "") || [],
                    title: ref["ref-title"]?._ || "",
                    source: ref["ref-source"]?._ || "",
                    year: ref["ref-year"] || "",
                  })),
                }, null, 2),
              },
            ],
          };
        }

        case "search_by_affiliation": {
          const { affiliationName, count = 10, start = 0 } = args as any;
          const response = await scopusClient.get("/search/scopus", {
            params: {
              query: `AFFIL("${affiliationName}")`,
              count,
              start,
              sort: "date-desc",
            },
          });

          const entries = response.data["search-results"]?.entry || [];
          const totalResults = response.data["search-results"]["opensearch:totalResults"];

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  affiliation: affiliationName,
                  totalResults,
                  startIndex: start,
                  itemsPerPage: count,
                  papers: entries.map(formatPaper),
                }, null, 2),
              },
            ],
          };
        }

        case "get_abstract": {
          const { scopusId } = args as any;
          const normalizedId = scopusId.startsWith("2-s2.0-") ? scopusId : `2-s2.0-${scopusId}`;

          const response = await scopusClient.get(`/abstract/scopus_id/${normalizedId}`, {
            params: {
              field: "dc:title,dc:description",
            },
          });

          const entry = response.data["abstracts-retrieval-response"];

          return {
            content: [
              {
                type: "text",
                text: JSON.stringify({
                  scopusId: normalizedId,
                  title: entry?.coredata?.["dc:title"] || "",
                  abstract: entry?.item?.bibrecord?.head?.abstracts?.abstracts?.$ || entry?.coredata?.["dc:description"] || "",
                }, null, 2),
              },
            ],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error: any) {
      if (error instanceof McpError) {
        throw error;
      }

      if (error.response) {
        const status = error.response.status;
        const message = error.response.data?.["service-error"]?.status?.statusText ||
                       error.response.data?.message ||
                       error.message;

        throw new McpError(
          ErrorCode.InternalError,
          `Scopus API Error (${status}): ${message}`
        );
      }

      throw new McpError(ErrorCode.InternalError, `Error: ${error.message}`);
    }
  });

  return server;
}

// Store active transports by session ID
const transports: Map<string, { transport: SSEServerTransport; server: Server }> = new Map();

// Express app setup
const app = express();
app.use(cors());
app.use(express.json());

// Health check endpoint
app.get("/health", (_req: Request, res: Response) => {
  res.json({ status: "ok", service: "mcp-scopus" });
});

// SSE endpoint for MCP clients to connect
app.get("/sse", async (req: Request, res: Response) => {
  console.log("New SSE connection request");

  // Set SSE headers
  res.setHeader("Content-Type", "text/event-stream");
  res.setHeader("Cache-Control", "no-cache");
  res.setHeader("Connection", "keep-alive");
  res.setHeader("Access-Control-Allow-Origin", "*");

  // Create new server and transport for this connection
  const server = createServer();
  const transport = new SSEServerTransport("/message", res);

  // Generate session ID
  const sessionId = Math.random().toString(36).substring(2, 15);
  transports.set(sessionId, { transport, server });

  console.log(`Session ${sessionId} created`);

  // Handle connection close
  res.on("close", () => {
    console.log(`Session ${sessionId} closed`);
    transports.delete(sessionId);
  });

  // Connect the server to the transport
  try {
    await server.connect(transport);
    console.log(`Session ${sessionId} connected`);
  } catch (error) {
    console.error(`Error connecting session ${sessionId}:`, error);
    transports.delete(sessionId);
    res.end();
  }
});

// Message endpoint for receiving client messages
app.post("/message", async (req: Request, res: Response) => {
  const sessionId = req.query.sessionId as string;

  console.log(`Message received for session ${sessionId || "unknown"}`);

  // Find the transport for this session
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

  // If no sessionId, try all transports (for backwards compatibility)
  for (const [id, { transport }] of transports) {
    try {
      await transport.handlePostMessage(req, res, req.body);
      console.log(`Message handled by session ${id}`);
      return;
    } catch (error) {
      // Try next transport
      continue;
    }
  }

  res.status(404).json({ error: "No active session found" });
});

// Start server
app.listen(PORT, () => {
  console.log(`Scopus MCP HTTP Server running on port ${PORT}`);
  console.log(`SSE endpoint: http://localhost:${PORT}/sse`);
  console.log(`Health check: http://localhost:${PORT}/health`);
});
