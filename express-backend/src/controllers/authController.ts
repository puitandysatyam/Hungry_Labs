import { Request, Response } from 'express';
import * as authService from '../services/authService';

export const register = async (req: Request, res: Response) => {
    try {
        const result = await authService.register(req.body);
        res.json(result);
    } catch (e: any) {
        res.status(400).json(e.message);
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const result = await authService.authenticate(req.body);
        res.json(result);
    } catch (e) {
        res.status(401).json("Invalid credentials");
    }
};

export const makeAdmin = async (req: Request, res: Response) => {
    try {
        const { email } = req.query;
        const msg = await authService.upgradeToAdmin(email as string);
        res.json(msg);
    } catch (e: any) {
        res.status(400).json(e.message);
    }
};
