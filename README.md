# MCP-Scopus 🔬

> An MCP (Model Context Protocol) server for searching academic papers on Scopus - helping AI assistants write papers without hallucinating citations.

[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](https://choosealicense.com/licenses/mit/)
[![Node.js](https://img.shields.io/badge/Node.js-18%2B-brightgreen.svg)](https://nodejs.org/)
[![Docker](https://img.shields.io/badge/Docker-Optional-blue.svg)](https://www.docker.com/)

## Why This Matters 🎯

When AI assistants write academic papers or research content, they often **hallucinate citations** - inventing papers that don't exist, misattributing authors, or fabricating DOIs. This MCP server solves that problem by giving AI direct access to **real academic data** from Scopus, the world's largest abstract and citation database.

### The Problem
- AI hallucinates non-existent papers ❌
- Fabricated author names and affiliations ❌
- Invented DOIs and citation counts ❌
- Outdated or incorrect publication data ❌

### The Solution
- Real papers from Scopus database ✅
- Accurate author information ✅
- Verified DOIs and citation metrics ✅
- Up-to-date publication details ✅

## Features

### Paper Search & Retrieval
- **search_papers** - Search by keywords, title, author, abstract, year range
- **get_paper_by_id** - Get full details by Scopus ID
- **get_paper_by_doi** - Retrieve paper by DOI
- **get_abstract** - Fetch paper abstracts

### Author Information
- **search_authors** - Find authors by name
- **get_author_by_id** - Get author profile with h-index, citations
- **get_author_publications** - List all publications by an author

### Citation Analysis
- **get_citations** - Papers citing a specific work
- **get_references** - Bibliography of a paper

### Institution Search
- **search_by_affiliation** - Find papers by university/organization

---

## 🚀 Installation

### Prerequisites
- **Node.js 18+** (required)
- A [Scopus API Key](https://dev.elsevier.com/) (free for academic use)

### Step 1: Clone & Build

```bash
# Clone the repository
git clone https://github.com/andri-setiawan/MCP-scopus.git
cd MCP-scopus

# Install dependencies
npm install

# Build the project
npm run build
```

### Step 2: Get Scopus API Key

1. Visit [Elsevier Developer Portal](https://dev.elsevier.com/)
2. Create a free account
3. Apply for API access
4. Select "Scopus Search API"
5. You'll receive an API key via email

**Note:** Free API keys have rate limits. For production use, consider a paid subscription.

---

## ⚙️ Configuration (Choose One)

### Option A: Direct Node.js (Recommended ✅)

**Most stable and reliable method.** Uses stdio transport directly without network overhead.

#### Claude Desktop Configuration

Add to your `claude_desktop_config.json`:

```json
{
  "mcpServers": {
    "scopus": {
      "command": "node",
      "args": [
        "/path/to/MCP-scopus/dist/index.js"
      ],
      "env": {
        "SCOPUS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

**Config file locations:**
| OS | Path |
|----|------|
| Windows | `%APPDATA%\Claude\claude_desktop_config.json` |
| macOS | `~/Library/Application Support/Claude/claude_desktop_config.json` |
| Linux | `~/.config/Claude/claude_desktop_config.json` |

#### Example: Windows Configuration
```json
{
  "mcpServers": {
    "scopus": {
      "command": "node",
      "args": [
        "D:\\Documents\\MCP-scopus\\dist\\index.js"
      ],
      "env": {
        "SCOPUS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Example: macOS/Linux Configuration
```json
{
  "mcpServers": {
    "scopus": {
      "command": "node",
      "args": [
        "/home/username/MCP-scopus/dist/index.js"
      ],
      "env": {
        "SCOPUS_API_KEY": "your_api_key_here"
      }
    }
  }
}
```

#### Why This Method is Recommended

| Aspect | Direct Node.js | HTTP/SSE (Docker) |
|--------|----------------|-------------------|
| **Stability** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **Latency** | Lower | Higher |
| **Connection** | Direct stdio | Network-based |
| **Timeouts** | No issues | Possible |
| **Docker Required** | No | Yes |
| **Setup Complexity** | Simple | More complex |

---

### Option B: Docker + HTTP/SSE (Alternative)

If you prefer containerization or need remote access:

```bash
# Build the image
docker build -t mcp-scopus .

# Run the container
docker run -d \
  --name mcp-scopus \
  --restart unless-stopped \
  -p 5566:5566 \
  -e SCOPUS_API_KEY=your_api_key_here \
  mcp-scopus
```

#### Claude Desktop Configuration (HTTP)

```json
{
  "mcpServers": {
    "scopus": {
      "command": "npx",
      "args": ["-y", "mcp-remote", "http://localhost:5566/sse"],
      "env": {}
    }
  }
}
```

#### Docker Management
```bash
docker logs mcp-scopus      # View logs
docker restart mcp-scopus   # Restart container
docker stop mcp-scopus      # Stop container
docker start mcp-scopus     # Start container
```

---

## 📝 Usage Examples

Once configured, restart Claude Desktop and try:

```
"Search for recent papers about transformer architectures in NLP"
"Find papers by Geoffrey Hinton from the last 5 years"
"What papers cite the attention is all you need paper?"
"Get details about paper with DOI 10.1016/j.example.2023.01.001"
"Find publications from Stanford University about machine learning"
```

### Search Syntax

The supports Scopus advanced query syntax:

```
machine learning AND PUBYEAR > 2023
TITLE(deep learning) AND AUTHOR(lecun)
ABS(neural networks) AND KEY(transformer)
SRCTITLE(Nature) AND PUBYEAR = 2024
```

---

## 🛠️ Available Tools

| Tool | Description |
|------|-------------|
| `search_papers` | Search papers by query with filters |
| `get_paper_by_id` | Get paper details by Scopus ID |
| `get_paper_by_doi` | Get paper details by DOI |
| `get_abstract` | Get paper abstract |
| `search_authors` | Search for authors |
| `get_author_by_id` | Get author profile |
| `get_author_publications` | List author's papers |
| `get_citations` | Get citing papers |
| `get_references` | Get paper's references |
| `search_by_affiliation` | Search by institution |

---

## 📖 API Reference

### search_papers
```typescript
{
  query: string,           // Required: Search query
  count?: number,          // Default: 10, Max: 200
  start?: number,          // For pagination
  sortBy?: string,         // 'relevance' | 'date' | 'citedby-count'
  sortOrder?: string       // 'asc' | 'desc'
}
```

### get_paper_by_id
```typescript
{
  scopusId: string         // Required: Scopus ID or EID
}
```

### get_citations
```typescript
{
  scopusId: string,        // Required: Scopus ID
  count?: number,          // Default: 20
  start?: number           // For pagination
}
```

---

## 🔧 Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode (stdio)
npm run dev

# Run HTTP server
npm run start:http
```

---

## 📁 Project Structure

```
MCP-scopus/
├── src/
│   ├── index.ts          # Stdio MCP server (recommended)
│   └── http-server.ts    # HTTP/SSE MCP server (alternative)
├── dist/                 # Compiled JavaScript
├── Dockerfile
├── docker-compose.yml
├── package.json
├── tsconfig.json
└── README.md
```

---

## ❓ Troubleshooting

### Connection Timeout Errors
If you see timeout errors with HTTP/SSE, **switch to Option A (Direct Node.js)** - it's more stable.

### API Key Issues
```bash
# Test your API key
curl -H "X-ELS-APIKey: your_key" "https://api.elsevier.com/content/search/scopus?query=test"
```

### Container Won't Start
```bash
# Check logs
docker logs mcp-scopus

# Rebuild
docker stop mcp-scopus && docker rm mcp-scopus
docker build -t mcp-scopus . --no-cache
docker run -d --name mcp-scopus -p 5566:5566 -e SCOPUS_API_KEY=your_key mcp-scopus
```

---

## 📜 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🙏 Acknowledgments

- [Model Context Protocol](https://modelcontextprotocol.io/) by Anthropic
- [Scopus API](https://dev.elsevier.com/) by Elsevier

---

## ⚠️ Disclaimer

This project is not affiliated with, endorsed by, or sponsored by Elsevier or Scopus. Scopus® is a registered trademark of Elsevier B.V. Use of the Scopus API is subject to Elsevier's terms of service.

---

**Made with ❤️ to help AI write better academic content without hallucinations**
