"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config"); // MUST BE AT THE VERY TOP to load .env before other imports evaluate!
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const auth_1 = __importDefault(require("../src/routes/auth"));
const menu_1 = __importDefault(require("../src/routes/menu"));
const orders_1 = __importDefault(require("../src/routes/orders"));
const admin_1 = __importDefault(require("../src/routes/admin"));
const payment_1 = __importDefault(require("../src/routes/payment"));
const rateLimiter_1 = require("../src/middlewares/rateLimiter");
const app = (0, express_1.default)();
// Trust proxy is strictly required for Vercel & Express rate-limiters to see real IPs
// If false, all requests look like they come from Vercel's load balancer and ONE user could rate-limit the whole app
app.set('trust proxy', 1);
// Apply global rate limiting
app.use(rateLimiter_1.rateLimiterMiddleware);
// Enable parsing raw body for webhooks - this handles Razorpay signature validation natively
app.use('/api/payment/webhook', express_1.default.raw({ type: 'application/json' }));
app.use(express_1.default.json());
// Secure CORS - origin cannot be '*' when credentials are true
app.use((0, cors_1.default)({
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
app.use('/api/auth', auth_1.default);
app.use('/api/menu', menu_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/admin', admin_1.default);
app.use('/api/payment', payment_1.default);
if (process.env.NODE_ENV !== 'production') {
    const PORT = process.env.PORT || 3000;
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
}
exports.default = app;
//# sourceMappingURL=index.js.map