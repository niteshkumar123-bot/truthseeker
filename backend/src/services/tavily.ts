import { config } from "../config.js";
import { AppError } from "../errors.js";
import type { ResearchSource } from "../schemas.js";

type TavilyResult = {
  title?: string;
  url?: string;
  content?: string;
  raw_content?: string;
  published_date?: string;
};

function canonicalUrl(value: string): string | null {
  try {
    const url = new URL(value);
    if (!["http:", "https:"].includes(url.protocol)) return null;
    url.hash = "";
    url.hostname = url.hostname.toLowerCase();
    // Drop common tracking parameters without altering the displayed source URL.
    ["utm_source", "utm_medium", "utm_campaign", "utm_term", "utm_content"].forEach((p) => url.searchParams.delete(p));
    return url.toString();
  } catch {
    return null;
  }
}

export async function searchSources(query: string): Promise<ResearchSource[]> {
  if (!config.tavilyApiKey) throw new AppError(503, "CONFIGURATION_ERROR", "The research service is not configured. Add TAVILY_API_KEY on the server.");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), config.timeoutMs);
  try {
    const response = await fetch("https://api.tavily.com/search", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal: controller.signal,
      body: JSON.stringify({
        api_key: config.tavilyApiKey,
        query,
        search_depth: "advanced",
        topic: "general",
        max_results: 8,
        include_answer: false,
        include_raw_content: false,
      }),
    });
    if (response.status === 429) throw new AppError(503, "UPSTREAM_RATE_LIMIT", "The web research provider is busy. Please try again shortly.");
    if (!response.ok) {
      if (config.nodeEnv !== "test") console.error("[TruthSeeker] Tavily request failed:", { status: response.status });
      if (response.status === 401 || response.status === 403) {
        throw new AppError(502, "TAVILY_AUTH_ERROR", "Tavily rejected the API key. Verify TAVILY_API_KEY in backend/.env and restart the backend.");
      }
      throw new AppError(502, "SEARCH_PROVIDER_ERROR", `Web research provider returned HTTP ${response.status}. Check your Tavily key, usage, and connectivity.`);
    }
    const payload = await response.json() as { results?: TavilyResult[] };
    const seen = new Set<string>();
    const sources: ResearchSource[] = [];
    for (const result of payload.results ?? []) {
      if (!result.url) continue;
      const normalized = canonicalUrl(result.url);
      if (!normalized || seen.has(normalized)) continue;
      seen.add(normalized);
      sources.push({
        id: `S${sources.length + 1}`,
        title: (result.title || "Untitled source").slice(0, 500),
        url: result.url,
        snippet: (result.content || result.raw_content || "").slice(0, 5000),
        ...(result.published_date ? { publishedDate: result.published_date } : {}),
      });
    }
    return sources;
  } catch (error) {
    if (error instanceof AppError) throw error;
    if (error instanceof Error && error.name === "AbortError") throw new AppError(504, "UPSTREAM_TIMEOUT", "Web research took too long. Please try again.");
    throw new AppError(502, "SEARCH_PROVIDER_ERROR", "Could not connect to the web research provider.");
  } finally {
    clearTimeout(timer);
  }
}