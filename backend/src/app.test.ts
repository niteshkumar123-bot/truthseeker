import { afterEach, describe, expect, it, vi } from "vitest";
import request from "supertest";

vi.mock("./services/research.js", () => ({
  research: vi.fn(async (query: string) => ({
    claim: query,
    verdict: "Partially Supported",
    confidence: 70,
    summary: "Example report grounded in retrieved sources.",
    supportingEvidence: [{ sourceId: "S1", explanation: "The source supports part of the claim." }],
    contradictingEvidence: [],
    limitations: ["This is a mocked test result."],
    sources: [{ id: "S1", title: "Example", url: "https://example.com/source", snippet: "Evidence snippet." }],
  })),
}));

import { app } from "./app.js";
import { research } from "./services/research.js";

afterEach(() => vi.clearAllMocks());

describe("TruthSeeker API", () => {
  it("returns a healthy status", async () => {
    const response = await request(app).get("/api/health");
    expect(response.status).toBe(200);
    expect(response.body.status).toBe("ok");
  });

  it("rejects short queries", async () => {
    const response = await request(app).post("/api/research").send({ query: "hi" });
    expect(response.status).toBe(400);
    expect(response.body.error.code).toBe("VALIDATION_ERROR");
    expect(research).not.toHaveBeenCalled();
  });

  it("rejects unexpected request fields", async () => {
    const response = await request(app).post("/api/research").send({ query: "Investigate this claim", secret: "no" });
    expect(response.status).toBe(400);
  });

  it("returns a validated research report for a valid query", async () => {
    const response = await request(app).post("/api/research").send({ query: "Investigate this claim" });
    expect(response.status).toBe(200);
    expect(response.body.verdict).toBe("Partially Supported");
    expect(response.body.sources[0].url).toBe("https://example.com/source");
    expect(research).toHaveBeenCalledWith("Investigate this claim");
  });
});