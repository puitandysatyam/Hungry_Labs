export declare const applyCoupon: (code: string) => Promise<{
    valid: boolean;
    message: string;
    discountType: null;
    discountValue: null;
    minOrderValue: null;
} | {
    valid: boolean;
    message: string;
    discountType: string;
    discountValue: number;
    minOrderValue: number;
}>;
export declare const placeOrder: (data: any) => Promise<{
    orderId: number;
    status: string;
    etaMinutes: number;
    razorpayOrderId: string;
}>;
//# sourceMappingURL=orderService.d.ts.map