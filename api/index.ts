import express from 'express';
import cors from 'cors';
import session from 'express-session';
import connectPgSimple from 'connect-pg-simple';
import { registerRoutes } from '../server/routes';

const app = express();

// Trust Vercel's proxy for secure cookies
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Diagnostics Route
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    uptime: process.uptime(),
    env: {
      supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING',
      supabaseKey: (process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'set' : 'MISSING',
      dbUrl: process.env.SUPABASE_DB_URL ? 'set' : 'MISSING',
      nodeEnv: process.env.NODE_ENV
    }
  });
});

const PgSession = connectPgSimple(session);

try {
  const sessionConfig: any = {
    secret: process.env.SESSION_SECRET || 'gcfm-cms-fallback-secret',
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: process.env.NODE_ENV === 'production',
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000,
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
    }
  };

  if (process.env.SUPABASE_DB_URL) {
    sessionConfig.store = new PgSession({
      conString: process.env.SUPABASE_DB_URL,
      tableName: 'user_sessions',
      createTableIfMissing: true
    });
  } else {
    console.warn('SUPABASE_DB_URL missing, using MemoryStore (sessions will not persist)');
  }

  app.use(session(sessionConfig));
} catch (err) {
  console.error('Failed to initialize session store:', err);
  // Fallback to memory store if DB store fails
  app.use(session({
    secret: process.env.SESSION_SECRET || 'gcfm-cms-fallback-secret',
    resave: false,
    saveUninitialized: false
  }));
}

try {
  registerRoutes(app);
} catch (err) {
  console.error('Failed to register routes:', err);
}

export default app;
