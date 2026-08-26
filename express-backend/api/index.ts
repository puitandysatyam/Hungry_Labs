import express from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from './routes/auth';
import menuRoutes from './routes/menu';
import orderRoutes from './routes/orders';
import adminRoutes from './routes/admin';
import paymentRoutes from './routes/payment';

dotenv.config();

const app = express();
// Enable parsing raw body for webhooks - this handles Razorpay signature validation natively
app.use('/api/payment/webhook', express.raw({ type: 'application/json' }));
app.use(express.json());

app.use(cors({
  origin: "*",
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
