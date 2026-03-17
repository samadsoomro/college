import express from 'express';
import cors from 'cors';
import session from 'express-session';
import { registerRoutes } from '../server/routes';

const app = express();

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

import connectPgSimple from 'connect-pg-simple';
const PgSession = connectPgSimple(session);

app.use(session({
  store: new PgSession({
    conString: process.env.SUPABASE_DB_URL,
    tableName: 'user_sessions',
    createTableIfMissing: true
  }),
  secret: process.env.SESSION_SECRET || 'fallback-secret-change-this',
  resave: false,
  saveUninitialized: false,
  cookie: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    maxAge: 24 * 60 * 60 * 1000,
    sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'lax'
  }
}));

registerRoutes(app);

export default app;
