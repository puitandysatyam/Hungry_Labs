import 'dotenv/config'; // MUST BE AT THE VERY TOP to load .env before other imports evaluate!
import express from "express";
import cors from "cors";

import authRoutes from '../src/routes/auth';
import menuRoutes from '../src/routes/menu';
import orderRoutes from '../src/routes/orders';
import adminRoutes from '../src/routes/admin';
import paymentRoutes from '../src/routes/payment';
import { rateLimiterMiddleware } from '../src/middlewares/rateLimiter';

const app = express();

// Trust proxy is strictly required for Vercel & Express rate-limiters to see real IPs
// If false, all requests look like they come from Vercel's load balancer and ONE user could rate-limit the whole app
app.set('trust proxy', 1);

// Apply global rate limiting
app.use(rateLimiterMiddleware);

// Enable parsing raw body for webhooks - this handles Razorpay signature validation natively
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

// Secure CORS - origin cannot be '*' when credentials are true
app.use(cors({
  origin: function (origin, callback) {
      // In dev, allow any origin. In production, whitelist domains.
      callback(null, origin || true);
  },
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  credentials: true
}));

app.get("/api/health", (req, res) => {
  res.json({ status: "OK", message: "Express backend running on Vercel" });
});

app.use('/api/auth', authRoutes);
app.use('/api/menu', menuRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/payment', paymentRoutes);

if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}

export default app;