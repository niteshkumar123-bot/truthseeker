export type Verdict = "Supported" | "Partially Supported" | "Contradicted" | "Insufficient Evidence";
export interface EvidenceItem { sourceId: string; explanation: string }
export interface ResearchSource { id: string; title: string; url: string; snippet: string; publishedDate?: string }
export interface ResearchReport {
  claim: string;
  verdict: Verdict;
  confidence: number;
  summary: string;
  supportingEvidence: EvidenceItem[];
  contradictingEvidence: EvidenceItem[];
  limitations: string[];
  sources: ResearchSource[];
}
export interface ApiError { error?: { code?: string; message?: string } }