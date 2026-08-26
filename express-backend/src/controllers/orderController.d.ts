import { Request, Response } from 'express';
export declare const getConfig: (req: Request, res: Response) => void;
export declare const placeOrder: (req: Request, res: Response) => Promise<void>;
export declare const applyCoupon: (req: Request, res: Response) => Promise<void>;
export declare const getUserOrders: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
//# sourceMappingURL=orderController.d.ts.map