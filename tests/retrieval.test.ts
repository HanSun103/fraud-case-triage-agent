import { describe, expect, it } from "vitest";

import { retrieveGuidanceForAlert } from "@/lib/rag/retrieveGuidance";
import { buildNoGuidanceCase, getCaseByScenario } from "./helpers";

describe("guidance retrieval", () => {
  it("retrieves guidance passages with citation metadata for a cross-border case", async () => {
    const demoCase = getCaseByScenario("Cross-border anomalies");
    const passages = await retrieveGuidanceForAlert(demoCase.alert, { topK: 3 });

    expect(passages.length).toBeGreaterThan(0);
    expect(passages[0].citation.title.length).toBeGreaterThan(0);
    expect(passages[0].citation.sourcePath).toContain("data/knowledge/raw/");
  });

  it("returns an empty list when nothing relevant is found", async () => {
    const passages = await retrieveGuidanceForAlert(buildNoGuidanceCase(), { topK: 3 });

    expect(passages).toEqual([]);
  });
});
