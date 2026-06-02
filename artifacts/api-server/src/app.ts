import express, { type Express, type Request, type Response, type NextFunction } from "express";
import cors from "cors";
import pinoHttp from "pino-http";
import router from "./routes";
import { logger } from "./lib/logger";

const app: Express = express();

// ── Security headers ──────────────────────────────────────────────────────────
app.use((_req: Request, res: Response, next: NextFunction) => {
  res.setHeader("X-Content-Type-Options", "nosniff");
  res.setHeader("X-Frame-Options", "DENY");
  res.setHeader("X-XSS-Protection", "1; mode=block");
  res.setHeader("Referrer-Policy", "strict-origin-when-cross-origin");
  res.setHeader("Permissions-Policy", "camera=(), microphone=(), geolocation=()");
  res.removeHeader("X-Powered-By");
  next();
});

// ── CORS — allow only Replit-hosted origins ───────────────────────────────────
const allowedPatterns = [
  /\.replit\.dev$/,
  /\.repl\.co$/,
  /\.replit\.app$/,
  /^https?:\/\/localhost(:\d+)?$/,
];

app.use(
  cors({
    origin(origin, callback) {
      // Allow same-origin / server-to-server (no Origin header)
      if (!origin) return callback(null, true);
      const ok = allowedPatterns.some((pattern) => pattern.test(origin));
      if (ok) return callback(null, true);
      logger.warn({ origin }, "CORS: rejected origin");
      callback(new Error("CORS: origin not allowed"));
    },
    credentials: true,
    methods: ["GET", "HEAD"],  // API only serves read endpoints
  })
);

// ── Logging ───────────────────────────────────────────────────────────────────
app.use(
  pinoHttp({
    logger,
    serializers: {
      req(req) {
        return { id: req.id, method: req.method, url: req.url?.split("?")[0] };
      },
      res(res) {
        return { statusCode: res.statusCode };
      },
    },
  })
);

app.use(express.json({ limit: "16kb" }));
app.use(express.urlencoded({ extended: true, limit: "16kb" }));

app.use("/api", router);

export default app;
