import type { ApiError, ResearchReport } from "./types";

const baseUrl = (import.meta.env.VITE_API_BASE_URL || "http://localhost:4000").replace(/\/$/, "");

export async function investigate(query: string): Promise<ResearchReport> {
  let response: Response;
  try {
    response = await fetch(`${baseUrl}/api/research`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ query }),
    });
  } catch {
    throw new Error("Cannot reach the TruthSeeker API. Check that the backend is running.");
  }
  const payload = await response.json() as ResearchReport | ApiError;
  if (!response.ok) {
    throw new Error((payload as ApiError).error?.message || "Research failed. Please try again.");
  }
  return payload as ResearchReport;
}