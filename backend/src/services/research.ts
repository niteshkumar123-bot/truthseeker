import { AppError } from "../errors.js";
import { researchReportSchema, type ResearchReport } from "../schemas.js";
import { analyzeEvidence } from "./gemini.js";
import { searchSources } from "./tavily.js";

export async function research(query: string): Promise<ResearchReport> {
  const sources = await searchSources(query);
  if (sources.length === 0) {
    return researchReportSchema.parse({
      claim: query,
      verdict: "Insufficient Evidence",
      confidence: 0,
      summary: "No usable web sources were returned, so this claim could not be assessed.",
      supportingEvidence: [],
      contradictingEvidence: [],
      limitations: ["The search provider returned no usable sources.", "Try rephrasing the claim or using more specific terms."],
      sources: [],
    });
  }
  const analysis = await analyzeEvidence(query, sources);
  // Always attach source metadata from retrieval, not from the model.
  const allowedIds = new Set(sources.map((s) => s.id));
  if ([...analysis.supportingEvidence, ...analysis.contradictingEvidence].some((e) => !allowedIds.has(e.sourceId))) {
    throw new AppError(502, "INVALID_SOURCE_REFERENCE", "The AI report contained an unknown source reference.");
  }
  return researchReportSchema.parse({ ...analysis, sources });
}