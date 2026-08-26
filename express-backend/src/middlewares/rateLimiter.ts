import { Request, Response, NextFunction } from 'express';
import { Ratelimit } from '@upstash/ratelimit';
import redis from '../config/redis';

// Only create the limiter if Redis is configured
const ratelimit = redis ? new Ratelimit({
  redis: redis,
  limiter: Ratelimit.slidingWindow(10, '10 s'), // 10 requests per 10 seconds per IP
  analytics: true,
}) : null;

export const rateLimiterMiddleware = async (req: Request, res: Response, next: NextFunction) => {
  // If Redis isn't configured, bypass the rate limiter
  if (!ratelimit) {
    return next();
  }

  try {
    // Vercel routes traffic through a proxy, so we check x-forwarded-for first
    const identifier = (req.headers['x-forwarded-for'] as string) || 
                       (req.headers['x-real-ip'] as string) || 
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
  } catch (error) {
    console.error('Rate Limiter Error:', error);
    // Don't kill the request if the ratelimiter fails
    next();
  }
};
