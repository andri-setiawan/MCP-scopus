import { describe, it, expect } from "vitest";
import { normalizeScopusId, buildYearFilter } from "../client.js";

describe("normalizeScopusId", () => {
  it("prepends prefix to bare numeric ID", () => {
    expect(normalizeScopusId("85123456789")).toBe("2-s2.0-85123456789");
  });

  it("does not double-prefix an already normalized ID", () => {
    expect(normalizeScopusId("2-s2.0-85123456789")).toBe("2-s2.0-85123456789");
  });

  it("handles empty string", () => {
    expect(normalizeScopusId("")).toBe("2-s2.0-");
  });
});

describe("buildYearFilter", () => {
  it("returns empty string when no years provided", () => {
    expect(buildYearFilter()).toBe("");
  });

  it("builds range filter for both years", () => {
    expect(buildYearFilter(2020, 2024)).toBe("PUBYEAR > 2019 AND PUBYEAR < 2025");
  });

  it("builds from-only filter", () => {
    expect(buildYearFilter(2020)).toBe("PUBYEAR > 2019");
  });

  it("builds to-only filter", () => {
    expect(buildYearFilter(undefined, 2024)).toBe("PUBYEAR < 2025");
  });
});
