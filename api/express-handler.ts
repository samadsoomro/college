import express from 'express';
import cors from 'cors';
import session from 'express-session';

let app: express.Express | null = null;

export default async function getApp() {
  if (app) return app;

  app = express();
  app.set('trust proxy', 1);
  app.use(cors({
    origin: process.env.FRONTEND_URL || 'https://collegewebsite-three-ruddy.vercel.app',
    credentials: true
  }));
  app.use(express.json({ limit: '10mb' }));
  app.use(express.urlencoded({ extended: true }));
  app.use(session({
    secret: process.env.SESSION_SECRET || 'fallback',
    resave: false,
    saveUninitialized: false,
    cookie: { 
      secure: true, 
      httpOnly: true, 
      maxAge: 86400000, 
      sameSite: 'none' 
    }
  }));

  const { registerRoutes } = await import('../server/routes');
  registerRoutes(app);

  return app;
}
