import { z } from "zod";

function clamp(defaultVal: number, max: number) {
  return z.number().int().min(0).max(max).default(defaultVal);
}

export const searchPapersSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  count: clamp(10, 200),
  start: clamp(0, 5000),
  sortBy: z.enum(["relevance", "date", "citedby-count", "pub-name"]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
  field: z.string().optional(),
  yearFrom: z.number().int().min(1900).max(2100).optional(),
  yearTo: z.number().int().min(1900).max(2100).optional(),
});

export const getPaperByIdSchema = z.object({
  scopusId: z.string().min(1, "Scopus ID is required"),
  field: z.string().optional(),
});

export const getPaperByDoiSchema = z.object({
  doi: z.string().min(1, "DOI is required"),
});

export const searchAuthorsSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  count: clamp(10, 200),
  start: clamp(0, 5000),
});

export const getAuthorByIdSchema = z.object({
  authorId: z.string().min(1, "Author ID is required"),
});

export const getAuthorPublicationsSchema = z.object({
  authorId: z.string().min(1, "Author ID is required"),
  count: clamp(25, 200),
  start: clamp(0, 5000),
  sortBy: z.enum(["date", "citedby-count"]).default("date"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getCitationsSchema = z.object({
  scopusId: z.string().min(1, "Scopus ID is required"),
  count: clamp(20, 200),
  start: clamp(0, 5000),
});

export const getReferencesSchema = z.object({
  scopusId: z.string().min(1, "Scopus ID is required"),
  count: clamp(20, 200),
  start: clamp(0, 5000),
});

export const searchByAffiliationSchema = z.object({
  affiliationName: z.string().min(1, "Affiliation name is required"),
  count: clamp(10, 200),
  start: clamp(0, 5000),
  yearFrom: z.number().int().min(1900).max(2100).optional(),
  yearTo: z.number().int().min(1900).max(2100).optional(),
});

export const getAbstractSchema = z.object({
  scopusId: z.string().min(1, "Scopus ID is required"),
});

export const getJournalInfoSchema = z.object({
  issn: z.string().min(1, "ISSN is required"),
});

export const searchJournalsSchema = z.object({
  query: z.string().min(1, "Query cannot be empty"),
  count: clamp(10, 200),
  start: clamp(0, 5000),
});

export const searchPapersAdvancedSchema = z.object({
  keywords: z.string().optional(),
  author: z.string().optional(),
  affiliation: z.string().optional(),
  journal: z.string().optional(),
  yearFrom: z.number().int().min(1900).max(2100).optional(),
  yearTo: z.number().int().min(1900).max(2100).optional(),
  documentType: z.enum([
    "article", "review", "conference-paper", "book-chapter",
    "editorial", "letter", "note", "short-survey", "book", "conference-review",
  ]).optional(),
  count: clamp(10, 200),
  start: clamp(0, 5000),
  sortBy: z.enum(["relevance", "date", "citedby-count", "pub-name"]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});

export const getCitationOverviewSchema = z.object({
  scopusId: z.string().min(1, "Scopus ID is required"),
});

export const searchBySubjectAreaSchema = z.object({
  subjectCode: z.string().min(1, "Subject area code is required"),
  keywords: z.string().optional(),
  count: clamp(10, 200),
  start: clamp(0, 5000),
  yearFrom: z.number().int().min(1900).max(2100).optional(),
  yearTo: z.number().int().min(1900).max(2100).optional(),
  sortBy: z.enum(["relevance", "date", "citedby-count", "pub-name"]).default("relevance"),
  sortOrder: z.enum(["asc", "desc"]).default("desc"),
});
