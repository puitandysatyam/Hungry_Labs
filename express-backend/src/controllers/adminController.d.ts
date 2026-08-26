import { Request, Response } from 'express';
export declare const getActiveOrders: (req: Request, res: Response) => Promise<void>;
export declare const getAllOrders: (req: Request, res: Response) => Promise<void>;
export declare const updateOrderStatus: (req: Request, res: Response) => Promise<void>;
export declare const getAddons: (req: Request, res: Response) => Promise<void>;
export declare const createAddon: (req: Request, res: Response) => Promise<void>;
export declare const updateAddon: (req: Request, res: Response) => Promise<void>;
export declare const deleteAddon: (req: Request, res: Response) => Promise<void>;
export declare const createMenuItem: (req: Request, res: Response) => Promise<void>;
export declare const updateMenuItem: (req: Request, res: Response) => Promise<void>;
export declare const deleteMenuItem: (req: Request, res: Response) => Promise<void>;
export declare const getCarouselImages: (req: Request, res: Response) => Promise<void>;
export declare const createCarouselImage: (req: Request, res: Response) => Promise<void>;
export declare const updateCarouselImage: (req: Request, res: Response) => Promise<void>;
export declare const deleteCarouselImage: (req: Request, res: Response) => Promise<void>;
export declare const getUploadUrl: (req: Request, res: Response) => Promise<Response<any, Record<string, any>> | undefined>;
export declare const createCoupon: (req: Request, res: Response) => Promise<void>;
//# sourceMappingURL=adminController.d.ts.map