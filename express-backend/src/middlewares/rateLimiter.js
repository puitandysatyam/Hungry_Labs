"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.rateLimiterMiddleware = void 0;
const express_1 = require("express");
const ratelimit_1 = require("@upstash/ratelimit");
const redis_1 = __importDefault(require("../config/redis"));
// Only create the limiter if Redis is configured
const ratelimit = redis_1.default ? new ratelimit_1.Ratelimit({
    redis: redis_1.default,
    limiter: ratelimit_1.Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds per IP
    analytics: true,
}) : null;
const rateLimiterMiddleware = async (req, res, next) => {
    // If Redis isn't configured, bypass the rate limiter
    if (!ratelimit) {
        return next();
    }
    try {
        // Vercel routes traffic through a proxy, so we check x-forwarded-for first
        const identifier = req.headers['x-forwarded-for'] ||
            req.headers['x-real-ip'] ||
            req.socket.remoteAddress ||
            'anonymous';
        const { success, limit, remaining, reset } = await ratelimit.limit(identifier);
        // Set standard RateLimit headers (optional, but good practice)
        res.setHeader('X-RateLimit-Limit', limit);
        res.setHeader('X-RateLimit-Remaining', remaining);
        res.setHeader('X-RateLimit-Reset', reset);
        if (!success) {
            return res.status(429).json({ error: 'Too many requests, please try again later.' });
        }
        next();
    }
    catch (error) {
        console.error('Rate Limiter Error:', error);
        // Don't kill the request if the ratelimiter fails
        next();
    }
};
exports.rateLimiterMiddleware = rateLimiterMiddleware;
//# sourceMappingURL=rateLimiter.js.map