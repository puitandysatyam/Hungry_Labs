import { Request, Response, NextFunction } from 'express';
import { verifyToken } from '../utils/jwt';

export interface AuthenticatedUser {
    id: number;
    email: string;
    role: string;
}

export const requireAuth = async (req: Request, res: Response, next: NextFunction): Promise<any> => {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'Unauthorized' });
    }

    const token = authHeader.split(' ')[1];
    const decoded = verifyToken(token) as AuthenticatedUser | null;

    if (!decoded) {
        return res.status(401).json({ message: 'Invalid token' });
    }

    (req as any).user = decoded;
    next();
};

export const optionalAuth = (req: Request, res: Response, next: NextFunction): void => {
    const authHeader = req.headers.authorization;
    if (authHeader && authHeader.startsWith('Bearer ')) {
        const token = authHeader.split(' ')[1];
        const decoded = verifyToken(token) as AuthenticatedUser | null;
        if (decoded) {
            (req as any).user = decoded;
        }
    }
    next();
};

export const requireAdmin = (req: Request, res: Response, next: NextFunction): any => {
    const user = (req as any).user as AuthenticatedUser | undefined;
    if (!user || user.role !== 'ADMIN') {
        return res.status(403).json({ message: 'Forbidden: Admins only' });
    }
    next();
};
