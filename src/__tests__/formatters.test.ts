import { describe, it, expect } from "vitest";
import { formatPaper, formatAuthorSearch, formatAuthorDetail, formatJournal } from "../formatters.js";

describe("formatPaper", () => {
  it("formats a complete search entry", () => {
    const entry = {
      "dc:identifier": "SCOPUS_ID:85012345678",
      "dc:title": "Deep Learning for NLP",
      "dc:creator": "Smith J, Doe A",
      "dc:description": "This is an abstract about deep learning.",
      "prism:publicationName": "Nature",
      "prism:coverDate": "2024-01-15",
      "prism:volume": "12",
      "prism:issueIdentifier": "3",
      "prism:pageRange": "100-115",
      "prism:doi": "10.1016/j.example.2024.01.001",
      "prism:issn": "0028-0836",
      "prism:eIssn": "1476-4687",
      "prism:isbn": "",
      "citedby-count": "42",
      "openaccess": "1",
      "openaccessFlag": "true",
      "subtypeDescription": "Article",
      "authkeywords": "deep learning | NLP",
      affiliation: [{ "@id": "60000001", "affiliation-name": "Stanford University" }],
      link: [{ "@href": "https://www.scopus.com/record/display.uri?eid=2-s2.0-85012345678", "@ref": "self" }],
    };

    const result = formatPaper(entry);

    expect(result.scopusId).toBe("85012345678");
    expect(result.title).toBe("Deep Learning for NLP");
    expect(result.authors).toBe("Smith J, Doe A");
    expect(result.publicationName).toBe("Nature");
    expect(result.publicationDate).toBe("2024-01-15");
    expect(result.doi).toBe("10.1016/j.example.2024.01.001");
    expect(result.citations).toBe("42");
    expect(result.abstract).toBe("This is an abstract about deep learning.");
    expect(result.documentType).toBe("Article");
    expect(result.openAccess).toBe("1");
    expect(result.affiliation).toHaveLength(1);
  });

  it("handles missing fields with defaults", () => {
    const result = formatPaper({});
    expect(result.scopusId).toBe("");
    expect(result.title).toBe("");
    expect(result.citations).toBe("0");
    expect(result.openAccess).toBe("0");
    expect(result.affiliation).toEqual([]);
  });

  it("strips SCOPUS_ID: prefix from identifier", () => {
    const result = formatPaper({ "dc:identifier": "SCOPUS_ID:999" });
    expect(result.scopusId).toBe("999");
  });
});

describe("formatAuthorSearch", () => {
  it("formats an author search entry", () => {
    const entry = {
      "dc:identifier": "AUTHOR_ID:57217123456",
      "dc:title": "Smith, John",
      "preferred-name": {
        surname: "Smith",
        given_name: "John",
        initials: "J.",
      },
      "affiliation-current": {
        "affiliation-name": "MIT",
        "affiliation-id": "60000002",
      },
      "document-count": "150",
    };

    const result = formatAuthorSearch(entry);

    expect(result.authorId).toBe("57217123456");
    expect(result.name).toBe("Smith, John");
    expect(result.givenName).toBe("John");
    expect(result.surname).toBe("Smith");
    expect(result.affiliation).toBe("MIT");
    expect(result.documentCount).toBe("150");
  });

  it("falls back to dc:title when preferred-name is missing", () => {
    const entry = {
      "dc:identifier": "AUTHOR_ID:123",
      "dc:title": "Unknown Author",
    };
    const result = formatAuthorSearch(entry);
    expect(result.name).toBe("Unknown Author");
  });

  it("handles given-name with hyphen variant", () => {
    const entry = {
      "dc:identifier": "AUTHOR_ID:456",
      "preferred-name": {
        surname: "Doe",
        "given-name": "Jane",
      },
    };
    const result = formatAuthorSearch(entry);
    expect(result.givenName).toBe("Jane");
    expect(result.name).toBe("Doe, Jane");
  });
});

describe("formatAuthorDetail", () => {
  it("formats full author detail with co-authors", () => {
    const entry = {
      author: {
        "preferred-name": {
          surname: "Einstein",
          given_name: "Albert",
          initials: "A.",
        },
        "affiliation-current": {
          "affiliation-name": "Princeton University",
          "affiliation-id": "60000003",
        },
        "subject-area": [
          { "@code": "3100", $: "Physics and Astronomy" },
        ],
        "publication-start": { year: "1901" },
        "publication-end": { year: "1955" },
      },
      coredata: {
        "document-count": "300",
        "cited-by-count": "50000",
      },
      h_index: { $: "85" },
      coauthor: [
        {
          "@auid": "70000000001",
          "preferred-name": { surname: "Bohr", given_name: "Niels" },
          "affiliation-current": { "affiliation-name": "University of Copenhagen" },
          "document-count": "200",
        },
      ],
    };

    const result = formatAuthorDetail(entry, "70000000000");

    expect(result.authorId).toBe("70000000000");
    expect(result.name).toBe("Einstein, Albert");
    expect(result.affiliation).toBe("Princeton University");
    expect(result.documentCount).toBe("300");
    expect(result.citationCount).toBe("50000");
    expect(result.hIndex).toBe("85");
    expect(result.publicationStart).toBe("1901");
    expect(result.subjectAreas).toEqual(["Physics and Astronomy"]);
    expect(result.coauthorCount).toBe(1);
    expect(result.coauthors).toHaveLength(1);
    expect(result.coauthors[0].name).toBe("Bohr, Niels");
  });

  it("handles empty co-authors", () => {
    const entry = {
      author: { "preferred-name": {} },
      coredata: {},
      h_index: {},
      coauthor: [],
    };
    const result = formatAuthorDetail(entry, "123");
    expect(result.coauthorCount).toBe(0);
    expect(result.coauthors).toEqual([]);
  });

  it("limits co-authors to 50", () => {
    const coauthor = Array.from({ length: 60 }, (_, i) => ({
      "@auid": `id-${i}`,
      "preferred-name": { surname: `Author${i}` },
      "document-count": "5",
    }));
    const entry = {
      author: { "preferred-name": {} },
      coredata: {},
      h_index: {},
      coauthor,
    };
    const result = formatAuthorDetail(entry, "123");
    expect(result.coauthors).toHaveLength(50);
    expect(result.coauthorCount).toBe(60);
  });
});

describe("formatJournal", () => {
  it("formats journal with metrics", () => {
    const entry = {
      "dc:identifier": "SOURCE_ID:21121",
      "dc:title": "Nature",
      "prism:publicationName": "Nature",
      "prism:issn": "0028-0836",
      "prism:eIssn": "1476-4687",
      subjectArea: [
        { "@code": "2700", $: "Medicine" },
        { "@code": "1300", $: "Biochemistry" },
      ],
      SJR: [
        { "@year": "2023", $: "12.45" },
        { "@year": "2022", $: "11.89" },
      ],
      SNIP: [
        { "@year": "2023", $: "4.56" },
      ],
      citeScoreYearInfo: {
        citeScoreTracker: "45.2",
        citeScoreCurrentMetric: "42.7",
        citeScoreCurrentMetricYear: "2023",
      },
      link: [{ "@href": "https://www.scopus.com/source/21121", "@ref": "self" }],
    };

    const result = formatJournal(entry);

    expect(result.sourceId).toBe("21121");
    expect(result.title).toBe("Nature");
    expect(result.issn).toBe("0028-0836");
    expect(result.subjectAreas).toHaveLength(2);
    expect(result.subjectAreas[0]).toEqual({ code: "2700", name: "Medicine" });
    expect(result.sjr).toHaveLength(2);
    expect(result.sjr[0]).toEqual({ year: "2023", value: "12.45" });
    expect(result.snip).toHaveLength(1);
    expect(result.citeScoreInfo.citeScoreCurrentMetric).toBe("42.7");
  });

  it("handles missing metrics gracefully", () => {
    const result = formatJournal({});
    expect(result.sourceId).toBe("");
    expect(result.sjr).toEqual([]);
    expect(result.snip).toEqual([]);
    expect(result.subjectAreas).toEqual([]);
  });
});
