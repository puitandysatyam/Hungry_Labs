import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import redis from '../config/redis';

// Upstash sliding window rate limiter: 60 requests per minute per IP
const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(60, '1 m'),
  analytics: true,
}) : null;

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // If Redis isn't configured, bypass the rate limiter
  if (!ratelimit) {
    return next();
  }

  // Exempt payment webhooks and health checks from consumer rate limiting
  if (req.path === '/api/payment/webhook' || req.path === '/api/health') {
    return next();
  }

  try {
    const forwarded = req.headers['x-forwarded-for'];
    const ip = typeof forwarded === 'string'
      ? forwarded.split(',')[0].trim()
      : (req.headers['x-real-ip'] as string) || req.ip || 'anonymous';

    const { success, limit, remaining, reset } = await ratelimit.limit(`rl:${ip}`);

    res.setHeader('X-RateLimit-Limit', limit);
    res.setHeader('X-RateLimit-Remaining', remaining);
    res.setHeader('X-RateLimit-Reset', reset);

    if (!success) {
      return res.status(429).json({ error: 'Too many requests. Please try again in a few moments.' });
    }

    next();
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // Graceful degradation: never fail user requests if rate limiter errors
    next();
  }
};
