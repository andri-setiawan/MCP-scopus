import type { Server } from "@modelcontextprotocol/sdk/server/index.js";
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
  ErrorCode,
  McpError,
} from "@modelcontextprotocol/sdk/types.js";
import { getClient, normalizeScopusId, buildYearFilter } from "./client.js";
import { getToolDefinitions } from "./tools.js";
import { formatPaper, formatAuthorSearch, formatAuthorDetail, formatJournal } from "./formatters.js";
import {
  searchPapersSchema,
  getPaperByIdSchema,
  getPaperByDoiSchema,
  searchAuthorsSchema,
  getAuthorByIdSchema,
  getAuthorPublicationsSchema,
  getCitationsSchema,
  getReferencesSchema,
  searchByAffiliationSchema,
  getAbstractSchema,
  getJournalInfoSchema,
  searchJournalsSchema,
  searchPapersAdvancedSchema,
  getCitationOverviewSchema,
  searchBySubjectAreaSchema,
} from "./schemas.js";
import type {
  ScopusAbstractResponse,
} from "./types.js";

export function registerHandlers(server: Server) {
  server.setRequestHandler(ListToolsRequestSchema, async () => ({
    tools: getToolDefinitions(),
  }));

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    const { name, arguments: args } = request.params;
    const client = getClient();

    try {
      switch (name) {
        case "search_papers": {
          const parsed = searchPapersSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { query, count, start, sortBy, sortOrder, field, yearFrom, yearTo } = parsed.data;

          let fullQuery = query;
          const yearFilter = buildYearFilter(yearFrom, yearTo);
          if (yearFilter) fullQuery = `${query} AND ${yearFilter}`;

          const params: Record<string, string | number> = { query: fullQuery, count, start, sort: `${sortBy}-${sortOrder}` };
          if (field) params.field = field;

          const response = await client.get("/search/scopus", { params });
          const results = response.data["search-results"];
          const entries = results?.entry || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              totalResults: results["opensearch:totalResults"],
              startIndex: start,
              itemsPerPage: count,
              papers: entries.map(formatPaper),
            }, null, 2) }],
          };
        }

        case "search_papers_advanced": {
          const parsed = searchPapersAdvancedSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { keywords, author, affiliation, journal, yearFrom, yearTo, documentType, count, start, sortBy, sortOrder } = parsed.data;

          const parts: string[] = [];
          if (keywords) parts.push(`(${keywords})`);
          if (author) parts.push(`AUTHOR(${author})`);
          if (affiliation) parts.push(`AFFIL("${affiliation}")`);
          if (journal) parts.push(`SRCTITLE("${journal}")`);
          if (documentType) parts.push(`DOCTYPE(${documentType})`);
          const yearFilter = buildYearFilter(yearFrom, yearTo);
          if (yearFilter) parts.push(yearFilter);

          const query = parts.length > 0 ? parts.join(" AND ") : "*";
          const params: Record<string, string | number> = { query, count, start, sort: `${sortBy}-${sortOrder}` };

          const response = await client.get("/search/scopus", { params });
          const results = response.data["search-results"];
          const entries = results?.entry || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              query,
              totalResults: results["opensearch:totalResults"],
              startIndex: start,
              itemsPerPage: count,
              papers: entries.map(formatPaper),
            }, null, 2) }],
          };
        }

        case "get_paper_by_id": {
          const parsed = getPaperByIdSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { scopusId, field } = parsed.data;
          const normalizedId = normalizeScopusId(scopusId);

          const params: Record<string, string> = {};
          if (field) params.field = field;

          const response = await client.get(`/abstract/scopus_id/${normalizedId}`, { params });
          const entry = (response.data as ScopusAbstractResponse)["abstracts-retrieval-response"];
          if (!entry) throw new McpError(ErrorCode.InvalidRequest, `Paper with Scopus ID ${scopusId} not found`);

          const coredata = entry.coredata || {};
          const authors = entry.authors?.author || [];
          const affiliations = entry.affiliation || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              scopusId: coredata["dc:identifier"]?.replace("SCOPUS_ID:", "") || normalizedId,
              title: coredata["dc:title"] || "",
              authors: authors.map((a) => ({
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
              subjectAreas: entry.subjectAreas?.["subject-area"]?.map((s) => s.$) || [],
              keywords: entry.item?.bibrecord?.head?.citationInfo?.authorKeywords?.["author-keyword"]?.map((k) => k.$) || [],
              affiliations: affiliations.map((a) => ({
                id: a["@affiliation-id"] || "",
                name: a["affiliation-name"] || "",
                city: a["city"] || "",
                country: a["country"] || "",
              })),
              documentType: coredata["subtypeDescription"] || "",
              openAccess: coredata["openaccess"] || "0",
            }, null, 2) }],
          };
        }

        case "get_paper_by_doi": {
          const parsed = getPaperByDoiSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { doi } = parsed.data;

          const response = await client.get(`/abstract/doi/${encodeURIComponent(doi)}`);
          const entry = (response.data as ScopusAbstractResponse)["abstracts-retrieval-response"];
          if (!entry) throw new McpError(ErrorCode.InvalidRequest, `Paper with DOI ${doi} not found`);

          const coredata = entry.coredata || {};
          const authors = entry.authors?.author || [];
          const affiliations = entry.affiliation || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              scopusId: coredata["dc:identifier"]?.replace("SCOPUS_ID:", "") || "",
              title: coredata["dc:title"] || "",
              authors: authors.map((a) => ({
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
              doi: coredata["prism:doi"] || doi,
              issn: coredata["prism:issn"] || "",
              citations: coredata["citedby-count"] || "0",
              abstract: entry.item?.bibrecord?.head?.abstracts?.abstracts?.$ || "",
              subjectAreas: entry.subjectAreas?.["subject-area"]?.map((s) => s.$) || [],
              keywords: entry.item?.bibrecord?.head?.citationInfo?.authorKeywords?.["author-keyword"]?.map((k) => k.$) || [],
              affiliations: affiliations.map((a) => ({
                id: a["@affiliation-id"] || "",
                name: a["affiliation-name"] || "",
                city: a["city"] || "",
                country: a["country"] || "",
              })),
              documentType: coredata["subtypeDescription"] || "",
              openAccess: coredata["openaccess"] || "0",
            }, null, 2) }],
          };
        }

        case "get_abstract": {
          const parsed = getAbstractSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { scopusId } = parsed.data;
          const normalizedId = normalizeScopusId(scopusId);

          const response = await client.get(`/abstract/scopus_id/${normalizedId}`, {
            params: { field: "dc:title,dc:description" },
          });

          const entry = (response.data as ScopusAbstractResponse)["abstracts-retrieval-response"];
          return {
            content: [{ type: "text", text: JSON.stringify({
              scopusId: normalizedId,
              title: entry?.coredata?.["dc:title"] || "",
              abstract: entry?.item?.bibrecord?.head?.abstracts?.abstracts?.$ || entry?.coredata?.["dc:description"] || "",
            }, null, 2) }],
          };
        }

        case "search_authors": {
          const parsed = searchAuthorsSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { query, count, start } = parsed.data;

          const response = await client.get("/search/author", {
            params: { query: `AUTHNAME(${query})`, count, start },
          });

          const results = response.data["search-results"];
          const entries = results?.entry || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              totalResults: results["opensearch:totalResults"],
              startIndex: start,
              itemsPerPage: count,
              authors: entries.map(formatAuthorSearch),
            }, null, 2) }],
          };
        }

        case "get_author_by_id": {
          const parsed = getAuthorByIdSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { authorId } = parsed.data;

          const response = await client.get(`/author/author_id/${authorId}`);
          const entry = response.data["author-retrieval-response"]?.[0];
          if (!entry) throw new McpError(ErrorCode.InvalidRequest, `Author with ID ${authorId} not found`);

          return {
            content: [{ type: "text", text: JSON.stringify(formatAuthorDetail(entry, authorId), null, 2) }],
          };
        }

        case "get_author_publications": {
          const parsed = getAuthorPublicationsSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { authorId, count, start, sortBy, sortOrder } = parsed.data;

          const response = await client.get("/search/scopus", {
            params: { query: `AU-ID(${authorId})`, count, start, sort: `${sortBy}-${sortOrder}` },
          });

          const results = response.data["search-results"];
          const entries = results?.entry || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              authorId,
              totalResults: results["opensearch:totalResults"],
              startIndex: start,
              itemsPerPage: count,
              publications: entries.map(formatPaper),
            }, null, 2) }],
          };
        }

        case "get_citations": {
          const parsed = getCitationsSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { scopusId, count, start } = parsed.data;
          const normalizedId = normalizeScopusId(scopusId);

          const response = await client.get("/search/scopus", {
            params: { query: `REF(${normalizedId})`, count, start, sort: "date-desc" },
          });

          const results = response.data["search-results"];
          const entries = results?.entry || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              citedPaperId: normalizedId,
              totalCitations: results["opensearch:totalResults"],
              startIndex: start,
              itemsPerPage: count,
              citingPapers: entries.map(formatPaper),
            }, null, 2) }],
          };
        }

        case "get_references": {
          const parsed = getReferencesSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { scopusId, count, start } = parsed.data;
          const normalizedId = normalizeScopusId(scopusId);

          const response = await client.get(`/abstract/scopus_id/${normalizedId}`, {
            params: { field: "references" },
          });

          const allRefs = response.data["abstracts-retrieval-response"]?.item?.bibrecord?.tail?.bibliography?.reference || [];
          const paginated = allRefs.slice(start, start + count);

          const result: Record<string, unknown> = {
            paperId: normalizedId,
            totalReferences: allRefs.length,
            startIndex: start,
            itemsPerPage: count,
            references: paginated.map((ref: any) => ({
              id: ref["@id"] || "",
              text: ref["ref-text"] || "",
              authors: ref["ref-authors"]?.author?.map((a: any) => a["ce:indexed-name"] || a?.ce?.indexedName || "") || [],
              title: ref["ref-title"]?._ || "",
              source: ref["ref-source"]?._ || "",
              year: ref["ref-year"] || "",
            })),
          };

          if (allRefs.length > 200) {
            result.warning = `This paper has ${allRefs.length} references. Showing ${paginated.length} of ${allRefs.length}. Use start/count to paginate.`;
          }

          return {
            content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
          };
        }

        case "search_by_affiliation": {
          const parsed = searchByAffiliationSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { affiliationName, count, start, yearFrom, yearTo } = parsed.data;

          let query = `AFFIL("${affiliationName}")`;
          const yearFilter = buildYearFilter(yearFrom, yearTo);
          if (yearFilter) query += ` AND ${yearFilter}`;

          const response = await client.get("/search/scopus", {
            params: { query, count, start, sort: "date-desc" },
          });

          const results = response.data["search-results"];
          const entries = results?.entry || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              affiliation: affiliationName,
              totalResults: results["opensearch:totalResults"],
              startIndex: start,
              itemsPerPage: count,
              papers: entries.map(formatPaper),
            }, null, 2) }],
          };
        }

        case "get_journal_info": {
          const parsed = getJournalInfoSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { issn } = parsed.data;

          const response = await client.get(`/serial/title/issn/${encodeURIComponent(issn)}`);
          const entries = response.data["serial-metadata-response"]?.entry || [];

          if (entries.length === 0) {
            throw new McpError(ErrorCode.InvalidRequest, `Journal with ISSN ${issn} not found`);
          }

          return {
            content: [{ type: "text", text: JSON.stringify(formatJournal(entries[0]), null, 2) }],
          };
        }

        case "search_journals": {
          const parsed = searchJournalsSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { query, count, start } = parsed.data;

          const response = await client.get("/serial/title", {
            params: { title: query, count, start },
          });

          const entries = response.data["serial-metadata-response"]?.entry ||
                          response.data["search-results"]?.entry || [];
          const totalResults = response.data["search-results"]?.["opensearch:totalResults"] || String(entries.length);

          const journals = entries.map((e: any) => ({
            sourceId: e["dc:identifier"]?.replace("SOURCE_ID:", "") || "",
            title: e["dc:title"] || "",
            issn: e["prism:issn"] || "",
            eIssn: e["prism:eIssn"] || "",
            aggregationType: e["prism:aggregationType"] || "",
            url: e.link?.[0]?.["@href"] || "",
          }));

          return {
            content: [{ type: "text", text: JSON.stringify({
              totalResults,
              startIndex: start,
              itemsPerPage: count,
              journals,
            }, null, 2) }],
          };
        }

        case "get_citation_overview": {
          const parsed = getCitationOverviewSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { scopusId } = parsed.data;
          const normalizedId = normalizeScopusId(scopusId);

          // Get paper details first
          const paperResponse = await client.get(`/abstract/scopus_id/${normalizedId}`);
          const paperEntry = (paperResponse.data as ScopusAbstractResponse)["abstracts-retrieval-response"];
          if (!paperEntry) throw new McpError(ErrorCode.InvalidRequest, `Paper with Scopus ID ${scopusId} not found`);

          const coredata = paperEntry.coredata || {};
          const pubYear = coredata["prism:coverDate"]?.substring(0, 4) || "";

          // Get total citations
          const currentYear = new Date().getFullYear();
          const yearRange: number[] = [];
          if (pubYear) {
            for (let y = parseInt(pubYear); y <= currentYear; y++) {
              yearRange.push(y);
            }
          }

          // Get citation count per year via search
          const yearlyCitations: Array<{ year: number; count: string }> = [];
          for (const year of yearRange) {
            try {
              const citeResp = await client.get("/search/scopus", {
                params: { query: `REF(${normalizedId}) AND PUBYEAR = ${year}`, count: 0, start: 0 },
              });
              yearlyCitations.push({
                year,
                count: citeResp.data["search-results"]?.["opensearch:totalResults"] || "0",
              });
            } catch {
              yearlyCitations.push({ year, count: "0" });
            }
          }

          return {
            content: [{ type: "text", text: JSON.stringify({
              scopusId: normalizedId,
              title: coredata["dc:title"] || "",
              doi: coredata["prism:doi"] || "",
              publicationYear: pubYear,
              totalCitations: coredata["citedby-count"] || "0",
              yearlyCitations,
            }, null, 2) }],
          };
        }

        case "search_by_subject_area": {
          const parsed = searchBySubjectAreaSchema.safeParse(args);
          if (!parsed.success) throw new McpError(ErrorCode.InvalidParams, parsed.error.message);
          const { subjectCode, keywords, count, start, yearFrom, yearTo, sortBy, sortOrder } = parsed.data;

          const parts: string[] = [`SUBJAREA(${subjectCode})`];
          if (keywords) parts.push(`(${keywords})`);
          const yearFilter = buildYearFilter(yearFrom, yearTo);
          if (yearFilter) parts.push(yearFilter);

          const query = parts.join(" AND ");

          const response = await client.get("/search/scopus", {
            params: { query, count, start, sort: `${sortBy}-${sortOrder}` },
          });

          const results = response.data["search-results"];
          const entries = results?.entry || [];

          return {
            content: [{ type: "text", text: JSON.stringify({
              subjectCode,
              query,
              totalResults: results["opensearch:totalResults"],
              startIndex: start,
              itemsPerPage: count,
              papers: entries.map(formatPaper),
            }, null, 2) }],
          };
        }

        default:
          throw new McpError(ErrorCode.MethodNotFound, `Unknown tool: ${name}`);
      }
    } catch (error: any) {
      if (error instanceof McpError) throw error;

      if (error.response) {
        const status = error.response.status;
        const message =
          error.response.data?.["service-error"]?.status?.statusText ||
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
}
