import { Request, Response } from 'express';
import * as menuService from '../services/menuService';

export const getMenu = async (req: Request, res: Response) => {
    try {
        const result = await menuService.getMenu();
        res.json(result);
    } catch (e: any) {
        res.status(500).json(e.message);
    }
};
