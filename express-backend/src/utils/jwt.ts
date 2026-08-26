import jwt from 'jsonwebtoken';

const SECRET = process.env.JWT_SECRET || '404E635266556A586E3272357538782F413F4428472B4B6250645367566B5970';

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
