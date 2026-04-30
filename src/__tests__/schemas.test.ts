import { describe, it, expect } from "vitest";
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
} from "../schemas.js";

describe("searchPapersSchema", () => {
  it("validates a valid search", () => {
    const result = searchPapersSchema.safeParse({ query: "machine learning" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.query).toBe("machine learning");
      expect(result.data.count).toBe(10);
      expect(result.data.sortBy).toBe("relevance");
    }
  });

  it("rejects empty query", () => {
    const result = searchPapersSchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });

  it("rejects negative count", () => {
    const result = searchPapersSchema.safeParse({ query: "test", count: -1 });
    expect(result.success).toBe(false);
  });

  it("rejects count over 200", () => {
    const result = searchPapersSchema.safeParse({ query: "test", count: 300 });
    expect(result.success).toBe(false);
  });

  it("accepts year filters", () => {
    const result = searchPapersSchema.safeParse({ query: "test", yearFrom: 2020, yearTo: 2024 });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.yearFrom).toBe(2020);
      expect(result.data.yearTo).toBe(2024);
    }
  });

  it("rejects invalid sortBy", () => {
    const result = searchPapersSchema.safeParse({ query: "test", sortBy: "invalid" });
    expect(result.success).toBe(false);
  });
});

describe("getPaperByIdSchema", () => {
  it("validates with scopusId", () => {
    const result = getPaperByIdSchema.safeParse({ scopusId: "2-s2.0-85123456789" });
    expect(result.success).toBe(true);
  });

  it("rejects missing scopusId", () => {
    const result = getPaperByIdSchema.safeParse({});
    expect(result.success).toBe(false);
  });

  it("rejects empty scopusId", () => {
    const result = getPaperByIdSchema.safeParse({ scopusId: "" });
    expect(result.success).toBe(false);
  });
});

describe("getPaperByDoiSchema", () => {
  it("validates with doi", () => {
    const result = getPaperByDoiSchema.safeParse({ doi: "10.1016/j.example.2023.01.001" });
    expect(result.success).toBe(true);
  });

  it("rejects missing doi", () => {
    const result = getPaperByDoiSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("searchAuthorsSchema", () => {
  it("validates with query", () => {
    const result = searchAuthorsSchema.safeParse({ query: "Smith J" });
    expect(result.success).toBe(true);
  });

  it("rejects empty query", () => {
    const result = searchAuthorsSchema.safeParse({ query: "" });
    expect(result.success).toBe(false);
  });
});

describe("getAuthorByIdSchema", () => {
  it("validates with authorId", () => {
    const result = getAuthorByIdSchema.safeParse({ authorId: "57217123456" });
    expect(result.success).toBe(true);
  });
});

describe("getAuthorPublicationsSchema", () => {
  it("applies defaults", () => {
    const result = getAuthorPublicationsSchema.safeParse({ authorId: "123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(25);
      expect(result.data.sortBy).toBe("date");
      expect(result.data.sortOrder).toBe("desc");
    }
  });
});

describe("getCitationsSchema", () => {
  it("applies defaults", () => {
    const result = getCitationsSchema.safeParse({ scopusId: "123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(20);
    }
  });
});

describe("getReferencesSchema", () => {
  it("applies defaults", () => {
    const result = getReferencesSchema.safeParse({ scopusId: "123" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.count).toBe(20);
    }
  });
});

describe("searchByAffiliationSchema", () => {
  it("validates basic search", () => {
    const result = searchByAffiliationSchema.safeParse({ affiliationName: "Stanford" });
    expect(result.success).toBe(true);
  });

  it("accepts year filters", () => {
    const result = searchByAffiliationSchema.safeParse({
      affiliationName: "Stanford",
      yearFrom: 2020,
      yearTo: 2024,
    });
    expect(result.success).toBe(true);
  });
});

describe("getAbstractSchema", () => {
  it("validates with scopusId", () => {
    const result = getAbstractSchema.safeParse({ scopusId: "123" });
    expect(result.success).toBe(true);
  });
});

describe("getJournalInfoSchema", () => {
  it("validates with issn", () => {
    const result = getJournalInfoSchema.safeParse({ issn: "0028-0836" });
    expect(result.success).toBe(true);
  });

  it("rejects missing issn", () => {
    const result = getJournalInfoSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});

describe("searchJournalsSchema", () => {
  it("validates with query", () => {
    const result = searchJournalsSchema.safeParse({ query: "Nature" });
    expect(result.success).toBe(true);
  });
});

describe("searchPapersAdvancedSchema", () => {
  it("validates with no required fields", () => {
    const result = searchPapersAdvancedSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("validates all optional fields", () => {
    const result = searchPapersAdvancedSchema.safeParse({
      keywords: "machine learning",
      author: "lecun",
      affiliation: "Stanford",
      journal: "Nature",
      yearFrom: 2020,
      yearTo: 2024,
      documentType: "article",
      count: 50,
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.keywords).toBe("machine learning");
      expect(result.data.author).toBe("lecun");
      expect(result.data.documentType).toBe("article");
    }
  });

  it("rejects invalid documentType", () => {
    const result = searchPapersAdvancedSchema.safeParse({
      documentType: "patent",
    });
    expect(result.success).toBe(false);
  });
});

describe("getCitationOverviewSchema", () => {
  it("validates with scopusId", () => {
    const result = getCitationOverviewSchema.safeParse({ scopusId: "123" });
    expect(result.success).toBe(true);
  });
});

describe("searchBySubjectAreaSchema", () => {
  it("validates with subjectCode", () => {
    const result = searchBySubjectAreaSchema.safeParse({ subjectCode: "1700" });
    expect(result.success).toBe(true);
  });

  it("validates with optional keywords and years", () => {
    const result = searchBySubjectAreaSchema.safeParse({
      subjectCode: "1700",
      keywords: "neural networks",
      yearFrom: 2022,
      yearTo: 2024,
    });
    expect(result.success).toBe(true);
  });

  it("rejects missing subjectCode", () => {
    const result = searchBySubjectAreaSchema.safeParse({});
    expect(result.success).toBe(false);
  });
});
