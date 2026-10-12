import express, { type ErrorRequestHandler } from "express";
import cors from "cors";
import helmet from "helmet";
import rateLimit from "express-rate-limit";
import { ZodError } from "zod";
import { config } from "./config.js";
import { AppError } from "./errors.js";
import { researchRequestSchema } from "./schemas.js";
import { research } from "./services/research.js";

export const app = express();
// Render sits behind a trusted reverse proxy; this lets express-rate-limit
// identify client IPs from the forwarded address correctly.
app.set("trust proxy", 1);
app.disable("x-powered-by");
app.use(helmet());
app.use(cors({
  origin: config.frontendOrigin.split(",").map((origin) => origin.trim()),
  methods: ["GET", "POST", "OPTIONS"],
}));
app.use(express.json({ limit: "20kb" }));
app.use("/api", rateLimit({ windowMs: 60_000, limit: 20, standardHeaders: "draft-7", legacyHeaders: false }));

app.get("/api/health", (_req, res) => res.json({ status: "ok" }));

app.post("/api/research", async (req, res, next) => {
  try {
    const parsed = researchRequestSchema.safeParse(req.body);
    if (!parsed.success) {
      return res.status(400).json({
        error: {
          code: "VALIDATION_ERROR",
          message: parsed.error.issues[0]?.message || "Please provide a valid query.",
        },
      });
    }
    const report = await research(parsed.data.query);
    return res.json(report);
  } catch (error) {
    return next(error);
  }
});

const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof AppError) {
    return res.status(error.status).json({ error: { code: error.code, message: error.message } });
  }
  if (error instanceof ZodError) {
    return res.status(400).json({ error: { code: "VALIDATION_ERROR", message: "The request was invalid." } });
  }
  // Do not log request bodies, credentials, or provider responses.
  if (config.nodeEnv !== "test") console.error("Unhandled API error:", error instanceof Error ? error.name : "unknown");
  return res.status(500).json({ error: { code: "INTERNAL_ERROR", message: "Something went wrong. Please try again." } });
};
app.use(errorHandler);