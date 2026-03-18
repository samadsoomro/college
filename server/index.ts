import express, { type Request, Response, NextFunction } from "express";
import session from "express-session";
import { createServer } from "http";
import path from "path";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { storage } from "./db-storage";
import cors from "cors";

declare module "express-session" {
  interface SessionData {
    userId?: string;
    isAdmin?: boolean;
    isLibraryCard?: boolean;
  }
}

const app = express();
app.use(express.json({ limit: "1024mb" }));
app.use(express.urlencoded({ extended: true, limit: "1024mb" }));

// Enable compression for all responses
import compression from "compression";
app.use(compression());

// CORS configuration - must be before session
app.use(
  cors({
    origin: true, // Allow all origins for now to avoid local development issues, but with credentials
    credentials: true,
  })
);



app.use(
  session({
    secret: process.env.SESSION_SECRET || "gcfm-library-secret-2026",
    resave: false,
    saveUninitialized: false,
    cookie: {
      maxAge: 86400000,
      httpOnly: true,
      secure: false,
      sameSite: "lax",
    },
  }),
);

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  // Initialize storage and ensure all required Supabase buckets exist
  await storage.init();
  
  registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  const server = createServer(app);
  server.timeout = 600000;
  server.keepAliveTimeout = 65000;
  server.headersTimeout = 66000;

  // Serve static files from the uploads directory
  const uploadDir = path.join(process.cwd(), "server", "uploads");
  app.use("/server/uploads", express.static(uploadDir));

  if (app.get("env") === "development" && process.env.VITE_EXTERNAL !== "true") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const PORT = process.env.PORT || 5001;
  server.listen(
    {
      port: PORT,
      host: "0.0.0.0",
    },
    () => {
      console.log(`Server running on port ${PORT}`);
      console.log(
        `[Server] Restarted at ${new Date().toISOString()} to apply latest DB schema changes.`,
      );
    },
  );
})();
