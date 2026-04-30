import type {
  ScopusSearchEntry,
  ScopusAuthorSearchEntry,
  ScopusAuthorRetrieval,
  ScopusCoauthor,
  ScopusSerialTitleEntry,
  ScopusPreferredName,
  FormattedPaper,
  FormattedAuthor,
  FormattedJournal,
} from "./types.js";

export function formatPaper(entry: ScopusSearchEntry): FormattedPaper {
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

function formatName(preferredName?: ScopusPreferredName, fallback?: string): string {
  if (!preferredName) return fallback || "";
  const surname = preferredName.surname || "";
  const givenName = preferredName.given_name || preferredName["given-name"] || "";
  return surname && givenName ? `${surname}, ${givenName}` : (fallback || "");
}

export function formatAuthorSearch(entry: ScopusAuthorSearchEntry) {
  const name = formatName(entry["preferred-name"], entry["dc:title"]);
  return {
    authorId: entry["dc:identifier"]?.replace("AUTHOR_ID:", "") || "",
    name,
    givenName: entry["preferred-name"]?.given_name || entry["preferred-name"]?.["given-name"] || "",
    surname: entry["preferred-name"]?.surname || "",
    affiliation: entry["affiliation-current"]?.["affiliation-name"] || "",
    documentCount: entry["document-count"] || "0",
  };
}

export function formatAuthorDetail(entry: ScopusAuthorRetrieval, authorId: string) {
  const author = entry.author || {};
  const preferredName = author["preferred-name"];
  const name = formatName(preferredName);

  return {
    authorId,
    name,
    givenName: preferredName?.given_name || preferredName?.["given-name"] || "",
    surname: preferredName?.surname || "",
    initials: preferredName?.initials || "",
    affiliation: author["affiliation-current"]?.["affiliation-name"] || "",
    affiliationId: author["affiliation-current"]?.["affiliation-id"] || "",
    subjectAreas: author["subject-area"]?.map((s) => s.$) || [],
    documentCount: entry["coredata"]?.["document-count"] || "0",
    citationCount: entry["coredata"]?.["cited-by-count"] || "0",
    hIndex: entry.h_index?.$ || "0",
    publicationStart: author["publication-start"]?.year || "",
    publicationEnd: author["publication-end"]?.year || "",
    coauthorCount: entry.coauthor?.length || 0,
    coauthors: formatCoauthors(entry.coauthor || []),
  };
}

function formatCoauthors(coauthors: ScopusCoauthor[]) {
  return coauthors.slice(0, 50).map((c) => ({
    authorId: c["@auid"] || "",
    name: formatName(c["preferred-name"]),
    affiliation: c["affiliation-current"]?.["affiliation-name"] || "",
    documentCount: c["document-count"] || "0",
  }));
}

export function formatJournal(entry: ScopusSerialTitleEntry): FormattedJournal {
  return {
    sourceId: entry["dc:identifier"]?.replace("SOURCE_ID:", "") || "",
    title: entry["dc:title"] || entry["prism:publicationName"] || "",
    issn: entry["prism:issn"] || "",
    eIssn: entry["prism:eIssn"] || "",
    subjectAreas: (entry.subjectArea || []).map((s) => ({
      code: s["@code"] || "",
      name: s.$,
    })),
    sjr: (entry.SJR || []).map((s) => ({
      year: s["@year"],
      value: s.$,
    })),
    snip: (entry.SNIP || []).map((s) => ({
      year: s["@year"],
      value: s.$,
    })),
    citeScoreInfo: {
      citeScoreTracker: entry.citeScoreYearInfo?.citeScoreTracker || "",
      citeScoreCurrentMetric: entry.citeScoreYearInfo?.citeScoreCurrentMetric || "",
      citeScoreCurrentMetricYear: entry.citeScoreYearInfo?.citeScoreCurrentMetricYear || "",
    },
    url: entry.link?.[0]?.["@href"] || "",
  };
}
