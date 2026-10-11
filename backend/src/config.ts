import "dotenv/config";

function positiveInt(value: string | undefined, fallback: number): number {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : fallback;
}

export const config = {
  port: positiveInt(process.env.PORT, 4000),
  timeoutMs: positiveInt(process.env.REQUEST_TIMEOUT_MS, 20_000),
  geminiApiKey: process.env.GEMINI_API_KEY ?? "",
  tavilyApiKey: process.env.TAVILY_API_KEY ?? "",
  geminiModel: process.env.GEMINI_MODEL || "gemini-2.5-flash",
  frontendOrigin: process.env.FRONTEND_ORIGIN || "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV || "development",
};