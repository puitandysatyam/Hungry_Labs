import jwt from 'jsonwebtoken';

if (!process.env.JWT_SECRET) {
    throw new Error("FATAL ERROR: JWT_SECRET is not defined in the environment variables. The application cannot start securely.");
}

const SECRET = process.env.JWT_SECRET;

export const generateToken = (payload: any) => {
    return jwt.sign(payload, SECRET, { expiresIn: '24h' });
};

export const verifyToken = (token: string) => {
    try {
        return jwt.verify(token, SECRET);
    } catch {
        return null;
    }
};
