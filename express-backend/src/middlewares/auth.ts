import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';
import prisma from '../config/db';

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded: any = verifyToken(token);

    if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    // Attach user to request
    (req as any).user = decoded;
    next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): any => {
    const user = (req as any).user;
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    next();
};
