import type { Tool } from "@modelcontextprotocol/sdk/types.js";

export function getToolDefinitions(): Tool[] {
  return [
    {
      name: "search_papers",
      description:
        "Search for academic papers on Scopus by keywords, title, author, or other criteria. Returns a list of matching papers with metadata including title, authors, abstract, citations, DOI, and more. Supports Scopus advanced query syntax like TITLE(), ABS(), AUTHOR(), KEY(), SRCTITLE(), PUBYEAR.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description:
              "The search query. Examples: 'machine learning', 'TITLE(machine learning)', 'AUTHOR(smith)', 'ABS(neural networks) AND PUBYEAR > 2020'",
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
            description:
              "Comma-separated list of fields to return (optional). If not specified, returns all available fields.",
          },
          yearFrom: {
            type: "number",
            description: "Filter papers from this year onwards (e.g., 2020)",
          },
          yearTo: {
            type: "number",
            description: "Filter papers up to this year (e.g., 2024)",
          },
        },
        required: ["query"],
      },
    },
    {
      name: "search_papers_advanced",
      description:
        "Structured advanced search combining multiple criteria without needing Scopus query syntax. Build complex searches by specifying author, keywords, journal, affiliation, year range, and document type separately.",
      inputSchema: {
        type: "object",
        properties: {
          keywords: {
            type: "string",
            description: "Keywords to search in title, abstract, and keywords",
          },
          author: {
            type: "string",
            description: "Author name (e.g., 'Smith J' or 'lecun')",
          },
          affiliation: {
            type: "string",
            description: "Institution/affiliation name (e.g., 'Stanford University')",
          },
          journal: {
            type: "string",
            description: "Journal or source title (e.g., 'Nature', 'IEEE')",
          },
          yearFrom: {
            type: "number",
            description: "Start year for date range filter",
          },
          yearTo: {
            type: "number",
            description: "End year for date range filter",
          },
          documentType: {
            type: "string",
            description: "Type of document",
            enum: [
              "article",
              "review",
              "conference-paper",
              "book-chapter",
              "editorial",
              "letter",
              "note",
              "short-survey",
              "book",
              "conference-review",
            ],
          },
          count: {
            type: "number",
            description: "Number of results (default: 10, max: 200)",
            default: 10,
          },
          start: {
            type: "number",
            description: "Starting index for pagination (default: 0)",
            default: 0,
          },
          sortBy: {
            type: "string",
            description: "Sort field",
            enum: ["relevance", "date", "citedby-count", "pub-name"],
            default: "relevance",
          },
          sortOrder: {
            type: "string",
            description: "Sort order",
            enum: ["asc", "desc"],
            default: "desc",
          },
        },
        required: [],
      },
    },
    {
      name: "get_paper_by_id",
      description:
        "Retrieve detailed information about a specific paper using its Scopus EID or Scopus ID.",
      inputSchema: {
        type: "object",
        properties: {
          scopusId: {
            type: "string",
            description:
              "The Scopus ID or EID of the paper. Examples: '2-s2.0-85123456789', '85123456789'",
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
      description:
        "Retrieve detailed information about a specific paper using its DOI (Digital Object Identifier). Returns full metadata including authors, affiliations, keywords, and subject areas.",
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
    {
      name: "search_authors",
      description:
        "Search for authors on Scopus by name. Returns author profiles with affiliations, publication counts, citation counts, and h-index.",
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
      description:
        "Retrieve detailed information about a specific author using their Scopus Author ID, including h-index, citation count, subject areas, and top co-authors.",
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
      description:
        "Retrieve a list of publications by a specific author using their Scopus Author ID.",
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
      description:
        "Retrieve the list of papers that cite a specific paper using its Scopus ID.",
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
      description:
        "Retrieve the list of references (bibliography) of a specific paper using its Scopus ID.",
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
          yearFrom: {
            type: "number",
            description: "Filter papers from this year onwards",
          },
          yearTo: {
            type: "number",
            description: "Filter papers up to this year",
          },
        },
        required: ["affiliationName"],
      },
    },
    {
      name: "get_journal_info",
      description:
        "Get journal metrics including CiteScore, SJR, SNIP, and subject area classifications. Essential for evaluating publication venues.",
      inputSchema: {
        type: "object",
        properties: {
          issn: {
            type: "string",
            description: "The ISSN of the journal (e.g., '0013063X')",
          },
        },
        required: ["issn"],
      },
    },
    {
      name: "search_journals",
      description:
        "Search for journals/serial titles by name. Returns ISSN, publisher info, and links to full metrics.",
      inputSchema: {
        type: "object",
        properties: {
          query: {
            type: "string",
            description: "Journal name to search for (e.g., 'Nature', 'IEEE Transactions')",
          },
          count: {
            type: "number",
            description: "Number of results (default: 10, max: 200)",
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
      name: "get_citation_overview",
      description:
        "Get a citation overview for a specific paper including total citations and yearly citation breakdown. Useful for understanding the impact trajectory of a paper.",
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
    {
      name: "search_by_subject_area",
      description:
        "Search for papers within a specific ASJC (All Science Journal Classification) subject area code. Useful for domain-specific literature reviews.",
      inputSchema: {
        type: "object",
        properties: {
          subjectCode: {
            type: "string",
            description:
              "ASJC subject area code (e.g., '1700' for Computer Science, '2200' for Engineering, '2700' for Medicine). See https://service.elsevier.com/app/answers/detail/a_id/15181/supporthub/scopus/ for full list.",
          },
          keywords: {
            type: "string",
            description: "Additional keywords to narrow the search within the subject area",
          },
          count: {
            type: "number",
            description: "Number of results (default: 10, max: 200)",
            default: 10,
          },
          start: {
            type: "number",
            description: "Starting index for pagination (default: 0)",
            default: 0,
          },
          yearFrom: {
            type: "number",
            description: "Filter papers from this year onwards",
          },
          yearTo: {
            type: "number",
            description: "Filter papers up to this year",
          },
          sortBy: {
            type: "string",
            description: "Sort field",
            enum: ["relevance", "date", "citedby-count", "pub-name"],
            default: "relevance",
          },
          sortOrder: {
            type: "string",
            description: "Sort order",
            enum: ["asc", "desc"],
            default: "desc",
          },
        },
        required: ["subjectCode"],
      },
    },
  ];
}
