import { z } from "zod";

export const researchRequestSchema = z.object({
  query: z.string().trim().min(8, "Please enter a query with at least 8 characters.")
    .max(1000, "Queries must be 1000 characters or fewer."),
}).strict();

export const verdictSchema = z.enum([
  "Supported", "Partially Supported", "Contradicted", "Insufficient Evidence",
]);

export const evidenceSchema = z.object({
  sourceId: z.string().min(1),
  explanation: z.string().min(1).max(2000),
});

export const modelReportSchema = z.object({
  claim: z.string().min(1).max(1000),
  verdict: verdictSchema,
  confidence: z.number().min(0).max(100),
  summary: z.string().min(1).max(5000),
  supportingEvidence: z.array(evidenceSchema).max(20),
  contradictingEvidence: z.array(evidenceSchema).max(20),
  limitations: z.array(z.string().min(1).max(1000)).max(20),
});

export const sourceSchema = z.object({
  id: z.string().min(1),
  title: z.string(),
  url: z.string().url(),
  snippet: z.string(),
  publishedDate: z.string().optional(),
});

export const researchReportSchema = modelReportSchema.extend({
  sources: z.array(sourceSchema),
});

export type ResearchRequest = z.infer<typeof researchRequestSchema>;
export type ModelReport = z.infer<typeof modelReportSchema>;
export type ResearchReport = z.infer<typeof researchReportSchema>;
export type ResearchSource = z.infer<typeof sourceSchema>;