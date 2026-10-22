import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, phone, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }
        const result = await authService.register(req.body);
        res.json(result);
    } catch (e: any) {
        res.status(400).json({ error: e.message || "Registration failed." });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            return res.status(400).json({ error: "Email and password are required." });
        }
        const result = await authService.authenticate(req.body);
        res.json(result);
    } catch (e: any) {
        res.status(401).json({ error: e.message || "Invalid credentials" });
    }
};
