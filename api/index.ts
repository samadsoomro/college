import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { registerRoutes } from '../server/routes';

const app = express();

app.set('trust proxy', 1);

app.use(cors({
  origin: process.env.FRONTEND_URL || 'https://collegewebsite-three-ruddy.vercel.app',
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple memory session — works on Vercel
// Users will need to re-login on cold starts (acceptable for now)
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

app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    supabaseUrl: process.env.SUPABASE_URL ? 'set' : 'MISSING',
    supabaseKey: process.env.SUPABASE_SERVICE_ROLE_KEY ? 'set' : 'MISSING',
    nodeEnv: process.env.NODE_ENV
  });
});

registerRoutes(app);

export default app;
