// Scopus API Response Types

// --- Search Results ---

export interface ScopusSearchResponse {
  "search-results": {
    entry?: ScopusSearchEntry[];
    "opensearch:totalResults": string;
    "opensearch:startIndex": string;
    "opensearch:itemsPerPage": string;
    link?: Array<{ "@href": string; "@ref": string }>;
  };
}

export interface ScopusSearchEntry {
  "dc:identifier"?: string;
  "dc:title"?: string;
  "dc:creator"?: string;
  "dc:description"?: string;
  "prism:publicationName"?: string;
  "prism:coverDate"?: string;
  "prism:volume"?: string;
  "prism:issueIdentifier"?: string;
  "prism:pageRange"?: string;
  "prism:doi"?: string;
  "prism:issn"?: string;
  "prism:eIssn"?: string;
  "prism:isbn"?: string;
  "prism:url"?: string;
  "citedby-count"?: string;
  "openaccess"?: string;
  "openaccessFlag"?: string;
  "subtypeDescription"?: string;
  "authkeywords"?: string;
  affiliation?: ScopusAffiliation[];
  link?: Array<{ "@href": string; "@ref": string }>;
}

export interface ScopusAffiliation {
  "@id"?: string;
  "affiliation-name"?: string;
  "affiliation-city"?: string;
  "affiliation-country"?: string;
  city?: string;
  country?: string;
}

// --- Abstract Retrieval ---

export interface ScopusAbstractResponse {
  "abstracts-retrieval-response": {
    coredata: ScopusAbstractCoredata;
    authors?: { author: ScopusAbstractAuthor[] };
    affiliation?: ScopusAbstractAffiliation[];
    subjectAreas?: { "subject-area": ScopusSubjectArea[] };
    item?: {
      bibrecord?: {
        head?: {
          abstracts?: { abstracts?: { $: string } };
          citationInfo?: {
            authorKeywords?: {
              "author-keyword"?: Array<{ $: string }>;
            };
          };
        };
        tail?: {
          bibliography?: {
            reference?: ScopusReference[];
          };
        };
      };
    };
  };
}

export interface ScopusAbstractCoredata {
  "dc:identifier"?: string;
  "dc:title"?: string;
  "dc:description"?: string;
  "prism:publicationName"?: string;
  "prism:coverDate"?: string;
  "prism:volume"?: string;
  "prism:issueIdentifier"?: string;
  "prism:pageRange"?: string;
  "prism:doi"?: string;
  "prism:issn"?: string;
  "prism:eIssn"?: string;
  "prism:isbn"?: string;
  "prism:url"?: string;
  "citedby-count"?: string;
  "openaccess"?: string;
  "subtypeDescription"?: string;
  publisher?: string;
  "prism:aggregationType"?: string;
  source?: string;
}

export interface ScopusAbstractAuthor {
  "@auid"?: string;
  "ce:indexed-name"?: string;
  "ce:given-name"?: string;
  "ce:surname"?: string;
  "preferred-name"?: { ce?: { indexedName?: string } };
  affiliation?: { "@id"?: string; "@name"?: string };
}

export interface ScopusAbstractAffiliation {
  "@affiliation-id"?: string;
  "affiliation-name"?: string;
  city?: string;
  country?: string;
}

export interface ScopusSubjectArea {
  "@code"?: string;
  "@abbrev"?: string;
  $: string;
}

export interface ScopusReference {
  "@id"?: string;
  "ref-text"?: string;
  "ref-title"?: { _: string };
  "ref-source"?: { _: string };
  "ref-year"?: string;
  "ref-authors"?: {
    author?: Array<{
      "ce:indexed-name"?: string;
      ce?: { indexedName?: string };
    }>;
  };
}

// --- Author Search ---

export interface ScopusAuthorSearchResponse {
  "search-results": {
    entry?: ScopusAuthorSearchEntry[];
    "opensearch:totalResults": string;
    "opensearch:startIndex": string;
    "opensearch:itemsPerPage": string;
  };
}

export interface ScopusAuthorSearchEntry {
  "dc:identifier"?: string;
  "dc:title"?: string;
  "preferred-name"?: ScopusPreferredName;
  "affiliation-current"?: {
    "affiliation-name"?: string;
    "affiliation-id"?: string;
  };
  "document-count"?: string;
  "cited-by-count"?: string;
}

export interface ScopusPreferredName {
  surname?: string;
  given_name?: string;
  "given-name"?: string;
  initials?: string;
}

// --- Author Retrieval ---

export interface ScopusAuthorResponse {
  "author-retrieval-response"?: ScopusAuthorRetrieval[];
}

export interface ScopusAuthorRetrieval {
  author: ScopusAuthorProfile;
  coredata?: {
    "document-count"?: string;
    "cited-by-count"?: string;
  };
  h_index?: { $?: string };
  coauthor?: ScopusCoauthor[];
}

export interface ScopusAuthorProfile {
  "preferred-name"?: ScopusPreferredName;
  "affiliation-current"?: {
    "affiliation-name"?: string;
    "affiliation-id"?: string;
  };
  "subject-area"?: ScopusSubjectArea[];
  "publication-start"?: { year?: string };
  "publication-end"?: { year?: string };
}

export interface ScopusCoauthor {
  "@auid"?: string;
  "preferred-name"?: ScopusPreferredName;
  "affiliation-current"?: {
    "affiliation-name"?: string;
    "affiliation-id"?: string;
  };
  "document-count"?: string;
}

// --- Serial Title (Journal) ---

export interface ScopusSerialTitleResponse {
  "serial-metadata-response": {
    entry?: ScopusSerialTitleEntry[];
  };
}

export interface ScopusSerialTitleEntry {
  "dc:identifier"?: string;
  "dc:title"?: string;
  "prism:publicationName"?: string;
  "prism:issn"?: string;
  "prism:eIssn"?: string;
  subjectArea?: ScopusSubjectArea[];
  SJR?: Array<{ "@year": string; $: string }>;
  SNIP?: Array<{ "@year": string; $: string }>;
  citeScoreYearInfo?: {
    citeScoreTracker?: string;
    citeScoreCurrentMetric?: string;
    citeScoreCurrentMetricYear?: string;
    citeScorePreviewYear?: string;
    citeScoreYearList?: string;
  };
  link?: Array<{ "@href": string; "@ref": string }>;
}

export interface ScopusSerialSearchResponse {
  "serial-title-response"?: {
    "serial-title"?: ScopusSerialSearchEntry[];
  };
  "search-results"?: {
    entry?: ScopusSerialSearchEntry[];
    "opensearch:totalResults": string;
  };
}

export interface ScopusSerialSearchEntry {
  "dc:identifier"?: string;
  "dc:title"?: string;
  "prism:issn"?: string;
  "prism:eIssn"?: string;
  "prism:aggregationType"?: string;
  "prism:coverDate"?: string;
  link?: Array<{ "@href": string; "@ref": string }>;
}

// --- Citation Overview ---

export interface ScopusCitationOverviewResponse {
  "abstracts-retrieval-response"?: ScopusAbstractResponse["abstracts-retrieval-response"];
}

// --- Formatted Output Types ---

export interface FormattedPaper {
  scopusId: string;
  title: string;
  authors: string;
  publicationName: string;
  publicationDate: string;
  volume: string;
  issue: string;
  pages: string;
  doi: string;
  issn: string;
  eIssn: string;
  isbn: string;
  citations: string;
  abstract: string;
  affiliation: ScopusAffiliation[];
  keywords: string;
  documentType: string;
  openAccess: string;
  openAccessType: string;
  url: string;
}

export interface FormattedAuthor {
  scopusAuthorId: string;
  name: string;
  givenName: string;
  surname: string;
  initials: string;
  affiliation: string;
  affiliationId: string;
  subjectAreas: string[];
  documentCount: string;
  citationCount: string;
  hIndex: string;
  publicationStart: string;
  publicationEnd: string;
}

export interface FormattedJournal {
  sourceId: string;
  title: string;
  issn: string;
  eIssn: string;
  subjectAreas: Array<{ code: string; name: string }>;
  sjr: Array<{ year: string; value: string }>;
  snip: Array<{ year: string; value: string }>;
  citeScoreInfo: {
    citeScoreTracker: string;
    citeScoreCurrentMetric: string;
    citeScoreCurrentMetricYear: string;
  };
  url: string;
}
