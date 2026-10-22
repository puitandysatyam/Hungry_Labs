import 'dotenv/config'; // MUST BE AT THE VERY TOP to load .env before other imports evaluate!
import express from "express";
import cors from "cors";

import authRoutes from '../src/routes/auth';
import menuRoutes from '../src/routes/menu';
import orderRoutes from '../src/routes/orders';
import adminRoutes from '../src/routes/admin';
import paymentRoutes from '../src/routes/payment';
import contactRoutes from '../src/routes/contact';
import { rateLimiterMiddleware } from '../src/middlewares/rateLimiter';

const app = express();

// Trust proxy is strictly required for Vercel & Express rate-limiters to see real IPs
app.set('trust proxy', 1);

// Standard Security Headers
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// Production-ready CORS Configuration
const allowedOrigins = [
  'http://localhost:5173',
  'http://localhost:4173',
  'http://localhost:3000',
  'http://127.0.0.1:5173',
];

if (process.env.FRONTEND_URL) {
  // Normalize by removing any trailing slash
  const cleanFrontendUrl = process.env.FRONTEND_URL.replace(/\/+$/, '');
  allowedOrigins.push(cleanFrontendUrl);
}

app.use(cors({
  origin: function (origin, callback) {
    // Allow non-browser tools (e.g. server-to-server, curl, Postman) where origin is undefined
    if (!origin) return callback(null, true);

    const isExplicitlyAllowed = allowedOrigins.includes(origin);
    const isVercelPreview = origin.endsWith('.vercel.app') && (origin.includes('thehungrylab') || origin.includes('hungry-lab'));

    if (isExplicitlyAllowed || isVercelPreview || process.env.NODE_ENV !== 'production') {
      callback(null, true);
    } else {
      callback(new Error(`Origin ${origin} not allowed by CORS`));
    }
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

// Apply global rate limiting (after CORS so preflight and 429 get proper headers)
app.use(rateLimiterMiddleware);

// Enable parsing raw body for webhooks - this handles Razorpay signature validation natively
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json({ limit: '1mb' }));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Express backend running on Vercel" });
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);
app.use('/api/contact', contactRoutes);

if (process.env.NODE_ENV !== 'production') {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;
