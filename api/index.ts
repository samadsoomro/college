import express from 'express';
import cors from 'cors';
import session from 'express-session';

const app = express();

// Trust Vercel's proxy for secure cookies
app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://collegewebsite-three-ruddy.vercel.app',
  credentials: true
}));

app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

app.use(session({
  secret: process.env.SESSION_SECRET || 'fallback-secret-key',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: true,
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: 'none'
  }
}));

// Health check BEFORE registerRoutes — so if routes fail we still get a response
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING',
    supabaseKey: (process.env.SUPABASE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY) ? 'set' : 'MISSING',
    nodeEnv: process.env.NODE_ENV
  });
});

try {
  // Use require for routes to catch import-time crashes in serverless logs
  const { registerRoutes } = require('../server/routes');
  registerRoutes(app);
} catch (err: any) {
  console.error('[STARTUP ERROR]', err.message, err.stack);
  app.use('/api/*', (req, res) => {
    res.status(500).json({ 
      error: 'Server startup failed', 
      message: err.message,
      stack: process.env.NODE_ENV === 'development' ? err.stack : undefined
    });
  });
}

export default app;
