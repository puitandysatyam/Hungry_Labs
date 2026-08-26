import { Request, Response, NextFunction } from 'express';
export declare const rateLimiterMiddleware: (req: Request, res: Response, next: NextFunction) => Promise<void | Response<any, Record<string, any>>>;
//# sourceMappingURL=rateLimiter.d.ts.map